import { describe, it, expect, vi } from "vitest";
import { AnnouncementService } from "./announcement.service";

const WALI = { sub: "t1", role: "TEACHER", schoolId: "s1" } as any;
const ADMIN = { sub: "adm", role: "SCHOOL_ADMIN", schoolId: "s1" } as any;

function mk(over: any = {}) {
  const prisma = {
    class: { findMany: vi.fn(async () => [{ id: "c1", schoolId: "s1", homeroomTeacherId: "t1" }]), findUnique: vi.fn() },
    announcement: {
      create: vi.fn(async ({ data }: any) => ({ id: "a1", ...data, retractedAt: null })),
      findUnique: vi.fn(async () => ({ id: "a1", schoolId: "s1", authorUserId: "t1", publishedAt: new Date() })),
      updateMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
    },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    parentLink: { findMany: vi.fn() },
    ...over,
  };
  const audit = { write: vi.fn(async () => undefined) };
  const svc = new AnnouncementService(prisma as any, audit as any);
  return { svc, prisma, audit };
}

describe("AnnouncementService.create — scope×role (12A.4)", () => {
  it("CLASS oleh wali kelas (kelas diampu) → sukses", async () => {
    const h = mk();
    const res = await h.svc.create(WALI, { scope: "CLASS", scopeIds: ["c1"], title: "Ulangan", body: "Besok ulangan" });
    expect(res.scope).toBe("CLASS");
    expect(h.audit.write.mock.calls[0][0].action).toBe("ANNOUNCEMENT_PUBLISH");
  });

  it("CLASS oleh guru BUKAN wali kelas → ANNOUNCEMENT_SCOPE_FORBIDDEN", async () => {
    const h = mk({ class: { findMany: vi.fn(async () => [{ id: "c1", schoolId: "s1", homeroomTeacherId: "lain" }]), findUnique: vi.fn() } });
    await expect(h.svc.create(WALI, { scope: "CLASS", scopeIds: ["c1"], title: "x", body: "y" })).rejects.toMatchObject({
      response: { error: { code: "ANNOUNCEMENT_SCOPE_FORBIDDEN" } },
    });
  });

  it("SCHOOL oleh GURU → ditolak; oleh ADMIN → sukses", async () => {
    const g = mk();
    await expect(g.svc.create(WALI, { scope: "SCHOOL", scopeIds: [], title: "x", body: "y" })).rejects.toMatchObject({
      response: { error: { code: "ANNOUNCEMENT_SCOPE_FORBIDDEN" } },
    });
    const a = mk();
    await expect(a.svc.create(ADMIN, { scope: "SCHOOL", scopeIds: [], title: "Libur", body: "Besok libur" })).resolves.toBeTruthy();
  });

  it("GRADE oleh admin tanpa scopeIds → ditolak", async () => {
    const h = mk();
    await expect(h.svc.create(ADMIN, { scope: "GRADE", scopeIds: [], title: "x", body: "y" })).rejects.toMatchObject({
      response: { error: { code: "ANNOUNCEMENT_SCOPE_FORBIDDEN" } },
    });
  });
});

describe("AnnouncementService.retract (≤15 menit)", () => {
  it("dalam jendela (count 1) → sukses + audit", async () => {
    const h = mk();
    const res = await h.svc.retract(WALI, "a1");
    expect(res).toEqual({ retracted: true });
    expect(h.audit.write.mock.calls[0][0].action).toBe("ANNOUNCEMENT_RETRACT");
  });

  it("lewat 15 menit (count 0) → ANNOUNCEMENT_RETRACT_EXPIRED", async () => {
    const h = mk({
      announcement: {
        findUnique: vi.fn(async () => ({ id: "a1", schoolId: "s1", authorUserId: "t1", publishedAt: new Date(Date.now() - 20 * 60 * 1000) })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    });
    await expect(h.svc.retract(WALI, "a1")).rejects.toMatchObject({
      response: { error: { code: "ANNOUNCEMENT_RETRACT_EXPIRED" } },
    });
  });

  it("bukan penulis & bukan admin → FORBIDDEN", async () => {
    const h = mk({ announcement: { findUnique: vi.fn(async () => ({ id: "a1", schoolId: "s1", authorUserId: "lain", publishedAt: new Date() })), updateMany: vi.fn() } });
    await expect(h.svc.retract(WALI, "a1")).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });
});

describe("AnnouncementService.listForUser (audiens siswa)", () => {
  it("siswa hanya lihat SCHOOL / kelasnya / angkatannya", async () => {
    const anns = [
      { id: "a1", schoolId: "s1", authorUserId: "x", scope: "SCHOOL", scopeIds: [], title: "A", body: "b", publishedAt: new Date(), retractedAt: null },
      { id: "a2", schoolId: "s1", authorUserId: "x", scope: "CLASS", scopeIds: ["cX"], title: "B", body: "b", publishedAt: new Date(), retractedAt: null },
      { id: "a3", schoolId: "s1", authorUserId: "x", scope: "GRADE", scopeIds: ["11"], title: "C", body: "b", publishedAt: new Date(), retractedAt: null },
    ];
    const h = mk({
      user: { findUnique: vi.fn(async () => ({ schoolId: "s1", classId: "c1" })), findMany: vi.fn() },
      class: { findUnique: vi.fn(async () => ({ grade: 11 })), findMany: vi.fn() },
      announcement: { findMany: vi.fn(async () => anns) },
    });
    const res = await h.svc.listForUser({ sub: "stu1", role: "STUDENT", schoolId: "s1" } as any);
    const ids = res.map((r) => r.id).sort();
    expect(ids).toEqual(["a1", "a3"]); // SCHOOL + GRADE 11; CLASS cX (bukan kelasnya c1) tersaring
  });
});
