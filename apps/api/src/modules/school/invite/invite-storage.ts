import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { API_PREFIX } from "@magnoo/shared";

/**
 * Penyimpanan PDF batch kode undangan (Fase 1g). PDF disimpan per-sekolah:
 * `{base}/invites/{schoolId}/{batchId}.pdf` → unduhan otomatis ter-scope (admin
 * hanya bisa mengambil PDF di folder sekolahnya). Izin file ketat 0600.
 * (Utang: pindah ke object storage + tautan sekali-pakai — sama seperti impor.)
 */
export function inviteBaseDir(configured?: string): string {
  const base = configured && configured.length > 0 ? configured : path.join(os.tmpdir(), "magnoo-imports");
  return path.join(base, "invites");
}

function pdfPath(baseDir: string, schoolId: string, batchId: string): string {
  return path.join(baseDir, schoolId, `${batchId}.pdf`);
}

/** URL unduh PDF batch (relatif terhadap host API). */
export function batchPdfUrl(batchId: string): string {
  return `${API_PREFIX}/school/invite-codes/batch/${batchId}`;
}

export async function saveBatchPdf(
  baseDir: string,
  schoolId: string,
  batchId: string,
  pdf: Buffer,
): Promise<string> {
  const p = pdfPath(baseDir, schoolId, batchId);
  await fs.mkdir(path.dirname(p), { recursive: true, mode: 0o700 });
  await fs.writeFile(p, pdf, { mode: 0o600 });
  return p;
}

export async function readBatchPdf(baseDir: string, schoolId: string, batchId: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(pdfPath(baseDir, schoolId, batchId));
  } catch {
    return null;
  }
}
