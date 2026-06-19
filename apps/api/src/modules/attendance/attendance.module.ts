import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AttendanceController } from "./attendance.controller";
import { QrTokenService } from "./qr-token.service";
import { AttendanceService } from "./attendance.service";
import { DailyStatusService } from "./daily-status.service";
import { CorrectionsService } from "./corrections.service";
import { AttendanceReadService } from "./attendance-read.service";

/**
 * Modul attendance (ADR-003 modular monolith).
 * Fase 2 — 2c: token QR server-side (secret TOTP terenkripsi per sekolah).
 * Check-in siswa, status harian, koreksi menyusul (2d–2f).
 *
 * Mengimpor AuthModule untuk JwtAuthGuard. PrismaModule/RbacModule global (app.module).
 * QrTokenService di-export agar modul check-in (2d) bisa memvalidasi token.
 */
@Module({
  imports: [AuthModule],
  controllers: [AttendanceController],
  providers: [QrTokenService, AttendanceService, DailyStatusService, CorrectionsService, AttendanceReadService],
  exports: [QrTokenService, AttendanceService, DailyStatusService],
})
export class AttendanceModule {}
