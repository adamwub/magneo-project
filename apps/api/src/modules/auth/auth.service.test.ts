import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { hashPassword } from "./password";
import { hashRefreshToken } from "./tokens";

/**
 * Tes unit logika auth (BAGIAN 7.2) dengan Prisma & JWT dipalsukan (mock).
 * Alur login penuh end-to-end (DB nyata) diuji di 1k.
 */

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    schoolId: "s1",
    role: "STUDENT",
    username: "20240001",
    passwordHash: "",
    status: "ACTIVE",
    phone: null,
    email: null,
    mustChangePassword: true,
    failedLoginCount: 0,
    lockedUntil: null,
    deletedAt: null,
    ...overrides,
  };
}

function codeOf(err: unknown): string | undefined {
  if (err instanceof HttpException) {
    const body = err.getResponse() as { error?: { code?: string } };
    return body.error?.code;
  }
  return undefined;
}

let goodHash: string;
beforeAll(async () => {
  goodHash = await hashPassword("Magnoo!2026");
});

let prisma: any;
let jwt: any;
let config: any;
let svc: AuthService;

beforeEach(() => {
  prisma = {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    session: {
      create: vi.fn().mockResolvedValue({ id: "sess1" }),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    consentRecord: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
  };
  jwt = { signAsync: vi.fn().mockResolvedValue("access.jwt.token") };
  config = {
    get: (k: string) =>
      ({ JWT_ACCESS_SECRET: "x".repeat(32), JWT_ACCESS_TTL_SEC: 3600, JWT_REFRESH_TTL_SEC: 2_592_000 }[k]),
  };
  svc = new AuthService(prisma, jwt, config);
});

const loginDto = { username: "20240001", schoolId: "s1", password: "Magnoo!2026", deviceId: "dev1" };

describe("login", () => {
  it("menolak akun yang sedang terkunci (ACCOUNT_LOCKED)", async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({ passwordHash: goodHash, lockedUntil: new Date(Date.now() + 60_000) }),
    );
    const err = await svc.login(loginDto).catch((e) => e);
    expect(codeOf(err)).toBe("ACCOUNT_LOCKED");
  });

  it("password salah → menaikkan failedLoginCount & error generik INVALID_CREDENTIALS", async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ passwordHash: goodHash, failedLoginCount: 0 }));
    const err = await svc.login({ ...loginDto, password: "salah" }).catch((e) => e);
    expect(codeOf(err)).toBe("INVALID_CREDENTIALS");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginCount: 1 }) }),
    );
  });

  it("gagal ke-5 → mengunci akun 15 menit (lockedUntil di-set, counter di-reset)", async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ passwordHash: goodHash, failedLoginCount: 4 }));
    await svc.login({ ...loginDto, password: "salah" }).catch((e) => e);
    const arg = prisma.user.update.mock.calls[0][0];
    expect(arg.data.failedLoginCount).toBe(0);
    expect(arg.data.lockedUntil).toBeInstanceOf(Date);
    expect(arg.data.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it("login sukses → buat sesi & kembalikan token + flag first-login", async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({ passwordHash: goodHash, mustChangePassword: true }),
    );
    const res = await svc.login(loginDto);
    expect(res.accessToken).toBe("access.jwt.token");
    expect(res.refreshToken).toBeTypeOf("string");
    expect(res.role).toBe("STUDENT");
    expect(res.mustChangePassword).toBe(true);
    expect(res.mustAcceptTos).toBe(true); // belum ada ConsentRecord TOS
    expect(prisma.session.create).toHaveBeenCalledOnce();
  });

  it("login siswa tanpa schoolId → ditolak (tidak bisa resolusi NIS)", async () => {
    const err = await svc.login({ username: "20240001", password: "Magnoo!2026", deviceId: "d" }).catch((e) => e);
    expect(codeOf(err)).toBe("INVALID_CREDENTIALS");
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });
});

describe("refresh (rotating)", () => {
  it("token tidak dikenal → ditolak", async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    const err = await svc.refresh({ refreshToken: "abc" }).catch((e) => e);
    expect(codeOf(err)).toBe("UNAUTHORIZED");
  });

  it("token valid → memutar token (ganti hash sesi) & beri refresh baru", async () => {
    prisma.session.findFirst.mockResolvedValue({
      id: "sess1",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: goodHash }));
    const res = await svc.refresh({ refreshToken: "lama" });
    expect(res.refreshToken).not.toBe("lama");
    const upd = prisma.session.update.mock.calls[0][0];
    expect(upd.where.id).toBe("sess1");
    expect(upd.data.refreshTokenHash).not.toBe(hashRefreshToken("lama"));
  });
});

describe("logout", () => {
  it("merevoke sesi berdasarkan sid", async () => {
    await svc.logout("sess1");
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "sess1", revokedAt: null }) }),
    );
  });
});
