import { Injectable, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  TokenPair,
  PasswordChangeRequest,
  PasswordForgotRequest,
  PasswordResetRequest,
  TosAcceptRequest,
  SessionListResponse,
  OtpSentResponse,
  JwtClaims,
  Role,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env";
import { apiError } from "../../common/api-error";
import { hashPassword, verifyPassword, checkPasswordPolicy } from "./password";
import { generateRefreshToken, hashRefreshToken } from "./tokens";
import { OtpService } from "./otp/otp.service";

/** Aturan lockout (BAGIAN 7.2): gagal 5× → kunci 15 menit. */
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;
/** 423 Locked — tidak tersedia di enum HttpStatus Nest versi ini. */
const HTTP_LOCKED = 423;
/** Batas sesi aktif per perangkat (BAGIAN 7.2): siswa 2, peran lain 3. */
const DEVICE_LIMIT_STUDENT = 2;
const DEVICE_LIMIT_OTHER = 3;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly otp: OtpService,
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

    const { accessToken, refreshToken, evicted } = await this.issueSession(
      user,
      dto.deviceId,
      dto.deviceName,
    );
    return {
      accessToken,
      refreshToken,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      mustAcceptTos: await this.needsTos(user.id),
      sessionEvicted: evicted,
    };
  }

  /** POST /auth/refresh (BAGIAN 7.1) — rotating + reuse-detection. */
  async refresh(dto: RefreshRequest): Promise<TokenPair> {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
    });

    if (!session) {
      // Mungkin token lama yang sudah diputar lalu dipakai ulang → reuse-detection.
      const reused = await this.prisma.session.findFirst({
        where: { prevRefreshTokenHash: tokenHash },
      });
      if (reused) {
        // Indikasi pencurian: cabut SELURUH sesi user (BAGIAN 7.1).
        await this.prisma.session.updateMany({
          where: { userId: reused.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw apiError(
          "TOKEN_REUSE_DETECTED",
          "Aktivitas mencurigakan terdeteksi. Semua sesi diakhiri, silakan login lagi.",
          HttpStatus.UNAUTHORIZED,
        );
      }
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
        prevRefreshTokenHash: session.refreshTokenHash,
        expiresAt: this.refreshExpiry(),
      },
    });
    const accessToken = await this.signAccessToken(user, session.id, await this.getLinkRoles(user.id));
    return { accessToken, refreshToken: newRefresh };
  }

  /** POST /auth/logout — revoke sesi penerbit token ini (sid dari klaim). */
  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** POST /auth/role-switch (BAGIAN 7.1) — pindah ke akun peran lain milik orang yang sama. */
  async roleSwitch(current: JwtClaims, targetUserId: string): Promise<TokenPair> {
    const link = await this.prisma.userRoleLink.findFirst({
      where: {
        verifiedBy: { not: null },
        OR: [
          { primaryUserId: current.sub, linkedUserId: targetUserId },
          { primaryUserId: targetUserId, linkedUserId: current.sub },
        ],
      },
    });
    if (!link) {
      throw apiError("ROLE_SWITCH_NOT_ALLOWED", "Tidak ada akun peran tertaut yang cocok.", HttpStatus.FORBIDDEN);
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target || target.status === "INACTIVE" || target.deletedAt) {
      throw apiError("ROLE_SWITCH_NOT_ALLOWED", "Akun tujuan tidak tersedia.", HttpStatus.FORBIDDEN);
    }
    // Sesi baru pada perangkat yang sama dengan sesi saat ini.
    const currentSession = await this.prisma.session.findUnique({ where: { id: current.sid } });
    const { accessToken, refreshToken } = await this.issueSession(
      target,
      currentSession?.deviceId ?? "role-switch",
      currentSession?.deviceName ?? undefined,
    );
    return { accessToken, refreshToken };
  }

  /** GET /auth/sessions — daftar sesi aktif user (BAGIAN 8.2). */
  async listSessions(userId: string, currentSid: string): Promise<SessionListResponse> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        createdAt: s.createdAt.toISOString(),
        current: s.id === currentSid,
      })),
    };
  }

  /** DELETE /auth/sessions/:id — cabut sesi milik user sendiri (BAGIAN 8.2). */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const res = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (res.count === 0) {
      throw apiError("NOT_FOUND", "Sesi tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
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

  /** Peran dari akun lain milik orang yang sama (UserRoleLink terverifikasi) — untuk role switcher. */
  private async getLinkRoles(userId: string): Promise<Role[]> {
    const links = await this.prisma.userRoleLink.findMany({
      where: { verifiedBy: { not: null }, OR: [{ primaryUserId: userId }, { linkedUserId: userId }] },
    });
    const otherIds = links.map((l) => (l.primaryUserId === userId ? l.linkedUserId : l.primaryUserId));
    if (otherIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: otherIds }, deletedAt: null },
      select: { role: true },
    });
    return users.map((u) => u.role);
  }

  /**
   * Buat sesi + token, lalu tegakkan batas perangkat (cabut sesi tertua bila lewat).
   * @returns token + `evicted` (true bila ada sesi lama yang dicabut).
   */
  private async issueSession(
    user: User,
    deviceId: string,
    deviceName?: string,
  ): Promise<TokenPair & { evicted: boolean }> {
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
    const evicted = await this.enforceDeviceLimit(user.id, user.role);
    const accessToken = await this.signAccessToken(user, session.id, await this.getLinkRoles(user.id));
    return { accessToken, refreshToken, evicted };
  }

  /** Cabut sesi TERTUA yang melebihi batas perangkat (BAGIAN 7.2). @returns true bila ada yang dicabut. */
  private async enforceDeviceLimit(userId: string, role: Role): Promise<boolean> {
    const limit = role === "STUDENT" ? DEVICE_LIMIT_STUDENT : DEVICE_LIMIT_OTHER;
    const active = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (active.length <= limit) return false;
    const toRevoke = active.slice(0, active.length - limit).map((s) => s.id);
    await this.prisma.session.updateMany({
      where: { id: { in: toRevoke } },
      data: { revokedAt: new Date() },
    });
    return true;
  }

  // ── Reset password berbasis OTP (BAGIAN 7.2 — role DEWASA; siswa via admin) ──

  /**
   * POST /auth/password/forgot — kirim OTP ke phone/email bila akun dewasa ada.
   * Respons selalu seragam (tidak membocorkan keberadaan akun). Siswa (tanpa
   * phone/email) tak akan ketemu → tak ada OTP (reset siswa lewat admin sekolah).
   */
  async forgotPassword(dto: PasswordForgotRequest): Promise<OtpSentResponse> {
    const id = dto.phone ?? dto.email!;
    const user = await this.findAdultByContact(dto);
    if (user) {
      await this.otp.request("PASSWORD_RESET", id);
    }
    // Bila user tak ada: jangan terbitkan OTP, tapi balas seragam.
    return { expiresInSec: OtpService.TTL_SEC };
  }

  /**
   * POST /auth/password/reset — verifikasi OTP lalu set password baru.
   * Semua sesi dicabut (paksa login ulang dgn password baru). first-login selesai.
   */
  async resetPassword(dto: PasswordResetRequest): Promise<void> {
    const id = dto.phone ?? dto.email!;
    await this.otp.verify("PASSWORD_RESET", id, dto.otp);
    const user = await this.findAdultByContact(dto);
    if (!user) {
      // OTP valid tapi akun hilang (mis. dinonaktifkan) — tetap generik.
      throw apiError("OTP_INVALID", "Kode salah.", HttpStatus.BAD_REQUEST);
    }
    const policy = checkPasswordPolicy(dto.newPassword, [user.username, user.phone, user.email]);
    if (!policy.ok) {
      throw apiError("PASSWORD_POLICY", "Password baru tidak memenuhi syarat keamanan.", HttpStatus.BAD_REQUEST);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(dto.newPassword), mustChangePassword: false },
    });
    // Keamanan: cabut semua sesi aktif setelah ganti password.
    await this.prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Cari user DEWASA (punya phone/email) berdasar kontak. Null bila tak ada/nonaktif. */
  private async findAdultByContact(dto: { phone?: string; email?: string }): Promise<User | null> {
    const where = dto.phone ? { phone: dto.phone } : { email: dto.email! };
    return this.prisma.user.findFirst({ where: { ...where, deletedAt: null, status: { not: "INACTIVE" } } });
  }

  private async signAccessToken(user: User, sessionId: string, linkRoles: Role[]): Promise<string> {
    const claims: JwtClaims = {
      sub: user.id,
      sid: sessionId,
      role: user.role,
      schoolId: user.schoolId,
      scopes: [], // diisi sesuai kebijakan RBAC pada endpoint (1c).
      linkRoles,
    };
    return this.jwt.signAsync(claims, {
      secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
      expiresIn: this.config.get("JWT_ACCESS_TTL_SEC", { infer: true }),
    });
  }
}
