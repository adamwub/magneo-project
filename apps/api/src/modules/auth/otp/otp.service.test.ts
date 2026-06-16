import { describe, it, expect, beforeEach } from "vitest";
import { OtpService } from "./otp.service";

/** Redis tiruan in-memory (cukup untuk menguji logika OTP, tanpa TTL nyata). */
class FakeRedis {
  store = new Map<string, string>();
  counters = new Map<string, number>();
  async incr(k: string): Promise<number> {
    const n = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, n);
    return n;
  }
  async expire(): Promise<number> {
    return 1;
  }
  async set(k: string, v: string): Promise<"OK"> {
    this.store.set(k, v);
    return "OK";
  }
  async get(k: string): Promise<string | null> {
    return this.store.get(k) ?? null;
  }
  async del(k: string): Promise<number> {
    return this.store.delete(k) ? 1 : 0;
  }
}

describe("OtpService (Fase 1g — OTP Redis, QA-1)", () => {
  let redis: FakeRedis;
  let sent: { id: string; code: string; purpose: string }[];
  let otp: OtpService;

  beforeEach(() => {
    redis = new FakeRedis();
    sent = [];
    const notifier = { send: async (id: string, code: string, purpose: string) => { sent.push({ id, code, purpose }); } };
    otp = new OtpService(redis as never, notifier as never);
  });

  async function requestAndGetCode(id = "0812"): Promise<string> {
    await otp.request("PARENT_REGISTER", id);
    return sent[sent.length - 1].code;
  }

  it("request mengirim OTP 6 digit & balas expiresInSec", async () => {
    const res = await otp.request("PARENT_REGISTER", "0812");
    expect(res.expiresInSec).toBe(OtpService.TTL_SEC);
    expect(sent).toHaveLength(1);
    expect(sent[0].code).toMatch(/^\d{6}$/);
  });

  it("verify dengan kode benar → sukses & kode dihapus (sekali pakai)", async () => {
    const code = await requestAndGetCode();
    await expect(otp.verify("PARENT_REGISTER", "0812", code)).resolves.toBeUndefined();
    // kode sudah dihapus → verifikasi ulang = OTP_EXPIRED
    await expect(otp.verify("PARENT_REGISTER", "0812", code)).rejects.toMatchObject({ status: 400 });
  });

  it("kode salah → OTP_INVALID", async () => {
    await requestAndGetCode();
    await expect(otp.verify("PARENT_REGISTER", "0812", "000000")).rejects.toMatchObject({ status: 400 });
  });

  it("tanpa request → OTP_EXPIRED (tak ada kode)", async () => {
    await expect(otp.verify("PARENT_REGISTER", "0899", "123456")).rejects.toMatchObject({ status: 400 });
  });

  it("salah berkali-kali → akhirnya rate-limited (kode hangus)", async () => {
    await requestAndGetCode();
    for (let i = 0; i < OtpService.MAX_ATTEMPTS; i++) {
      await expect(otp.verify("PARENT_REGISTER", "0812", "000000")).rejects.toMatchObject({ status: 400 });
    }
    // percobaan berikutnya → 429 (terlalu banyak percobaan)
    await expect(otp.verify("PARENT_REGISTER", "0812", "000000")).rejects.toMatchObject({ status: 429 });
  });

  it("penerbitan OTP dibatasi (rate-limit) setelah RATE_MAX kali", async () => {
    for (let i = 0; i < OtpService.RATE_MAX; i++) await otp.request("PARENT_REGISTER", "0812");
    await expect(otp.request("PARENT_REGISTER", "0812")).rejects.toMatchObject({ status: 429 });
  });

  it("namespace purpose terpisah (PARENT_REGISTER vs PASSWORD_RESET tak saling pakai)", async () => {
    const code = await requestAndGetCode("0812");
    await expect(otp.verify("PASSWORD_RESET", "0812", code)).rejects.toMatchObject({ status: 400 });
  });
});
