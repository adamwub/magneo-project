import { describe, it, expect } from "vitest";
import { schoolLocalTime, presentOrLate } from "./school-time";

describe("schoolLocalTime (konversi ke timezone sekolah)", () => {
  it("UTC → Asia/Jakarta (UTC+7): jam & tanggal benar", () => {
    const r = schoolLocalTime(new Date("2026-07-21T00:30:00Z"), "Asia/Jakarta");
    expect(r.date).toBe("2026-07-21");
    expect(r.hhmm).toBe("07:30");
  });

  it("melewati batas hari (malam UTC → besok pagi WIB)", () => {
    const r = schoolLocalTime(new Date("2026-07-21T20:00:00Z"), "Asia/Jakarta");
    expect(r.date).toBe("2026-07-22");
    expect(r.hhmm).toBe("03:00");
  });

  it("WITA (UTC+8) berbeda dari WIB", () => {
    const r = schoolLocalTime(new Date("2026-07-21T00:30:00Z"), "Asia/Makassar");
    expect(r.hhmm).toBe("08:30");
  });
});

describe("presentOrLate (10.2)", () => {
  it("sebelum/di cutoff = PRESENT, sesudah = LATE", () => {
    expect(presentOrLate("06:59", "07:15")).toBe("PRESENT");
    expect(presentOrLate("07:15", "07:15")).toBe("PRESENT"); // tepat cutoff = masih hadir
    expect(presentOrLate("07:16", "07:15")).toBe("LATE");
    expect(presentOrLate("09:00", "07:15")).toBe("LATE");
  });
});
