import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuditLogEntry, AuditLogQuery } from "@magnoo/shared";
import { PrismaService } from "../../../prisma/prisma.service";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Jalur BACA audit log (Fase 1h, BAGIAN 8.2 GET /school/audit-log).
 *
 * Sengaja terpisah dari `AuditService` (yang write-only) agar sifat append-only
 * audit tetap terjaga — service ini hanya `findMany`, tak pernah update/delete.
 * Di-scope ke sekolah: hanya aksi yang dilakukan oleh user sekolah pemanggil.
 * Daftar TIDAK memuat before/after (bisa berisi detail sensitif) — hanya metadata.
 */
@Injectable()
export class AuditReadService {
  constructor(private readonly prisma: PrismaService) {}

  async list(schoolId: string, query: AuditLogQuery): Promise<AuditLogEntry[]> {
    const actorIds = await this.schoolUserIds(schoolId);
    if (actorIds.length === 0) return [];

    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const where: Prisma.AuditLogWhereInput = {
      actorUserId: { in: actorIds },
      ...(query.action ? { action: query.action } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
    };

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    return rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Semua user sekolah (aktor audit yang mungkin: admin/guru/ortu/siswa). */
  private async schoolUserIds(schoolId: string): Promise<string[]> {
    const rows = await this.prisma.user.findMany({ where: { schoolId }, select: { id: true } });
    return rows.map((r) => r.id);
  }
}
