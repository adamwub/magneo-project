import { randomBytes, createHash } from "node:crypto";

/**
 * Token refresh (BAGIAN 7.1).
 *
 * Refresh token = string acak buram (bukan JWT). Yang disimpan di tabel `Session`
 * hanyalah HASH-nya (SHA-256), bukan token mentah — jadi bocornya isi DB tidak
 * langsung memberi token yang bisa dipakai. Rotasi: tiap refresh menerbitkan token
 * baru dan mengganti hash di Session (reuse-detection menyusul di 1d).
 */

/** Buat refresh token mentah (dikirim ke klien sekali, tidak disimpan apa adanya). */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash refresh token untuk disimpan/dicocokkan di `Session.refreshTokenHash`. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
