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
] as const;
