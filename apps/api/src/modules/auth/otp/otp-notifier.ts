import { Injectable, Logger } from "@nestjs/common";

/**
 * Pengirim OTP (Fase 1g). Implementasi v1 = STUB yang hanya mencatat ke log
 * (BAGIAN 11.2: kanal WA/SMS = adapter, implementasi nyata fase lanjut, "selalu
 * cek biaya"). Saat WA/SMS sungguhan dibangun, ganti isi `send()` dengan adapter
 * NotifChannel dari NotificationModule — antarmuka ini tetap.
 */
@Injectable()
export class OtpNotifier {
  private readonly logger = new Logger(OtpNotifier.name);

  /** Kirim kode OTP ke nomor/identifier. Stub: catat ke log (TIDAK kirim nyata). */
  async send(identifier: string, code: string, purpose: string): Promise<void> {
    // Catatan: di produksi JANGAN log kode OTP. Stub dev sengaja menampilkannya
    // agar alur bisa diuji tanpa kanal WA/SMS nyata.
    this.logger.log(`[OTP-STUB] ${purpose} → ${identifier}: kode ${code}`);
  }
}
