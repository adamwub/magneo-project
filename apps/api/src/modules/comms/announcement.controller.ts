import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import {
  announcementCreateRequestSchema,
  type AnnouncementCreateRequest,
  type Announcement,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { AnnouncementService } from "./announcement.service";

/**
 * Pengumuman (BAGIAN 8.2 `/announcements`, rule 10.6 / 12A.4).
 * @Roles kasar; scope×role halus (kelas diampu, dll) ditegakkan di service.
 */
@Controller("announcements")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementController {
  constructor(private readonly ann: AnnouncementService) {}

  /** POST /announcements — buat pengumuman (scope×role ditegakkan service). */
  @Post()
  @Roles("TEACHER", "SCHOOL_ADMIN", "PRINCIPAL")
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(announcementCreateRequestSchema)) dto: AnnouncementCreateRequest,
  ): Promise<Announcement> {
    return this.ann.create(user, dto);
  }

  /** POST /announcements/:id/retract — tarik (≤15 menit). */
  @Post(":id/retract")
  @Roles("TEACHER", "SCHOOL_ADMIN", "PRINCIPAL")
  @HttpCode(HttpStatus.OK)
  retract(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<{ retracted: true }> {
    return this.ann.retract(user, id);
  }

  /** GET /announcements — pengumuman aktif yang relevan untuk pemanggil. */
  @Get()
  @Roles("STUDENT", "PARENT", "TEACHER", "SCHOOL_ADMIN", "PRINCIPAL")
  list(@CurrentUser() user: JwtClaims): Promise<Announcement[]> {
    return this.ann.listForUser(user);
  }
}
