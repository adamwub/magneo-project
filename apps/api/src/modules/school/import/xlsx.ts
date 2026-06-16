import * as ExcelJS from "exceljs";

/**
 * Pembaca file XLSX daftar siswa (Fase 1f).
 *
 * Format yang disepakati pemilik: kolom WAJIB `NIS`, `Nama`, `Kelas`; OPSIONAL
 * `NISN`, `JK`, `Tgl Lahir`. Baris pertama = header (judul kolom). Pencocokan
 * header tidak peka huruf besar/kecil & menerima beberapa sinonim umum.
 *
 * PENTING (anti-rusak NIS): kita membaca TEKS sel (`cell.text`), bukan nilai
 * mentah — agar NIS dengan angka nol di depan / angka panjang tidak rusak jadi
 * angka / notasi ilmiah oleh Excel.
 */

export interface ParsedStudentRow {
  /** Nomor baris asli di file (1-based, termasuk header) — untuk laporan error. */
  rowNumber: number;
  nis: string;
  name: string;
  className: string;
  nisn?: string;
  gender?: string;
  birthDate?: string;
}

export interface ParsedSheet {
  /** Kolom wajib yang tidak ditemukan di header (kosong = lengkap). */
  missingColumns: string[];
  rows: ParsedStudentRow[];
}

/** Sinonim header yang diterima (sudah dinormalisasi: lowercase, tanpa spasi tepi). */
const HEADER_ALIASES: Record<keyof Omit<ParsedStudentRow, "rowNumber">, string[]> = {
  nis: ["nis"],
  name: ["nama", "nama lengkap", "nama siswa"],
  className: ["kelas", "rombel", "rombongan belajar"],
  nisn: ["nisn"],
  gender: ["jk", "jenis kelamin", "l/p"],
  birthDate: ["tgl lahir", "tanggal lahir", "tgl. lahir"],
};

const REQUIRED: (keyof typeof HEADER_ALIASES)[] = ["nis", "name", "className"];

function normHeader(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parse buffer XLSX → daftar baris siswa. Melempar Error bila file tidak bisa dibaca
 * (rusak/bukan XLSX) — pemanggil mengubahnya jadi pesan ramah & job FAILED.
 */
export async function parseStudentsXlsx(buffer: Buffer): Promise<ParsedSheet> {
  const wb = new ExcelJS.Workbook();
  // Cast: @types/node 20 menjadikan Buffer generik (Buffer<ArrayBufferLike>); tipe exceljs
  // menuntut bentuk Buffer-nya sendiri. Runtime identik — cast ke tipe parameter exceljs.
  type LoadArg = Parameters<typeof wb.xlsx.load>[0];
  await wb.xlsx.load(buffer as unknown as LoadArg);
  const ws = wb.worksheets[0];
  if (!ws) {
    throw new Error("File tidak berisi lembar kerja (worksheet).");
  }

  // Petakan judul kolom → indeks kolom (1-based) berdasarkan baris header (baris 1).
  const headerRow = ws.getRow(1);
  const colOf: Partial<Record<keyof ParsedStudentRow, number>> = {};
  headerRow.eachCell((cell, colNumber) => {
    const h = normHeader(cell.text);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof typeof HEADER_ALIASES,
      string[],
    ][]) {
      if (aliases.includes(h) && colOf[field] === undefined) {
        colOf[field] = colNumber;
      }
    }
  });

  const missingColumns = REQUIRED.filter((f) => colOf[f] === undefined).map(
    (f) => HEADER_ALIASES[f][0],
  );
  if (missingColumns.length > 0) {
    return { missingColumns, rows: [] };
  }

  const text = (row: ExcelJS.Row, field: keyof ParsedStudentRow): string => {
    const col = colOf[field];
    if (!col) return "";
    return row.getCell(col).text.trim();
  };

  const rows: ParsedStudentRow[] = [];
  const lastRow = ws.rowCount;
  for (let r = 2; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const nis = text(row, "nis");
    const name = text(row, "name");
    const className = text(row, "className");
    const nisn = text(row, "nisn");
    const gender = text(row, "gender");
    const birthDate = text(row, "birthDate");

    // Lewati baris yang benar-benar kosong (sering ada di ekor file Excel).
    if (!nis && !name && !className && !nisn && !gender && !birthDate) continue;

    rows.push({
      rowNumber: r,
      nis,
      name,
      className,
      ...(nisn ? { nisn } : {}),
      ...(gender ? { gender } : {}),
      ...(birthDate ? { birthDate } : {}),
    });
  }

  return { missingColumns: [], rows };
}
