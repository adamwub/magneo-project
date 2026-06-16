import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import {
  consentCreateRequestSchema,
  CONSENT_TYPES,
  type ConsentCreateRequest,
  type ConsentRecord,
  type ConsentType,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { apiError } from "../../../common/api-error";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser } from "../../auth/current-user.decorator";
import { Roles } from "../../../common/rbac/roles.decorator";
import { Scope } from "../../../common/rbac/scope.decorator";
import { RolesGuard } from "../../../common/rbac/roles.guard";
import { ConsentService } from "./consent.service";

/**
 * Endpoint arsip persetujuan (BAGIAN 8.2 /school/consents).
 * Scope "school": admin hanya menyentuh siswa sekolahnya (difilter di service).
 */
@Controller("school/consents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consents: ConsentService) {}

  @Post()
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  grant(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(consentCreateRequestSchema)) dto: ConsentCreateRequest,
  ): Promise<ConsentRecord> {
    return this.consents.grant(user.sub, this.schoolIdOf(user), dto);
  }

  @Get()
  @Roles("SCHOOL_ADMIN", "PRINCIPAL")
  @Scope("school")
  list(
    @CurrentUser() user: JwtClaims,
    @Query("subjectUserId") subjectUserId?: string,
    @Query("type") type?: string,
  ): Promise<ConsentRecord[]> {
    if (type && !(CONSENT_TYPES as readonly string[]).includes(type)) {
      throw apiError("VALIDATION_ERROR", "Jenis consent tidak dikenal.", HttpStatus.BAD_REQUEST);
    }
    return this.consents.list(this.schoolIdOf(user), {
      ...(subjectUserId ? { subjectUserId } : {}),
      ...(type ? { type: type as ConsentType } : {}),
    });
  }

  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun ini tidak terikat sekolah.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
