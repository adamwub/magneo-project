import { describe, it, expect } from "vitest";
import {
  loginRequestSchema,
  passwordChangeRequestSchema,
  passwordResetRequestSchema,
  parentVerifyOtpRequestSchema,
  parentLinkChildRequestSchema,
} from "./auth.js";

describe("loginRequestSchema", () => {
  const base = { password: "secret12", deviceId: "dev-1" };

  it("menerima tepat satu identifier (username)", () => {
    const r = loginRequestSchema.safeParse({ ...base, username: "12345" });
    expect(r.success).toBe(true);
  });

  it("menolak bila tidak ada identifier sama sekali", () => {
    const r = loginRequestSchema.safeParse(base);
    expect(r.success).toBe(false);
  });

  it("menolak bila lebih dari satu identifier", () => {
    const r = loginRequestSchema.safeParse({
      ...base,
      username: "12345",
      email: "a@b.com",
    });
    expect(r.success).toBe(false);
  });
});

describe("passwordChangeRequestSchema", () => {
  it("menolak password baru < 8 karakter (policy BAGIAN 7.2)", () => {
    const r = passwordChangeRequestSchema.safeParse({
      oldPassword: "x",
      newPassword: "short",
    });
    expect(r.success).toBe(false);
  });
});

describe("passwordResetRequestSchema", () => {
  const base = { otp: "123456", newPassword: "secret12" };

  it("menerima reset via phone dengan OTP 6 digit", () => {
    const r = passwordResetRequestSchema.safeParse({ ...base, phone: "0812" });
    expect(r.success).toBe(true);
  });

  it("menolak bila phone dan email diisi keduanya", () => {
    const r = passwordResetRequestSchema.safeParse({
      ...base,
      phone: "0812",
      email: "a@b.com",
    });
    expect(r.success).toBe(false);
  });

  it("menolak OTP yang bukan 6 digit", () => {
    const r = passwordResetRequestSchema.safeParse({
      ...base,
      phone: "0812",
      otp: "12ab",
    });
    expect(r.success).toBe(false);
  });
});

describe("parentVerifyOtpRequestSchema", () => {
  it("menolak OTP < 6 digit", () => {
    const r = parentVerifyOtpRequestSchema.safeParse({ phone: "0812", otp: "123" });
    expect(r.success).toBe(false);
  });
});

describe("parentLinkChildRequestSchema", () => {
  it("menerima kode 8 karakter huruf besar/angka", () => {
    const r = parentLinkChildRequestSchema.safeParse({ inviteCode: "AB12CD34" });
    expect(r.success).toBe(true);
  });

  it("menolak kode dengan huruf kecil atau panjang salah", () => {
    expect(parentLinkChildRequestSchema.safeParse({ inviteCode: "ab12cd34" }).success).toBe(false);
    expect(parentLinkChildRequestSchema.safeParse({ inviteCode: "AB12" }).success).toBe(false);
  });
});
