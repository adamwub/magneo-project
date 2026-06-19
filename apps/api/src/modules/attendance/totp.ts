import { createHmac } from "node:crypto";

/**
 * TOTP token absensi QR (BAGIAN 10.2 & 12A.1).
 * Param mengikat spec 12A.1: period=30 dtk, digits=8, algoritma SHA-256, validate window=±1.
 *
 * Secret per sekolah (raw bytes) disimpan terenkripsi (lih. aes-gcm.ts) dan TIDAK PERNAH
 * dikirim ke klien. Modul ini hanya menghitung/memvalidasi token dari secret + waktu server.
 */

export const TOTP_PERIOD_SEC = 30;
export const TOTP_DIGITS = 8;
const ALGO = "sha256";

/** Step TOTP untuk detik epoch tertentu (default: sekarang). */
export function totpStep(epochSec: number = Math.floor(Date.now() / 1000)): number {
  return Math.floor(epochSec / TOTP_PERIOD_SEC);
}

/** Detik tersisa sebelum token berganti (untuk UI rotasi). */
export function totpExpiresInSec(epochSec: number = Math.floor(Date.now() / 1000)): number {
  return TOTP_PERIOD_SEC - (epochSec % TOTP_PERIOD_SEC);
}

/** HOTP(secret, counter) → string `TOTP_DIGITS` digit (RFC 4226 dynamic truncation). */
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // counter 64-bit big-endian (aman s/d 2^53 — cukup utk step 30 dtk).
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac(ALGO, secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

/** Token TOTP untuk step tertentu (default: step sekarang). */
export function generateTotp(secret: Buffer, step: number = totpStep()): string {
  return hotp(secret, step);
}

/**
 * Validasi token terhadap secret dengan window ±`window` step (default 1, sesuai 12A.1).
 * Mengembalikan `step` yang cocok (untuk kunci anti-replay di 2d), atau null bila tidak valid.
 * Perbandingan tidak bocor lewat panjang (token selalu `TOTP_DIGITS` digit).
 */
export function validateTotp(
  token: string,
  secret: Buffer,
  opts: { now?: number; window?: number } = {},
): number | null {
  const window = opts.window ?? 1;
  const nowStep = totpStep(opts.now ?? Math.floor(Date.now() / 1000));
  if (!/^\d+$/.test(token) || token.length !== TOTP_DIGITS) return null;
  for (let d = -window; d <= window; d++) {
    if (generateTotp(secret, nowStep + d) === token) return nowStep + d;
  }
  return null;
}
