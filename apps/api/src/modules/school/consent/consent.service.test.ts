import { describe, it, expect, beforeEach } from "vitest";
import { ConsentService } from "./consent.service";

/** Prisma + Audit tiruan untuk menguji cabang logika consent tanpa DB nyata. */
function makeService(opts: { studentInSchool: boolean; activeExists: boolean }) {
  const audits: string[] = [];
  const created: unknown[] = [];
  const prisma = {
    user: {
      count: async () => (opts.studentInSchool ? 1 : 0),
      findMany: async () => [{ id: "stu-1" }],
    },
    consentRecord: {
      findFirst: async () => (opts.activeExists ? { id: "c-old" } : null),
      findMany: async () => [
        { id: "c1", subjectUserId: "stu-1", grantedByUserId: null, type: "FACE", docVersion: "v1", grantedAt: new Date(), revokedAt: null, evidenceRef: null },
      ],
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: "c-new", revokedAt: null, grantedAt: new Date(), ...data };
        created.push(row);
        return row;
      },
    },
  };
  const audit = { write: async (e: { action: string }) => { audits.push(e.action); } };
  const svc = new ConsentService(prisma as never, audit as never);
  return { svc, audits, created };
}

const dto = { subjectUserId: "stu-1", type: "FACE" as const, docVersion: "v1" };

describe("ConsentService.grant (Fase 1h)", () => {
  it("subjek bukan siswa sekolah ini → NOT_FOUND (cegah IDOR)", async () => {
    const { svc } = makeService({ studentInSchool: false, activeExists: false });
    await expect(svc.grant("admin", "sch-1", dto)).rejects.toMatchObject({ status: 404 });
  });

  it("sudah ada consent aktif tipe sama → CONFLICT", async () => {
    const { svc } = makeService({ studentInSchool: true, activeExists: true });
    await expect(svc.grant("admin", "sch-1", dto)).rejects.toMatchObject({ status: 409 });
  });

  it("happy path → buat record + tulis audit CONSENT_GRANT", async () => {
    const { svc, audits, created } = makeService({ studentInSchool: true, activeExists: false });
    const res = await svc.grant("admin", "sch-1", dto);
    expect(res.subjectUserId).toBe("stu-1");
    expect(res.type).toBe("FACE");
    expect(created).toHaveLength(1);
    expect(audits).toContain("CONSENT_GRANT");
  });
});

describe("ConsentService.list (Fase 1h)", () => {
  it("filter subjectUserId bukan siswa sekolah → NOT_FOUND", async () => {
    const { svc } = makeService({ studentInSchool: false, activeExists: false });
    await expect(svc.list("sch-1", { subjectUserId: "stu-x" })).rejects.toMatchObject({ status: 404 });
  });

  it("tanpa filter → kembalikan arsip siswa sekolah", async () => {
    const { svc } = makeService({ studentInSchool: true, activeExists: false });
    const rows = await svc.list("sch-1", {});
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("FACE");
  });
});
