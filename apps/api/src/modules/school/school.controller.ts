import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  schoolSettingsSchema,
  classCreateRequestSchema,
  classUpdateRequestSchema,
  classPromoteRequestSchema,
  type SchoolSettings,
  type ClassCreateRequest,
  type ClassUpdateRequest,
  type Class as ClassDto,
  type ClassPromoteRequest,
  type ClassPromoteResult,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { apiError } from "../../common/api-error";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { Scope } from "../../common/rbac/scope.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { SchoolService } from "./school.service";

/**
 * Endpoint master data sekolah (BAGIAN 8.2 `/school/...`).
 * Scope "school": admin/kepsek hanya menyentuh sekolahnya sendiri (data difilter
 * di service ke `schoolId` pemanggil). Impor/kode undangan/consent/audit = 1f–1h.
 */
@Controller("school")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  // ── Setelan ───────────────────────────────────────────────────────────────

  @Get("settings")
  @Roles("SCHOOL_ADMIN", "PRINCIPAL")
  @Scope("school")
  getSettings(@CurrentUser() user: JwtClaims): Promise<SchoolSettings> {
    return this.school.getSettings(this.schoolIdOf(user));
  }

  @Put("settings")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  updateSettings(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(schoolSettingsSchema)) dto: SchoolSettings,
  ): Promise<SchoolSettings> {
    return this.school.updateSettings(user, this.schoolIdOf(user), dto);
  }

  // ── Kelas ───────────────────────────────────────────────────────────────

  @Post("classes")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  createClass(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(classCreateRequestSchema)) dto: ClassCreateRequest,
  ): Promise<ClassDto> {
    return this.school.createClass(user, this.schoolIdOf(user), dto);
  }

  @Get("classes")
  @Roles("SCHOOL_ADMIN", "PRINCIPAL", "TEACHER")
  @Scope("school")
  listClasses(
    @CurrentUser() user: JwtClaims,
    @Query("academicYear") academicYear?: string,
  ): Promise<ClassDto[]> {
    return this.school.listClasses(this.schoolIdOf(user), academicYear);
  }

  @Patch("classes/:id")
  @Roles("SCHOOL_ADMIN")
  @Scope("school", { param: "id", resource: "class" })
  updateClass(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(classUpdateRequestSchema)) dto: ClassUpdateRequest,
  ): Promise<ClassDto> {
    return this.school.updateClass(user, this.schoolIdOf(user), id, dto);
  }

  @Delete("classes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles("SCHOOL_ADMIN")
  @Scope("school", { param: "id", resource: "class" })
  async deleteClass(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<void> {
    await this.school.deleteClass(user, this.schoolIdOf(user), id);
  }

  @Post("classes/promote")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  promote(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(classPromoteRequestSchema)) dto: ClassPromoteRequest,
  ): Promise<ClassPromoteResult> {
    return this.school.promote(user, this.schoolIdOf(user), dto);
  }

  // ── internal ─────────────────────────────────────────────────────────────

  /** schoolId pemanggil dijamin terisi oleh scope guard; tegaskan untuk tipe & defense. */
  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun ini tidak terikat sekolah.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
