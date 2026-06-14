import { Injectable } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  TokenPair,
  PasswordChangeRequest,
  TosAcceptRequest,
  JwtClaims,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env";
import { apiError } from "../../common/api-error";
import { hashPassword, verifyPassword, checkPasswordPolicy } from "./password";
import { generateRefreshToken, hashRefreshToken } from "./tokens";

/** Aturan lockout (BAGIAN 7.2): gagal 5× → kunci 15 menit. */
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;
/** 423 Locked — tidak tersedia di enum HttpStatus Nest versi ini. */
const HTTP_LOCKED = 423;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** POST /auth/login (BAGIAN 7.2). Pesan error tidak membedakan user vs password. */
  async login(dto: LoginRequest): Promise<LoginResponse> {
    const user = await this.findLoginUser(dto);

    // Generic: jangan bocorkan apakah user ada (BAGIAN 7.2).
    if (!user || user.status === "INACTIVE" || user.deletedAt) {
      throw apiError("INVALID_CREDENTIALS", "Login gagal.", HttpStatus.UNAUTHORIZED);
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw apiError(
        "ACCOUNT_LOCKED",
        "Akun terkunci sementara karena terlalu banyak percobaan.",
        HTTP_LOCKED,
      );
    }

    const passwordOk = await verifyPassword(user.passwordHash, dto.password);
    if (!passwordOk) {
      await this.registerFailedLogin(user);
      throw apiError("INVALID_CREDENTIALS", "Login gagal.", HttpStatus.UNAUTHORIZED);
    }

    // Sukses: reset penghitung gagal & kunci.
    if (user.failedLoginCount !== 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    const { accessToken, refreshToken } = await this.issueSession(user, dto.deviceId, dto.deviceName);
    return {
      accessToken,
      refreshToken,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      mustAcceptTos: await this.needsTos(user.id),
    };
  }

  /** POST /auth/refresh (BAGIAN 7.1) — rotating: terbitkan token baru, ganti hash sesi. */
  async refresh(dto: RefreshRequest): Promise<TokenPair> {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
    });
    if (!session) {
      throw apiError("UNAUTHORIZED", "Sesi tidak valid.", HttpStatus.UNAUTHORIZED);
    }
    const now = new Date();
    if (session.expiresAt <= now) {
      throw apiError("TOKEN_EXPIRED", "Sesi kedaluwarsa, silakan login lagi.", HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status === "INACTIVE" || user.deletedAt) {
      throw apiError("UNAUTHORIZED", "Sesi tidak valid.", HttpStatus.UNAUTHORIZED);
    }

    const newRefresh = generateRefreshToken();
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashRefreshToken(newRefresh),
        expiresAt: this.refreshExpiry(),
      },
    });
    const accessToken = await this.signAccessToken(user, session.id);
    return { accessToken, refreshToken: newRefresh };
  }

  /** POST /auth/logout — revoke sesi penerbit token ini (sid dari klaim). */
  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** POST /auth/password/change (BAGIAN 7.2). */
  async changePassword(userId: string, dto: PasswordChangeRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw apiError("UNAUTHORIZED", "Sesi tidak valid.", HttpStatus.UNAUTHORIZED);
    }
    const oldOk = await verifyPassword(user.passwordHash, dto.oldPassword);
    if (!oldOk) {
      throw apiError("INVALID_CREDENTIALS", "Password lama salah.", HttpStatus.UNAUTHORIZED);
    }
    const policy = checkPasswordPolicy(dto.newPassword, [user.username, user.phone, user.email]);
    if (!policy.ok) {
      throw apiError(
        "PASSWORD_POLICY",
        "Password baru tidak memenuhi syarat keamanan.",
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(dto.newPassword), mustChangePassword: false },
    });
  }

  /** POST /auth/tos/accept — first-login: setujui ToS sesuai role (BAGIAN 7.2). */
  async acceptTos(userId: string, dto: TosAcceptRequest): Promise<void> {
    await this.prisma.consentRecord.create({
      data: {
        subjectUserId: userId,
        type: "TOS",
        docVersion: dto.docVersion,
        grantedAt: new Date(),
      },
    });
  }

  // ── internal ───────────────────────────────────────────────────────────────

  private async findLoginUser(dto: LoginRequest): Promise<User | null> {
    if (dto.username) {
      // Siswa: NIS (username) unik per sekolah → butuh schoolId.
      if (!dto.schoolId) return null;
      return this.prisma.user.findFirst({
        where: { schoolId: dto.schoolId, username: dto.username, deletedAt: null },
      });
    }
    if (dto.phone) {
      return this.prisma.user.findFirst({ where: { phone: dto.phone, deletedAt: null } });
    }
    if (dto.email) {
      return this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    }
    return null;
  }

  private async registerFailedLogin(user: User): Promise<void> {
    const failed = user.failedLoginCount + 1;
    if (failed >= LOCK_THRESHOLD) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil },
      });
      return;
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failed },
    });
  }

  private async needsTos(userId: string): Promise<boolean> {
    const tos = await this.prisma.consentRecord.findFirst({
      where: { subjectUserId: userId, type: "TOS", revokedAt: null },
    });
    return tos === null;
  }

  private refreshExpiry(): Date {
    const ttl = this.config.get("JWT_REFRESH_TTL_SEC", { infer: true });
    return new Date(Date.now() + ttl * 1000);
  }

  private async issueSession(
    user: User,
    deviceId: string,
    deviceName?: string,
  ): Promise<TokenPair> {
    const refreshToken = generateRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceId,
        deviceName: deviceName ?? null,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });
    const accessToken = await this.signAccessToken(user, session.id);
    return { accessToken, refreshToken };
  }

  private async signAccessToken(user: User, sessionId: string): Promise<string> {
    const claims: JwtClaims = {
      sub: user.id,
      sid: sessionId,
      role: user.role,
      schoolId: user.schoolId,
      scopes: [], // diisi sesuai kebijakan RBAC pada 1c.
      linkRoles: [], // diisi role switcher pada 1d.
    };
    return this.jwt.signAsync(claims, {
      secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
      expiresIn: this.config.get("JWT_ACCESS_TTL_SEC", { infer: true }),
    });
  }
}
