import { Global, Module } from "@nestjs/common";
import { ScopeService } from "./scope.service";
import { RolesGuard } from "./roles.guard";

/**
 * Perkakas RBAC (BAGIAN 7.3) — global agar tiap modul bisa
 * `@UseGuards(JwtAuthGuard, RolesGuard)` + dekorator @Roles/@Scope.
 * AuditService disediakan AuditModule (juga global).
 */
@Global()
@Module({
  providers: [ScopeService, RolesGuard],
  exports: [ScopeService, RolesGuard],
})
export class RbacModule {}
