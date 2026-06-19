/**
 * Adapter pengirim push (BAGIAN 11.2 / 12A.2). Seam agar pengiriman FCM nyata (firebase-admin)
 * tinggal dipasang saat owner menyediakan service account Firebase — tanpa mengubah pemanggil.
 *
 * Sekarang: `StubPushSender` (enabled=false) — TIDAK mengirim apa pun, hanya menandai notifikasi
 * "QUEUED" di log. Saat Firebase siap: tambah `FcmPushSender` (enabled=true) + sediakan via token ini.
 */

export const PUSH_SENDER = Symbol("PUSH_SENDER");

export interface PushMessage {
  tokens: string[];
  /** Kunci template lokalisasi (teks DIRAKIT di klien — tanpa PII di payload). */
  templateKey: string;
  /** Data ringkas non-PII (string→string), mis. { date, status }. */
  data: Record<string, string>;
}

export interface PushResult {
  sent: number;
  /** Token yang ditolak (mis. UNREGISTERED) → dicabut oleh pemanggil. */
  failedTokens: string[];
}

export interface PushSender {
  /** TRUE bila benar-benar mengirim (FCM aktif). FALSE = stub (belum ada kredensial). */
  readonly enabled: boolean;
  send(msg: PushMessage): Promise<PushResult>;
}

/** Stub: tidak mengirim; dipakai sebelum Firebase tersedia. */
export class StubPushSender implements PushSender {
  readonly enabled = false;
  async send(_msg: PushMessage): Promise<PushResult> {
    return { sent: 0, failedTokens: [] };
  }
}
