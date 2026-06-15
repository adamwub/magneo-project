import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createSchoolRequestSchema,
  pairBoxRequestSchema,
  type CreateSchoolRequest,
  type School,
  type PairBoxRequest,
  type PairBoxResponse,
  type AdminAccountResponse,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { Scope } from "../../common/rbac/scope.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { SchoolService } from "./school.service";

/**
 * Endpoint provisioning HQ (BAGIAN 8.2 `/hq/...`, matriks 7.4: hanya HQ).
 * Semua memakai scope "global" — hanya HQ_ADMIN/HQ_OPS yang lolos (ADR-005:
 * HQ tak boleh PII siswa, jadi tak ada scope sekolah/kelas di sini).
 */
@Controller("hq/schools")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("HQ_OPS", "HQ_ADMIN")
@Scope("global")
export class HqController {
  constructor(private readonly school: SchoolService) {}

  @Post()
  createSchool(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createSchoolRequestSchema)) dto: CreateSchoolRequest,
  ): Promise<School> {
    return this.school.createSchool(user, dto);
  }

  @Get()
  listSchools(): Promise<School[]> {
    return this.school.listSchools();
  }

  @Get(":id")
  getSchool(@Param("id") id: string): Promise<School> {
    return this.school.getSchool(id);
  }

  @Post(":id/pair-box")
  pairBox(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(pairBoxRequestSchema)) dto: PairBoxRequest,
  ): Promise<PairBoxResponse> {
    return this.school.pairBox(user, id, dto.boxSerial);
  }

  @Post(":id/admin-account")
  createAdminAccount(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
  ): Promise<AdminAccountResponse> {
    return this.school.createAdminAccount(user, id);
  }
}
