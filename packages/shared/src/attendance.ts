import { z } from "zod";
import { ATT_TYPES, ATT_METHODS, ATT_STATUSES, FINAL_ATT_STATUSES } from "./enums.js";

/**
 * Skema attendance inti (BAGIAN 6.2 & 8.2 aplikasi.md).
 * Aturan bisnis (rule 10.2–10.4) BELUM diimplementasikan di sini — itu pekerjaan Fase 2.
 * Di Fase 0 kita hanya menyiapkan bentuk data (skema) bersama.
 */

/** Tanggal sekolah bertipe string "YYYY-MM-DD" (BAGIAN 8.1). */
export const schoolDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD.");

/** POST /attendance/qr/checkin — {qrToken, geo?} (validasi lengkap = rule 10.2, Fase 2). */
export const qrCheckinRequestSchema = z.object({
  qrToken: z.string().min(1),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
});
export type QrCheckinRequest = z.infer<typeof qrCheckinRequestSchema>;

/**
 * GET /attendance/qr/current — token QR yang sedang berlaku untuk ditampilkan di
 * layar gerbang (12A.1). Berisi token TOTP 8-digit yang berotasi; SECRET TOTP
 * TIDAK PERNAH dikirim ke klien. `period` = detik per rotasi (30).
 */
export const qrCurrentResponseSchema = z.object({
  token: z.string(),
  period: z.number().int().positive(),
  expiresInSec: z.number().int().nonnegative(),
});
export type QrCurrentResponse = z.infer<typeof qrCurrentResponseSchema>;

/** POST /attendance/corrections — koreksi absen (BAGIAN 10.4). status = PRESENT|LATE. */
export const attendanceCorrectionRequestSchema = z.object({
  studentUserId: z.string().min(1),
  date: schoolDateSchema,
  status: z.enum(ATT_STATUSES),
  reason: z.string().min(1),
});
export type AttendanceCorrectionRequest = z.infer<typeof attendanceCorrectionRequestSchema>;

/** Satu event absensi (immutable; koreksi = event baru, BAGIAN 6.2). */
export const attendanceEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  schoolId: z.string(),
  date: schoolDateSchema,
  type: z.enum(ATT_TYPES),
  method: z.enum(ATT_METHODS),
  status: z.enum(ATT_STATUSES),
  occurredAt: z.string(), // ISO-8601 UTC
});
export type AttendanceEvent = z.infer<typeof attendanceEventSchema>;

// ── Laporan kehadiran (BAGIAN 8.2 GET /attendance/me|class|school) — Fase 2 (2f) ──
// Catatan privasi (ADR-005 / 13.2): respons cloud TANPA nama siswa — hanya userId
// (pseudonim). Pemetaan ke nama asli hanya di Box (Fase 3).

/** GET /attendance/me?month=YYYY-MM [STUDENT diri sendiri]. */
export const attendanceMonthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan YYYY-MM."),
});
export type AttendanceMonthQuery = z.infer<typeof attendanceMonthQuerySchema>;

/** GET /attendance/class/:classId?date= dan /school/summary?date=. */
export const attendanceDateQuerySchema = z.object({ date: schoolDateSchema });
export type AttendanceDateQuery = z.infer<typeof attendanceDateQuerySchema>;

export const attendanceMineResponseSchema = z.object({
  month: z.string(),
  days: z.array(z.object({ date: schoolDateSchema, finalStatus: z.enum(FINAL_ATT_STATUSES) })),
});
export type AttendanceMineResponse = z.infer<typeof attendanceMineResponseSchema>;

/** Satu baris rekap kelas — userId pseudonim, TANPA nama (ADR-005). */
export const classAttendanceRowSchema = z.object({
  userId: z.string(),
  finalStatus: z.enum(FINAL_ATT_STATUSES),
  firstInAt: z.string().nullable(),
});
export const classAttendanceResponseSchema = z.object({
  classId: z.string(),
  date: schoolDateSchema,
  students: z.array(classAttendanceRowSchema),
});
export type ClassAttendanceResponse = z.infer<typeof classAttendanceResponseSchema>;

export const schoolAttendanceSummarySchema = z.object({
  date: schoolDateSchema,
  counts: z.object({
    PRESENT: z.number().int().nonnegative(),
    LATE: z.number().int().nonnegative(),
    PERMIT: z.number().int().nonnegative(),
    SICK: z.number().int().nonnegative(),
    ABSENT_NO_INFO: z.number().int().nonnegative(),
  }),
  total: z.number().int().nonnegative(),
});
export type SchoolAttendanceSummary = z.infer<typeof schoolAttendanceSummarySchema>;

/** Status harian per siswa (materialized, BAGIAN 6.2). */
export const dailyAttendanceStatusSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  date: schoolDateSchema,
  finalStatus: z.enum(FINAL_ATT_STATUSES),
});
export type DailyAttendanceStatus = z.infer<typeof dailyAttendanceStatusSchema>;
