import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import { PrismaService } from "../../prisma/prisma.service";
import { REDIS_CONNECTION_TOKEN } from "../../queue/queue.constants";
import { PUSH_SENDER, type PushSender } from "./push-sender";

const DEDUP_TTL_SEC = 86_400; // 1 hari (12A.2): cegah notif ganda untuk peristiwa sama

/**
 * Pengiriman notifikasi (BAGIAN 11.2 / 12A.2).
 * - Push ke DeviceToken aktif milik user; teks DIRAKIT di klien via `templateKey` (payload tanpa PII).
 * - Dedup per (user, templateKey, dedupeKey) via Redis NX.
 * - Catat ke `NotificationLog`. Saat pengirim stub (Firebase belum ada) → status QUEUED
 *   (menunggu pipeline FCM nyata); saat aktif → SENT/FAILED + cabut token mati.
 *
 * Guardrail 13.2: TIDAK pernah menaruh nama/NIS anak di payload/log. `data` hanya nilai non-PII.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis,
  ) {}

  /** Kirim push ke satu user (idempoten per dedupeKey). Mengembalikan true bila diproses. */
  async notifyUser(
    userId: string,
    templateKey: string,
    data: Record<string, string>,
    dedupeKey?: string,
  ): Promise<boolean> {
    if (dedupeKey) {
      const ok = await this.redis.set(
        `notifsent:${userId}:${templateKey}:${dedupeKey}`,
        "1",
        "EX",
        DEDUP_TTL_SEC,
        "NX",
      );
      if (ok !== "OK") return false; // sudah dikirim untuk peristiwa ini
    }

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId, revokedAt: null },
      select: { token: true },
    });
    const tokens = devices.map((d) => d.token);

    let status: "QUEUED" | "SENT" | "FAILED" = "QUEUED";
    if (tokens.length > 0 && this.sender.enabled) {
      const res = await this.sender.send({ tokens, templateKey, data });
      status = res.failedTokens.length >= tokens.length ? "FAILED" : "SENT";
      if (res.failedTokens.length > 0) {
        // Cabut token mati (UNREGISTERED) agar tak dikirimi lagi.
        await this.prisma.deviceToken.updateMany({
          where: { token: { in: res.failedTokens } },
          data: { revokedAt: new Date() },
        });
      }
    }

    await this.prisma.notificationLog.create({
      data: { userId, channel: "PUSH", templateKey, payloadRef: data, status },
    });
    return true;
  }

  /**
   * Notif ke SEMUA orang tua aktif dari seorang siswa saat check-in (BAGIAN 11.2 / DoD <60 dtk).
   * Payload non-PII: hanya { date, status } + studentUserId (pseudonim). Dedup per (siswa, tanggal).
   */
  async notifyCheckin(studentUserId: string, status: string, date: string): Promise<void> {
    const links = await this.prisma.parentLink.findMany({
      where: { studentUserId, status: "ACTIVE" },
      select: { parentUserId: true },
    });
    for (const l of links) {
      await this.notifyUser(
        l.parentUserId,
        "attendance.checkin",
        { studentUserId, status, date },
        `checkin:${studentUserId}:${date}`,
      );
    }
  }
}
