import { Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma, Class as PrismaClass, School as PrismaSchool } from "@prisma/client";
import {
  SCHOOL_SETTING_DEFAULTS,
  type JwtClaims,
  type CreateSchoolRequest,
  type School,
  type PairBoxResponse,
  type AdminAccountResponse,
  type SchoolSettings,
  type ClassCreateRequest,
  type ClassUpdateRequest,
  type Class as ClassDto,
  type ClassPromoteRequest,
  type ClassPromoteResult,
  type ClassPromotionPlan,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env";
import { apiError } from "../../common/api-error";
import { AuditService } from "../../common/audit/audit.service";
// hashPassword = util kripto argon2id leaf (sumber tunggal hashing, dipakai auth & seed).
import { hashPassword } from "../auth/password";
import {
  generateTempPassword,
  generatePairingToken,
  hashPairingToken,
  PAIRING_TOKEN_TTL_SEC,
} from "./provisioning";

/**
 * Provisioning & master data sekolah (Fase 1e, BAGIAN 7.4 & 8.2).
 *
 * Dua kelompok endpoint memakai service ini:
 *  - HQ (`/hq/...`): buat sekolah, pairing Box, terbitkan akun admin (scope global).
 *  - Sekolah (`/school/...`): setelan, CRUD kelas, kenaikan kelas (scope sekolah pemanggil).
 *
 * Penjaga RBAC (1c) memvalidasi peran & scope di controller; service tetap memfilter
 * data ke `schoolId` pemanggil (defense-in-depth, BAGIAN 7.3).
 */
@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
  ) {}

  // ── HQ: provisioning ─────────────────────────────────────────────────────

  /** POST /hq/schools — buat sekolah baru (status ONBOARDING). */
  async createSchool(actor: JwtClaims, dto: CreateSchoolRequest): Promise<School> {
    const dup = await this.prisma.school.findUnique({ where: { npsn: dto.npsn } });
    if (dup) {
      throw apiError("CONFLICT", "NPSN sudah terdaftar.", HttpStatus.CONFLICT);
    }
    const school = await this.prisma.school.create({
      data: {
        npsn: dto.npsn,
        name: dto.name,
        city: dto.city,
        status: "ONBOARDING",
        settings: {},
        ...(dto.province ? { province: dto.province } : {}),
        ...(dto.timezone ? { timezone: dto.timezone } : {}),
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "SCHOOL_CREATE",
      entity: "school",
      entityId: school.id,
      after: { npsn: school.npsn, name: school.name },
    });
    return this.toSchoolDto(school);
  }

  /** GET /hq/schools — daftar sekolah (untuk wizard provision). */
  async listSchools(): Promise<School[]> {
    const schools = await this.prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return schools.map((s) => this.toSchoolDto(s));
  }

  /** GET /hq/schools/:id — detail satu sekolah. */
  async getSchool(id: string): Promise<School> {
    return this.toSchoolDto(await this.requireSchool(id));
  }

  /**
   * POST /hq/schools/:id/pair-box — terbitkan pairing token sekali-pakai untuk Box.
   * Token mentah hanya dikembalikan SEKALI; yang disimpan = hash(token + pepper).
   * Penyelesaian pairing oleh Box = Fase 3.
   */
  async pairBox(actor: JwtClaims, schoolId: string, boxSerial: string): Promise<PairBoxResponse> {
    await this.requireSchool(schoolId);
    const token = generatePairingToken();
    const pepper = this.config.get("BOX_PAIRING_PEPPER", { infer: true });
    const pairingTokenHash = hashPairingToken(token, pepper);
    const expiresAt = new Date(Date.now() + PAIRING_TOKEN_TTL_SEC * 1000);

    // upsert: serial sama → terbitkan ulang token (re-pair). pairedAt tetap null
    // sampai Box menyelesaikan pairing (Fase 3).
    await this.prisma.device.upsert({
      where: { id: boxSerial },
      create: { id: boxSerial, schoolId, pairingTokenHash, pairingTokenExpiresAt: expiresAt },
      update: { schoolId, pairingTokenHash, pairingTokenExpiresAt: expiresAt },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "BOX_PAIR",
      entity: "device",
      entityId: boxSerial,
      after: { schoolId },
    });
    return { pairingToken: token, expiresInSec: PAIRING_TOKEN_TTL_SEC };
  }

  /**
   * POST /hq/schools/:id/admin-account — terbitkan akun admin sekolah.
   * Username otomatis (admin, admin2, ...) unik per sekolah; password sementara
   * hanya dikembalikan SEKALI; admin wajib menggantinya saat login pertama.
   */
  async createAdminAccount(actor: JwtClaims, schoolId: string): Promise<AdminAccountResponse> {
    await this.requireSchool(schoolId);
    const existing = await this.prisma.user.count({
      where: { schoolId, role: "SCHOOL_ADMIN", deletedAt: null },
    });
    const username = existing === 0 ? "admin" : `admin${existing + 1}`;
    const tempPassword = generateTempPassword();
    const user = await this.prisma.user.create({
      data: {
        schoolId,
        role: "SCHOOL_ADMIN",
        username,
        passwordHash: await hashPassword(tempPassword),
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "ADMIN_ACCOUNT_CREATE",
      entity: "user",
      entityId: user.id,
      after: { schoolId, username, role: "SCHOOL_ADMIN" },
    });
    return { username, tempPassword };
  }

  // ── Sekolah: setelan (BAGIAN 10.1) ───────────────────────────────────────

  /** GET /school/settings — default 10.1 + override yang tersimpan. */
  async getSettings(schoolId: string): Promise<SchoolSettings> {
    const school = await this.requireSchool(schoolId);
    return this.effectiveSettings(school.settings);
  }

  /** PUT /school/settings — hanya field yang dikirim yang di-override (BAGIAN 10.1). */
  async updateSettings(
    actor: JwtClaims,
    schoolId: string,
    patch: SchoolSettings,
  ): Promise<SchoolSettings> {
    const school = await this.requireSchool(schoolId);
    const stored = this.asOverrides(school.settings);
    const overrides = { ...stored, ...patch };
    await this.prisma.school.update({
      where: { id: schoolId },
      data: { settings: overrides as Prisma.InputJsonValue },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "SETTINGS_UPDATE",
      entity: "school",
      entityId: schoolId,
      before: stored as Prisma.InputJsonValue,
      after: overrides as Prisma.InputJsonValue,
    });
    return { ...SCHOOL_SETTING_DEFAULTS, ...overrides };
  }

  // ── Sekolah: kelas ───────────────────────────────────────────────────────

  /** POST /school/classes — buat kelas. */
  async createClass(
    actor: JwtClaims,
    schoolId: string,
    dto: ClassCreateRequest,
  ): Promise<ClassDto> {
    await this.assertHomeroomTeacher(schoolId, dto.homeroomTeacherId);
    const klass = await this.prisma.class.create({
      data: {
        schoolId,
        academicYear: dto.academicYear,
        grade: dto.grade,
        major: dto.major ?? null,
        label: dto.label,
        homeroomTeacherId: dto.homeroomTeacherId ?? null,
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "CLASS_CREATE",
      entity: "class",
      entityId: klass.id,
      after: { label: klass.label, grade: klass.grade, academicYear: klass.academicYear },
    });
    return this.toClassDto(klass);
  }

  /** GET /school/classes — daftar kelas sekolah (opsional filter tahun ajaran). */
  async listClasses(schoolId: string, academicYear?: string): Promise<ClassDto[]> {
    const classes = await this.prisma.class.findMany({
      where: { schoolId, deletedAt: null, ...(academicYear ? { academicYear } : {}) },
      orderBy: [{ academicYear: "desc" }, { grade: "asc" }, { label: "asc" }],
    });
    return classes.map((c) => this.toClassDto(c));
  }

  /** PATCH /school/classes/:id — ubah kelas. */
  async updateClass(
    actor: JwtClaims,
    schoolId: string,
    classId: string,
    dto: ClassUpdateRequest,
  ): Promise<ClassDto> {
    await this.requireClass(schoolId, classId);
    if (dto.homeroomTeacherId !== undefined) {
      await this.assertHomeroomTeacher(schoolId, dto.homeroomTeacherId);
    }
    const klass = await this.prisma.class.update({
      where: { id: classId },
      data: {
        ...(dto.academicYear !== undefined ? { academicYear: dto.academicYear } : {}),
        ...(dto.grade !== undefined ? { grade: dto.grade } : {}),
        ...(dto.major !== undefined ? { major: dto.major } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.homeroomTeacherId !== undefined
          ? { homeroomTeacherId: dto.homeroomTeacherId }
          : {}),
      },
    });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "CLASS_UPDATE",
      entity: "class",
      entityId: classId,
      after: { label: klass.label, grade: klass.grade },
    });
    return this.toClassDto(klass);
  }

  /** DELETE /school/classes/:id — soft-delete. Tolak bila masih ada siswa aktif. */
  async deleteClass(actor: JwtClaims, schoolId: string, classId: string): Promise<void> {
    await this.requireClass(schoolId, classId);
    const students = await this.prisma.user.count({
      where: { classId, role: "STUDENT", deletedAt: null },
    });
    if (students > 0) {
      throw apiError(
        "CONFLICT",
        "Kelas masih berisi siswa. Pindahkan siswa dulu sebelum menghapus.",
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.class.update({ where: { id: classId }, data: { deletedAt: new Date() } });
    await this.audit.write({
      actorUserId: actor.sub,
      action: "CLASS_DELETE",
      entity: "class",
      entityId: classId,
    });
  }

  /**
   * POST /school/classes/promote — wizard kenaikan kelas (preview → confirm).
   *  - grade 10/11 → kelas baru grade+1 di tahun ajaran tujuan; siswa ikut pindah.
   *  - grade 12 → ditandai lulus & kelas diarsipkan; siswa TIDAK diubah jadi alumni
   *    (itu job harian `graduation-transition` Fase 7, BAGIAN 10.9).
   *  - dryRun=true → hanya pratinjau, tidak ada perubahan data.
   */
  async promote(
    actor: JwtClaims,
    schoolId: string,
    dto: ClassPromoteRequest,
  ): Promise<ClassPromoteResult> {
    const sources = await this.prisma.class.findMany({
      where: { schoolId, academicYear: dto.fromAcademicYear, deletedAt: null },
      orderBy: [{ grade: "asc" }, { label: "asc" }],
    });

    // Hitung jumlah siswa per kelas sumber (sekali jalan).
    const plans: ClassPromotionPlan[] = await Promise.all(
      sources.map(async (c) => ({
        fromClassId: c.id,
        fromLabel: c.label,
        fromGrade: c.grade,
        toGrade: c.grade >= 12 ? c.grade : c.grade + 1,
        graduating: c.grade >= 12,
        studentCount: await this.prisma.user.count({
          where: { classId: c.id, role: "STUDENT", deletedAt: null },
        }),
      })),
    );

    const studentsGraduating = plans
      .filter((p) => p.graduating)
      .reduce((sum, p) => sum + p.studentCount, 0);

    if (dto.dryRun) {
      return {
        dryRun: true,
        fromAcademicYear: dto.fromAcademicYear,
        toAcademicYear: dto.toAcademicYear,
        plan: plans,
        classesCreated: 0,
        studentsPromoted: 0,
        studentsGraduating,
      };
    }

    // Konfirmasi: jalankan semua perubahan dalam satu transaksi (semua atau tidak sama sekali).
    let classesCreated = 0;
    let studentsPromoted = 0;
    const applied = await this.prisma.$transaction(async (tx) => {
      const result: ClassPromotionPlan[] = [];
      for (const p of plans) {
        const source = sources.find((s) => s.id === p.fromClassId)!;
        if (!p.graduating) {
          const created = await tx.class.create({
            data: {
              schoolId,
              academicYear: dto.toAcademicYear,
              grade: p.toGrade,
              major: source.major,
              label: source.label,
              homeroomTeacherId: source.homeroomTeacherId,
            },
          });
          const moved = await tx.user.updateMany({
            where: { classId: source.id, role: "STUDENT", deletedAt: null },
            data: { classId: created.id },
          });
          classesCreated += 1;
          studentsPromoted += moved.count;
          result.push({ ...p, toClassId: created.id });
        } else {
          // grade 12: arsipkan kelas, siswa dibiarkan (ditangani job Fase 7).
          result.push(p);
        }
        // Kelas tahun lalu diarsipkan (soft-delete) — baris tetap ada untuk riwayat.
        await tx.class.update({ where: { id: source.id }, data: { deletedAt: new Date() } });
      }
      return result;
    });

    await this.audit.write({
      actorUserId: actor.sub,
      action: "CLASS_PROMOTE",
      entity: "school",
      entityId: schoolId,
      after: {
        fromAcademicYear: dto.fromAcademicYear,
        toAcademicYear: dto.toAcademicYear,
        classesCreated,
        studentsPromoted,
        studentsGraduating,
      },
    });

    return {
      dryRun: false,
      fromAcademicYear: dto.fromAcademicYear,
      toAcademicYear: dto.toAcademicYear,
      plan: applied,
      classesCreated,
      studentsPromoted,
      studentsGraduating,
    };
  }

  // ── internal ─────────────────────────────────────────────────────────────

  private async requireSchool(id: string): Promise<PrismaSchool> {
    const school = await this.prisma.school.findFirst({ where: { id, deletedAt: null } });
    if (!school) {
      throw apiError("NOT_FOUND", "Sekolah tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return school;
  }

  private async requireClass(schoolId: string, classId: string): Promise<PrismaClass> {
    const klass = await this.prisma.class.findFirst({
      where: { id: classId, schoolId, deletedAt: null },
    });
    if (!klass) {
      throw apiError("NOT_FOUND", "Kelas tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return klass;
  }

  /** Pastikan wali kelas (bila diisi) adalah guru aktif di sekolah yang sama. */
  private async assertHomeroomTeacher(schoolId: string, teacherId?: string | null): Promise<void> {
    if (!teacherId) return;
    const teacher = await this.prisma.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER", deletedAt: null },
    });
    if (!teacher) {
      throw apiError(
        "VALIDATION_ERROR",
        "Wali kelas harus guru aktif di sekolah ini.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private asOverrides(settings: PrismaSchool["settings"]): Partial<SchoolSettings> {
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      return settings as Partial<SchoolSettings>;
    }
    return {};
  }

  private effectiveSettings(settings: PrismaSchool["settings"]): SchoolSettings {
    return { ...SCHOOL_SETTING_DEFAULTS, ...this.asOverrides(settings) };
  }

  private toSchoolDto(s: PrismaSchool): School {
    return {
      id: s.id,
      npsn: s.npsn,
      name: s.name,
      city: s.city,
      province: s.province,
      timezone: s.timezone,
      status: s.status,
    };
  }

  private toClassDto(c: PrismaClass): ClassDto {
    return {
      id: c.id,
      schoolId: c.schoolId,
      academicYear: c.academicYear,
      grade: c.grade,
      major: c.major,
      label: c.label,
      homeroomTeacherId: c.homeroomTeacherId,
    };
  }
}
