/**
 * Enum inti bersama (single source of truth untuk TS dan Dart).
 *
 * Nilai-nilai didefinisikan sekali sebagai array konstan, lalu dipakai untuk:
 *   - membentuk zod enum (validasi di tepi, BAGIAN 17 aplikasi.md), dan
 *   - menghasilkan `enum` Dart lewat skrip generate (ADR-004).
 *
 * Sumber nilai: BAGIAN 6 (Model Data) aplikasi.md.
 */

/** User.role — BAGIAN 6.1 */
export const ROLES = [
  "STUDENT",
  "TEACHER",
  "SCHOOL_ADMIN",
  "PRINCIPAL",
  "PARENT",
  "ALUMNI",
  "PARTNER",
  "HQ_ADMIN",
  "HQ_OPS",
] as const;
export type Role = (typeof ROLES)[number];

/** User.status — BAGIAN 6.1 */
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "LOCKED", "PENDING_CONSENT"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** School.status — BAGIAN 6.1 */
export const SCHOOL_STATUSES = ["ONBOARDING", "ACTIVE", "PAUSED", "TERMINATED"] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

/** ParentLink.status — BAGIAN 6.1 */
export const LINK_STATUSES = ["ACTIVE", "REVOKED"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** ConsentRecord.type — BAGIAN 6.1 */
export const CONSENT_TYPES = [
  "GENERAL_DATA",
  "FACE",
  "PUBLICATION",
  "ALUMNI_CAREER",
  "TOS",
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

/**
 * Status job impor XLSX (BAGIAN 8.2 /school/users/import).
 * Bukan enum DB — status dilacak di antrean BullMQ/Redis, dipakai di respons API.
 */
export const IMPORT_JOB_STATUSES = ["QUEUED", "RUNNING", "COMPLETED", "FAILED"] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

/**
 * Status turunan kode undangan ortu (BAGIAN 8.2 /school/invite-codes).
 * Dihitung dari kolom usedAt/revokedAt/expiresAt InviteCode saat membentuk respons.
 */
export const INVITE_CODE_STATUSES = ["ACTIVE", "USED", "REVOKED", "EXPIRED"] as const;
export type InviteCodeStatus = (typeof INVITE_CODE_STATUSES)[number];

/** AttendanceEvent.type — BAGIAN 6.2 */
export const ATT_TYPES = ["IN", "OUT", "CORRECTION"] as const;
export type AttType = (typeof ATT_TYPES)[number];

/** AttendanceEvent.method — BAGIAN 6.2 */
export const ATT_METHODS = ["QR", "FACE", "MANUAL"] as const;
export type AttMethod = (typeof ATT_METHODS)[number];

/** AttendanceEvent.status — BAGIAN 6.2 */
export const ATT_STATUSES = ["PRESENT", "LATE"] as const;
export type AttStatus = (typeof ATT_STATUSES)[number];

/** DailyAttendanceStatus.finalStatus — BAGIAN 6.2 */
export const FINAL_ATT_STATUSES = [
  "PRESENT",
  "LATE",
  "PERMIT",
  "SICK",
  "ABSENT_NO_INFO",
] as const;
export type FinalAtt = (typeof FINAL_ATT_STATUSES)[number];

/** Permit.type — BAGIAN 6.2 / 10.3 (Fase 2) */
export const PERMIT_TYPES = ["SICK", "FAMILY", "DISPENSATION", "OTHER"] as const;
export type PermitType = (typeof PERMIT_TYPES)[number];

/** Permit.status — state machine 12A.3 (Fase 2) */
export const PERMIT_STATUSES = ["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"] as const;
export type PermitStatus = (typeof PERMIT_STATUSES)[number];

/** Announcement.scope — BAGIAN 6.2 / 10.6 (Fase 2) */
export const ANN_SCOPES = ["CLASS", "GRADE", "SCHOOL", "PARENTS"] as const;
export type AnnScope = (typeof ANN_SCOPES)[number];

/** DeviceToken.platform — push FCM, 12A.2 (Fase 2) */
export const PLATFORMS = ["ANDROID", "IOS"] as const;
export type Platform = (typeof PLATFORMS)[number];

/**
 * Registry enum untuk skrip generate Dart.
 * Tambahkan entri di sini saat menambah enum baru yang perlu di sisi Dart.
 */
export const ENUM_REGISTRY = [
  { name: "Role", values: ROLES },
  { name: "UserStatus", values: USER_STATUSES },
  { name: "AttType", values: ATT_TYPES },
  { name: "AttMethod", values: ATT_METHODS },
  { name: "AttStatus", values: ATT_STATUSES },
  { name: "FinalAtt", values: FINAL_ATT_STATUSES },
  // Fase 1 — dipakai di alur HP (ortu link anak & persetujuan ToS).
  { name: "LinkStatus", values: LINK_STATUSES },
  { name: "ConsentType", values: CONSENT_TYPES },
  // Fase 2 — izin, pengumuman, device push (dipakai di layar HP).
  { name: "PermitType", values: PERMIT_TYPES },
  { name: "PermitStatus", values: PERMIT_STATUSES },
  { name: "AnnScope", values: ANN_SCOPES },
  { name: "Platform", values: PLATFORMS },
] as const;
