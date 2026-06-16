import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import type { Env } from "../../../config/env";
import { buildRedisConnection } from "../../../queue/redis-connection";
import {
  STUDENT_IMPORT_QUEUE,
  type StudentImportJobData,
} from "../../../queue/queue.constants";
import { ImportService } from "./import.service";

/**
 * Worker antrean impor siswa (Fase 1f) — berjalan IN-PROCESS bersama API
 * (keputusan pemilik 2026-06-16; cukup untuk skala awal di server 4GB, bisa dipisah
 * jadi proses sendiri nanti — dicatat sebagai utang di progress.md).
 *
 * Lifecycle Nest: dibuat saat modul start (`onModuleInit`), ditutup rapi saat aplikasi
 * berhenti (`onModuleDestroy`, dipicu enableShutdownHooks di main.ts). Worker punya
 * koneksi Redis SENDIRI (BullMQ mewajibkan maxRetriesPerRequest:null untuk blocking cmd).
 */
@Injectable()
export class ImportWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImportWorker.name);
  private worker?: Worker<StudentImportJobData>;
  private readonly connection = buildRedisConnection(this.config);

  /** 2 job bersamaan: cukup untuk satu sekolah mengimpor; hash argon2 berat per siswa. */
  private static readonly CONCURRENCY = 2;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly importer: ImportService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<StudentImportJobData>(
      STUDENT_IMPORT_QUEUE,
      async (job) => {
        await this.importer.process(job.data.jobId);
      },
      { connection: this.connection, concurrency: ImportWorker.CONCURRENCY },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job impor ${job?.id ?? "?"} gagal di worker: ${err.message}`);
    });
    this.logger.log("Worker impor siswa siap (in-process).");
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    this.connection.disconnect();
  }
}
