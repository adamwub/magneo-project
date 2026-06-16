import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { API_PREFIX } from "@magnoo/shared";

/**
 * Penyimpanan berkas impor (Fase 1f): file unggahan + laporan CSV (error & kredensial).
 *
 * Catatan privasi: kredensial berisi password sementara plaintext. Disimpan HANYA
 * sebagai file di disk dengan izin ketat (0600), TIDAK PERNAH di DB, dan dihapus
 * setelah admin mengunduhnya. (Utang: pindah ke object storage + tautan sekali-pakai
 * terenkripsi — dicatat di progress.md.)
 */

/** Direktori dasar penyimpanan impor (env IMPORT_STORAGE_DIR atau subfolder temp sistem). */
export function importBaseDir(configured?: string): string {
  return configured && configured.length > 0
    ? configured
    : path.join(os.tmpdir(), "magnoo-imports");
}

function jobDir(baseDir: string, jobId: string): string {
  return path.join(baseDir, jobId);
}

export function uploadPath(baseDir: string, jobId: string): string {
  return path.join(jobDir(baseDir, jobId), "input.xlsx");
}
export function errorCsvPath(baseDir: string, jobId: string): string {
  return path.join(jobDir(baseDir, jobId), "errors.csv");
}
export function credentialsCsvPath(baseDir: string, jobId: string): string {
  return path.join(jobDir(baseDir, jobId), "credentials.csv");
}

/** URL unduh (relatif terhadap host API) untuk laporan error & kredensial. */
export function errorReportUrl(jobId: string): string {
  return `${API_PREFIX}/school/users/import/${jobId}/errors.csv`;
}
export function credentialsReportUrl(jobId: string): string {
  return `${API_PREFIX}/school/users/import/${jobId}/credentials.csv`;
}

/** Simpan buffer file unggahan ke disk (buat folder bila perlu). */
export async function saveUpload(baseDir: string, jobId: string, buffer: Buffer): Promise<string> {
  await fs.mkdir(jobDir(baseDir, jobId), { recursive: true, mode: 0o700 });
  const p = uploadPath(baseDir, jobId);
  await fs.writeFile(p, buffer, { mode: 0o600 });
  return p;
}

export async function readUpload(baseDir: string, jobId: string): Promise<Buffer> {
  return fs.readFile(uploadPath(baseDir, jobId));
}

/** Tulis file CSV (folder dipastikan ada, izin 0600). */
export async function writeCsv(filePath: string, csv: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await fs.writeFile(filePath, csv, { mode: 0o600 });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFileQuiet(filePath: string): Promise<void> {
  await fs.rm(filePath, { force: true });
}

/** Escape satu sel CSV (RFC 4180): bungkus dengan kutip bila ada koma/kutip/newline. */
export function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Bangun teks CSV dari header + baris. */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((cols) => cols.map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}
