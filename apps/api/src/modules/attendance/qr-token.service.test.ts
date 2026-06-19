import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomBytes } from "node:crypto";
import { QrTokenService } from "./qr-token.service";
import { validateTotp, TOTP_DIGITS } from "./totp";

const KEY_B64 = randomBytes(32).toString("base64");

/** Mock Prisma School: simpan qrTotpSecretEnc in-memory, modelkan updateMany "hanya bila null". */
function makePrisma(initialEnc: string | null = null) {
  const state = { enc: initialEnc, exists: true };
  return {
    state,
    school: {
      findUnique: vi.fn(async () => (state.exists ? { qrTotpSecretEnc: state.enc } : null)),
      updateMany: vi.fn(async ({ where, data }: any) => {
        // where: { id, qrTotpSecretEnc: null } → tulis hanya bila masih kosong (anti-balapan).
        if (where.qrTotpSecretEnc === null && state.enc === null) {
          state.enc = data.qrTotpSecretEnc;
          return { count: 1 };
        }
        return { count: 0 };
      }),
    },
  };
}

const config = { get: vi.fn(() => KEY_B64) } as any;

describe("QrTokenService (2c) — token QR server-side", () => {
  let prisma: ReturnType<typeof makePrisma>;
  let svc: QrTokenService;

  beforeEach(() => {
    prisma = makePrisma(null);
    svc = new QrTokenService(prisma as any, config);
  });

  it("current(): kembalikan token 8-digit + period 30 + expiresInSec, TANPA secret", async () => {
    const res = await svc.current("school1");
    expect(Object.keys(res).sort()).toEqual(["expiresInSec", "period", "token"]); // tak ada 'secret'
    expect(res.token).toMatch(/^\d{8}$/);
    expect(res.period).toBe(30);
    expect(res.expiresInSec).toBeGreaterThan(0);
  });

  it("membuat & menyimpan secret TERENKRIPSI saat belum ada (bukan plaintext)", async () => {
    await svc.current("school1");
    expect(prisma.school.updateMany).toHaveBeenCalledTimes(1);
    const stored = prisma.state.enc!;
    expect(stored).toBeTruthy();
    // Tersimpan sebagai blob base64 terenkripsi, bukan 32 byte mentah.
    expect(Buffer.from(stored, "base64").length).toBeGreaterThan(32); // IV(12)+TAG(16)+CT(32)
  });

  it("secret dipakai ulang (tak menimpa) pada panggilan berikutnya", async () => {
    await svc.current("school1");
    const firstEnc = prisma.state.enc;
    await svc.current("school1");
    expect(prisma.state.enc).toBe(firstEnc); // tak dibuat ulang
    expect(prisma.school.updateMany).toHaveBeenCalledTimes(1); // hanya sekali
  });

  it("validateToken: token dari current() valid; token asal lain ditolak", async () => {
    const { token } = await svc.current("school1");
    expect(await svc.validateToken("school1", token)).not.toBeNull();
    expect(await svc.validateToken("school1", "abc")).toBeNull(); // format salah pasti ditolak
  });

  it("token sekolah A tidak valid di sekolah B (mengikat schoolId via secret beda)", async () => {
    const a = makePrisma(null);
    const b = makePrisma(null);
    const svcA = new QrTokenService(a as any, config);
    const svcB = new QrTokenService(b as any, config);
    const { token } = await svcA.current("A");
    expect(await svcB.validateToken("B", token)).toBeNull();
    expect(TOTP_DIGITS).toBe(8);
  });
});
