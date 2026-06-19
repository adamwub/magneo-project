import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";

/**
 * Modul notification (ADR-003 modular monolith).
 * Fase 2 — 2g: registrasi device push (`/me/devices`). Antrean `notifications` + pengiriman
 * FCM nyata (firebase-admin) + WA stub menyusul (butuh service account FCM dari owner).
 *
 * Mengimpor AuthModule untuk JwtAuthGuard. PrismaModule/RbacModule global (app.module).
 */
@Module({
  imports: [AuthModule],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class NotificationModule {}
