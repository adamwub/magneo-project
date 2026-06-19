import { describe, it, expect } from "vitest";
import { deviceRegisterRequestSchema } from "./device.js";
import { permitCreateRequestSchema, permitDecisionRequestSchema } from "./permit.js";
import { announcementCreateRequestSchema } from "./announcement.js";
import { qrCurrentResponseSchema } from "./attendance.js";
import { schoolSettingsSchema } from "./school.js";

describe("Fase 2 — skema shared", () => {
  it("device: terima token+platform valid, tolak platform asing", () => {
    expect(deviceRegisterRequestSchema.safeParse({ token: "abc", platform: "ANDROID" }).success).toBe(true);
    expect(deviceRegisterRequestSchema.safeParse({ token: "abc", platform: "WEB" }).success).toBe(false);
    expect(deviceRegisterRequestSchema.safeParse({ token: "", platform: "IOS" }).success).toBe(false);
  });

  it("permit create: tolak dateEnd < dateStart", () => {
    const base = { type: "SICK", note: "demam", dateStart: "2026-07-02", dateEnd: "2026-07-01" };
    expect(permitCreateRequestSchema.safeParse(base).success).toBe(false);
    expect(permitCreateRequestSchema.safeParse({ ...base, dateEnd: "2026-07-03" }).success).toBe(true);
  });

  it("permit decision: hanya APPROVE/REJECT", () => {
    expect(permitDecisionRequestSchema.safeParse({ decision: "APPROVE" }).success).toBe(true);
    expect(permitDecisionRequestSchema.safeParse({ decision: "MAYBE" }).success).toBe(false);
  });

  it("announcement create: scopeIds default kosong", () => {
    const parsed = announcementCreateRequestSchema.parse({ scope: "SCHOOL", title: "Libur", body: "Besok libur" });
    expect(parsed.scopeIds).toEqual([]);
    expect(announcementCreateRequestSchema.safeParse({ scope: "PLANET", title: "x", body: "y" }).success).toBe(false);
  });

  it("qr/current: tidak mengandung secret (hanya token/period/expiresInSec)", () => {
    const ok = qrCurrentResponseSchema.parse({ token: "12345678", period: 30, expiresInSec: 12 });
    expect(Object.keys(ok).sort()).toEqual(["expiresInSec", "period", "token"]);
  });

  it("school settings: geo & CIDR WiFi divalidasi (12A.1)", () => {
    expect(
      schoolSettingsSchema.safeParse({ geo: { lat: -7.25, lng: 112.75 }, wifi_cidrs: ["10.20.0.0/16"] }).success,
    ).toBe(true);
    expect(schoolSettingsSchema.safeParse({ geo: { lat: 200, lng: 0 } }).success).toBe(false);
    expect(schoolSettingsSchema.safeParse({ wifi_cidrs: ["not-a-cidr"] }).success).toBe(false);
  });
});
