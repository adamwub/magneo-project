import type { ImportRowError } from "@magnoo/shared";
import type { ParsedStudentRow } from "./xlsx";

/**
 * Validasi per-baris file impor (Fase 1f, QA-2). Mengumpulkan SEMUA masalah pada satu
 * baris (bukan berhenti di error pertama) agar laporan ke admin selengkap mungkin.
 *
 * PII (nama, NISN, JK, tgl lahir) hanya divalidasi formatnya — TIDAK disimpan di cloud
 * (ADR-005). Yang dipakai ke depan hanya: NIS (untuk disamarkan) + kelas (→ classId).
 */

export interface ValidStudentRow {
  rowNumber: number;
  nis: string;
  classId: string;
}

const NIS_RE = /^[0-9]{4,20}$/;
const NISN_RE = /^[0-9]{6,12}$/;
const GENDER_RE = /^(l|p|laki-laki|perempuan)$/i;
// Terima format tanggal umum (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY) — lentur, tidak disimpan.
const DATE_RE = /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})$/;

function normLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Bangun peta label-kelas (dinormalisasi) → classId, untuk mencocokkan kolom "Kelas". */
export function buildClassLabelMap(classes: { id: string; label: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of classes) map.set(normLabel(c.label), c.id);
  return map;
}

/**
 * Validasi satu baris. `seenNis` melacak NIS yang sudah muncul DI FILE INI (deteksi ganda).
 * Mengembalikan baris valid ATAU daftar error (tidak keduanya).
 */
export function validateRow(
  row: ParsedStudentRow,
  classLabelMap: Map<string, string>,
  seenNis: Set<string>,
): { ok: true; value: ValidStudentRow } | { ok: false; errors: ImportRowError[] } {
  const errors: ImportRowError[] = [];

  // NIS (wajib, digit, unik dalam file).
  if (!row.nis) {
    errors.push({ row: row.rowNumber, column: "NIS", code: "NIS_REQUIRED", message: "NIS wajib diisi." });
  } else if (!NIS_RE.test(row.nis)) {
    errors.push({
      row: row.rowNumber,
      column: "NIS",
      code: "NIS_INVALID",
      message: "NIS harus berupa 4–20 digit angka.",
    });
  } else if (seenNis.has(row.nis)) {
    errors.push({
      row: row.rowNumber,
      column: "NIS",
      code: "DUPLICATE_NIS_IN_FILE",
      message: "NIS ini muncul lebih dari sekali dalam file.",
    });
  } else {
    // Kemunculan PERTAMA NIS valid → tandai, agar duplikat berikutnya tertangkap.
    // (Ditandai walau baris ini gagal validasi lain seperti kelas tak ada.)
    seenNis.add(row.nis);
  }

  // Nama (wajib; hanya untuk laporan — tidak disimpan).
  if (!row.name) {
    errors.push({ row: row.rowNumber, column: "Nama", code: "NAME_REQUIRED", message: "Nama wajib diisi." });
  }

  // Kelas (wajib; harus cocok kelas aktif sekolah).
  let classId: string | undefined;
  if (!row.className) {
    errors.push({
      row: row.rowNumber,
      column: "Kelas",
      code: "CLASS_REQUIRED",
      message: "Kelas wajib diisi.",
    });
  } else {
    classId = classLabelMap.get(normLabel(row.className));
    if (!classId) {
      errors.push({
        row: row.rowNumber,
        column: "Kelas",
        code: "CLASS_NOT_FOUND",
        message: `Kelas "${row.className}" tidak ada di sekolah ini. Buat kelasnya dulu.`,
      });
    }
  }

  // Opsional — validasi format bila diisi.
  if (row.nisn && !NISN_RE.test(row.nisn)) {
    errors.push({
      row: row.rowNumber,
      column: "NISN",
      code: "NISN_INVALID",
      message: "NISN harus 6–12 digit angka.",
    });
  }
  if (row.gender && !GENDER_RE.test(row.gender)) {
    errors.push({
      row: row.rowNumber,
      column: "JK",
      code: "GENDER_INVALID",
      message: "Jenis kelamin harus L atau P.",
    });
  }
  if (row.birthDate && !DATE_RE.test(row.birthDate)) {
    errors.push({
      row: row.rowNumber,
      column: "Tgl Lahir",
      code: "BIRTHDATE_INVALID",
      message: "Tanggal lahir tidak dikenali (pakai YYYY-MM-DD atau DD/MM/YYYY).",
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { rowNumber: row.rowNumber, nis: row.nis, classId: classId! } };
}
