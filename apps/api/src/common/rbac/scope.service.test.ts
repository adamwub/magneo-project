import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScopeService } from "./scope.service";
import type { ScopeMeta } from "./scope.decorator";

function req(params: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  return { params, body } as never;
}
const meta = (level: ScopeMeta["level"], options: ScopeMeta["options"] = {}): ScopeMeta => ({
  level,
  options,
});

const student = { sub: "u1", sid: "s1", role: "STUDENT" as const, schoolId: "sc1", scopes: [], linkRoles: [] };
const teacher = { ...student, sub: "t1", role: "TEACHER" as const };
const admin = { ...student, sub: "a1", role: "SCHOOL_ADMIN" as const };
const parent = { ...student, sub: "p1", role: "PARENT" as const };
const hq = { ...student, sub: "h1", role: "HQ_OPS" as const, schoolId: null };

let prisma: any;
let svc: ScopeService;
beforeEach(() => {
  prisma = {
    user: { findUnique: vi.fn() },
    class: { findUnique: vi.fn() },
    parentLink: { findFirst: vi.fn() },
  };
  svc = new ScopeService(prisma);
});

describe("scope: global", () => {
  it("HQ diizinkan, non-HQ ditolak", async () => {
    expect((await svc.check(meta("global"), req(), hq)).allowed).toBe(true);
    expect((await svc.check(meta("global"), req(), admin)).allowed).toBe(false);
  });
});

describe("scope: self", () => {
  it("tanpa id target = diri sendiri → izin", async () => {
    expect((await svc.check(meta("self"), req(), student)).allowed).toBe(true);
  });
  it("id sama → izin; id beda → tolak", async () => {
    expect((await svc.check(meta("self", { param: "id" }), req({ id: "u1" }), student)).allowed).toBe(true);
    expect((await svc.check(meta("self", { param: "id" }), req({ id: "u2" }), student)).allowed).toBe(false);
  });
  it("ortu boleh akses anak yang tertaut aktif", async () => {
    prisma.parentLink.findFirst.mockResolvedValue({ id: "l1" });
    const r = await svc.check(meta("self", { param: "id" }), req({ id: "child1" }), parent);
    expect(r.allowed).toBe(true);
    prisma.parentLink.findFirst.mockResolvedValue(null);
    const r2 = await svc.check(meta("self", { param: "id" }), req({ id: "childX" }), parent);
    expect(r2.allowed).toBe(false);
  });
});

describe("scope: school", () => {
  it("tanpa target → izin bila pemanggil punya schoolId", async () => {
    expect((await svc.check(meta("school"), req(), admin)).allowed).toBe(true);
    expect((await svc.check(meta("school"), req(), hq)).allowed).toBe(false);
  });
  it("schoolId target cocok/ tidak", async () => {
    expect((await svc.check(meta("school", { param: "schoolId" }), req({ schoolId: "sc1" }), admin)).allowed).toBe(true);
    expect((await svc.check(meta("school", { param: "schoolId" }), req({ schoolId: "sc2" }), admin)).allowed).toBe(false);
  });
  it("resource=user → resolusi sekolah dari user target", async () => {
    prisma.user.findUnique.mockResolvedValue({ schoolId: "sc2" });
    const r = await svc.check(meta("school", { param: "id", resource: "user" }), req({ id: "uX" }), admin);
    expect(r.allowed).toBe(false); // user target di sekolah lain
  });
});

describe("scope: class", () => {
  it("guru wali kelas → izin; guru bukan wali → tolak", async () => {
    prisma.class.findUnique.mockResolvedValue({ schoolId: "sc1", homeroomTeacherId: "t1" });
    expect((await svc.check(meta("class", { param: "classId" }), req({ classId: "c1" }), teacher)).allowed).toBe(true);
    prisma.class.findUnique.mockResolvedValue({ schoolId: "sc1", homeroomTeacherId: "tOther" });
    expect((await svc.check(meta("class", { param: "classId" }), req({ classId: "c1" }), teacher)).allowed).toBe(false);
  });
  it("admin → kelas mana pun di sekolahnya, tapi tolak kelas sekolah lain", async () => {
    prisma.class.findUnique.mockResolvedValue({ schoolId: "sc1", homeroomTeacherId: "tX" });
    expect((await svc.check(meta("class", { param: "classId" }), req({ classId: "c1" }), admin)).allowed).toBe(true);
    prisma.class.findUnique.mockResolvedValue({ schoolId: "sc2", homeroomTeacherId: "tX" });
    expect((await svc.check(meta("class", { param: "classId" }), req({ classId: "c2" }), admin)).allowed).toBe(false);
  });
});
