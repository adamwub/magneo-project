import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Enkripsi simetris AES-256-GCM (BAGIAN 14 / 12A.1) untuk menyimpan secret kecil
 * (mis. secret TOTP absensi QR per sekolah) terenkripsi at-rest di DB.
 *
 * Format blob tersimpan (base64): IV(12) ‖ AUTH_TAG(16) ‖ CIPHERTEXT.
 * Key = 32 byte (AES-256), berasal dari env/vault (lih. QR_TOTP_ENC_KEY) — JANGAN hardcode.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit nonce (rekomendasi GCM)
const TAG_LEN = 16;

/** Decode & validasi key base64 menjadi 32 byte. Lempar bila panjang salah. */
export function loadAesKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error(`Kunci AES-256 harus 32 byte (didapat ${key.length}). Pakai \`openssl rand -base64 32\`.`);
  }
  return key;
}

/** Enkripsi `plaintext` → blob base64 (IV‖TAG‖CT). IV acak tiap panggilan. */
export function encryptToBase64(plaintext: Buffer, key: Buffer): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Dekripsi blob base64 (IV‖TAG‖CT) → plaintext. Lempar bila tag tak cocok (data diubah). */
export function decryptFromBase64(blobBase64: string, key: Buffer): Buffer {
  const blob = Buffer.from(blobBase64, "base64");
  if (blob.length < IV_LEN + TAG_LEN) {
    throw new Error("Blob terenkripsi rusak/terlalu pendek.");
  }
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}
