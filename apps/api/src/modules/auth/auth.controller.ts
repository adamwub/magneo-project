import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  loginRequestSchema,
  refreshRequestSchema,
  passwordChangeRequestSchema,
  passwordForgotRequestSchema,
  passwordResetRequestSchema,
  tosAcceptRequestSchema,
  roleSwitchRequestSchema,
  parentRegisterRequestSchema,
  parentVerifyOtpRequestSchema,
  parentLinkChildRequestSchema,
  type LoginRequest,
  type LoginResponse,
  type RefreshRequest,
  type TokenPair,
  type PasswordChangeRequest,
  type PasswordForgotRequest,
  type PasswordResetRequest,
  type TosAcceptRequest,
  type RoleSwitchRequest,
  type SessionListResponse,
  type OtpSentResponse,
  type ParentRegisterRequest,
  type ParentVerifyOtpRequest,
  type ParentLinkChildRequest,
  type TempTokenResponse,
  type LinkChildResponse,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { ParentService } from "./parent/parent.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";

/**
 * Endpoint auth (BAGIAN 8.2). Cakupan 1b: login, refresh, logout, ganti password,
 * setuju ToS. 1d: role-switch & daftar sesi. 1g: lupa/reset password (OTP) & alur
 * registrasi ortu (register → verify-otp → link-child).
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly parent: ParentService,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) dto: LoginRequest,
  ): Promise<LoginResponse> {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ZodValidationPipe(refreshRequestSchema)) dto: RefreshRequest,
  ): Promise<TokenPair> {
    return this.auth.refresh(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtClaims): Promise<void> {
    await this.auth.logout(user.sid);
  }

  @Post("password/change")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(passwordChangeRequestSchema)) dto: PasswordChangeRequest,
  ): Promise<void> {
    await this.auth.changePassword(user.sub, dto);
  }

  @Post("password/forgot")
  @HttpCode(HttpStatus.OK)
  forgotPassword(
    @Body(new ZodValidationPipe(passwordForgotRequestSchema)) dto: PasswordForgotRequest,
  ): Promise<OtpSentResponse> {
    return this.auth.forgotPassword(dto);
  }

  @Post("password/reset")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body(new ZodValidationPipe(passwordResetRequestSchema)) dto: PasswordResetRequest,
  ): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  // ── Registrasi ortu (BAGIAN 8.2 /auth/parent) ──────────────────────────────

  @Post("parent/register")
  @HttpCode(HttpStatus.OK)
  parentRegister(
    @Body(new ZodValidationPipe(parentRegisterRequestSchema)) dto: ParentRegisterRequest,
  ): Promise<OtpSentResponse> {
    return this.parent.register(dto);
  }

  @Post("parent/verify-otp")
  @HttpCode(HttpStatus.OK)
  parentVerifyOtp(
    @Body(new ZodValidationPipe(parentVerifyOtpRequestSchema)) dto: ParentVerifyOtpRequest,
  ): Promise<TempTokenResponse> {
    return this.parent.verifyOtp(dto);
  }

  /** Bearer = temp token (registrasi) ATAU access token ortu penuh — diverifikasi di service. */
  @Post("parent/link-child")
  @HttpCode(HttpStatus.OK)
  parentLinkChild(
    @Headers("authorization") authorization: string,
    @Body(new ZodValidationPipe(parentLinkChildRequestSchema)) dto: ParentLinkChildRequest,
  ): Promise<LinkChildResponse> {
    return this.parent.linkChild(authorization, dto.inviteCode);
  }

  @Post("tos/accept")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async acceptTos(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(tosAcceptRequestSchema)) dto: TosAcceptRequest,
  ): Promise<void> {
    await this.auth.acceptTos(user.sub, dto);
  }

  @Post("role-switch")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  roleSwitch(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(roleSwitchRequestSchema)) dto: RoleSwitchRequest,
  ): Promise<TokenPair> {
    return this.auth.roleSwitch(user, dto.targetUserId);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  listSessions(@CurrentUser() user: JwtClaims): Promise<SessionListResponse> {
    return this.auth.listSessions(user.sub, user.sid);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
  ): Promise<void> {
    await this.auth.revokeSession(user.sub, id);
  }
}
