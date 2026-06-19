import { describe, it, expect, vi } from "vitest";
import { PermitService } from "./permit.service";

const STUDENT = { sub: "stu1", role: "STUDENT", schoolId: "s1" } as any;
const PARENT = { sub: "par1", role: "PARENT", schoolId: null } as any;
const WALI = { sub: "t1", role: "TEACHER", schoolId: "s1" } as any;
const ADMIN = { sub: "adm", role: "SCHOOL_ADMIN", schoolId: "s1" } as any;

const baseDto = { type: "SICK" as const, dateStart: "2026-07-21", dateEnd: "2026-07-21", note: "demam" };

function mk(over: any = {}) {
  const prisma = {
    parentLink: { findUnique: vi.fn(async () => ({ status: "ACTIVE" })), findMany: vi.fn(async () => []) },
    user: {
      findUnique: vi.fn(async () => ({ role: "STUDENT", schoolId: "s1", classId: "c1", deletedAt: null })),
      findMany: vi.fn(async () => []),
    },
    class: { findUnique: vi.fn(async () => ({ schoolId: "s1", homeroomTeacherId: "t1" })), findMany: vi.fn(async () => []) },
    permit: {
      findFirst: vi.fn(async () => null), // no overlap
      create: vi.fn(async ({ data }: any) => ({ id: "p1", ...data, decidedByUserId: null, decidedAt: null, decisionNote: null })),
      findUnique: vi.fn(async () => ({
        id: "p1", studentUserId: "stu1", requestedByUserId: "stu1", type: "SICK",
        dateStart: "2026-07-21", dateEnd: "2026-07-21", note: "demam", attachmentUrl: null,
        status: "SUBMITTED", decidedByUserId: null, decidedAt: null, decisionNote: null,
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    ...over,
  };
  const audit = { write: vi.fn(async () => undefined) };
  const daily = { recompute: vi.fn(async () => ({ finalStatus: "SICK", firstInAt: null, lastOutAt: null })) };
  const svc = new PermitService(prisma as any, audit as any, daily as any);
  return { svc, prisma, audit, daily };
}

describe("PermitService.create (10.3 / 12A.3)", () => {
  it("siswa: ajukan untuk diri (abaikan studentUserId body), status SUBMITTED", async () => {
    const h = mk();
    await h.svc.create(STUDENT, { ...baseDto, studentUserId: "stuLAIN" } as any);
    const data = h.prisma.permit.create.mock.calls[0][0].data;
    expect(data.studentUserId).toBe("stu1"); // dari sesi, bukan body
    expect(data.status).toBe("SUBMITTED");
    expect(data.requestedByUserId).toBe("stu1");
  });

  it("ortu ber-ParentLink ACTIVE: boleh; tanpa link → FORBIDDEN", async () => {
    const ok = mk();
    await expect(ok.svc.create(PARENT, { ...baseDto, studentUserId: "stu1" })).resolves.toBeTruthy();
    const no = mk({ parentLink: { findUnique: vi.fn(async () => null), findMany: vi.fn() } });
    await expect(no.svc.create(PARENT, { ...baseDto, studentUserId: "stu1" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("tumpang-tindih → PERMIT_DUPLICATE", async () => {
    const h = mk({ permit: { findFirst: vi.fn(async () => ({ id: "old" })), create: vi.fn() } });
    await expect(h.svc.create(STUDENT, baseDto)).rejects.toMatchObject({
      response: { error: { code: "PERMIT_DUPLICATE" } },
    });
  });
});

describe("PermitService.decide (state machine)", () => {
  it("wali kelas APPROVE → APPROVED + recompute + audit", async () => {
    const h = mk();
    await h.svc.decide(WALI, "p1", { decision: "APPROVE" });
    const upd = h.prisma.permit.updateMany.mock.calls[0][0];
    expect(upd.where).toEqual({ id: "p1", status: "SUBMITTED" });
    expect(upd.data.status).toBe("APPROVED");
    expect(h.daily.recompute).toHaveBeenCalledWith("stu1", "s1", "2026-07-21");
    expect(h.audit.write.mock.calls[0][0].action).toBe("PERMIT_DECIDE");
  });

  it("REJECT → REJECTED, tanpa recompute", async () => {
    const h = mk();
    await h.svc.decide(ADMIN, "p1", { decision: "REJECT" });
    expect(h.prisma.permit.updateMany.mock.calls[0][0].data.status).toBe("REJECTED");
    expect(h.daily.recompute).not.toHaveBeenCalled();
  });

  it("guru bukan wali kelas → FORBIDDEN", async () => {
    const h = mk({ class: { findUnique: vi.fn(async () => ({ schoolId: "s1", homeroomTeacherId: "lain" })), findMany: vi.fn() } });
    await expect(h.svc.decide(WALI, "p1", { decision: "APPROVE" })).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("sudah diputus (updateMany count 0) → PERMIT_INVALID_TRANSITION", async () => {
    const h = mk({
      permit: {
        findUnique: vi.fn(async () => ({ id: "p1", studentUserId: "stu1", dateStart: "2026-07-21", dateEnd: "2026-07-21", status: "APPROVED" })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    });
    await expect(h.svc.decide(ADMIN, "p1", { decision: "APPROVE" })).rejects.toMatchObject({
      response: { error: { code: "PERMIT_INVALID_TRANSITION" } },
    });
  });
});

describe("PermitService.cancel", () => {
  it("pembuat batalkan SUBMITTED → CANCELLED", async () => {
    const h = mk();
    await h.svc.cancel(STUDENT, "p1");
    expect(h.prisma.permit.updateMany.mock.calls[0][0].data.status).toBe("CANCELLED");
  });

  it("bukan pembuat → FORBIDDEN", async () => {
    const h = mk();
    await expect(h.svc.cancel({ sub: "lain", role: "STUDENT", schoolId: "s1" } as any, "p1")).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("status bukan SUBMITTED (count 0) → PERMIT_INVALID_TRANSITION", async () => {
    const h = mk({
      permit: {
        findUnique: vi.fn(async () => ({ id: "p1", requestedByUserId: "stu1", status: "APPROVED" })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    });
    await expect(h.svc.cancel(STUDENT, "p1")).rejects.toMatchObject({
      response: { error: { code: "PERMIT_INVALID_TRANSITION" } },
    });
  });
});
