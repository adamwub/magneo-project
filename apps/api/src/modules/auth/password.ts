import { hash, verify } from "@node-rs/argon2";

/**
 * Kebijakan & hashing password (BAGIAN 7.2 & 14 aplikasi.md).
 *
 * Hashing: argon2id (default @node-rs/argon2), sama dengan seed (BAGIAN 14).
 * Kebijakan: min 8 karakter, tolak yang terlalu lemah, tolak yang sama dengan
 * identitas login (NIS/username/phone/email).
 *
 * Catatan keterbatasan (utang): spec menyebut juga menolak password = tanggal lahir.
 * Tanggal lahir adalah PII yang TIDAK disimpan di cloud (ADR-005), jadi tidak bisa
 * dicek di sini. Pengecekan tanggal lahir hanya mungkin di Box (fase lanjut).
 */

/** Daftar password paling umum yang langsung ditolak (kelas "123456", dst). */
const WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "qwerty123",
  "11111111",
  "00000000",
  "abcd12345",
]);

export interface PasswordPolicyResult {
  ok: boolean;
  /** Alasan teknis (untuk log/dev), bukan teks yang ditampilkan ke pengguna. */
  reason?: string;
}

/**
 * Validasi password baru terhadap kebijakan.
 * @param password password baru
 * @param identifiers nilai identitas yang tak boleh dipakai sebagai password
 *        (mis. NIS mentah yang baru diketik siswa, username, phone, email)
 */
export function checkPasswordPolicy(
  password: string,
  identifiers: Array<string | null | undefined> = [],
): PasswordPolicyResult {
  if (password.length < 8) {
    return { ok: false, reason: "too_short" };
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: "too_common" };
  }
  const normalized = password.trim().toLowerCase();
  for (const id of identifiers) {
    if (id && id.trim().toLowerCase() === normalized) {
      return { ok: false, reason: "equals_identifier" };
    }
  }
  return { ok: true };
}

/** Hash password dengan argon2id (BAGIAN 14). */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

/** Verifikasi password terhadap hash tersimpan. Tidak melempar untuk hash invalid. */
export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}
