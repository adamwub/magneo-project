import { describe, it, expect } from "vitest";
import * as ExcelJS from "exceljs";
import { parseStudentsXlsx } from "./xlsx";

/** Bangun buffer XLSX in-memory dari baris (baris pertama = header). */
async function buildXlsx(rows: (string | number)[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  rows.forEach((r) => ws.addRow(r));
  const buf = await wb.xlsx.writeBuffer();
  return buf as unknown as Buffer;
}

describe("parseStudentsXlsx (Fase 1f)", () => {
  it("membaca header standar + baris data", async () => {
    const buf = await buildXlsx([
      ["NIS", "Nama", "Kelas"],
      ["20240001", "Budi", "X-IPA-1"],
      ["20240002", "Siti", "X-IPA-1"],
    ]);
    const { missingColumns, rows } = await parseStudentsXlsx(buf);
    expect(missingColumns).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ rowNumber: 2, nis: "20240001", name: "Budi", className: "X-IPA-1" });
  });

  it("menerima sinonim header (Nama Lengkap, Rombel) tak peka huruf besar/kecil", async () => {
    const buf = await buildXlsx([
      ["nis", "Nama Lengkap", "ROMBEL"],
      ["20240003", "Andi", "XI-IPS-2"],
    ]);
    const { missingColumns, rows } = await parseStudentsXlsx(buf);
    expect(missingColumns).toEqual([]);
    expect(rows[0]).toMatchObject({ nis: "20240003", name: "Andi", className: "XI-IPS-2" });
  });

  it("ANTI-RUSAK NIS: angka nol di depan dipertahankan (baca teks sel, bukan angka)", async () => {
    const buf = await buildXlsx([
      ["NIS", "Nama", "Kelas"],
      ["0023", "Caca", "X-IPA-1"],
    ]);
    const { rows } = await parseStudentsXlsx(buf);
    expect(rows[0].nis).toBe("0023");
  });

  it("melewati baris kosong di tengah/ekor file", async () => {
    const buf = await buildXlsx([
      ["NIS", "Nama", "Kelas"],
      ["20240001", "Budi", "X-IPA-1"],
      ["", "", ""],
      ["20240002", "Siti", "X-IPA-1"],
    ]);
    const { rows } = await parseStudentsXlsx(buf);
    expect(rows).toHaveLength(2);
  });

  it("kolom wajib hilang → laporkan di missingColumns, tanpa baris", async () => {
    const buf = await buildXlsx([
      ["NIS", "Nama"], // tanpa Kelas
      ["20240001", "Budi"],
    ]);
    const { missingColumns, rows } = await parseStudentsXlsx(buf);
    expect(missingColumns).toContain("kelas");
    expect(rows).toEqual([]);
  });

  it("membaca kolom opsional (NISN, JK, Tgl Lahir) bila ada", async () => {
    const buf = await buildXlsx([
      ["NIS", "Nama", "Kelas", "NISN", "JK", "Tgl Lahir"],
      ["20240001", "Budi", "X-IPA-1", "1234567890", "L", "2008-05-01"],
    ]);
    const { rows } = await parseStudentsXlsx(buf);
    expect(rows[0]).toMatchObject({ nisn: "1234567890", gender: "L", birthDate: "2008-05-01" });
  });
});
