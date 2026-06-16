import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";

/** Data satu kartu undangan (TANPA nama siswa — ADR-005; nama via Box, Fase 3). */
export interface InviteCard {
  code: string;
  classLabel: string;
  studentUserId: string;
  expiresAt: Date;
}

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 28;
const COLS = 2;
const ROWS = 4; // 8 kartu per halaman
const GAP = 12;

function fmtDate(d: Date): string {
  // YYYY-MM-DD (sederhana, tanpa locale agar deterministik).
  return d.toISOString().slice(0, 10);
}

/**
 * Render PDF batch kartu undangan ortu (Fase 1g). Tiap kartu: kode undangan (besar),
 * QR kode undangan (untuk dipindai app ortu), label kelas, tanggal kadaluarsa, dan
 * ID siswa opaque (untuk dicocokkan admin — cloud tak punya nama siswa).
 */
export async function renderInvitePdf(cards: InviteCard[], schoolName: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const cardW = (A4.w - 2 * MARGIN - (COLS - 1) * GAP) / COLS;
  const cardH = (A4.h - 2 * MARGIN - (ROWS - 1) * GAP) / ROWS;
  const perPage = COLS * ROWS;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const idxOnPage = i % perPage;
    if (idxOnPage === 0) pdf.addPage([A4.w, A4.h]);
    const page = pdf.getPages()[pdf.getPageCount() - 1];

    const col = idxOnPage % COLS;
    const row = Math.floor(idxOnPage / COLS);
    const x = MARGIN + col * (cardW + GAP);
    // Baris dari atas ke bawah.
    const yTop = A4.h - MARGIN - row * (cardH + GAP);
    const yBottom = yTop - cardH;

    // Bingkai kartu.
    page.drawRectangle({
      x, y: yBottom, width: cardW, height: cardH,
      borderColor: rgb(0.06, 0.14, 0.23), borderWidth: 1,
    });

    const pad = 12;
    let cy = yTop - pad - 9;
    page.drawText(schoolName.slice(0, 40), { x: x + pad, y: cy, size: 9, font: bold, color: rgb(0.06, 0.14, 0.23) });
    cy -= 14;
    page.drawText("Undangan Orang Tua — Magnoo", { x: x + pad, y: cy, size: 8, font, color: rgb(0.3, 0.3, 0.3) });

    // QR (kanan atas).
    const qrPng = await QRCode.toBuffer(card.code, { width: 96, margin: 0 });
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = 72;
    page.drawImage(qrImg, { x: x + cardW - pad - qrSize, y: yTop - pad - qrSize, width: qrSize, height: qrSize });

    // Kode undangan (besar, kiri).
    cy -= 30;
    page.drawText("KODE:", { x: x + pad, y: cy, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    cy -= 22;
    page.drawText(card.code, { x: x + pad, y: cy, size: 22, font: bold, color: rgb(0.89, 0.22, 0.12) });

    // Detail bawah.
    cy = yBottom + pad + 26;
    page.drawText(`Kelas: ${card.classLabel}`, { x: x + pad, y: cy, size: 9, font });
    cy -= 13;
    page.drawText(`Berlaku s/d: ${fmtDate(card.expiresAt)}`, { x: x + pad, y: cy, size: 9, font });
    cy -= 13;
    page.drawText(`ID: ${card.studentUserId.slice(0, 8)}`, { x: x + pad, y: cy, size: 7, font, color: rgb(0.5, 0.5, 0.5) });
  }

  if (cards.length === 0) {
    const page = pdf.addPage([A4.w, A4.h]);
    page.drawText("Tidak ada kode undangan.", { x: MARGIN, y: A4.h - MARGIN - 20, size: 12, font });
  }

  return Buffer.from(await pdf.save());
}
