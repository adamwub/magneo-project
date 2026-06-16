import { describe, it, expect } from "vitest";
import { generateNisKey, normalizeNis, pseudonymizeNis } from "./pseudonym";

describe("pseudonymizeNis (Fase 1f — penyamaran NIS, ADR-005)", () => {
  const KEY = generateNisKey();
  const PEPPER = "test-pepper-0123456789";

  it("deterministik: NIS sama + kunci sama + pepper sama → hasil sama (kunci idempotensi)", () => {
    const a = pseudonymizeNis("20240001", KEY, PEPPER);
    const b = pseudonymizeNis("20240001", KEY, PEPPER);
    expect(a).toBe(b);
  });

  it("output buram hex 64 char, BUKAN NIS asli (tidak ada NIS mentah di cloud)", () => {
    const out = pseudonymizeNis("20240001", KEY, PEPPER);
    expect(out).toMatch(/^[0-9a-f]{64}$/);
    expect(out).not.toContain("20240001");
  });

  it("NIS berbeda → samaran berbeda", () => {
    expect(pseudonymizeNis("20240001", KEY, PEPPER)).not.toBe(
      pseudonymizeNis("20240002", KEY, PEPPER),
    );
  });

  it("butuh DUA rahasia: ganti kunci ATAU pepper → samaran berubah", () => {
    const base = pseudonymizeNis("20240001", KEY, PEPPER);
    expect(pseudonymizeNis("20240001", generateNisKey(), PEPPER)).not.toBe(base);
    expect(pseudonymizeNis("20240001", KEY, "pepper-lain-0123456789")).not.toBe(base);
  });

  it("normalisasi: spasi tepi diabaikan, angka nol di depan dipertahankan", () => {
    expect(normalizeNis("  20240001  ")).toBe("20240001");
    expect(pseudonymizeNis("  20240001 ", KEY, PEPPER)).toBe(
      pseudonymizeNis("20240001", KEY, PEPPER),
    );
    // leading zero penting: "0123" ≠ "123"
    expect(pseudonymizeNis("0123", KEY, PEPPER)).not.toBe(pseudonymizeNis("123", KEY, PEPPER));
  });

  it("generateNisKey menghasilkan kunci acak 64 hex (32 byte) yang berbeda tiap panggilan", () => {
    const k1 = generateNisKey();
    const k2 = generateNisKey();
    expect(k1).toMatch(/^[0-9a-f]{64}$/);
    expect(k1).not.toBe(k2);
  });
});
