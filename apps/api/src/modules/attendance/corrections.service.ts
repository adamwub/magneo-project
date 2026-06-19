import { Injectable, HttpStatus } from "@nestjs/common";
import type { AttendanceCorrectionRequest, JwtClaims, FinalAtt } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { apiError } from "../../common/api-error";
import { AuditService } from "../../common/audit/audit.service";
import { DailyStatusService } from "./daily-status.service";
import { schoolLocalTime, daysBetweenSchoolDates } from "./school-time";

const MAX_CORRECTION_DAYS = 3; // koreksi hanya ≤ H+3 (BAGIAN 10.4)

export interface CorrectionResult {
  studentUserId: string;
  date: string;
  finalStatus: FinalAtt;
}

/**
 * Koreksi absen (BAGIAN 10.4). Hanya TEACHER (wali kelas siswa, ≤ H+3) & SCHOOL_ADMIN.
 * Wajib alasan; membuat AttendanceEvent CORRECTION; AuditLog before/after; recompute status.
 */
@Injectable()
export class CorrectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly daily: DailyStatusService,
  ) {}

  async correct(actor: JwtClaims, dto: AttendanceCorrectionRequest): Promise<CorrectionResult> {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentUserId },
      select: { schoolId: true, classId: true, role: true, deletedAt: true },
    });
    if (!student || student.deletedAt || student.role !== "STUDENT") {
      throw apiError("NOT_FOUND", "Siswa tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    const schoolId = student.schoolId;
    if (!schoolId || actor.schoolId !== schoolId) {
      throw apiError("FORBIDDEN", "Tidak boleh mengoreksi siswa sekolah lain.", HttpStatus.FORBIDDEN);
    }

    // RBAC: SCHOOL_ADMIN bebas (sekolahnya); TEACHER hanya wali kelas siswa (12A.3-style).
    if (actor.role === "TEACHER") {
      if (!student.classId) {
        throw apiError("FORBIDDEN", "Siswa belum punya kelas.", HttpStatus.FORBIDDEN);
      }
      const klass = await this.prisma.class.findUnique({
        where: { id: student.classId },
        select: { schoolId: true, homeroomTeacherId: true },
      });
      if (!klass || klass.schoolId !== schoolId || klass.homeroomTeacherId !== actor.sub) {
        throw apiError("FORBIDDEN", "Hanya wali kelas yang boleh mengoreksi.", HttpStatus.FORBIDDEN);
      }
    } else if (actor.role !== "SCHOOL_ADMIN") {
      throw apiError("FORBIDDEN", "Peran tidak berhak mengoreksi absen.", HttpStatus.FORBIDDEN);
    }

    // Jendela ≤ H+3 (waktu sekolah).
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true },
    });
    const today = schoolLocalTime(new Date(), school!.timezone).date;
    const age = daysBetweenSchoolDates(dto.date, today); // today - date
    if (age < 0) {
      throw apiError("VALIDATION_ERROR", "Tanggal koreksi tidak boleh di masa depan.", HttpStatus.BAD_REQUEST);
    }
    if (age > MAX_CORRECTION_DAYS) {
      throw apiError("FORBIDDEN", "Koreksi hanya sampai H+3.", HttpStatus.FORBIDDEN);
    }

    const before = await this.prisma.dailyAttendanceStatus.findUnique({
      where: { userId_date: { userId: dto.studentUserId, date: dto.date } },
      select: { finalStatus: true },
    });

    const now = new Date();
    await this.prisma.attendanceEvent.create({
      data: {
        userId: dto.studentUserId,
        schoolId,
        date: dto.date,
        type: "CORRECTION",
        method: "MANUAL",
        status: dto.status,
        occurredAt: now,
        correctedBy: actor.sub,
        correctionReason: dto.reason,
      },
    });

    const after = await this.daily.recompute(dto.studentUserId, schoolId, dto.date);

    await this.audit.write({
      actorUserId: actor.sub,
      action: "ATTENDANCE_CORRECT",
      entity: "attendance",
      entityId: `${dto.studentUserId}:${dto.date}`,
      before: { finalStatus: before?.finalStatus ?? null },
      after: { finalStatus: after.finalStatus, correctedTo: dto.status, reason: dto.reason },
    });

    return { studentUserId: dto.studentUserId, date: dto.date, finalStatus: after.finalStatus };
  }
}
