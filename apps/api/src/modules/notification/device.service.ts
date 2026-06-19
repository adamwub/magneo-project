import { Injectable } from "@nestjs/common";
import type { DeviceRegisterRequest } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Registrasi device untuk push FCM (BAGIAN 12A.2) — potongan 2g.
 *
 * Token diikat ke `userId` dari SESI (bukan body) → tak bisa membajak channel push
 * orang lain. Token `@unique`: bila device dipakai user lain (ganti login), kepemilikan
 * berpindah ke user terkini (upsert). Token TIDAK pernah dikembalikan di response/log.
 * Pengiriman push nyata (firebase-admin) menyusul — butuh service account FCM owner.
 */
@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /me/devices — daftarkan/segarkan token milik pemanggil. */
  async register(userId: string, dto: DeviceRegisterRequest): Promise<{ registered: true }> {
    const now = new Date();
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { userId, token: dto.token, platform: dto.platform, lastSeenAt: now },
      update: { userId, platform: dto.platform, lastSeenAt: now, revokedAt: null },
    });
    return { registered: true };
  }

  /** DELETE /me/devices/:token — cabut token, HANYA milik pemanggil. */
  async remove(userId: string, token: string): Promise<{ removed: boolean }> {
    const res = await this.prisma.deviceToken.deleteMany({ where: { token, userId } });
    return { removed: res.count > 0 };
  }
}
