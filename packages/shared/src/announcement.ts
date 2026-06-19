import { z } from "zod";
import { ANN_SCOPES } from "./enums.js";

/**
 * Pengumuman (announcement) — BAGIAN 10.6 & adendum 12A.4 (Fase 2).
 *
 * Sekolah/guru kirim pengumuman ke kelas/angkatan/sekolah/ortu. Bisa ditarik
 * (retract) ≤15 menit setelah publish. Penegakan scope×role & jendela retract
 * 15 menit ada di backend (potongan 2j), bukan di skema ini.
 */

/**
 * POST /announcements.
 * `scopeIds` = classId[] (CLASS) atau angkatan[] (GRADE); kosong untuk SCHOOL/PARENTS.
 */
export const announcementCreateRequestSchema = z.object({
  scope: z.enum(ANN_SCOPES),
  scopeIds: z.array(z.string()).default([]),
  title: z.string().min(1),
  body: z.string().min(1),
});
export type AnnouncementCreateRequest = z.infer<typeof announcementCreateRequestSchema>;

/** Satu pengumuman (respons). Waktu publish/retract ISO-8601. */
export const announcementSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  authorUserId: z.string(),
  scope: z.enum(ANN_SCOPES),
  scopeIds: z.array(z.string()),
  title: z.string(),
  body: z.string(),
  publishedAt: z.string(),
  retractedAt: z.string().nullable(),
});
export type Announcement = z.infer<typeof announcementSchema>;
