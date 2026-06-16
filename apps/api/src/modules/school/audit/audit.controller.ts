import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";
import type { AuditLogEntry, AuditLogQuery, JwtClaims } from "@magnoo/shared";
import { apiError } from "../../../common/api-error";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser } from "../../auth/current-user.decorator";
import { Roles } from "../../../common/rbac/roles.decorator";
import { Scope } from "../../../common/rbac/scope.decorator";
import { RolesGuard } from "../../../common/rbac/roles.guard";
import { AuditReadService } from "./audit-read.service";

/**
 * Endpoint baca audit log sekolah (BAGIAN 8.2 GET /school/audit-log).
 * Hanya SCHOOL_ADMIN; ter-scope ke sekolah pemanggil (difilter di service).
 */
@Controller("school/audit-log")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditRead: AuditReadService) {}

  @Get()
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  list(
    @CurrentUser() user: JwtClaims,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
    @Query("entity") entity?: string,
  ): Promise<AuditLogEntry[]> {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun ini tidak terikat sekolah.", HttpStatus.FORBIDDEN);
    }
    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        throw apiError("VALIDATION_ERROR", "limit harus bilangan bulat ≥ 1.", HttpStatus.BAD_REQUEST);
      }
    }
    const query: AuditLogQuery = {
      ...(cursor ? { cursor } : {}),
      ...(parsedLimit !== undefined ? { limit: parsedLimit } : {}),
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    };
    return this.auditRead.list(user.schoolId, query);
  }
}
