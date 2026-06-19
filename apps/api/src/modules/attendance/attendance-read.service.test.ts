import { describe, it, expect, vi } from "vitest";
import { AttendanceReadService } from "./attendance-read.service";

describe("AttendanceReadService (2f — laporan)", () => {
  it("mine: ambil status bulan tertentu, urut tanggal", async () => {
    const prisma = {
      dailyAttendanceStatus: {
        findMany: vi.fn(async () => [
          { date: "2026-07-01", finalStatus: "PRESENT" },
          { date: "2026-07-02", finalStatus: "LATE" },
        ]),
      },
    };
    const svc = new AttendanceReadService(prisma as any);
    const res = await svc.mine("stu1", "2026-07");
    expect(res.month).toBe("2026-07");
    expect(res.days).toHaveLength(2);
    // filter pakai startsWith bulan
    expect(prisma.dailyAttendanceStatus.findMany.mock.calls[0][0].where).toMatchObject({
      userId: "stu1",
      date: { startsWith: "2026-07" },
    });
  });

  it("classDay: siswa tanpa catatan → ABSENT_NO_INFO; respons TANPA nama (hanya userId)", async () => {
    const prisma = {
      user: { findMany: vi.fn(async () => [{ id: "s1" }, { id: "s2" }]) },
      dailyAttendanceStatus: {
        findMany: vi.fn(async () => [{ userId: "s1", finalStatus: "PRESENT", firstInAt: new Date("2026-07-21T00:10:00Z") }]),
      },
    };
    const svc = new AttendanceReadService(prisma as any);
    const res = await svc.classDay("sch1", "c1", "2026-07-21");
    expect(res.students).toHaveLength(2);
    const s1 = res.students.find((s) => s.userId === "s1")!;
    const s2 = res.students.find((s) => s.userId === "s2")!;
    expect(s1.finalStatus).toBe("PRESENT");
    expect(s1.firstInAt).toBe("2026-07-21T00:10:00.000Z");
    expect(s2.finalStatus).toBe("ABSENT_NO_INFO"); // tak ada catatan → default
    expect(s2.firstInAt).toBeNull();
    // privasi: tak ada properti nama/displayName/nis
    for (const row of res.students) {
      expect(Object.keys(row).sort()).toEqual(["finalStatus", "firstInAt", "userId"]);
    }
  });

  it("schoolSummary: petakan groupBy ke counts + total", async () => {
    const prisma = {
      dailyAttendanceStatus: {
        groupBy: vi.fn(async () => [
          { finalStatus: "PRESENT", _count: { _all: 120 } },
          { finalStatus: "LATE", _count: { _all: 8 } },
          { finalStatus: "ABSENT_NO_INFO", _count: { _all: 5 } },
        ]),
      },
    };
    const svc = new AttendanceReadService(prisma as any);
    const res = await svc.schoolSummary("sch1", "2026-07-21");
    expect(res.counts).toEqual({ PRESENT: 120, LATE: 8, PERMIT: 0, SICK: 0, ABSENT_NO_INFO: 5 });
    expect(res.total).toBe(133);
  });
});
