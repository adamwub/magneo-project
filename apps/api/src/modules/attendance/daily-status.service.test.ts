import { describe, it, expect } from "vitest";
import { computeDailyFinalStatus, type StatusEvent } from "./daily-status.service";

const t = (iso: string): Date => new Date(iso);
const IN = (status: "PRESENT" | "LATE", at: string): StatusEvent => ({ type: "IN", status, occurredAt: t(at) });
const OUT = (at: string): StatusEvent => ({ type: "OUT", status: "PRESENT", occurredAt: t(at) });
const CORR = (status: "PRESENT" | "LATE", at: string): StatusEvent => ({ type: "CORRECTION", status, occurredAt: t(at) });

describe("computeDailyFinalStatus (rule 10.3)", () => {
  it("tanpa event & tanpa permit → ABSENT_NO_INFO", () => {
    const r = computeDailyFinalStatus([], null);
    expect(r.finalStatus).toBe("ABSENT_NO_INFO");
    expect(r.firstInAt).toBeNull();
    expect(r.lastOutAt).toBeNull();
  });

  it("IN PRESENT → PRESENT; firstInAt terisi", () => {
    const r = computeDailyFinalStatus([IN("PRESENT", "2026-07-21T00:10:00Z")], null);
    expect(r.finalStatus).toBe("PRESENT");
    expect(r.firstInAt).toEqual(t("2026-07-21T00:10:00Z"));
  });

  it("IN LATE → LATE", () => {
    expect(computeDailyFinalStatus([IN("LATE", "2026-07-21T01:00:00Z")], null).finalStatus).toBe("LATE");
  });

  it("permit APPROVED override kehadiran: SICK→SICK, FAMILY→PERMIT", () => {
    const ev = [IN("PRESENT", "2026-07-21T00:10:00Z")];
    expect(computeDailyFinalStatus(ev, "SICK").finalStatus).toBe("SICK");
    expect(computeDailyFinalStatus(ev, "FAMILY").finalStatus).toBe("PERMIT");
    expect(computeDailyFinalStatus(ev, "DISPENSATION").finalStatus).toBe("PERMIT");
  });

  it("CORRECTION terbaru menang atas IN (koreksi guru)", () => {
    const r = computeDailyFinalStatus(
      [IN("LATE", "2026-07-21T01:00:00Z"), CORR("PRESENT", "2026-07-21T03:00:00Z")],
      null,
    );
    expect(r.finalStatus).toBe("PRESENT");
  });

  it("permit menang bahkan atas koreksi", () => {
    const r = computeDailyFinalStatus(
      [CORR("PRESENT", "2026-07-21T03:00:00Z")],
      "SICK",
    );
    expect(r.finalStatus).toBe("SICK");
  });

  it("OUT mengisi lastOutAt (untuk deteksi pulang awal)", () => {
    const r = computeDailyFinalStatus(
      [IN("PRESENT", "2026-07-21T00:10:00Z"), OUT("2026-07-21T05:00:00Z")],
      null,
    );
    expect(r.lastOutAt).toEqual(t("2026-07-21T05:00:00Z"));
    expect(r.finalStatus).toBe("PRESENT");
  });
});
