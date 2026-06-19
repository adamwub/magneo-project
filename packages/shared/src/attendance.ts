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

/** Status harian per siswa (materialized, BAGIAN 6.2). */
export const dailyAttendanceStatusSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  date: schoolDateSchema,
  finalStatus: z.enum(FINAL_ATT_STATUSES),
});
export type DailyAttendanceStatus = z.infer<typeof dailyAttendanceStatusSchema>;
