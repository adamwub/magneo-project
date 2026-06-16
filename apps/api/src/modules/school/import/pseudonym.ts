import { randomBytes, createHash, createHmac } from "node:crypto";

/**
 * Penyamaran NIS siswa (Fase 1f, keputusan pemilik 2026-06-14 + ADR-005 / guardrail 13.2).
 *
 * NIS asli TIDAK PERNAH disimpan di cloud. Yang disimpan sebagai `User.username` adalah
 * hasil penyamaran berikut, yang BUTUH DUA rahasia:
 *   - `nisKey`  : kunci acak unik per sekolah (kolom `School.nisKey`, di DB).
 *   - `pepper`  : `NIS_PSEUDONYM_PEPPER` (di env, BAGIAN 16).
 *
 * Konstruksi: `username = HMAC_SHA256(key = sha256(nisKey + pepper), message = NIS)` (hex).
 * Bila salah satu rahasia bocor sendirian, NIS tetap aman (perlu keduanya untuk menyamarkan
 * ulang & mencocokkan). Deterministik → login siswa nanti menyamarkan NIS dengan cara sama
 * lalu mencocokkan ke `username`; sekaligus jadi kunci idempotensi (@@unique[schoolId,username]).
 */

/** Kunci penyamaran per sekolah: 32 byte acak, disimpan hex. */
export function generateNisKey(): string {
  return randomBytes(32).toString("hex");
}

/** Normalisasi NIS sebelum disamarkan: buang spasi di tepi (leading zero DIPERTAHANKAN). */
export function normalizeNis(nis: string): string {
  return nis.trim();
}

/** Samarkan NIS → username buram (hex). Butuh nisKey (DB) + pepper (env). */
export function pseudonymizeNis(nis: string, nisKey: string, pepper: string): string {
  const key = createHash("sha256").update(`${nisKey}${pepper}`).digest();
  return createHmac("sha256", key).update(normalizeNis(nis)).digest("hex");
}
