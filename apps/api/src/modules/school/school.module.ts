import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { HqController } from "./hq.controller";
import { SchoolController } from "./school.controller";
import { SchoolService } from "./school.service";
import { ImportController } from "./import/import.controller";
import { ImportService } from "./import/import.service";
import { ImportWorker } from "./import/import.worker";

/**
 * Modul school (ADR-003 modular monolith) — Fase 1e: provisioning HQ, pairing Box,
 * akun admin, setelan, CRUD kelas, wizard kenaikan kelas. Fase 1f: impor XLSX siswa
 * (controller + service + worker antrean in-process). Kode undangan/consent = 1g–1h.
 *
 * Mengimpor AuthModule untuk memakai JwtAuthGuard (autentikasi sebelum RolesGuard).
 * RbacModule, AuditModule & QueueModule bersifat global (lihat app.module).
 */
@Module({
  imports: [AuthModule],
  controllers: [HqController, SchoolController, ImportController],
  providers: [SchoolService, ImportService, ImportWorker],
  exports: [SchoolService],
})
export class SchoolModule {}
