import { describe, it, expect } from "vitest";
import { buildClassLabelMap, validateRow } from "./validation";
import type { ParsedStudentRow } from "./xlsx";

const CLASSES = [
  { id: "c10", label: "X-IPA-1" },
  { id: "c11", label: "XI-IPS-2" },
];
const classMap = buildClassLabelMap(CLASSES);

function row(over: Partial<ParsedStudentRow>): ParsedStudentRow {
  return { rowNumber: 2, nis: "20240001", name: "Budi", className: "X-IPA-1", ...over };
}

describe("validateRow (Fase 1f — QA-2)", () => {
  it("baris valid → ok + classId hasil pemetaan label kelas", () => {
    const res = validateRow(row({}), classMap, new Set());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({ rowNumber: 2, nis: "20240001", classId: "c10" });
    }
  });

  it("label kelas tidak peka huruf besar/kecil & spasi tepi", () => {
    const res = validateRow(row({ className: "  x-ipa-1 " }), classMap, new Set());
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.classId).toBe("c10");
  });

  it("NIS kosong → NIS_REQUIRED", () => {
    const res = validateRow(row({ nis: "" }), classMap, new Set());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.map((e) => e.code)).toContain("NIS_REQUIRED");
  });

  it("NIS bukan angka → NIS_INVALID", () => {
    const res = validateRow(row({ nis: "ABC123" }), classMap, new Set());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.map((e) => e.code)).toContain("NIS_INVALID");
  });

  it("nama kosong → NAME_REQUIRED", () => {
    const res = validateRow(row({ name: "" }), classMap, new Set());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.map((e) => e.code)).toContain("NAME_REQUIRED");
  });

  it("kelas tidak ada di sekolah → CLASS_NOT_FOUND", () => {
    const res = validateRow(row({ className: "XII-GHOST-9" }), classMap, new Set());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.map((e) => e.code)).toContain("CLASS_NOT_FOUND");
  });

  it("mengumpulkan SEMUA error pada satu baris (bukan berhenti di error pertama)", () => {
    const res = validateRow(row({ nis: "", name: "", className: "XII-GHOST" }), classMap, new Set());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const codes = res.errors.map((e) => e.code);
      expect(codes).toContain("NIS_REQUIRED");
      expect(codes).toContain("NAME_REQUIRED");
      expect(codes).toContain("CLASS_NOT_FOUND");
    }
  });

  it("deteksi NIS ganda DALAM file: kemunculan kedua → DUPLICATE_NIS_IN_FILE", () => {
    const seen = new Set<string>();
    const first = validateRow(row({ rowNumber: 2, nis: "20240001" }), classMap, seen);
    const second = validateRow(row({ rowNumber: 3, nis: "20240001" }), classMap, seen);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.errors.map((e) => e.code)).toContain("DUPLICATE_NIS_IN_FILE");
  });

  it("NIS valid yang barisnya gagal (kelas salah) tetap ditandai → duplikatnya tertangkap", () => {
    const seen = new Set<string>();
    validateRow(row({ rowNumber: 2, nis: "20240009", className: "GHOST" }), classMap, seen);
    const dup = validateRow(row({ rowNumber: 3, nis: "20240009" }), classMap, seen);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.errors.map((e) => e.code)).toContain("DUPLICATE_NIS_IN_FILE");
  });

  it("kolom opsional salah format → error spesifik (NISN/JK/Tgl Lahir)", () => {
    const res = validateRow(
      row({ nisn: "12", gender: "X", birthDate: "kemarin" }),
      classMap,
      new Set(),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const codes = res.errors.map((e) => e.code);
      expect(codes).toContain("NISN_INVALID");
      expect(codes).toContain("GENDER_INVALID");
      expect(codes).toContain("BIRTHDATE_INVALID");
    }
  });

  it("kolom opsional valid (L/P, NISN 10 digit, tanggal DD/MM/YYYY) → ok", () => {
    const res = validateRow(
      row({ nisn: "1234567890", gender: "P", birthDate: "31/12/2008" }),
      classMap,
      new Set(),
    );
    expect(res.ok).toBe(true);
  });
});
