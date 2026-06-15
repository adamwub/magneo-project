import { randomBytes, createHash } from "node:crypto";

/**
 * Pembantu provisioning (Fase 1e).
 *
 * Dua rahasia sekali-tampil diterbitkan saat provisioning sekolah:
 *  - Password sementara akun admin (POST /hq/schools/:id/admin-account).
 *  - Pairing token Box (POST /hq/schools/:id/pair-box).
 *
 * Keduanya hanya dikirim SEKALI ke pemanggil; yang disimpan di DB adalah hash-nya
 * (password lewat argon2 di service; pairing token lewat hash + pepper di sini).
 */

/** Alfabet tanpa karakter ambigu (tanpa 0/O/1/l/I) agar mudah diketik manual. */
const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Ambil n karakter acak dari alfabet aman (pakai randomBytes, bukan Math.random). */
function randomFromAlphabet(n: number): string {
  const bytes = randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) {
    out += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }
  return out;
}

/**
 * Password sementara admin sekolah: 12 karakter dari alfabet aman.
 * Admin WAJIB menggantinya saat login pertama (mustChangePassword=true).
 */
export function generateTempPassword(): string {
  return randomFromAlphabet(12);
}

/** Pairing token Box mentah (buram). Dikirim sekali; hash + pepper yang disimpan. */
export function generatePairingToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Hash pairing token untuk disimpan/dicocokkan: sha256(token + pepper) — BAGIAN 16. */
export function hashPairingToken(token: string, pepper: string): string {
  return createHash("sha256").update(`${token}${pepper}`).digest("hex");
}

/** Masa berlaku pairing token sekali-pakai: 7 hari (cukup untuk pemasangan fisik Box). */
export const PAIRING_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;
