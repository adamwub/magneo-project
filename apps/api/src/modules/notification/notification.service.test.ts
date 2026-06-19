import { describe, it, expect, vi } from "vitest";
import { NotificationService } from "./notification.service";

function mk(over: any = {}) {
  const prisma = {
    deviceToken: { findMany: vi.fn(async () => [{ token: "tok1" }]), updateMany: vi.fn(async () => ({ count: 0 })) },
    notificationLog: { create: vi.fn(async () => ({})) },
    parentLink: { findMany: vi.fn(async () => [{ parentUserId: "p1" }, { parentUserId: "p2" }]) },
    ...over,
  };
  const sender = { enabled: false, send: vi.fn(async () => ({ sent: 0, failedTokens: [] })) };
  const redis = { set: vi.fn(async () => "OK") };
  const svc = new NotificationService(prisma as any, sender as any, redis as any);
  return { svc, prisma, sender, redis };
}

describe("NotificationService (2h pondasi)", () => {
  it("stub (Firebase belum ada): TIDAK kirim, log status QUEUED", async () => {
    const h = mk();
    const ok = await h.svc.notifyUser("u1", "attendance.checkin", { date: "2026-07-21", status: "PRESENT" });
    expect(ok).toBe(true);
    expect(h.sender.send).not.toHaveBeenCalled(); // stub: tak mengirim
    expect(h.prisma.notificationLog.create.mock.calls[0][0].data.status).toBe("QUEUED");
  });

  it("payload TANPA PII anak (hanya data non-identitas)", async () => {
    const h = mk();
    await h.svc.notifyUser("u1", "attendance.checkin", { date: "2026-07-21", status: "LATE" });
    const payload = h.prisma.notificationLog.create.mock.calls[0][0].data.payloadRef;
    expect(payload).toEqual({ date: "2026-07-21", status: "LATE" });
    expect(JSON.stringify(payload)).not.toMatch(/nama|nis|name/i);
  });

  it("dedup: kunci sudah ada (set NX != OK) → tidak proses ulang", async () => {
    const h = mk({}, );
    h.redis.set.mockResolvedValueOnce(null);
    const ok = await h.svc.notifyUser("u1", "attendance.checkin", { date: "d", status: "PRESENT" }, "checkin:stu1:d");
    expect(ok).toBe(false);
    expect(h.prisma.notificationLog.create).not.toHaveBeenCalled();
  });

  it("notifyCheckin: kirim ke SEMUA ortu aktif, dedup per (siswa,tanggal)", async () => {
    const h = mk();
    await h.svc.notifyCheckin("stu1", "PRESENT", "2026-07-21");
    expect(h.prisma.parentLink.findMany.mock.calls[0][0].where).toMatchObject({ studentUserId: "stu1", status: "ACTIVE" });
    expect(h.prisma.notificationLog.create).toHaveBeenCalledTimes(2); // 2 ortu
    // dedupe key dipakai
    expect(h.redis.set.mock.calls[0][0]).toContain("notifsent:p1:attendance.checkin:checkin:stu1:2026-07-21");
  });

  it("pengirim AKTIF + token mati → status FAILED + token dicabut", async () => {
    const sender = { enabled: true, send: vi.fn(async () => ({ sent: 0, failedTokens: ["tok1"] })) };
    const prisma = {
      deviceToken: { findMany: vi.fn(async () => [{ token: "tok1" }]), updateMany: vi.fn(async () => ({ count: 1 })) },
      notificationLog: { create: vi.fn(async () => ({})) },
      parentLink: { findMany: vi.fn() },
    };
    const svc = new NotificationService(prisma as any, sender as any, { set: vi.fn(async () => "OK") } as any);
    await svc.notifyUser("u1", "attendance.checkin", { date: "d", status: "PRESENT" });
    expect(prisma.notificationLog.create.mock.calls[0][0].data.status).toBe("FAILED");
    expect(prisma.deviceToken.updateMany).toHaveBeenCalled(); // token mati dicabut
  });
});
