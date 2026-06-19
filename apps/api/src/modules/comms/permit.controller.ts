import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  permitCreateRequestSchema,
  permitDecisionRequestSchema,
  permitListQuerySchema,
  type PermitCreateRequest,
  type PermitDecisionRequest,
  type PermitListQuery,
  type Permit,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { PermitService } from "./permit.service";

/**
 * Izin/Permit (BAGIAN 8.2 `/permits`, rule 10.3 / 12A.3).
 * RBAC kasar di @Roles; otorisasi halus (ParentLink, wali kelas, sekolah-sama) di service.
 */
@Controller("permits")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermitController {
  constructor(private readonly permits: PermitService) {}

  /** POST /permits — ajukan izin (siswa untuk diri / ortu untuk anaknya). */
  @Post()
  @Roles("STUDENT", "PARENT")
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(permitCreateRequestSchema)) dto: PermitCreateRequest,
  ): Promise<Permit> {
    return this.permits.create(user, dto);
  }

  /** POST /permits/:id/decision — wali kelas / SCHOOL_ADMIN setujui/tolak. */
  @Post(":id/decision")
  @Roles("TEACHER", "SCHOOL_ADMIN")
  @HttpCode(HttpStatus.OK)
  decide(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(permitDecisionRequestSchema)) dto: PermitDecisionRequest,
  ): Promise<Permit> {
    return this.permits.decide(user, id, dto);
  }

  /** POST /permits/:id/cancel — pembuat batalkan (selama SUBMITTED). */
  @Post(":id/cancel")
  @Roles("STUDENT", "PARENT")
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<Permit> {
    return this.permits.cancel(user, id);
  }

  /** GET /permits?scope=me|class|child — daftar sesuai peran. */
  @Get()
  @Roles("STUDENT", "PARENT", "TEACHER", "SCHOOL_ADMIN")
  list(
    @CurrentUser() user: JwtClaims,
    @Query(new ZodValidationPipe(permitListQuerySchema)) q: PermitListQuery,
  ): Promise<Permit[]> {
    return this.permits.list(user, q);
  }
}
