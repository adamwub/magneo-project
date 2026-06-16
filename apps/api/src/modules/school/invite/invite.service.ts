import { Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes, randomUUID } from "node:crypto";
import type { InviteCode as PrismaInviteCode } from "@prisma/client";
import type {
  InviteCode as InviteCodeDto,
  InviteCodeBatchResponse,
  InviteCodeGenerateRequest,
} from "@magnoo/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import type { Env } from "../../../config/env";
import { apiError } from "../../../common/api-error";
import { AuditService } from "../../../common/audit/audit.service";
import { renderInvitePdf, type InviteCard } from "./invite-pdf";
import { inviteBaseDir, saveBatchPdf, readBatchPdf, batchPdfUrl } from "./invite-storage";

/** Alfabet kode (subset [A-Z0-9] tanpa karakter ambigu I/O/0/1). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 8;
const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari (BAGIAN 6.1)

/**
 * Kode undangan ortu (Fase 1g, BAGIAN 8.2 /school/invite-codes).
 *
 * Admin sekolah membuat kode per siswa (lewat kelas atau daftar id) → sistem
 * menerbitkan kode 8-karakter unik (kadaluarsa 30 hari) + PDF kartu (dengan QR)
 * untuk dicetak & dibagikan ke ortu. Ortu menukar kode di /auth/parent/link-child.
 * Tanpa nama siswa di cloud (ADR-005): kartu memakai label kelas + ID opaque.
 */
@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
  ) {}

  private baseDir(): string {
    return inviteBaseDir(this.config.get("IMPORT_STORAGE_DIR", { infer: true }));
  }

  /** POST /school/invite-codes/generate — buat kode untuk siswa terpilih + PDF batch. */
  async generate(
    actorUserId: string,
    schoolId: string,
    dto: InviteCodeGenerateRequest,
  ): Promise<InviteCodeBatchResponse> {
    // Tentukan daftar siswa (selalu difilter ke sekolah pemanggil — defense-in-depth).
    const students = await this.prisma.user.findMany({
      where: {
        schoolId,
        role: "STUDENT",
        deletedAt: null,
        ...(dto.classId ? { classId: dto.classId } : { id: { in: dto.studentIds ?? [] } }),
      },
      select: { id: true, classId: true },
    });
    if (students.length === 0) {
      throw apiError("NOT_FOUND", "Tidak ada siswa aktif yang cocok untuk dibuatkan kode.", HttpStatus.NOT_FOUND);
    }

    // Label kelas untuk kartu PDF.
    const classIds = [...new Set(students.map((s) => s.classId).filter((c): c is string => !!c))];
    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds }, schoolId },
      select: { id: true, label: true },
    });
    const labelOf = new Map(classes.map((c) => [c.id, c.label]));

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const rows: PrismaInviteCode[] = [];
    for (const s of students) {
      rows.push(await this.createUniqueCode(s.id, expiresAt));
    }

    const cards: InviteCard[] = rows.map((r, i) => ({
      code: r.code,
      classLabel: students[i].classId ? (labelOf.get(students[i].classId!) ?? "—") : "—",
      studentUserId: r.studentUserId,
      expiresAt: r.expiresAt,
    }));
    const school = await this.prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });
    const pdf = await renderInvitePdf(cards, school?.name ?? "Sekolah");
    const batchId = randomUUID();
    await saveBatchPdf(this.baseDir(), schoolId, batchId, pdf);

    await this.audit.write({
      actorUserId,
      action: "INVITE_GENERATE",
      entity: "inviteCode",
      entityId: batchId,
      after: { schoolId, count: rows.length },
    });

    return { codes: rows.map(toDto), batchPdfUrl: batchPdfUrl(batchId) };
  }

  /** POST /school/invite-codes/:id/revoke — batalkan satu kode (difilter ke sekolah). */
  async revoke(actorUserId: string, schoolId: string, id: string): Promise<InviteCodeDto> {
    const invite = await this.prisma.inviteCode.findUnique({ where: { id } });
    if (!invite || !(await this.belongsToSchool(invite.studentUserId, schoolId))) {
      throw apiError("INVITE_CODE_INVALID", "Kode undangan tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    if (invite.usedAt) throw apiError("INVITE_CODE_USED", "Kode sudah dipakai, tak bisa dibatalkan.", HttpStatus.CONFLICT);
    if (invite.revokedAt) return toDto(invite); // idempotent
    const updated = await this.prisma.inviteCode.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.audit.write({
      actorUserId,
      action: "INVITE_REVOKE",
      entity: "inviteCode",
      entityId: id,
      after: { studentUserId: invite.studentUserId },
    });
    return toDto(updated);
  }

  /** GET /school/invite-codes/batch/:batchId — unduh PDF (ter-scope ke folder sekolah). */
  async getBatchPdf(schoolId: string, batchId: string): Promise<Buffer> {
    const pdf = await readBatchPdf(this.baseDir(), schoolId, batchId);
    if (!pdf) throw apiError("NOT_FOUND", "PDF batch tidak ditemukan.", HttpStatus.NOT_FOUND);
    return pdf;
  }

  // ── internal ───────────────────────────────────────────────────────────────

  private async createUniqueCode(studentUserId: string, expiresAt: Date): Promise<PrismaInviteCode> {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        return await this.prisma.inviteCode.create({
          data: { code: genCode(), studentUserId, expiresAt },
        });
      } catch (err) {
        // P2002 = bentrok unik pada `code`; coba kode lain.
        if ((err as { code?: string }).code === "P2002" && attempt < 5) continue;
        throw err;
      }
    }
    throw apiError("CONFLICT", "Gagal membuat kode unik, coba lagi.", HttpStatus.CONFLICT);
  }

  private async belongsToSchool(studentUserId: string, schoolId: string): Promise<boolean> {
    const c = await this.prisma.user.count({ where: { id: studentUserId, schoolId } });
    return c > 0;
  }
}

/** Kode 8 karakter dari alfabet aman (acak kuat). */
function genCode(): string {
  const bytes = randomBytes(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** Status turunan kode (BAGIAN 8.2): dihitung dari usedAt/revokedAt/expiresAt. */
function statusOf(row: PrismaInviteCode): InviteCodeDto["status"] {
  if (row.revokedAt) return "REVOKED";
  if (row.usedAt) return "USED";
  if (row.expiresAt.getTime() < Date.now()) return "EXPIRED";
  return "ACTIVE";
}

function toDto(row: PrismaInviteCode): InviteCodeDto {
  return {
    id: row.id,
    code: row.code,
    studentUserId: row.studentUserId,
    status: statusOf(row),
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt ? row.usedAt.toISOString() : null,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  };
}
