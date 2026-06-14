import { describe, it, expect } from "vitest";
import { loginRequestSchema, passwordChangeRequestSchema } from "./auth.js";

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
