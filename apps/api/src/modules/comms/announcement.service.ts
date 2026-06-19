import { Injectable, HttpStatus } from "@nestjs/common";
import type { AnnouncementCreateRequest, Announcement, JwtClaims } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { apiError } from "../../common/api-error";
import { AuditService } from "../../common/audit/audit.service";

const RETRACT_WINDOW_MS = 15 * 60 * 1000; // 10.6 / 12A.4: retract ≤ 15 menit

/**
 * Pengumuman (BAGIAN 10.6 & 12A.4). Scope × role ditegakkan server-side; retract ≤15 mnt.
 * Mengikuti 12A.4 yang MENGIKAT: CLASS=TEACHER(kelas diampu)+SCHOOL_ADMIN; GRADE/SCHOOL/PARENTS
 * =SCHOOL_ADMIN/PRINCIPAL. (Usulan guru→ortu/F5 belum diterapkan — perlu persetujuan terpisah.)
 * Pengiriman push menyusul (pipeline FCM); 2j menyimpan & menyajikan pengumuman in-app.
 */
@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** POST /announcements */
  async create(actor: JwtClaims, dto: AnnouncementCreateRequest): Promise<Announcement> {
    const schoolId = actor.schoolId;
    if (!schoolId) throw apiError("FORBIDDEN", "Akun tanpa sekolah tidak bisa mengumumkan.", HttpStatus.FORBIDDEN);

    await this.assertScopeRole(actor, schoolId, dto);

    const ann = await this.prisma.announcement.create({
      data: {
        schoolId,
        authorUserId: actor.sub,
        scope: dto.scope,
        scopeIds: dto.scopeIds,
        title: dto.title,
        body: dto.body,
        publishedAt: new Date(),
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "ANNOUNCEMENT_PUBLISH",
      entity: "announcement",
      entityId: ann.id,
      after: { scope: dto.scope, scopeIds: dto.scopeIds, title: dto.title },
    });
    return this.toDto(ann);
  }

  /** Penegakan scope × role (12A.4). Lempar ANNOUNCEMENT_SCOPE_FORBIDDEN bila tak sah. */
  private async assertScopeRole(actor: JwtClaims, schoolId: string, dto: AnnouncementCreateRequest): Promise<void> {
    const forbid = (msg: string): never => {
      throw apiError("ANNOUNCEMENT_SCOPE_FORBIDDEN", msg, HttpStatus.FORBIDDEN);
    };
    const isAdmin = actor.role === "SCHOOL_ADMIN" || actor.role === "PRINCIPAL";

    if (dto.scope === "CLASS") {
      if (actor.role !== "TEACHER" && actor.role !== "SCHOOL_ADMIN") forbid("Peran tak boleh mengumumkan ke kelas.");
      if (dto.scopeIds.length === 0) forbid("scopeIds (kelas) wajib untuk scope CLASS.");
      const classes = await this.prisma.class.findMany({
        where: { id: { in: dto.scopeIds } },
        select: { id: true, schoolId: true, homeroomTeacherId: true },
      });
      if (classes.length !== dto.scopeIds.length) forbid("Ada kelas yang tidak valid.");
      for (const c of classes) {
        if (c.schoolId !== schoolId) forbid("Kelas bukan milik sekolah Anda.");
        if (actor.role === "TEACHER" && c.homeroomTeacherId !== actor.sub) forbid("Hanya kelas yang Anda ampu.");
      }
    } else if (dto.scope === "GRADE") {
      if (!isAdmin) forbid("Hanya admin/kepala sekolah untuk scope angkatan.");
      if (dto.scopeIds.length === 0) forbid("scopeIds (angkatan) wajib untuk scope GRADE.");
    } else if (dto.scope === "SCHOOL" || dto.scope === "PARENTS") {
      if (!isAdmin) forbid("Hanya admin/kepala sekolah untuk scope sekolah/orang tua.");
    }
  }

  /** POST /announcements/:id/retract — penulis atau admin/kepsek, ≤15 menit. */
  async retract(actor: JwtClaims, id: string): Promise<{ retracted: true }> {
    const ann = await this.prisma.announcement.findUnique({ where: { id } });
    if (!ann) throw apiError("NOT_FOUND", "Pengumuman tidak ditemukan.", HttpStatus.NOT_FOUND);
    if (actor.schoolId !== ann.schoolId) throw apiError("FORBIDDEN", "Bukan sekolah Anda.", HttpStatus.FORBIDDEN);
    const isAdmin = actor.role === "SCHOOL_ADMIN" || actor.role === "PRINCIPAL";
    if (ann.authorUserId !== actor.sub && !isAdmin) {
      throw apiError("FORBIDDEN", "Hanya penulis atau admin yang bisa menarik.", HttpStatus.FORBIDDEN);
    }
    // Jendela retract: hanya bila belum ditarik & publish ≤15 mnt lalu (basis server).
    const res = await this.prisma.announcement.updateMany({
      where: { id, retractedAt: null, publishedAt: { gte: new Date(Date.now() - RETRACT_WINDOW_MS) } },
      data: { retractedAt: new Date() },
    });
    if (res.count === 0) {
      throw apiError("ANNOUNCEMENT_RETRACT_EXPIRED", "Jendela tarik 15 menit sudah lewat (atau sudah ditarik).", HttpStatus.CONFLICT);
    }
    await this.audit.write({
      actorUserId: actor.sub,
      action: "ANNOUNCEMENT_RETRACT",
      entity: "announcement",
      entityId: id,
      before: { retractedAt: null },
      after: { retractedAt: new Date().toISOString() },
    });
    return { retracted: true };
  }

  /** GET /announcements — pengumuman aktif yang relevan untuk pemanggil. */
  async listForUser(actor: JwtClaims): Promise<Announcement[]> {
    // Staf sekolah: semua pengumuman aktif di sekolahnya.
    if (actor.role === "TEACHER" || actor.role === "SCHOOL_ADMIN" || actor.role === "PRINCIPAL") {
      if (!actor.schoolId) return [];
      const rows = await this.prisma.announcement.findMany({
        where: { schoolId: actor.schoolId, retractedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 100,
      });
      return rows.map((r) => this.toDto(r));
    }

    // Siswa: pengumuman sekolahnya yang menyasar dia (SCHOOL / kelasnya / angkatannya).
    if (actor.role === "STUDENT") {
      const me = await this.prisma.user.findUnique({ where: { id: actor.sub }, select: { schoolId: true, classId: true } });
      if (!me?.schoolId) return [];
      const grade = me.classId
        ? (await this.prisma.class.findUnique({ where: { id: me.classId }, select: { grade: true } }))?.grade
        : undefined;
      const rows = await this.prisma.announcement.findMany({
        where: { schoolId: me.schoolId, retractedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 200,
      });
      return rows
        .filter((a) => this.matchesStudent(a, me.classId ?? null, grade))
        .slice(0, 100)
        .map((r) => this.toDto(r));
    }

    // Ortu: pengumuman untuk anak-anaknya (SCHOOL/PARENTS/kelas/angkatan anak).
    if (actor.role === "PARENT") {
      const links = await this.prisma.parentLink.findMany({
        where: { parentUserId: actor.sub, status: "ACTIVE" },
        select: { studentUserId: true },
      });
      if (links.length === 0) return [];
      const children = await this.prisma.user.findMany({
        where: { id: { in: links.map((l) => l.studentUserId) } },
        select: { schoolId: true, classId: true },
      });
      const schoolIds = [...new Set(children.map((c) => c.schoolId).filter(Boolean) as string[])];
      const classIds = new Set(children.map((c) => c.classId).filter(Boolean) as string[]);
      const classRows = classIds.size
        ? await this.prisma.class.findMany({ where: { id: { in: [...classIds] } }, select: { id: true, grade: true } })
        : [];
      const grades = new Set(classRows.map((c) => String(c.grade)));
      if (schoolIds.length === 0) return [];
      const rows = await this.prisma.announcement.findMany({
        where: { schoolId: { in: schoolIds }, retractedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 200,
      });
      return rows
        .filter(
          (a) =>
            a.scope === "SCHOOL" ||
            a.scope === "PARENTS" ||
            (a.scope === "CLASS" && a.scopeIds.some((id) => classIds.has(id))) ||
            (a.scope === "GRADE" && a.scopeIds.some((g) => grades.has(g))),
        )
        .slice(0, 100)
        .map((r) => this.toDto(r));
    }
    return [];
  }

  private matchesStudent(a: { scope: string; scopeIds: string[] }, classId: string | null, grade?: number): boolean {
    if (a.scope === "SCHOOL") return true;
    if (a.scope === "CLASS") return !!classId && a.scopeIds.includes(classId);
    if (a.scope === "GRADE") return grade !== undefined && a.scopeIds.includes(String(grade));
    return false; // PARENTS bukan untuk siswa
  }

  private toDto(a: {
    id: string;
    schoolId: string;
    authorUserId: string;
    scope: string;
    scopeIds: string[];
    title: string;
    body: string;
    publishedAt: Date;
    retractedAt: Date | null;
  }): Announcement {
    return {
      id: a.id,
      schoolId: a.schoolId,
      authorUserId: a.authorUserId,
      scope: a.scope as Announcement["scope"],
      scopeIds: a.scopeIds,
      title: a.title,
      body: a.body,
      publishedAt: a.publishedAt.toISOString(),
      retractedAt: a.retractedAt ? a.retractedAt.toISOString() : null,
    };
  }
}
