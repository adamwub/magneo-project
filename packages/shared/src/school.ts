import { z } from "zod";
import {
  ROLES,
  USER_STATUSES,
  SCHOOL_STATUSES,
  CONSENT_TYPES,
  IMPORT_JOB_STATUSES,
  INVITE_CODE_STATUSES,
} from "./enums.js";

/**
 * Skema provisioning & master data sekolah (BAGIAN 7.3, 8.2 modul `school`).
 *
 * Catatan privasi (ADR-005 & Guardrail 13.2): tidak ada PII siswa di sini.
 * NIS siswa DISAMARKAN sebelum disimpan di cloud — `User.username` siswa berisi
 * hasil samaran (hash berkunci per sekolah), bukan NIS mentah. Penyamaran terjadi
 * saat impor/login (potongan 1f/1b), bukan di lapisan skema ini.
 */

// ── Format dasar yang dipakai ulang ─────────────────────────────────────────
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:MM.");
const academicYear = z
  .string()
  .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran YYYY/YYYY, mis. 2026/2027.");
const grade = z.number().int().min(10).max(12);

// ── HQ: provisioning sekolah (BAGIAN 8.2 /hq/schools) ───────────────────────

/** POST /hq/schools [HQ_OPS]. NPSN = 8 digit nomor pokok sekolah nasional. */
export const createSchoolRequestSchema = z.object({
  npsn: z.string().regex(/^\d{8}$/, "NPSN harus 8 digit."),
  name: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
});
export type CreateSchoolRequest = z.infer<typeof createSchoolRequestSchema>;

export const schoolSchema = z.object({
  id: z.string(),
  npsn: z.string(),
  name: z.string(),
  city: z.string(),
  province: z.string(),
  timezone: z.string(),
  status: z.enum(SCHOOL_STATUSES),
});
export type School = z.infer<typeof schoolSchema>;

/** POST /hq/schools/:id/pair-box — {boxSerial} → pairingToken sekali pakai. */
export const pairBoxRequestSchema = z.object({
  boxSerial: z.string().min(1),
});
export type PairBoxRequest = z.infer<typeof pairBoxRequestSchema>;

export const pairBoxResponseSchema = z.object({
  pairingToken: z.string(),
  expiresInSec: z.number().int().positive(),
});
export type PairBoxResponse = z.infer<typeof pairBoxResponseSchema>;

/** POST /hq/schools/:id/admin-account → kredensial admin sekolah (sekali tampil). */
export const adminAccountResponseSchema = z.object({
  username: z.string(),
  tempPassword: z.string(),
});
export type AdminAccountResponse = z.infer<typeof adminAccountResponseSchema>;

// ── School: setelan (BAGIAN 8.2 GET/PUT /school/settings, default 10.1) ──────

/** Semua opsional: hanya field yang dikirim yang di-override (BAGIAN 10.1). */
export const schoolSettingsSchema = z.object({
  jam_masuk: timeOfDay.optional(),
  late_cutoff: timeOfDay.optional(),
  absent_cutoff: timeOfDay.optional(),
  jam_pulang: timeOfDay.optional(),
  wifi_hours: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/, "Format jam WiFi HH:MM-HH:MM.")
    .optional(),
  qr_geo_radius_m: z.number().int().positive().optional(),
  student_wifi_mbps: z.number().positive().optional(),
  tutor_daily_quota: z.number().int().nonnegative().optional(),
  teacher_gen_daily_quota: z.number().int().nonnegative().optional(),
});
export type SchoolSettings = z.infer<typeof schoolSettingsSchema>;

// ── School: kelas (BAGIAN 8.2 CRUD /school/classes) ─────────────────────────

export const classCreateRequestSchema = z.object({
  academicYear,
  grade,
  major: z.string().min(1).optional(),
  label: z.string().min(1),
  homeroomTeacherId: z.string().optional(),
});
export type ClassCreateRequest = z.infer<typeof classCreateRequestSchema>;

export const classUpdateRequestSchema = classCreateRequestSchema.partial();
export type ClassUpdateRequest = z.infer<typeof classUpdateRequestSchema>;

export const classSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  academicYear: z.string(),
  grade: z.number().int(),
  major: z.string().nullable(),
  label: z.string(),
  homeroomTeacherId: z.string().nullable(),
});
export type Class = z.infer<typeof classSchema>;

/**
 * POST /school/classes/promote — wizard kenaikan kelas (preview→confirm).
 * dryRun=true → hanya pratinjau (tidak mengubah data).
 */
export const classPromoteRequestSchema = z.object({
  fromAcademicYear: academicYear,
  toAcademicYear: academicYear,
  dryRun: z.boolean().default(true),
});
export type ClassPromoteRequest = z.infer<typeof classPromoteRequestSchema>;

/**
 * Satu baris rencana kenaikan kelas (per kelas asal).
 * - grade 10/11 → naik ke grade+1: kelas baru dibuat, siswa ikut pindah.
 * - grade 12 → `graduating=true`: kelas diarsipkan, siswa TIDAK diubah jadi alumni
 *   (itu job harian `graduation-transition` Fase 7, BAGIAN 10.9).
 */
