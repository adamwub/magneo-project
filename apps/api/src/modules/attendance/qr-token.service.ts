import { Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import type { QrCurrentResponse } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env";
import { apiError } from "../../common/api-error";
import { loadAesKey, encryptToBase64, decryptFromBase64 } from "../../common/crypto/aes-gcm";
import {
  generateTotp,
  validateTotp,
  totpExpiresInSec,
  TOTP_PERIOD_SEC,
} from "./totp";

/**
 * Token QR absensi (BAGIAN 10.2 & 12A.1).
 *
 * Secret TOTP per sekolah disimpan TERENKRIPSI (AES-256-GCM) di `School.qrTotpSecretEnc`,
 * dibuat acak saat pertama dibutuhkan. Secret raw HANYA hidup di memori server saat
 * menghitung/memvalidasi token — TIDAK PERNAH dikirim ke klien. Endpoint `GET /attendance/qr/current`
 * hanya mengembalikan token publik 8-digit + sisa waktu rotasi.
 */
@Injectable()
export class QrTokenService {
  private readonly key: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.key = loadAesKey(config.get("QR_TOTP_ENC_KEY", { infer: true }));
  }

  /** Secret TOTP sekolah (raw bytes). Dibuat & disimpan terenkripsi bila belum ada. */
  private async getOrCreateSecret(schoolId: string): Promise<Buffer> {
    const found = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { qrTotpSecretEnc: true },
    });
    if (!found) throw apiError("NOT_FOUND", "Sekolah tidak ditemukan.", HttpStatus.NOT_FOUND);
    if (found.qrTotpSecretEnc) return decryptFromBase64(found.qrTotpSecretEnc, this.key);

    const secret = randomBytes(32);
    const enc = encryptToBase64(secret, this.key);
    // Tulis hanya bila masih kosong → aman dari balapan (dua permintaan bersamaan).
    await this.prisma.school.updateMany({
      where: { id: schoolId, qrTotpSecretEnc: null },
      data: { qrTotpSecretEnc: enc },
    });
    // Baca ulang: bila request lain menang balapan, pakai miliknya (konsisten 1 secret/sekolah).
    const after = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { qrTotpSecretEnc: true },
    });
    return decryptFromBase64(after!.qrTotpSecretEnc!, this.key);
  }

  /** Token QR yang sedang berlaku untuk ditampilkan di gerbang (tanpa secret). */
  async current(schoolId: string): Promise<QrCurrentResponse> {
    const secret = await this.getOrCreateSecret(schoolId);
    return {
      token: generateTotp(secret),
      period: TOTP_PERIOD_SEC,
      expiresInSec: totpExpiresInSec(),
    };
  }

  /**
   * Validasi token check-in terhadap secret sekolah (dipakai potongan 2d).
   * Mengembalikan `step` yang cocok (untuk kunci anti-replay) atau null bila tidak valid.
   */
  async validateToken(schoolId: string, token: string): Promise<number | null> {
    const secret = await this.getOrCreateSecret(schoolId);
    return validateTotp(token, secret);
  }
}
