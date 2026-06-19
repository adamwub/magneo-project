import { z } from "zod";

/**
 * Pesan ortu↔wali kelas — Thread PARENT_HOMEROOM (BAGIAN 10.7 & 12A.5, Fase 2).
 *
 * Guardrail 13.5: TIDAK ada DM siswa↔siswa / luar→siswa / chat tersembunyi guru↔siswa.
 * Di Fase 2 HANYA tipe PARENT_HOMEROOM (ortu↔wali kelas anaknya); semua pesan tercatat.
 * CLASS_ROOM & APPLICATION = bukan Fase 2.
 */

export const THREAD_TYPES = ["PARENT_HOMEROOM", "CLASS_ROOM", "APPLICATION"] as const;
export type ThreadType = (typeof THREAD_TYPES)[number];

/** POST /threads — ortu memulai thread dengan wali kelas anaknya (mulai dari templateKey). */
export const threadStartRequestSchema = z.object({
  studentUserId: z.string().min(1),
  body: z.string().min(1),
  templateKey: z.string().optional(),
});
export type ThreadStartRequest = z.infer<typeof threadStartRequestSchema>;

/** POST /threads/:id/messages */
export const sendMessageRequestSchema = z.object({
  body: z.string().min(1),
  templateKey: z.string().optional(),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const messageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  senderUserId: z.string(),
  body: z.string(),
  templateKey: z.string().nullable(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

export const threadSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  type: z.enum(THREAD_TYPES),
  contextId: z.string(),
  participantIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Thread = z.infer<typeof threadSchema>;