export const classPromotionPlanSchema = z.object({
  fromClassId: z.string(),
  fromLabel: z.string(),
  fromGrade: z.number().int(),
  toGrade: z.number().int(),
  graduating: z.boolean(),
  studentCount: z.number().int().nonnegative(),
  /** Hanya terisi saat konfirmasi (dryRun=false) & kelas tujuan dibuat. */
  toClassId: z.string().optional(),
});
export type ClassPromotionPlan = z.infer<typeof classPromotionPlanSchema>;

/** Hasil wizard kenaikan kelas (pratinjau maupun konfirmasi). */
export const classPromoteResultSchema = z.object({
  dryRun: z.boolean(),
  fromAcademicYear: z.string(),
  toAcademicYear: z.string(),
  plan: z.array(classPromotionPlanSchema),
  /** Ringkasan: jumlah kelas baru dibuat & siswa lulus (0 saat dryRun). */
  classesCreated: z.number().int().nonnegative(),
  studentsPromoted: z.number().int().nonnegative(),
  studentsGraduating: z.number().int().nonnegative(),
});
export type ClassPromoteResult = z.infer<typeof classPromoteResultSchema>;

// ── School: user tunggal (BAGIAN 8.2 POST/PATCH /school/users) ───────────────

/** Catatan: PII siswa dilarang — `displayName/phone/email` hanya untuk role dewasa (ADR-005). */
export const userCreateRequestSchema = z.object({
  role: z.enum(ROLES),
  username: z.string().min(1),
  displayName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  classId: z.string().optional(),
  graduationYear: z.number().int().optional(),
});
export type UserCreateRequest = z.infer<typeof userCreateRequestSchema>;

/** PATCH /school/users/:id — deactivate, reset password, pindah kelas, dll. */
export const userPatchRequestSchema = z.object({
  status: z.enum(USER_STATUSES).optional(),
  classId: z.string().optional(),
  resetPassword: z.boolean().optional(),
});
export type UserPatchRequest = z.infer<typeof userPatchRequestSchema>;

// ── School: impor XLSX (BAGIAN 8.2 /school/users/import) ─────────────────────

/** POST /school/users/import (multipart) → jobId. */
export const importStartResponseSchema = z.object({
  jobId: z.string(),
});
export type ImportStartResponse = z.infer<typeof importStartResponseSchema>;

/** Satu baris bermasalah pada file impor (untuk laporan error ramah, BAGIAN 8.2 / QA-2). */
export const importRowErrorSchema = z.object({
  row: z.number().int().positive(),
  column: z.string().optional(),
  code: z.string(),
  message: z.string(),
});
export type ImportRowError = z.infer<typeof importRowErrorSchema>;

/** GET /school/users/import/:jobId → progress + laporan error. */
export const importJobStatusSchema = z.object({
  jobId: z.string(),
  status: z.enum(IMPORT_JOB_STATUSES),
  total: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
  /** Siswa BARU yang dibuat (punya kredensial sekali-unduh); ≤ succeeded. */
  created: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z.array(importRowErrorSchema),
  /** Pesan ramah saat status FAILED (mis. file rusak / terlalu besar). */
  message: z.string().optional(),
  errorReportUrl: z.string().optional(),
  /** URL unduh kredensial sekali-pakai (NIS + password sementara siswa baru). */
  credentialsReportUrl: z.string().optional(),
});
export type ImportJobStatusResponse = z.infer<typeof importJobStatusSchema>;

// ── School: kode undangan ortu (BAGIAN 8.2 /school/invite-codes) ─────────────

/** POST /school/invite-codes/generate — {classId|studentIds} → PDF batch. */
export const inviteCodeGenerateRequestSchema = z
  .object({
    classId: z.string().optional(),
    studentIds: z.array(z.string()).min(1).optional(),
  })
  .refine((v) => [v.classId, v.studentIds].filter(Boolean).length === 1, {
    message: "Isi tepat satu: classId ATAU studentIds.",
  });
export type InviteCodeGenerateRequest = z.infer<typeof inviteCodeGenerateRequestSchema>;

export const inviteCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  studentUserId: z.string(),
  status: z.enum(INVITE_CODE_STATUSES),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
});
export type InviteCode = z.infer<typeof inviteCodeSchema>;

export const inviteCodeBatchResponseSchema = z.object({
  codes: z.array(inviteCodeSchema),
  batchPdfUrl: z.string().optional(),
});
export type InviteCodeBatchResponse = z.infer<typeof inviteCodeBatchResponseSchema>;

// ── School: consent (BAGIAN 8.2 GET/POST /school/consents) ───────────────────

export const consentCreateRequestSchema = z.object({
  subjectUserId: z.string().min(1),
  type: z.enum(CONSENT_TYPES),
  docVersion: z.string().min(1),
  grantedByUserId: z.string().optional(),
  evidenceRef: z.string().optional(),
});
export type ConsentCreateRequest = z.infer<typeof consentCreateRequestSchema>;

export const consentRecordSchema = z.object({
  id: z.string(),
  subjectUserId: z.string(),
  grantedByUserId: z.string().nullable(),
  type: z.enum(CONSENT_TYPES),
  docVersion: z.string(),
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
  evidenceRef: z.string().nullable(),
});
export type ConsentRecord = z.infer<typeof consentRecordSchema>;

// ── School: audit log (BAGIAN 8.2 GET /school/audit-log, append-only) ────────

export const auditLogQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
});
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const auditLogEntrySchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  ip: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
