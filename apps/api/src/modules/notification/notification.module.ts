import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync } from "node:fs";
import type { Env } from "../../config/env";
import { AuthModule } from "../auth/auth.module";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { NotificationService } from "./notification.service";
import { PUSH_SENDER, StubPushSender, type PushSender } from "./push-sender";
import { FcmPushSender } from "./fcm-push-sender";

/**
 * Modul notification (ADR-003 modular monolith). 2g: device push. 2h: NotificationService
 * (dedup + log, payload tanpa PII).
 *
 * PUSH_SENDER dipilih saat boot: bila `FIREBASE_SERVICE_ACCOUNT_PATH` di-set & file ada →
 * `FcmPushSender` (kirim nyata); jika tidak → `StubPushSender` (aman, tercatat tak terkirim).
 * Jadi kredensial Firebase tinggal disediakan via env/vault tanpa ubah kode.
 */
const pushSenderProvider = {
  provide: PUSH_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): PushSender => {
    const path = config.get("FIREBASE_SERVICE_ACCOUNT_PATH", { infer: true });
    if (path && existsSync(path)) {
      try {
        return new FcmPushSender(path);
      } catch {
        // Kredensial rusak → jangan jatuhkan boot; mundur ke stub (notif tetap tercatat).
        return new StubPushSender();
      }
    }
    return new StubPushSender();
  },
};

@Module({
  imports: [AuthModule],
  controllers: [DeviceController],
  providers: [DeviceService, NotificationService, pushSenderProvider],
  exports: [DeviceService, NotificationService],
})
export class NotificationModule {}
