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
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    session: {
      create: vi.fn().mockResolvedValue({ id: "sess1" }),
      findFirst: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({ id: "sess1", deviceId: "dev1", deviceName: null }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    userRoleLink: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
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
    expect(res.sessionEvicted).toBe(false);
    expect(prisma.session.create).toHaveBeenCalledOnce();
  });

  it("melebihi batas perangkat → cabut sesi tertua & tandai sessionEvicted", async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ passwordHash: goodHash }));
    // Siswa: batas 2. Setelah create ada 3 sesi aktif → 1 tertua dicabut.
    prisma.session.findMany.mockResolvedValue([{ id: "old" }, { id: "mid" }, { id: "sess1" }]);
    const res = await svc.login(loginDto);
    expect(res.sessionEvicted).toBe(true);
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["old"] } } }),
    );
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

describe("refresh reuse-detection", () => {
  it("token lama yang sudah diputar dipakai ulang → cabut SEMUA sesi + TOKEN_REUSE_DETECTED", async () => {
    prisma.session.findFirst
      .mockResolvedValueOnce(null) // tidak cocok sebagai token aktif
      .mockResolvedValueOnce({ id: "sessX", userId: "u1" }); // cocok sebagai prev hash → reuse
    const err = await svc.refresh({ refreshToken: "token-lama" }).catch((e) => e);
    expect(codeOf(err)).toBe("TOKEN_REUSE_DETECTED");
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", revokedAt: null }, data: expect.any(Object) }),
    );
  });
});

describe("role-switch", () => {
  it("tanpa tautan terverifikasi → ROLE_SWITCH_NOT_ALLOWED", async () => {
    prisma.userRoleLink.findFirst.mockResolvedValue(null);
    const claims = { sub: "u1", sid: "sess1", role: "PARENT", schoolId: "s1", scopes: [], linkRoles: [] };
    const err = await svc.roleSwitch(claims as never, "u2").catch((e) => e);
    expect(codeOf(err)).toBe("ROLE_SWITCH_NOT_ALLOWED");
  });

  it("dengan tautan terverifikasi → terbitkan sesi untuk akun tujuan", async () => {
    prisma.userRoleLink.findFirst.mockResolvedValue({ id: "link1", verifiedBy: "admin1" });
    prisma.user.findUnique.mockResolvedValue(makeUser({ id: "u2", role: "TEACHER", passwordHash: goodHash }));
    const claims = { sub: "u1", sid: "sess1", role: "PARENT", schoolId: "s1", scopes: [], linkRoles: [] };
    const res = await svc.roleSwitch(claims as never, "u2");
    expect(res.accessToken).toBe("access.jwt.token");
    expect(res.refreshToken).toBeTypeOf("string");
    expect(prisma.session.create).toHaveBeenCalledOnce();
  });
});

describe("listSessions & revokeSession", () => {
  it("listSessions menandai sesi saat ini (current=true)", async () => {
    prisma.session.findMany.mockResolvedValue([
      { id: "sess1", deviceName: "HP A", createdAt: new Date(), revokedAt: null },
      { id: "sess2", deviceName: "HP B", createdAt: new Date(), revokedAt: null },
    ]);
    const res = await svc.listSessions("u1", "sess1");
    expect(res.sessions.find((s) => s.id === "sess1")?.current).toBe(true);
    expect(res.sessions.find((s) => s.id === "sess2")?.current).toBe(false);
  });

  it("revokeSession yang bukan milik user / tidak ada → NOT_FOUND", async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 0 });
    const err = await svc.revokeSession("u1", "sessZ").catch((e) => e);
    expect(codeOf(err)).toBe("NOT_FOUND");
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
