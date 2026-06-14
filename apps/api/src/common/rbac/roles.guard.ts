import { Injectable, type CanActivate, type ExecutionContext, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role, JwtClaims } from "@magnoo/shared";
import { apiError } from "../api-error";
import { AuditService } from "../audit/audit.service";
import { ROLES_KEY } from "./roles.decorator";
import { SCOPE_KEY, type ScopeMeta } from "./scope.decorator";
import { ScopeService } from "./scope.service";

interface AuthedRequest {
  user?: JwtClaims;
  ip?: string;
  method: string;
  originalUrl?: string;
  url: string;
}

/**
 * Guard OTORISASI (1c, BAGIAN 7.3): jalan SETELAH JwtAuthGuard.
 * Memvalidasi (a) peran via @Roles dan (b) scope resource via @Scope.
 * Pelanggaran → 403 FORBIDDEN + AuditLog (QA-1: IDOR antar scope = 403+audit).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopeService: ScopeService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const scopeMeta = this.reflector.getAllAndOverride<ScopeMeta | undefined>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Tidak ada aturan RBAC pada endpoint ini → biarkan lewat (autentikasi saja).
    if (!roles && !scopeMeta) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user) {
      // JwtAuthGuard belum jalan / token tak ada — perlakukan sebagai tak terotorisasi.
      throw apiError("UNAUTHORIZED", "Token tidak ada.", HttpStatus.UNAUTHORIZED);
    }

    if (roles && !roles.includes(user.role)) {
      await this.deny(user, req, "role", "*");
      throw apiError("FORBIDDEN", "Peran Anda tidak diizinkan.", HttpStatus.FORBIDDEN);
    }

    if (scopeMeta) {
      const result = await this.scopeService.check(scopeMeta, req as never, user);
      if (!result.allowed) {
        await this.deny(user, req, result.entity, result.entityId);
        throw apiError("FORBIDDEN", "Di luar jangkauan akses Anda.", HttpStatus.FORBIDDEN);
      }
    }

    return true;
  }

  private async deny(
    user: JwtClaims,
    req: AuthedRequest,
    entity: string,
    entityId: string,
  ): Promise<void> {
    await this.audit.write({
      actorUserId: user.sub,
      action: "RBAC_DENY",
      entity,
      entityId,
      after: { role: user.role, method: req.method, path: req.originalUrl ?? req.url },
      ip: req.ip ?? null,
    });
  }
}
