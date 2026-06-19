import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { NotificationService } from "./notification.service";
import { PUSH_SENDER, StubPushSender } from "./push-sender";

/**
 * Modul notification (ADR-003 modular monolith).
 * Fase 2 — 2g: registrasi device push (`/me/devices`). 2h (pondasi): NotificationService
 * (dedup + log, payload tanpa PII) dengan pengirim STUB. Pengiriman FCM nyata (firebase-admin)
 * + WA fallback menyusul saat owner menyediakan service account — cukup ganti provider PUSH_SENDER.
 *
 * Mengimpor AuthModule untuk JwtAuthGuard. PrismaModule/RbacModule/QueueModule(Redis) global.
 */
@Module({
  imports: [AuthModule],
  controllers: [DeviceController],
  providers: [DeviceService, NotificationService, { provide: PUSH_SENDER, useClass: StubPushSender }],
  exports: [DeviceService, NotificationService],
})
export class NotificationModule {}
