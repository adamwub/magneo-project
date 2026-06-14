import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";

/** Global agar semua modul bisa mencatat audit tanpa import berulang. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
