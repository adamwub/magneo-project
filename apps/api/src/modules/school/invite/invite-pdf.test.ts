import { describe, it, expect } from "vitest";
import { renderInvitePdf, type InviteCard } from "./invite-pdf";

function card(code: string): InviteCard {
  return { code, classLabel: "X-IPA-1", studentUserId: "abcdef12-3456", expiresAt: new Date("2026-12-31") };
}

describe("renderInvitePdf (Fase 1g)", () => {
  it("menghasilkan PDF valid (header %PDF) untuk beberapa kartu + QR", async () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`KODE${String(i).padStart(4, "0")}`));
    const pdf = await renderInvitePdf(cards, "SMA Contoh");
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("daftar kosong tetap menghasilkan PDF (tidak melempar)", async () => {
    const pdf = await renderInvitePdf([], "SMA Contoh");
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
