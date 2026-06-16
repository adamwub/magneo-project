import { Inject, Injectable, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { ImportJobStatusResponse, ImportRowError, ImportStartResponse } from "@magnoo/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import type { Env } from "../../../config/env";
import { apiError } from "../../../common/api-error";
import { AuditService } from "../../../common/audit/audit.service";
import { hashPassword } from "../../auth/password";
import { generateTempPassword } from "../provisioning";
import {
  STUDENT_IMPORT_QUEUE_TOKEN,
  STUDENT_IMPORT_JOB,
} from "../../../queue/queue.constants";
import { generateNisKey, pseudonymizeNis } from "./pseudonym";
import { parseStudentsXlsx } from "./xlsx";
import { buildClassLabelMap, validateRow } from "./validation";
import {
  importBaseDir,
  saveUpload,
  readUpload,
  writeCsv,
  toCsv,
  uploadPath,
  errorCsvPath,
  credentialsCsvPath,
  errorReportUrl,
  credentialsReportUrl,
  fileExists,
  deleteFileQuiet,
} from "./import-storage";

/**
 * Impor massal siswa via XLSX (Fase 1f, BAGIAN 8.2 /school/users/import + QA-2).
 *
 * Alur: admin unggah XLSX → kita simpan file + buat baris ImportJob (QUEUED) →
 * masuk antrean BullMQ → worker memanggil `process(jobId)` di latar belakang:
 * baca → validasi per-baris → samarkan NIS → upsert siswa (idempotent) → tulis
 * laporan CSV (error + kredensial sekali-unduh). File unggahan (berisi NIS asli)
 * DIHAPUS setelah diproses — NIS mentah tidak menetap di cloud (ADR-005 / guardrail 13.2).
 *
 * Idempotensi: username siswa = penyamaran NIS (deterministik) + unik [schoolId,username].
 * Impor file yang sama dua kali → baris kedua meng-update, bukan menggandakan.
 */
@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  /** Batas baris per file impor; di atas ini ditolak ramah (QA-2 "5.000 baris ditolak"). */
  static readonly MAX_IMPORT_ROWS = 3000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
    @Inject(STUDENT_IMPORT_QUEUE_TOKEN) private readonly queue: Queue,
  ) {}

  private baseDir(): string {
    return importBaseDir(this.config.get("IMPORT_STORAGE_DIR", { infer: true }));
  }

  // ── Produsen: terima unggahan, buat job, masuk antrean ─────────────────────

  /** POST /school/users/import — simpan file, buat ImportJob, enqueue → jobId. */
  async startImport(
    actorUserId: string,
    schoolId: string,
    file: { buffer: Buffer; originalname: string },
  ): Promise<ImportStartResponse> {
    if (!file?.buffer?.length) {
      throw apiError("IMPORT_FILE_INVALID", "File impor kosong atau tidak terbaca.", HttpStatus.BAD_REQUEST);
    }
    if (!/\.xlsx$/i.test(file.originalname)) {
      throw apiError(
        "IMPORT_FILE_INVALID",
        "Format file harus .xlsx (Excel). Simpan ulang sebagai Excel Workbook lalu unggah lagi.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.prisma.importJob.create({
      data: { schoolId, createdBy: actorUserId, status: "QUEUED" },
    });
    await saveUpload(this.baseDir(), job.id, file.buffer);
    await this.audit.write({
      actorUserId,
      action: "IMPORT_START",
      entity: "importJob",
      entityId: job.id,
      after: { schoolId },
    });
    await this.queue.add(STUDENT_IMPORT_JOB, { jobId: job.id }, { jobId: job.id });
    return { jobId: job.id };
  }

  // ── Status & unduhan ───────────────────────────────────────────────────────

  /** GET /school/users/import/:jobId — progres + tautan laporan (difilter ke sekolah). */
  async getStatus(schoolId: string, jobId: string): Promise<ImportJobStatusResponse> {
    const job = await this.requireJob(schoolId, jobId);
    return {
      jobId: job.id,
      status: job.status as ImportJobStatusResponse["status"],
      total: job.total,
      processed: job.processed,
      succeeded: job.succeeded,
      created: job.created,
      failed: job.failed,
      errors: (job.errors as unknown as ImportRowError[]) ?? [],
      ...(job.message ? { message: job.message } : {}),
      ...(job.errorCsv ? { errorReportUrl: errorReportUrl(job.id) } : {}),
      ...(job.credentialsCsv && !job.credentialsDownloadedAt
        ? { credentialsReportUrl: credentialsReportUrl(job.id) }
        : {}),
    };
  }

  /** GET .../import/:jobId/errors.csv — isi laporan error (CSV). */
  async readErrorCsv(schoolId: string, jobId: string): Promise<string> {
    const job = await this.requireJob(schoolId, jobId);
    if (!job.errorCsv || !(await fileExists(job.errorCsv))) {
      throw apiError("IMPORT_JOB_NOT_FOUND", "Laporan error tidak tersedia.", HttpStatus.NOT_FOUND);
    }
    const { promises: fs } = await import("node:fs");
    return fs.readFile(job.errorCsv, "utf8");
  }

  /**
   * GET .../import/:jobId/credentials.csv — kredensial sekali-unduh. Setelah diunduh,
   * file dihapus & ditandai (berisi NIS asli + password sementara → tidak boleh menetap).
   */
  async readCredentialsCsvOnce(schoolId: string, jobId: string): Promise<string> {
    const job = await this.requireJob(schoolId, jobId);
    if (!job.credentialsCsv || job.credentialsDownloadedAt || !(await fileExists(job.credentialsCsv))) {
      throw apiError(
        "IMPORT_JOB_NOT_FOUND",
        "Kredensial tidak tersedia atau sudah pernah diunduh (hanya bisa sekali).",
        HttpStatus.NOT_FOUND,
      );
    }
    const { promises: fs } = await import("node:fs");
    const csv = await fs.readFile(job.credentialsCsv, "utf8");
    await deleteFileQuiet(job.credentialsCsv);
    await this.prisma.importJob.update({
      where: { id: job.id },
      data: { credentialsDownloadedAt: new Date() },
    });
    await this.audit.write({
      actorUserId: job.createdBy,
      action: "IMPORT_CREDENTIALS_DOWNLOAD",
      entity: "importJob",
      entityId: job.id,
    });
    return csv;
  }

  private async requireJob(schoolId: string, jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job || job.schoolId !== schoolId) {
      throw apiError("IMPORT_JOB_NOT_FOUND", "Job impor tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return job;
  }

  // ── Konsumen: pemrosesan job (dipanggil worker) ────────────────────────────

  /** Inti pemrosesan satu job impor. Dipanggil worker BullMQ. Tidak melempar ke worker. */
  async process(jobId: string): Promise<void> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      this.logger.warn(`Job impor ${jobId} tak ditemukan saat diproses.`);
      return;
    }
    const baseDir = this.baseDir();
    try {
      await this.prisma.importJob.update({ where: { id: jobId }, data: { status: "RUNNING" } });

      const nisKey = await this.ensureNisKey(job.schoolId);
      const pepper = this.config.get("NIS_PSEUDONYM_PEPPER", { infer: true });

      const buffer = await readUpload(baseDir, jobId);
      let parsed;
      try {
        parsed = await parseStudentsXlsx(buffer);
      } catch {
        return await this.fail(jobId, baseDir, "File tidak bisa dibaca. Pastikan benar-benar file Excel (.xlsx) yang utuh.");
      }
      if (parsed.missingColumns.length > 0) {
        return await this.fail(
          jobId,
          baseDir,
          `Kolom wajib tidak ditemukan: ${parsed.missingColumns.join(", ")}. Pastikan baris pertama berisi judul kolom NIS, Nama, Kelas.`,
        );
      }
      if (parsed.rows.length > ImportService.MAX_IMPORT_ROWS) {
        return await this.fail(
          jobId,
          baseDir,
          `File berisi ${parsed.rows.length} baris — melebihi batas ${ImportService.MAX_IMPORT_ROWS} per impor. Bagi menjadi beberapa file lalu unggah bergantian.`,
        );
      }

      const classes = await this.prisma.class.findMany({
        where: { schoolId: job.schoolId, deletedAt: null },
        select: { id: true, label: true },
      });
      const classMap = buildClassLabelMap(classes);

      const seenNis = new Set<string>();
      const errors: ImportRowError[] = [];
      const credentials: { nis: string; password: string }[] = [];
      const total = parsed.rows.length;
      let processed = 0;
      let succeeded = 0;
      let created = 0;
      let failed = 0;

      for (const row of parsed.rows) {
        const res = validateRow(row, classMap, seenNis);
        if (!res.ok) {
          errors.push(...res.errors);
          failed++;
        } else {
          const username = pseudonymizeNis(res.value.nis, nisKey, pepper);
          const existing = await this.prisma.user.findUnique({
            where: { schoolId_username: { schoolId: job.schoolId, username } },
            select: { id: true },
          });
          if (existing) {
            await this.prisma.user.update({
              where: { id: existing.id },
              data: { classId: res.value.classId, status: "ACTIVE", deletedAt: null },
            });
          } else {
            const tempPassword = generateTempPassword();
            await this.prisma.user.create({
              data: {
                schoolId: job.schoolId,
                role: "STUDENT",
                username,
                passwordHash: await hashPassword(tempPassword),
                status: "ACTIVE",
                mustChangePassword: true,
                classId: res.value.classId,
              },
            });
            credentials.push({ nis: res.value.nis, password: tempPassword });
            created++;
          }
          succeeded++;
        }
        processed++;
        if (processed % 50 === 0) {
          await this.prisma.importJob.update({
            where: { id: jobId },
            data: { processed, succeeded, created, failed },
          });
        }
      }

      // Laporan error (CSV) — bila ada baris bermasalah.
      let errorCsv: string | null = null;
      if (errors.length > 0) {
        const csv = toCsv(
          ["Baris", "Kolom", "Kode", "Pesan"],
          errors.map((e) => [String(e.row), e.column ?? "", e.code, e.message]),
        );
        errorCsv = errorCsvPath(baseDir, jobId);
        await writeCsv(errorCsv, csv);
      }

      // Kredensial sekali-unduh (NIS asli + password sementara) — hanya siswa baru.
      let credsCsv: string | null = null;
      if (credentials.length > 0) {
        const csv = toCsv(
          ["NIS", "Password Sementara"],
          credentials.map((c) => [c.nis, c.password]),
        );
        credsCsv = credentialsCsvPath(baseDir, jobId);
        await writeCsv(credsCsv, csv);
      }

      // File unggahan (berisi NIS asli + PII) dihapus setelah diproses (ADR-005).
      await deleteFileQuiet(uploadPath(baseDir, jobId));

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          total,
          processed,
          succeeded,
          created,
          failed,
          errors: errors.slice(0, 200) as unknown as object, // tampilan dipotong; lengkap di CSV
          errorCsv,
          credentialsCsv: credsCsv,
          finishedAt: new Date(),
        },
      });
      await this.audit.write({
        actorUserId: job.createdBy,
        action: "IMPORT_COMPLETE",
        entity: "importJob",
        entityId: jobId,
        after: { total, succeeded, created, failed },
      });
    } catch (err) {
      this.logger.error(`Job impor ${jobId} gagal tak terduga`, err as Error);
      await this.fail(jobId, baseDir, "Terjadi kesalahan tak terduga saat memproses impor. Coba unggah ulang.");
    }
  }

  /** Pastikan sekolah punya kunci penyamaran NIS; buat sekali saat impor pertama. */
  private async ensureNisKey(schoolId: string): Promise<string> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { nisKey: true },
    });
    if (school?.nisKey) return school.nisKey;
    const nisKey = generateNisKey();
    await this.prisma.school.update({ where: { id: schoolId }, data: { nisKey } });
    return nisKey;
  }

  /** Tandai job FAILED dengan pesan ramah; bersihkan file unggahan. */
  private async fail(jobId: string, baseDir: string, message: string): Promise<void> {
    await deleteFileQuiet(uploadPath(baseDir, jobId));
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: "FAILED", message, finishedAt: new Date() },
    });
  }
}
