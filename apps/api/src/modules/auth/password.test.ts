import { describe, it, expect } from "vitest";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "./password";

describe("checkPasswordPolicy (BAGIAN 7.2)", () => {
  it("menolak password < 8 karakter", () => {
    expect(checkPasswordPolicy("short").ok).toBe(false);
  });

  it("menolak password terlalu umum", () => {
    expect(checkPasswordPolicy("12345678").ok).toBe(false);
    expect(checkPasswordPolicy("password").ok).toBe(false);
  });

  it("menolak password yang sama dengan identitas (NIS/username/phone/email)", () => {
    expect(checkPasswordPolicy("20240001", ["20240001"]).ok).toBe(false);
    expect(checkPasswordPolicy("Budi2024", ["budi2024"]).ok).toBe(false); // case-insensitive
  });

  it("menerima password yang kuat dan berbeda dari identitas", () => {
    expect(checkPasswordPolicy("Magnoo!2026", ["20240001", "0812"]).ok).toBe(true);
  });
});

describe("hashPassword/verifyPassword (argon2id)", () => {
  it("hash bisa diverifikasi dengan password benar dan gagal dgn yang salah", async () => {
    const h = await hashPassword("Magnoo!2026");
    expect(h).not.toContain("Magnoo!2026"); // tidak menyimpan plaintext
    expect(await verifyPassword(h, "Magnoo!2026")).toBe(true);
    expect(await verifyPassword(h, "salah-banget")).toBe(false);
  });

  it("verify mengembalikan false (tidak melempar) untuk hash rusak", async () => {
    expect(await verifyPassword("bukan-hash", "apa-saja")).toBe(false);
  });
});
