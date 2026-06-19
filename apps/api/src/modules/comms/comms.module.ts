import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { PermitController } from "./permit.controller";
import { PermitService } from "./permit.service";
import { AnnouncementController } from "./announcement.controller";
import { AnnouncementService } from "./announcement.service";

/**
 * Modul comms (ADR-003 modular monolith).
 * Fase 2 — 2i: izin/permit (workflow + state machine). Pengumuman & thread menyusul (2j/2k).
 *
 * Mengimpor AuthModule (JwtAuthGuard) & AttendanceModule (DailyStatusService untuk recompute
 * status harian saat izin APPROVED). PrismaModule/RbacModule/AuditModule global (app.module).
 */
@Module({
  imports: [AuthModule, AttendanceModule],
  controllers: [PermitController, AnnouncementController],
  providers: [PermitService, AnnouncementService],
  exports: [PermitService, AnnouncementService],
})
export class CommsModule {}
