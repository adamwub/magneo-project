import { Injectable, HttpStatus } from "@nestjs/common";
import type { ConsentRecord as PrismaConsent } from "@prisma/client";
import type {
  ConsentCreateRequest,
  ConsentRecord as ConsentRecordDto,
  ConsentType,
} from "@magnoo/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import { apiError } from "../../../common/api-error";
import { AuditService } from "../../../common/audit/audit.service";

/**
 * Arsip persetujuan (ConsentRecord) — Fase 1h, BAGIAN 8.2 GET/POST /school/consents.
 *
 * Menyimpan jejak persetujuan per siswa (GENERAL_DATA/FACE/PUBLICATION/ALUMNI_CAREER/TOS)
 * beserta versi dokumen, siapa yang memberi (ortu), dan nomor arsip formulir fisik.
 * Semua di-scope ke sekolah pemanggil (subjek harus siswa sekolah itu — defense-in-depth).
 *
 * Pencabutan consent (revoke) + pemicu hapus template wajah di Box = Fase 6
 * (job `face-consent-revocation`, BAGIAN 10.10). Di 1h hanya grant + arsip + audit.
 */
@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** POST /school/consents — catat persetujuan baru (tolak bila sudah ada yang aktif). */
  async grant(
    actorUserId: string,
    schoolId: string,
    dto: ConsentCreateRequest,
  ): Promise<ConsentRecordDto> {
    await this.requireSchoolStudent(schoolId, dto.subjectUserId);

    const active = await this.prisma.consentRecord.findFirst({
      where: { subjectUserId: dto.subjectUserId, type: dto.type, revokedAt: null },
    });
    if (active) {
      throw apiError(
        "CONFLICT",
        "Sudah ada persetujuan aktif untuk jenis ini pada siswa tersebut.",
        HttpStatus.CONFLICT,
      );
    }

    const rec = await this.prisma.consentRecord.create({
      data: {
        subjectUserId: dto.subjectUserId,
        type: dto.type,
        docVersion: dto.docVersion,
        grantedByUserId: dto.grantedByUserId ?? null,
        evidenceRef: dto.evidenceRef ?? null,
        grantedAt: new Date(),
      },
    });
    await this.audit.write({
      actorUserId,
      action: "CONSENT_GRANT",
      entity: "consentRecord",
      entityId: rec.id,
      after: { subjectUserId: dto.subjectUserId, type: dto.type, docVersion: dto.docVersion },
    });
    return toDto(rec);
  }

  /** GET /school/consents — arsip consent untuk siswa sekolah ini (filter opsional). */
  async list(
    schoolId: string,
    filter: { subjectUserId?: string; type?: ConsentType },
  ): Promise<ConsentRecordDto[]> {
    let subjectIds: string[];
    if (filter.subjectUserId) {
      await this.requireSchoolStudent(schoolId, filter.subjectUserId);
      subjectIds = [filter.subjectUserId];
    } else {
      subjectIds = await this.schoolStudentIds(schoolId);
    }
    if (subjectIds.length === 0) return [];

    const rows = await this.prisma.consentRecord.findMany({
      where: { subjectUserId: { in: subjectIds }, ...(filter.type ? { type: filter.type } : {}) },
      orderBy: { grantedAt: "desc" },
    });
    return rows.map(toDto);
  }

  // ── internal ───────────────────────────────────────────────────────────────

  private async schoolStudentIds(schoolId: string): Promise<string[]> {
    const rows = await this.prisma.user.findMany({
      where: { schoolId, role: "STUDENT", deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /** Pastikan subjek adalah siswa di sekolah pemanggil (cegah IDOR lintas sekolah). */
  private async requireSchoolStudent(schoolId: string, subjectUserId: string): Promise<void> {
    const count = await this.prisma.user.count({
      where: { id: subjectUserId, schoolId, role: "STUDENT", deletedAt: null },
    });
    if (count === 0) {
      throw apiError("NOT_FOUND", "Siswa tidak ditemukan di sekolah ini.", HttpStatus.NOT_FOUND);
    }
  }
}

function toDto(r: PrismaConsent): ConsentRecordDto {
  return {
    id: r.id,
    subjectUserId: r.subjectUserId,
    grantedByUserId: r.grantedByUserId,
    type: r.type as ConsentType,
    docVersion: r.docVersion,
    grantedAt: r.grantedAt.toISOString(),
    revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
    evidenceRef: r.evidenceRef,
  };
}
