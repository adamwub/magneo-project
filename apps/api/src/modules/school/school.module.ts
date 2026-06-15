import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { HqController } from "./hq.controller";
import { SchoolController } from "./school.controller";
import { SchoolService } from "./school.service";

/**
 * Modul school (ADR-003 modular monolith) — Fase 1e: provisioning HQ, pairing Box,
 * akun admin, setelan, CRUD kelas, wizard kenaikan kelas. Impor XLSX/kode undangan/
 * consent/audit-log menyusul di 1f–1h.
 *
 * Mengimpor AuthModule untuk memakai JwtAuthGuard (autentikasi sebelum RolesGuard).
 * RbacModule & AuditModule bersifat global (lihat app.module).
 */
@Module({
  imports: [AuthModule],
  controllers: [HqController, SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
