import { z } from "zod";
import { PERMIT_TYPES, PERMIT_STATUSES } from "./enums.js";
import { schoolDateSchema } from "./attendance.js";

/**
 * Izin (permit) — BAGIAN 10.3 & adendum 12A.3 (Fase 2).
 *
 * Alur: siswa/ortu ajukan (SUBMITTED) → wali kelas/SCHOOL_ADMIN putuskan
 * (APPROVED/REJECTED) atau pembuat batalkan (CANCELLED). State machine:
 * SUBMITTED → {APPROVED, REJECTED, CANCELLED}; APPROVED/REJECTED terminal.
 * Logika & penegakan transisi/RBAC ada di backend (potongan 2i), bukan di skema.
 */

/**
 * POST /permits — pembuat = siswa (untuk diri) atau ortu (untuk anaknya).
 * `studentUserId` diisi HANYA bila pengaju ortu (untuk anak); siswa→diri (server).
 */
export const permitCreateRequestSchema = z
  .object({
    studentUserId: z.string().optional(),
    type: z.enum(PERMIT_TYPES),
    dateStart: schoolDateSchema,
    dateEnd: schoolDateSchema,
    note: z.string().min(1),
    attachmentUrl: z.string().optional(), // hasil presign PERMIT_ATTACHMENT (≤5MB, jpg/png/pdf)
  })
  .refine((v) => v.dateEnd >= v.dateStart, {
    message: "dateEnd tidak boleh sebelum dateStart.",
    path: ["dateEnd"],
  });
export type PermitCreateRequest = z.infer<typeof permitCreateRequestSchema>;

/** POST /permits/:id/decision — wali kelas / SCHOOL_ADMIN (12A.3). */
export const permitDecisionRequestSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  decisionNote: z.string().optional(),
});
export type PermitDecisionRequest = z.infer<typeof permitDecisionRequestSchema>;

/** GET /permits?scope=me|class|child — lingkup daftar sesuai peran pemanggil. */
export const permitListQuerySchema = z.object({
  scope: z.enum(["me", "class", "child"]),
  status: z.enum(PERMIT_STATUSES).optional(),
});
export type PermitListQuery = z.infer<typeof permitListQuerySchema>;

/** Satu izin (respons). Tanggal sebagai string "YYYY-MM-DD"; waktu putusan ISO-8601. */
export const permitSchema = z.object({
  id: z.string(),
  studentUserId: z.string(),
  requestedByUserId: z.string(),
  type: z.enum(PERMIT_TYPES),
  dateStart: schoolDateSchema,
  dateEnd: schoolDateSchema,
  note: z.string(),
  attachmentUrl: z.string().nullable(),
  status: z.enum(PERMIT_STATUSES),
  decidedByUserId: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decisionNote: z.string().nullable(),
});
export type Permit = z.infer<typeof permitSchema>;
