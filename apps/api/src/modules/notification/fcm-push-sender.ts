import { readFileSync } from "node:fs";
import * as admin from "firebase-admin";
import type { PushSender, PushMessage, PushResult } from "./push-sender";

/**
 * Pengirim push FCM nyata (firebase-admin) — BAGIAN 11.2 / 12A.2.
 * Dibuat HANYA bila service account tersedia (lihat factory di notification.module).
 * Service account dibaca dari path env (vault/luar repo) — tak pernah di-commit (13.11).
 *
 * Pesan = DATA-only (`templateKey` + data non-PII) → teks DIRAKIT di klien (13.2),
 * server tak pernah menaruh nama anak. Token mati (UNREGISTERED/invalid) dikembalikan
 * agar pemanggil mencabutnya; error transien TIDAK mencabut token.
 */
export class FcmPushSender implements PushSender {
  readonly enabled = true;
  private readonly app: admin.app.App;

  constructor(serviceAccountPath: string) {
    const sa = JSON.parse(readFileSync(serviceAccountPath, "utf8")) as admin.ServiceAccount;
    // Named app agar tak bentrok bila firebase-admin diinisialisasi di tempat lain.
    this.app =
      admin.apps.find((a) => a?.name === "magneo-fcm") ??
      admin.initializeApp({ credential: admin.credential.cert(sa) }, "magneo-fcm");
  }

  async send(msg: PushMessage): Promise<PushResult> {
    if (msg.tokens.length === 0) return { sent: 0, failedTokens: [] };
    const res = await admin.messaging(this.app).sendEachForMulticast({
      tokens: msg.tokens,
      // DATA-only: tanpa blok `notification` berisi teks (teks dirakit klien via templateKey).
      data: { ...msg.data, templateKey: msg.templateKey },
    });
    const failedTokens: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        // Cabut HANYA token yang benar-benar mati — bukan error transien (kuota/jaringan).
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          failedTokens.push(msg.tokens[i]);
        }
      }
    });
    return { sent: res.successCount, failedTokens };
  }
}
