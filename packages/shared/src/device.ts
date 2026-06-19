import { z } from "zod";
import { PLATFORMS } from "./enums.js";

/**
 * Registrasi device untuk notifikasi push (FCM). Fase 2 (12A.2).
 *
 * Klien (HP ortu/siswa) mendaftarkan registration token FCM-nya lewat
 * `POST /me/devices`; server menyimpannya di `DeviceToken` untuk mengirim
 * notifikasi (mis. anak masuk/tidak masuk). Tidak ada PII di sini.
 */

/** POST /me/devices — {token, platform}. */
export const deviceRegisterRequestSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(PLATFORMS),
});
export type DeviceRegisterRequest = z.infer<typeof deviceRegisterRequestSchema>;
