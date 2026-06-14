import { Injectable, type CanActivate, type ExecutionContext, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { jwtClaimsSchema, type JwtClaims } from "@magnoo/shared";
import type { Env } from "../../config/env";
import { apiError } from "../../common/api-error";

/** Request yang sudah memuat klaim user terverifikasi. */
export interface AuthedRequest extends Request {
  user: JwtClaims;
}

/**
 * Guard AUTENTIKASI (1b): memverifikasi access token (Bearer) dan menempelkan
 * klaim ke `request.user`. OTORISASI peran/scope (RBAC) ditangani guard terpisah
 * pada 1c — guard ini hanya memastikan "siapa" pemanggil, bukan "boleh apa".
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw apiError("UNAUTHORIZED", "Token tidak ada.", HttpStatus.UNAUTHORIZED);
    }

    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
      });
    } catch {
      throw apiError("TOKEN_EXPIRED", "Token tidak valid atau kedaluwarsa.", HttpStatus.UNAUTHORIZED);
    }

    const parsed = jwtClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      throw apiError("UNAUTHORIZED", "Token tidak valid.", HttpStatus.UNAUTHORIZED);
    }
    req.user = parsed.data;
    return true;
  }
}
