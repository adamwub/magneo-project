import { describe, it, expect, vi, beforeEach } from "vitest";
import { CorrectionsService } from "./corrections.service";
import { schoolLocalTime } from "./school-time";

// Tanggal sekolah hari ini (WIB) — biar tes deterministik kapan pun dijalankan.
const TODAY = schoolLocalTime(new Date(), "Asia/Jakarta").date;
function shift(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ADMIN = { sub: "admin1", role: "SCHOOL_ADMIN", schoolId: "s1" } as any;
const WALI = { sub: "teacher1", role: "TEACHER", schoolId: "s1" } as any;

function setup(opts: { studentClass?: string | null; homeroom?: string | null } = {}) {
  const prisma = {
    user: {
      findUnique: vi.fn(async () => ({
        schoolId: "s1",
        classId: opts.studentClass === undefined ? "c1" : opts.studentClass,
        role: "STUDENT",
        deletedAt: null,
      })),
    },
    class: {
      findUnique: vi.fn(async () => ({
        schoolId: "s1",
        homeroomTeacherId: opts.homeroom === undefined ? "teacher1" : opts.homeroom,
      })),
    },
    school: { findUnique: vi.fn(async () => ({ timezone: "Asia/Jakarta" })) },
    dailyAttendanceStatus: { findUnique: vi.fn(async () => ({ finalStatus: "ABSENT_NO_INFO" })) },
    attendanceEvent: { create: vi.fn(async () => ({ id: "e1" })) },
  };
  const audit = { write: vi.fn(async () => undefined) };
  const daily = { recompute: vi.fn(async () => ({ finalStatus: "PRESENT", firstInAt: null, lastOutAt: null })) };
  const svc = new CorrectionsService(prisma as any, audit as any, daily as any);
  return { svc, prisma, audit, daily };
}

const dto = (over: Record<string, unknown> = {}) => ({
  studentUserId: "stu1",
  date: TODAY,
  status: "PRESENT" as const,
  reason: "Lupa scan, hadir tepat waktu",
  ...over,
});

describe("CorrectionsService.correct (rule 10.4)", () => {
  let h: ReturnType<typeof setup>;
  beforeEach(() => {
    h = setup();
  });

  it("wali kelas: sukses → buat CORRECTION, recompute, AuditLog before/after", async () => {
    const res = await h.svc.correct(WALI, dto());
    expect(res.finalStatus).toBe("PRESENT");
    const ev = h.prisma.attendanceEvent.create.mock.calls[0][0].data;
    expect(ev).toMatchObject({ type: "CORRECTION", method: "MANUAL", correctedBy: "teacher1" });
    expect(ev.correctionReason).toBeTruthy();
    expect(h.daily.recompute).toHaveBeenCalledOnce();
    const audit = h.audit.write.mock.calls[0][0];
    expect(audit.action).toBe("ATTENDANCE_CORRECT");
    expect(audit.before).toHaveProperty("finalStatus");
    expect(audit.after).toHaveProperty("finalStatus");
  });

  it("SCHOOL_ADMIN sekolah sama: sukses", async () => {
    const res = await h.svc.correct(ADMIN, dto());
    expect(res.finalStatus).toBe("PRESENT");
  });

  it("guru BUKAN wali kelas → FORBIDDEN, tak buat event", async () => {
    const x = setup({ homeroom: "teacherLain" });
    await expect(x.svc.correct(WALI, dto())).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
    expect(x.prisma.attendanceEvent.create).not.toHaveBeenCalled();
  });

  it("lewat H+3 → FORBIDDEN", async () => {
    await expect(h.svc.correct(ADMIN, dto({ date: shift(TODAY, -5) }))).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("tanggal masa depan → VALIDATION_ERROR", async () => {
    await expect(h.svc.correct(ADMIN, dto({ date: shift(TODAY, 1) }))).rejects.toMatchObject({
      response: { error: { code: "VALIDATION_ERROR" } },
    });
  });

  it("H-2 masih boleh (dalam jendela)", async () => {
    const res = await h.svc.correct(ADMIN, dto({ date: shift(TODAY, -2) }));
    expect(res.finalStatus).toBe("PRESENT");
  });

  it("siswa sekolah lain → FORBIDDEN", async () => {
    await expect(
      h.svc.correct({ sub: "a", role: "SCHOOL_ADMIN", schoolId: "sX" } as any, dto()),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });
});
