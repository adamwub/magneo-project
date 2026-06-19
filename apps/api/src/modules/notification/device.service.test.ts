import { describe, it, expect, vi } from "vitest";
import { DeviceService } from "./device.service";

describe("DeviceService (2g — registrasi device push)", () => {
  it("register: upsert by token, ikat ke userId sesi, reset revokedAt", async () => {
    const prisma = { deviceToken: { upsert: vi.fn(async () => ({})) } };
    const svc = new DeviceService(prisma as any);
    const res = await svc.register("user1", { token: "tok-abc", platform: "ANDROID" });
    expect(res).toEqual({ registered: true });
    const arg = prisma.deviceToken.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ token: "tok-abc" });
    expect(arg.create).toMatchObject({ userId: "user1", token: "tok-abc", platform: "ANDROID" });
    // ganti-login: kepemilikan token pindah ke user terkini + token diaktifkan lagi
    expect(arg.update).toMatchObject({ userId: "user1", platform: "ANDROID", revokedAt: null });
  });

  it("remove: hanya hapus token MILIK pemanggil (filter userId)", async () => {
    const prisma = { deviceToken: { deleteMany: vi.fn(async () => ({ count: 1 })) } };
    const svc = new DeviceService(prisma as any);
    const res = await svc.remove("user1", "tok-abc");
    expect(res).toEqual({ removed: true });
    expect(prisma.deviceToken.deleteMany.mock.calls[0][0]).toEqual({ where: { token: "tok-abc", userId: "user1" } });
  });

  it("remove: token bukan milik pemanggil → removed:false (count 0)", async () => {
    const prisma = { deviceToken: { deleteMany: vi.fn(async () => ({ count: 0 })) } };
    const svc = new DeviceService(prisma as any);
    expect(await svc.remove("user1", "tok-orang-lain")).toEqual({ removed: false });
  });
});
