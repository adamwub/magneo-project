import { describe, it, expect } from "vitest";
import {
  createSchoolRequestSchema,
  schoolSettingsSchema,
  classCreateRequestSchema,
  inviteCodeGenerateRequestSchema,
  auditLogQuerySchema,
} from "./school.js";

describe("createSchoolRequestSchema", () => {
  const base = { name: "SMK Negeri 1", city: "Malang" };

  it("menerima NPSN 8 digit", () => {
    const r = createSchoolRequestSchema.safeParse({ ...base, npsn: "20536789" });
    expect(r.success).toBe(true);
  });

  it("menolak NPSN bukan 8 digit", () => {
    expect(createSchoolRequestSchema.safeParse({ ...base, npsn: "123" }).success).toBe(false);
    expect(createSchoolRequestSchema.safeParse({ ...base, npsn: "2053678a" }).success).toBe(false);
  });
});

describe("schoolSettingsSchema", () => {
  it("menerima jam format HH:MM dan semua field opsional", () => {
    expect(schoolSettingsSchema.safeParse({}).success).toBe(true);
    expect(schoolSettingsSchema.safeParse({ jam_masuk: "07:00" }).success).toBe(true);
  });

  it("menolak jam yang tidak valid", () => {
    expect(schoolSettingsSchema.safeParse({ jam_masuk: "25:00" }).success).toBe(false);
    expect(schoolSettingsSchema.safeParse({ jam_masuk: "7am" }).success).toBe(false);
  });

  it("menerima wifi_hours format rentang dan menolak yang salah", () => {
    expect(schoolSettingsSchema.safeParse({ wifi_hours: "06:00-17:00" }).success).toBe(true);
    expect(schoolSettingsSchema.safeParse({ wifi_hours: "06:00" }).success).toBe(false);
  });
});

describe("classCreateRequestSchema", () => {
  const base = { academicYear: "2026/2027", label: "XI-TKJ-2" };

  it("menerima grade 10-12 dan tahun ajaran YYYY/YYYY", () => {
    expect(classCreateRequestSchema.safeParse({ ...base, grade: 11 }).success).toBe(true);
  });

  it("menolak grade di luar 10-12", () => {
    expect(classCreateRequestSchema.safeParse({ ...base, grade: 9 }).success).toBe(false);
  });

  it("menolak format tahun ajaran yang salah", () => {
    const r = classCreateRequestSchema.safeParse({ ...base, grade: 10, academicYear: "2026" });
    expect(r.success).toBe(false);
  });
});

describe("inviteCodeGenerateRequestSchema", () => {
  it("menerima tepat satu dari classId atau studentIds", () => {
    expect(inviteCodeGenerateRequestSchema.safeParse({ classId: "c1" }).success).toBe(true);
    expect(inviteCodeGenerateRequestSchema.safeParse({ studentIds: ["s1"] }).success).toBe(true);
  });

  it("menolak bila keduanya kosong atau keduanya diisi", () => {
    expect(inviteCodeGenerateRequestSchema.safeParse({}).success).toBe(false);
    expect(
      inviteCodeGenerateRequestSchema.safeParse({ classId: "c1", studentIds: ["s1"] }).success,
    ).toBe(false);
  });
});

describe("auditLogQuerySchema", () => {
  it("membatasi limit maksimum 100 (BAGIAN 8.1)", () => {
    expect(auditLogQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    expect(auditLogQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
