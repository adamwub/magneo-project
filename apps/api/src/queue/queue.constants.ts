/**
 * Konstanta antrean (Fase 1f). Nama antrean & token DI dipisah agar bisa dipakai
 * lintas modul tanpa impor melingkar.
 */

/** Nama antrean BullMQ untuk impor massal siswa. */
export const STUDENT_IMPORT_QUEUE = "student-import";

/** Token DI untuk instance `Queue` student-import (dipakai service impor saat enqueue). */
export const STUDENT_IMPORT_QUEUE_TOKEN = Symbol("STUDENT_IMPORT_QUEUE");

/** Token DI untuk koneksi ioredis bersama (dipakai Queue & ditutup saat shutdown). */
export const REDIS_CONNECTION_TOKEN = Symbol("REDIS_CONNECTION");

/** Nama job tunggal di antrean impor. */
export const STUDENT_IMPORT_JOB = "import-students";

/** Bentuk data job impor (jobId menunjuk baris ImportJob; file ada di disk). */
export interface StudentImportJobData {
  jobId: string;
}
