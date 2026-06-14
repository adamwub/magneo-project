import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  loginRequestSchema,
  refreshRequestSchema,
  passwordChangeRequestSchema,
  tosAcceptRequestSchema,
  type LoginRequest,
  type LoginResponse,
  type RefreshRequest,
  type TokenPair,
  type PasswordChangeRequest,
  type TosAcceptRequest,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";

/**
 * Endpoint auth (BAGIAN 8.2). Cakupan 1b: login, refresh, logout, ganti password,
 * setuju ToS. Lupa/reset password & alur ortu = 1g; role-switch & daftar sesi = 1d.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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

  @Post("tos/accept")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async acceptTos(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(tosAcceptRequestSchema)) dto: TosAcceptRequest,
  ): Promise<void> {
    await this.auth.acceptTos(user.sub, dto);
  }
}
