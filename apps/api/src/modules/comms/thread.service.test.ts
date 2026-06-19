import { describe, it, expect, vi } from "vitest";
import { ThreadService } from "./thread.service";

const PARENT = { sub: "par1", role: "PARENT", schoolId: "s1" } as any;
const TEACHER = { sub: "t1", role: "TEACHER", schoolId: "s1" } as any;

function mk(over: any = {}) {
  const prisma = {
    parentLink: { findUnique: vi.fn(async () => ({ status: "ACTIVE" })) },
    user: { findUnique: vi.fn(async () => ({ schoolId: "s1", classId: "c1" })) },
    class: { findUnique: vi.fn(async () => ({ homeroomTeacherId: "t1" })) },
    thread: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async () => ({ id: "th1", schoolId: "s1", type: "PARENT_HOMEROOM", contextId: "c1", participantIds: ["par1", "t1"], createdAt: new Date(), updatedAt: new Date() })),
      create: vi.fn(async ({ data }: any) => ({ id: "th1", ...data, createdAt: new Date(), updatedAt: new Date() })),
      findMany: vi.fn(async () => []),
    },
    message: { create: vi.fn(async ({ data }: any) => ({ id: "m1", ...data, createdAt: new Date() })), findMany: vi.fn(async () => []) },
    ...over,
  };
  const svc = new ThreadService(prisma as any);
  return { svc, prisma };
}

describe("ThreadService.start (PARENT_HOMEROOM)", () => {
  it("ortu ber-link ACTIVE: buat thread [ortu, wali kelas] + pesan pertama", async () => {
    const h = mk();
    const t = await h.svc.start(PARENT, { studentUserId: "stu1", body: "Halo Bu, izin tanya", templateKey: "intro" });
    expect(t.type).toBe("PARENT_HOMEROOM");
    expect(h.prisma.thread.create.mock.calls[0][0].data.participantIds).toEqual(["par1", "t1"]);
    expect(h.prisma.message.create.mock.calls[0][0].data.senderUserId).toBe("par1");
  });

  it("tanpa ParentLink ACTIVE → FORBIDDEN", async () => {
    const h = mk({ parentLink: { findUnique: vi.fn(async () => null) } });
    await expect(h.svc.start(PARENT, { studentUserId: "stu1", body: "x" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("kelas tanpa wali kelas → NOT_FOUND", async () => {
    const h = mk({ class: { findUnique: vi.fn(async () => ({ homeroomTeacherId: null })) } });
    await expect(h.svc.start(PARENT, { studentUserId: "stu1", body: "x" })).rejects.toMatchObject({
      response: { error: { code: "NOT_FOUND" } },
    });
  });

  it("non-ortu (guru) memulai → FORBIDDEN", async () => {
    const h = mk();
    await expect(h.svc.start(TEACHER, { studentUserId: "stu1", body: "x" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });
});

describe("ThreadService.send / akses", () => {
  it("peserta (wali kelas) kirim pesan → ok", async () => {
    const h = mk();
    const m = await h.svc.send(TEACHER, "th1", { body: "Baik, Bu" });
    expect(m.senderUserId).toBe("t1");
  });

  it("bukan peserta → FORBIDDEN", async () => {
    const h = mk({ thread: { findUnique: vi.fn(async () => ({ id: "th1", type: "PARENT_HOMEROOM", participantIds: ["parX", "tX"] })) } });
    await expect(h.svc.send(TEACHER, "th1", { body: "nyelonong" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("tipe thread bukan PARENT_HOMEROOM → FORBIDDEN (Fase 2)", async () => {
    const h = mk({ thread: { findUnique: vi.fn(async () => ({ id: "th1", type: "CLASS_ROOM", participantIds: ["t1"] })) } });
    await expect(h.svc.send(TEACHER, "th1", { body: "x" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("siswa coba kirim (peserta-pun ditolak) → FORBIDDEN", async () => {
    const h = mk({ thread: { findUnique: vi.fn(async () => ({ id: "th1", type: "PARENT_HOMEROOM", participantIds: ["stu1", "t1"] })) } });
    await expect(h.svc.send({ sub: "stu1", role: "STUDENT", schoolId: "s1" } as any, "th1", { body: "x" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });
});
