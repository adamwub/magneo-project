import { Injectable, HttpStatus } from "@nestjs/common";
import type {
  PermitCreateRequest,
  PermitDecisionRequest,
  PermitListQuery,
  Permit,
  JwtClaims,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { apiError } from "../../common/api-error";
import { AuditService } from "../../common/audit/audit.service";
import { DailyStatusService } from "../attendance/daily-status.service";

/** Tanggal sekolah "YYYY-MM-DD" dari start..end (inklusif). Dibatasi 92 hari (anti-loop). */
function datesInRange(start: string, end: string): string[] {
  const d0 = Date.parse(`${start}T00:00:00Z`);
  const d1 = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(d0) || Number.isNaN(d1) || d1 < d0) return [start];
  const out: string[] = [];
  for (let t = d0, i = 0; t <= d1 && i < 92; t += 86_400_000, i++) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Izin/Permit (BAGIAN 10.3 & state machine 12A.3).
 * Pengaju: siswa (untuk diri) / ortu (untuk anak ber-ParentLink ACTIVE).
 * Pemutus: wali kelas (homeroom) + SCHOOL_ADMIN. APPROVED → recompute status harian.
 * State: SUBMITTED → {APPROVED, REJECTED, CANCELLED}; terminal & idempoten (conditional update).
 */
@Injectable()
export class PermitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly daily: DailyStatusService,
  ) {}

  /** POST /permits */
  async create(actor: JwtClaims, dto: PermitCreateRequest): Promise<Permit> {
    let studentUserId: string;
    if (actor.role === "STUDENT") {
      studentUserId = actor.sub; // siswa → untuk diri (abaikan studentUserId dari body)
    } else if (actor.role === "PARENT") {
      if (!dto.studentUserId) {
        throw apiError("VALIDATION_ERROR", "studentUserId wajib untuk pengajuan oleh orang tua.", HttpStatus.BAD_REQUEST);
      }
      const link = await this.prisma.parentLink.findUnique({
        where: { parentUserId_studentUserId: { parentUserId: actor.sub, studentUserId: dto.studentUserId } },
        select: { status: true },
      });
      if (!link || link.status !== "ACTIVE") {
        throw apiError("FORBIDDEN", "Bukan orang tua sah dari siswa ini.", HttpStatus.FORBIDDEN);
      }
      studentUserId = dto.studentUserId;
    } else {
      throw apiError("FORBIDDEN", "Hanya siswa/orang tua yang bisa mengajukan izin.", HttpStatus.FORBIDDEN);
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      select: { role: true, schoolId: true, deletedAt: true },
    });
    if (!student || student.deletedAt || student.role !== "STUDENT" || !student.schoolId) {
      throw apiError("NOT_FOUND", "Siswa tidak ditemukan.", HttpStatus.NOT_FOUND);
    }

    // Tolak izin tumpang-tindih yang masih hidup (SUBMITTED/APPROVED) untuk siswa & rentang sama.
    const overlap = await this.prisma.permit.findFirst({
      where: {
        studentUserId,
        status: { in: ["SUBMITTED", "APPROVED"] },
        dateStart: { lte: dto.dateEnd },
        dateEnd: { gte: dto.dateStart },
      },
      select: { id: true },
    });
    if (overlap) {
      throw apiError("PERMIT_DUPLICATE", "Sudah ada izin pada rentang tanggal itu.", HttpStatus.CONFLICT);
    }

    const permit = await this.prisma.permit.create({
      data: {
        studentUserId,
        requestedByUserId: actor.sub,
        type: dto.type,
        dateStart: dto.dateStart,
        dateEnd: dto.dateEnd,
        note: dto.note,
        attachmentUrl: dto.attachmentUrl ?? null,
        status: "SUBMITTED",
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "PERMIT_SUBMIT",
      entity: "permit",
      entityId: permit.id,
      after: { studentUserId, type: dto.type, dateStart: dto.dateStart, dateEnd: dto.dateEnd },
    });
    return this.toDto(permit);
  }

  /** POST /permits/:id/decision — wali kelas / SCHOOL_ADMIN. */
  async decide(actor: JwtClaims, permitId: string, dto: PermitDecisionRequest): Promise<Permit> {
    const permit = await this.prisma.permit.findUnique({ where: { id: permitId } });
    if (!permit) throw apiError("NOT_FOUND", "Izin tidak ditemukan.", HttpStatus.NOT_FOUND);

    const student = await this.prisma.user.findUnique({
      where: { id: permit.studentUserId },
      select: { schoolId: true, classId: true },
    });
    if (!student?.schoolId || actor.schoolId !== student.schoolId) {
      throw apiError("FORBIDDEN", "Tidak boleh memutus izin siswa sekolah lain.", HttpStatus.FORBIDDEN);
    }
    if (actor.role === "TEACHER") {
      if (!student.classId) throw apiError("FORBIDDEN", "Siswa belum punya kelas.", HttpStatus.FORBIDDEN);
      const klass = await this.prisma.class.findUnique({
        where: { id: student.classId },
        select: { schoolId: true, homeroomTeacherId: true },
      });
      if (!klass || klass.schoolId !== student.schoolId || klass.homeroomTeacherId !== actor.sub) {
        throw apiError("FORBIDDEN", "Hanya wali kelas yang boleh memutus.", HttpStatus.FORBIDDEN);
      }
    } else if (actor.role !== "SCHOOL_ADMIN") {
      throw apiError("FORBIDDEN", "Peran tidak berhak memutus izin.", HttpStatus.FORBIDDEN);
    }

    const newStatus = dto.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    // State machine + anti-race: hanya transisi dari SUBMITTED.
    const res = await this.prisma.permit.updateMany({
      where: { id: permitId, status: "SUBMITTED" },
      data: { status: newStatus, decidedByUserId: actor.sub, decidedAt: new Date(), decisionNote: dto.decisionNote ?? null },
    });
    if (res.count === 0) {
      throw apiError("PERMIT_INVALID_TRANSITION", "Izin sudah diputus atau dibatalkan.", HttpStatus.CONFLICT);
    }

    // APPROVED → status harian dihitung ulang per tanggal dalam rentang (10.3).
    if (newStatus === "APPROVED") {
      for (const date of datesInRange(permit.dateStart, permit.dateEnd)) {
        await this.daily.recompute(permit.studentUserId, student.schoolId, date);
      }
    }
    await this.audit.write({
      actorUserId: actor.sub,
      action: "PERMIT_DECIDE",
      entity: "permit",
      entityId: permitId,
      before: { status: "SUBMITTED" },
      after: { status: newStatus, decisionNote: dto.decisionNote ?? null },
    });
    const updated = await this.prisma.permit.findUnique({ where: { id: permitId } });
    return this.toDto(updated!);
  }

  /** POST /permits/:id/cancel — pembuat, selama masih SUBMITTED. */
  async cancel(actor: JwtClaims, permitId: string): Promise<Permit> {
    const permit = await this.prisma.permit.findUnique({ where: { id: permitId } });
    if (!permit) throw apiError("NOT_FOUND", "Izin tidak ditemukan.", HttpStatus.NOT_FOUND);
    if (permit.requestedByUserId !== actor.sub) {
      throw apiError("FORBIDDEN", "Hanya pengaju yang bisa membatalkan.", HttpStatus.FORBIDDEN);
    }
    const res = await this.prisma.permit.updateMany({
      where: { id: permitId, status: "SUBMITTED" },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) {
      throw apiError("PERMIT_INVALID_TRANSITION", "Hanya izin berstatus SUBMITTED yang bisa dibatalkan.", HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.permit.findUnique({ where: { id: permitId } });
    return this.toDto(updated!);
  }

  /** GET /permits?scope=me|class|child */
  async list(actor: JwtClaims, q: PermitListQuery): Promise<Permit[]> {
    const statusFilter = q.status ? { status: q.status } : {};
    let studentIds: string[] | null = null;

    if (q.scope === "me") {
      if (actor.role !== "STUDENT") throw apiError("FORBIDDEN", "Scope 'me' hanya untuk siswa.", HttpStatus.FORBIDDEN);
      studentIds = [actor.sub];
    } else if (q.scope === "child") {
      if (actor.role !== "PARENT") throw apiError("FORBIDDEN", "Scope 'child' hanya untuk orang tua.", HttpStatus.FORBIDDEN);
      const links = await this.prisma.parentLink.findMany({
        where: { parentUserId: actor.sub, status: "ACTIVE" },
        select: { studentUserId: true },
      });
      studentIds = links.map((l) => l.studentUserId);
    } else {
      // scope "class" — wali kelas (kelas diampu) / SCHOOL_ADMIN (sekolahnya).
      if (!actor.schoolId) throw apiError("FORBIDDEN", "Akun tanpa sekolah.", HttpStatus.FORBIDDEN);
      if (actor.role === "SCHOOL_ADMIN") {
        const students = await this.prisma.user.findMany({
          where: { schoolId: actor.schoolId, role: "STUDENT", deletedAt: null },
          select: { id: true },
        });
        studentIds = students.map((s) => s.id);
      } else if (actor.role === "TEACHER") {
        const classes = await this.prisma.class.findMany({
          where: { homeroomTeacherId: actor.sub, schoolId: actor.schoolId },
          select: { id: true },
        });
        const students = await this.prisma.user.findMany({
          where: { classId: { in: classes.map((c) => c.id) }, role: "STUDENT", deletedAt: null },
          select: { id: true },
        });
        studentIds = students.map((s) => s.id);
      } else {
        throw apiError("FORBIDDEN", "Peran tidak berhak melihat izin kelas.", HttpStatus.FORBIDDEN);
      }
    }

    if (studentIds.length === 0) return [];
    const rows = await this.prisma.permit.findMany({
      where: { studentUserId: { in: studentIds }, ...statusFilter },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((r) => this.toDto(r));
  }

  private toDto(p: {
    id: string;
    studentUserId: string;
    requestedByUserId: string;
    type: string;
    dateStart: string;
    dateEnd: string;
    note: string;
    attachmentUrl: string | null;
    status: string;
    decidedByUserId: string | null;
    decidedAt: Date | null;
    decisionNote: string | null;
  }): Permit {
    return {
      id: p.id,
      studentUserId: p.studentUserId,
      requestedByUserId: p.requestedByUserId,
      type: p.type as Permit["type"],
      dateStart: p.dateStart,
      dateEnd: p.dateEnd,
      note: p.note,
      attachmentUrl: p.attachmentUrl,
      status: p.status as Permit["status"],
      decidedByUserId: p.decidedByUserId,
      decidedAt: p.decidedAt ? p.decidedAt.toISOString() : null,
      decisionNote: p.decisionNote,
    };
  }
}
