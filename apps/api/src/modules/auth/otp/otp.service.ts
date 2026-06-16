import { Inject, Injectable, HttpStatus } from "@nestjs/common";
import { createHash, randomInt } from "node:crypto";
import type { Redis } from "ioredis";
import { apiError } from "../../../common/api-error";
import { REDIS_CONNECTION_TOKEN } from "../../../queue/queue.constants";
import { OtpNotifier } from "./otp-notifier";

/** Tujuan OTP (namespace key Redis terpisah, tak bisa saling pakai). */
export type OtpPurpose = "PARENT_REGISTER" | "PASSWORD_RESET";

/**
 * Layanan OTP berbasis Redis (Fase 1g) — dipakai registrasi ortu & reset password.
 *
 * OTP disimpan sebagai HASH (sha256), bukan kode mentah (bila Redis bocor, kode tak
 * langsung terbaca). TTL singkat, batas percobaan, dan rate-limit penerbitan menahan
 * brute-force & spam (BAGIAN 7.2 / QA-1). Tidak membocorkan keberadaan akun: pemanggil
 * memutuskan kapan meminta OTP; respons ke klien selalu seragam.
 */
@Injectable()
export class OtpService {
  static readonly TTL_SEC = 5 * 60; // masa berlaku OTP
  static readonly MAX_ATTEMPTS = 5; // salah tebak maksimum sebelum hangus
  static readonly RATE_MAX = 3; // penerbitan OTP maksimum per window
  static readonly RATE_WINDOW_SEC = 10 * 60;

  constructor(
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis,
    private readonly notifier: OtpNotifier,
  ) {}

  private key(purpose: OtpPurpose, id: string): string {
    return `otp:${purpose}:${id}`;
  }
  private rateKey(purpose: OtpPurpose, id: string): string {
    return `otprl:${purpose}:${id}`;
  }
  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }

  /** Terbitkan & kirim OTP. Melempar OTP_RATE_LIMITED bila terlalu sering. */
  async request(purpose: OtpPurpose, id: string): Promise<{ expiresInSec: number }> {
    const rk = this.rateKey(purpose, id);
    const count = await this.redis.incr(rk);
    if (count === 1) await this.redis.expire(rk, OtpService.RATE_WINDOW_SEC);
    if (count > OtpService.RATE_MAX) {
      throw apiError(
        "OTP_RATE_LIMITED",
        "Terlalu banyak permintaan kode. Coba lagi nanti.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.redis.set(
      this.key(purpose, id),
      JSON.stringify({ hash: this.hash(code), attempts: 0 }),
      "EX",
      OtpService.TTL_SEC,
    );
    await this.notifier.send(id, code, purpose);
    return { expiresInSec: OtpService.TTL_SEC };
  }

  /** Verifikasi OTP. Sukses → hapus kode (sekali pakai). Gagal → error spesifik. */
  async verify(purpose: OtpPurpose, id: string, code: string): Promise<void> {
    const k = this.key(purpose, id);
    const raw = await this.redis.get(k);
    if (!raw) {
      throw apiError("OTP_EXPIRED", "Kode sudah kedaluwarsa atau tidak ada.", HttpStatus.BAD_REQUEST);
    }
    const data = JSON.parse(raw) as { hash: string; attempts: number };
    const attempts = data.attempts + 1;
    if (attempts > OtpService.MAX_ATTEMPTS) {
      await this.redis.del(k);
      throw apiError("OTP_RATE_LIMITED", "Terlalu banyak percobaan. Minta kode baru.", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (this.hash(code) !== data.hash) {
      await this.redis.set(k, JSON.stringify({ ...data, attempts }), "KEEPTTL");
      throw apiError("OTP_INVALID", "Kode salah.", HttpStatus.BAD_REQUEST);
    }
    await this.redis.del(k);
  }
}
