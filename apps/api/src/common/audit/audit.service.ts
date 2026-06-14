import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface AuditEntry {
  actorUserId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
}

/**
 * Penulis AuditLog (BAGIAN 6.1 — APPEND-ONLY).
 *
 * Service ini SATU-SATUNYA jalan menulis audit, dan SENGAJA hanya menyediakan
 * `write()` (create). Tidak ada update/delete — menegakkan sifat append-only di
 * lapisan service (melunasi utang 0d untuk AuditLog). Penulisan tidak boleh
 * menggagalkan operasi utama: kegagalan audit di-swallow + dicatat ke stderr.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          before: entry.before,
          after: entry.after,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[audit] gagal menulis audit log:", entry.action, err);
    }
  }
}
