import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import {
  generateTotp,
  validateTotp,
  totpStep,
  totpExpiresInSec,
  TOTP_DIGITS,
  TOTP_PERIOD_SEC,
} from "./totp";

const secret = randomBytes(32);

describe("TOTP (12A.1: period=30, digits=8, SHA256, window=1)", () => {
  it("token selalu 8 digit", () => {
    for (let s = 0; s < 5; s++) {
      const t = generateTotp(secret, totpStep(s * 30));
      expect(t).toMatch(/^\d{8}$/);
      expect(t.length).toBe(TOTP_DIGITS);
    }
  });

  it("token berganti tiap step (deterministik per step)", () => {
    const now = 1_750_000_000;
    const step = totpStep(now);
    expect(generateTotp(secret, step)).toBe(generateTotp(secret, step)); // sama utk step sama
    expect(generateTotp(secret, step)).not.toBe(generateTotp(secret, step + 1)); // beda antar step
  });

  it("validate menerima step n-1, n, n+1 (window=1) dan mengembalikan step yang cocok", () => {
    const now = 1_750_000_321;
    const step = totpStep(now);
    for (const d of [-1, 0, 1]) {
      const token = generateTotp(secret, step + d);
      expect(validateTotp(token, secret, { now })).toBe(step + d);
    }
  });

  it("validate menolak token di luar window (±2)", () => {
    const now = 1_750_000_321;
    const step = totpStep(now);
    expect(validateTotp(generateTotp(secret, step + 2), secret, { now })).toBeNull();
    expect(validateTotp(generateTotp(secret, step - 2), secret, { now })).toBeNull();
  });

  it("validate menolak format salah & secret beda", () => {
    const now = 1_750_000_321;
    expect(validateTotp("12345678", secret, { now, window: 1 })).toBeNull(); // hampir mustahil cocok
    expect(validateTotp("abc", secret, { now })).toBeNull();
    expect(validateTotp("1234567", secret, { now })).toBeNull(); // 7 digit
    const other = randomBytes(32);
    const tok = generateTotp(secret, totpStep(now));
    expect(validateTotp(tok, other, { now })).toBeNull(); // secret beda → tolak
  });

  it("expiresInSec dalam (0, 30]", () => {
    expect(totpExpiresInSec(1_750_000_000)).toBeGreaterThan(0);
    expect(totpExpiresInSec(1_750_000_000)).toBeLessThanOrEqual(TOTP_PERIOD_SEC);
  });
});
