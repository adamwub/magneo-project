import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttendanceService } from "./attendance.service";

const STUDENT = { sub: "stu1", role: "STUDENT", schoolId: "s1" } as any;
const SCHOOL_GEO = { lat: -7.2575, lng: 112.7521 };
// Titik ~55 m dari sekolah (dalam radius default 150 m).
const NEAR = { geoLat: SCHOOL_GEO.lat + 0.0005, geoLng: SCHOOL_GEO.lng };
const FAR = { geoLat: SCHOOL_GEO.lat + 0.01, geoLng: SCHOOL_GEO.lng }; // ~1.1 km

function setup(settings: Record<string, unknown>) {
  const prisma = {
    school: { findUnique: vi.fn(async () => ({ timezone: "Asia/Jakarta", settings })) },
    attendanceEvent: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => ({ id: "e1", ...data })),
    },
  };
  const qr = { validateToken: vi.fn(async () => 42) }; // token valid, step 42
  const daily = { recompute: vi.fn(async () => ({ finalStatus: "PRESENT", firstInAt: null, lastOutAt: null })) };
  const notif = { notifyCheckin: vi.fn(async () => undefined) };
  const redis = { set: vi.fn(async () => "OK") }; // anti-replay: berhasil ambil kunci
  const svc = new AttendanceService(prisma as any, qr as any, daily as any, notif as any, redis as any);
  return { svc, prisma, qr, daily, notif, redis };
}

const GEO_SETTINGS = { geo: SCHOOL_GEO }; // qr_geo_radius_m & late_cutoff dari default

describe("AttendanceService.checkin (rule 10.2 / 12A.1)", () => {
  let h: ReturnType<typeof setup>;
  beforeEach(() => {
    h = setup(GEO_SETTINGS);
  });

  it("token tidak valid → ATTENDANCE_INVALID_TOKEN", async () => {
    h.qr.validateToken.mockResolvedValueOnce(null);
    await expect(h.svc.checkin(STUDENT, { qrToken: "x", ...NEAR })).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_INVALID_TOKEN" } },
    });
  });

  it("settings tanpa geo & wifi → ATTENDANCE_LOCATION_REQUIRED", async () => {
    const x = setup({}); // tak ada geo/wifi_cidrs
    await expect(x.svc.checkin(STUDENT, { qrToken: "t", ...NEAR })).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_LOCATION_REQUIRED" } },
    });
  });

  it("di luar radius & bukan IP WiFi → ATTENDANCE_OUT_OF_AREA", async () => {
    await expect(h.svc.checkin(STUDENT, { qrToken: "t", ...FAR }, "8.8.8.8")).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_OUT_OF_AREA" } },
    });
  });

  it("LULUS via GPS dalam radius → buat event IN (PRESENT/LATE), occurredAt server", async () => {
    const ev = await h.svc.checkin(STUDENT, { qrToken: "t", ...NEAR });
    expect(h.prisma.attendanceEvent.create).toHaveBeenCalledTimes(1);
    const data = h.prisma.attendanceEvent.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ userId: "stu1", schoolId: "s1", type: "IN", method: "QR" });
    expect(["PRESENT", "LATE"]).toContain(data.status);
    expect(data.occurredAt).toBeInstanceOf(Date); // server set, bukan dari klien
    expect(ev.type).toBe("IN");
    expect(h.redis.set).toHaveBeenCalledWith(
      "attreplay:s1:stu1:42",
      "1",
      "EX",
      90,
      "NX",
    );
  });

  it("LULUS via IP WiFi sekolah (tanpa koordinat GPS)", async () => {
    const x = setup({ wifi_cidrs: ["10.20.0.0/16"] });
    const ev = await x.svc.checkin(STUDENT, { qrToken: "t" }, "10.20.5.9");
    expect(ev.type).toBe("IN");
    expect(x.prisma.attendanceEvent.create).toHaveBeenCalledTimes(1);
  });

  it("double-event <5 mnt → sukses idempoten, TIDAK buat event baru, TIDAK pakai anti-replay", async () => {
    const recent = {
      id: "e0",
      userId: "stu1",
      schoolId: "s1",
      date: "2026-07-21",
      type: "IN",
      method: "QR",
      status: "PRESENT",
      occurredAt: new Date(),
    };
    h.prisma.attendanceEvent.findFirst.mockResolvedValueOnce(recent);
    const ev = await h.svc.checkin(STUDENT, { qrToken: "t", ...NEAR });
    expect(ev.id).toBe("e0");
    expect(h.prisma.attendanceEvent.create).not.toHaveBeenCalled();
    expect(h.redis.set).not.toHaveBeenCalled();
  });

  it("replay token (anti-replay gagal ambil kunci) → ATTENDANCE_INVALID_TOKEN", async () => {
    h.redis.set.mockResolvedValueOnce(null); // kunci sudah ada → replay
    await expect(h.svc.checkin(STUDENT, { qrToken: "t", ...NEAR })).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_INVALID_TOKEN" } },
    });
    expect(h.prisma.attendanceEvent.create).not.toHaveBeenCalled();
  });

  it("akun tanpa schoolId → FORBIDDEN", async () => {
    await expect(
      h.svc.checkin({ sub: "u", role: "STUDENT", schoolId: null } as any, { qrToken: "t", ...NEAR }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });
});
