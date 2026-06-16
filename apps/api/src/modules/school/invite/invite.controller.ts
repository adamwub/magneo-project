import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import {
  inviteCodeGenerateRequestSchema,
  type InviteCodeBatchResponse,
  type InviteCodeGenerateRequest,
  type InviteCode as InviteCodeDto,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { apiError } from "../../../common/api-error";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser } from "../../auth/current-user.decorator";
import { Roles } from "../../../common/rbac/roles.decorator";
import { Scope } from "../../../common/rbac/scope.decorator";
import { RolesGuard } from "../../../common/rbac/roles.guard";
import { InviteService } from "./invite.service";

/**
 * Endpoint kode undangan ortu (BAGIAN 8.2 /school/invite-codes).
 * Scope "school": admin hanya menyentuh sekolahnya (difilter di service).
 */
@Controller("school/invite-codes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InviteController {
  constructor(private readonly invites: InviteService) {}

  @Post("generate")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  generate(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(inviteCodeGenerateRequestSchema)) dto: InviteCodeGenerateRequest,
  ): Promise<InviteCodeBatchResponse> {
    return this.invites.generate(user.sub, this.schoolIdOf(user), dto);
  }

  @Post(":id/revoke")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  revoke(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<InviteCodeDto> {
    return this.invites.revoke(user.sub, this.schoolIdOf(user), id);
  }

  @Get("batch/:batchId")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  async batchPdf(
    @CurrentUser() user: JwtClaims,
    @Param("batchId") batchId: string,
  ): Promise<StreamableFile> {
    const pdf = await this.invites.getBatchPdf(this.schoolIdOf(user), batchId);
    return new StreamableFile(pdf, {
      type: "application/pdf",
      disposition: 'attachment; filename="undangan-ortu.pdf"',
    });
  }

  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun ini tidak terikat sekolah.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
