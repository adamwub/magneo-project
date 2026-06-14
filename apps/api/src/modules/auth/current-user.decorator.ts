import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtClaims } from "@magnoo/shared";
import type { AuthedRequest } from "./jwt-auth.guard";

/**
 * Ambil klaim user terverifikasi dari request (diisi oleh JwtAuthGuard).
 * Pakai pada controller: `@CurrentUser() user: JwtClaims`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtClaims => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user;
  },
);
