import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { SchoolService } from "./school.service";
import { hashPairingToken } from "./provisioning";

/**
 * Tes unit logika provisioning & master data sekolah (Fase 1e, BAGIAN 7.4 & 8.2)
 * dengan Prisma, Config, & Audit dipalsukan (mock). Alur HTTP nyata diuji di 1k.
 */

function codeOf(err: unknown): string | undefined {
  if (err instanceof HttpException) {
    const body = err.getResponse() as { error?: { code?: string } };
    return body.error?.code;
  }
  return undefined;
}

const HQ = { sub: "hq1", sid: "s", role: "HQ_OPS", schoolId: null, scopes: [], linkRoles: [] } as never;
const ADMIN = {
  sub: "adm1",
  sid: "s",
  role: "SCHOOL_ADMIN",
  schoolId: "school1",
  scopes: [],
  linkRoles: [],
} as never;
const PEPPER = "x".repeat(16);

let prisma: any;
let config: any;
let audit: any;
let svc: SchoolService;

beforeEach(() => {
  prisma = {
    school: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue({ id: "school1", settings: {} }),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(makeSchool()),
      update: vi.fn().mockResolvedValue(makeSchool()),
    },
    device: { upsert: vi.fn().mockResolvedValue({}) },
    user: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "u1" }),
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    class: {
      create: vi.fn().mockResolvedValue(makeClass()),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(makeClass()),
      update: vi.fn().mockResolvedValue(makeClass()),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  };
  config = { get: (k: string) => ({ BOX_PAIRING_PEPPER: PEPPER }[k]) };
  audit = { write: vi.fn().mockResolvedValue(undefined) };
  svc = new SchoolService(prisma, config, audit);
});

function makeSchool(overrides: Record<string, unknown> = {}) {
  return {
    id: "school1",
    npsn: "12345678",
    name: "SMA Negeri 1",
    city: "Surabaya",
    province: "Jawa Timur",
    timezone: "Asia/Jakarta",
    status: "ONBOARDING",
    settings: {},
    ...overrides,
  };
}

function makeClass(overrides: Record<string, unknown> = {}) {
  return {
    id: "class1",
    schoolId: "school1",
    academicYear: "2026/2027",
    grade: 10,
    major: null,
    label: "X-1",
    homeroomTeacherId: null,
    ...overrides,
  };
}

describe("createSchool", () => {
  it("menolak NPSN duplikat (CONFLICT)", async () => {
    prisma.school.findUnique.mockResolvedValue(makeSchool());
    const err = await svc
      .createSchool(HQ, { npsn: "12345678", name: "X", city: "Y" })
      .catch((e) => e);
    expect(codeOf(err)).toBe("CONFLICT");
  });

  it("membuat sekolah status ONBOARDING & mencatat audit", async () => {
    const res = await svc.createSchool(HQ, { npsn: "87654321", name: "SMA 2", city: "Malang" });
    expect(prisma.school.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "ONBOARDING" }) }),
    );
    expect(res.status).toBe("ONBOARDING");
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: "SCHOOL_CREATE" }));
  });
});

describe("pairBox", () => {
  it("sekolah tak ada → NOT_FOUND", async () => {
    prisma.school.findFirst.mockResolvedValue(null);
    const err = await svc.pairBox(HQ, "nope", "MAGNOO-0001").catch((e) => e);
    expect(codeOf(err)).toBe("NOT_FOUND");
  });

  it("menyimpan HASH (token+pepper), bukan token mentah, & kembalikan token sekali", async () => {
    const res = await svc.pairBox(HQ, "school1", "MAGNOO-0001");
    expect(res.pairingToken).toBeTruthy();
    expect(res.expiresInSec).toBeGreaterThan(0);
    const stored = prisma.device.upsert.mock.calls[0][0].create.pairingTokenHash;
    expect(stored).toBe(hashPairingToken(res.pairingToken, PEPPER));
    expect(stored).not.toBe(res.pairingToken);
  });
});

describe("createAdminAccount", () => {
  it("admin pertama → username 'admin', wajib ganti password, password sementara dikembalikan", async () => {
    prisma.user.count.mockResolvedValue(0);
    const res = await svc.createAdminAccount(HQ, "school1");
    expect(res.username).toBe("admin");
    expect(res.tempPassword).toHaveLength(12);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mustChangePassword: true, role: "SCHOOL_ADMIN" }),
      }),
    );
  });

  it("admin kedua → username 'admin2'", async () => {
    prisma.user.count.mockResolvedValue(1);
    const res = await svc.createAdminAccount(HQ, "school1");
    expect(res.username).toBe("admin2");
  });
});

