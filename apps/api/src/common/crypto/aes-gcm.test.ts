import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { loadAesKey, encryptToBase64, decryptFromBase64 } from "./aes-gcm";

const key = randomBytes(32);
const keyB64 = key.toString("base64");

describe("AES-256-GCM (BAGIAN 14 / 12A.1)", () => {
  it("round-trip: dekripsi mengembalikan plaintext", () => {
    const secret = randomBytes(32);
    const blob = encryptToBase64(secret, key);
    expect(decryptFromBase64(blob, key).equals(secret)).toBe(true);
  });

  it("ciphertext != plaintext, dan IV acak → blob beda tiap enkripsi", () => {
    const secret = Buffer.from("rahasia-totp");
    const a = encryptToBase64(secret, key);
    const b = encryptToBase64(secret, key);
    expect(a).not.toBe(b); // IV acak
    expect(a).not.toContain(secret.toString("base64").replace(/=+$/, ""));
  });

  it("tag GCM menolak data yang diubah (integritas)", () => {
    const blob = Buffer.from(encryptToBase64(randomBytes(16), key), "base64");
    blob[blob.length - 1] ^= 0xff; // ubah 1 byte ciphertext
    expect(() => decryptFromBase64(blob.toString("base64"), key)).toThrow();
  });

  it("kunci salah → gagal dekripsi", () => {
    const blob = encryptToBase64(randomBytes(16), key);
    expect(() => decryptFromBase64(blob, randomBytes(32))).toThrow();
  });

  it("loadAesKey: terima 32 byte base64, tolak panjang salah", () => {
    expect(loadAesKey(keyB64).length).toBe(32);
    expect(() => loadAesKey(Buffer.alloc(16).toString("base64"))).toThrow();
  });

  it("blob terlalu pendek ditolak", () => {
    expect(() => decryptFromBase64(Buffer.alloc(8).toString("base64"), key)).toThrow();
  });
});