describe("settings", () => {
  it("getSettings: default 10.1 + override tersimpan", async () => {
    prisma.school.findFirst.mockResolvedValue(makeSchool({ settings: { jam_masuk: "06:30" } }));
    const res = await svc.getSettings("school1");
    expect(res.jam_masuk).toBe("06:30"); // override
    expect(res.absent_cutoff).toBe("09:00"); // default 10.1
  });

  it("updateSettings: hanya field yang dikirim yang di-override", async () => {
    prisma.school.findFirst.mockResolvedValue(makeSchool({ settings: { jam_masuk: "06:30" } }));
    const res = await svc.updateSettings(ADMIN, "school1", { late_cutoff: "06:45" });
    const saved = prisma.school.update.mock.calls[0][0].data.settings;
    expect(saved).toEqual({ jam_masuk: "06:30", late_cutoff: "06:45" });
    expect(res.jam_masuk).toBe("06:30");
    expect(res.late_cutoff).toBe("06:45");
  });
});

describe("classes", () => {
  it("createClass: wali kelas bukan guru sekolah ini → VALIDATION_ERROR", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const err = await svc
      .createClass(ADMIN, "school1", {
        academicYear: "2026/2027",
        grade: 10,
        label: "X-1",
        homeroomTeacherId: "ghost",
      })
      .catch((e) => e);
    expect(codeOf(err)).toBe("VALIDATION_ERROR");
  });

  it("deleteClass: masih ada siswa → CONFLICT (tidak menghapus)", async () => {
    prisma.class.findFirst.mockResolvedValue(makeClass());
    prisma.user.count.mockResolvedValue(3);
    const err = await svc.deleteClass(ADMIN, "school1", "class1").catch((e) => e);
    expect(codeOf(err)).toBe("CONFLICT");
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("deleteClass: kelas kosong → soft-delete (set deletedAt)", async () => {
    prisma.class.findFirst.mockResolvedValue(makeClass());
    prisma.user.count.mockResolvedValue(0);
    await svc.deleteClass(ADMIN, "school1", "class1");
    expect(prisma.class.update.mock.calls[0][0].data.deletedAt).toBeInstanceOf(Date);
  });
});

describe("promote (kenaikan kelas)", () => {
  const sources = [
    makeClass({ id: "c10", grade: 10, label: "X-1" }),
    makeClass({ id: "c12", grade: 12, label: "XII-1" }),
  ];

  it("dryRun: pratinjau saja, tanpa perubahan data", async () => {
    prisma.class.findMany.mockResolvedValue(sources);
    prisma.user.count.mockImplementation(({ where }: any) =>
      Promise.resolve(where.classId === "c12" ? 30 : 20),
    );
    const res = await svc.promote(ADMIN, "school1", {
      fromAcademicYear: "2026/2027",
      toAcademicYear: "2027/2028",
      dryRun: true,
    });
    expect(res.dryRun).toBe(true);
    expect(res.classesCreated).toBe(0);
    expect(res.studentsGraduating).toBe(30);
    expect(res.plan.find((p) => p.fromClassId === "c10")?.toGrade).toBe(11);
    expect(res.plan.find((p) => p.fromClassId === "c12")?.graduating).toBe(true);
    expect(prisma.class.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("confirm: kelas 10 naik (kelas baru + siswa pindah), kelas 12 lulus (tak buat kelas)", async () => {
    prisma.class.findMany.mockResolvedValue(sources);
    prisma.user.count.mockImplementation(({ where }: any) =>
      Promise.resolve(where.classId === "c12" ? 30 : 20),
    );
    prisma.class.create.mockResolvedValue(makeClass({ id: "c11new", grade: 11 }));
    prisma.user.updateMany.mockResolvedValue({ count: 20 });

    const res = await svc.promote(ADMIN, "school1", {
      fromAcademicYear: "2026/2027",
      toAcademicYear: "2027/2028",
      dryRun: false,
    });

    expect(res.dryRun).toBe(false);
    expect(res.classesCreated).toBe(1); // hanya kelas 10 → 11
    expect(res.studentsPromoted).toBe(20);
    expect(res.studentsGraduating).toBe(30);
    // kelas baru dibuat tepat sekali (untuk kelas 10, bukan kelas 12)
    expect(prisma.class.create).toHaveBeenCalledTimes(1);
    expect(prisma.class.create.mock.calls[0][0].data.grade).toBe(11);
    // kedua kelas sumber diarsipkan (soft-delete)
    const softDeletes = prisma.class.update.mock.calls.filter(
      (c: any) => c[0].data.deletedAt instanceof Date,
    );
    expect(softDeletes).toHaveLength(2);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: "CLASS_PROMOTE" }));
  });
});
