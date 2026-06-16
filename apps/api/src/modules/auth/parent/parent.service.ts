import { Injectable, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import {
  jwtClaimsSchema,
  type LinkChildResponse,
  type OtpSentResponse,
  type ParentRegisterRequest,
  type ParentVerifyOtpRequest,
  type TempTokenResponse,
} from "@magnoo/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import type { Env } from "../../../config/env";
import { apiError } from "../../../common/api-error";
import { AuditService } from "../../../common/audit/audit.service";
import { hashPassword } from "../password";
import { OtpService } from "../otp/otp.service";

/** Konteks pemanggil link-child: registrasi (temp token, baru punya phone) ATAU ortu penuh. */
type LinkContext = { kind: "temp"; phone: string } | { kind: "full"; parentUserId: string };

/**
 * Registrasi ortu + tautan anak (Fase 1g, BAGIAN 7.2 & 8.2 /auth/parent).
 *
 * Alur: register {phone} → OTP (Redis, stub log) → verify-otp → TEMP TOKEN (bukti
 * kepemilikan nomor) → link-child {inviteCode} (pakai temp token ATAU token ortu
 * penuh untuk menautkan anak berikutnya). Tanpa PII siswa di respons (ADR-005):
 * link-child hanya mengembalikan studentUserId + status tautan.
 */
@Injectable()
export class ParentService {
  /** Masa berlaku temp token (cukup untuk menyelesaikan link-child). */
  static readonly TEMP_TOKEN_TTL_SEC = 15 * 60;
  /** Penanda payload temp token agar tak bisa dipakai sebagai access token biasa. */
  private static readonly TEMP_PURPOSE = "PARENT_LINK";

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly otp: OtpService,
    private readonly audit: AuditService,
  ) {}

  /** POST /auth/parent/register — kirim OTP ke nomor (tak bocorkan keberadaan akun). */
  async register(dto: ParentRegisterRequest): Promise<OtpSentResponse> {
    return this.otp.request("PARENT_REGISTER", dto.phone);
  }

  /** POST /auth/parent/verify-otp — verifikasi OTP → temp token untuk link-child. */
  async verifyOtp(dto: ParentVerifyOtpRequest): Promise<TempTokenResponse> {
    await this.otp.verify("PARENT_REGISTER", dto.phone, dto.otp);
    const tempToken = await this.jwt.signAsync(
      { purpose: ParentService.TEMP_PURPOSE, phone: dto.phone },
      {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: ParentService.TEMP_TOKEN_TTL_SEC,
      },
    );
    return { tempToken, expiresInSec: ParentService.TEMP_TOKEN_TTL_SEC };
  }

  /**
   * POST /auth/parent/link-child — validasi kode undangan lalu tautkan ortu↔anak.
   * Menerima Bearer berupa temp token (registrasi) ATAU access token ortu penuh.
   */
  async linkChild(bearer: string, inviteCode: string): Promise<LinkChildResponse> {
    const ctx = await this.resolveContext(bearer);

    const invite = await this.prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite) throw apiError("INVITE_CODE_INVALID", "Kode undangan tidak dikenali.", HttpStatus.BAD_REQUEST);
    if (invite.revokedAt) throw apiError("INVITE_CODE_REVOKED", "Kode undangan sudah dibatalkan.", HttpStatus.BAD_REQUEST);
    if (invite.usedAt) throw apiError("INVITE_CODE_USED", "Kode undangan sudah dipakai.", HttpStatus.BAD_REQUEST);
    if (invite.expiresAt.getTime() < Date.now()) {
      throw apiError("INVITE_CODE_EXPIRED", "Kode undangan sudah kedaluwarsa.", HttpStatus.BAD_REQUEST);
    }

    const student = await this.prisma.user.findFirst({
      where: { id: invite.studentUserId, role: "STUDENT", deletedAt: null },
    });
    if (!student) throw apiError("INVITE_CODE_INVALID", "Kode undangan tidak dikenali.", HttpStatus.BAD_REQUEST);

    const parentUserId = await this.resolveParentUserId(ctx, student.schoolId);

    const existing = await this.prisma.parentLink.findUnique({
      where: { parentUserId_studentUserId: { parentUserId, studentUserId: student.id } },
    });
    if (existing) {
      throw apiError("PARENT_ALREADY_LINKED", "Anda sudah tertaut dengan siswa ini.", HttpStatus.CONFLICT);
    }

    // Tautkan + tandai kode terpakai dalam satu transaksi (idempotensi kode sekali-pakai).
    await this.prisma.$transaction([
      this.prisma.parentLink.create({
        data: { parentUserId, studentUserId: student.id, inviteCodeId: invite.id, status: "ACTIVE" },
      }),
      this.prisma.inviteCode.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ]);
    await this.audit.write({
      actorUserId: parentUserId,
      action: "PARENT_LINK_CHILD",
      entity: "parentLink",
      entityId: invite.id,
      after: { studentUserId: student.id },
    });
    return { studentUserId: student.id, status: "ACTIVE" };
  }

  /** Verifikasi Bearer → konteks (temp/full). 401 bila bukan keduanya. */
  private async resolveContext(bearer: string): Promise<LinkContext> {
    const [scheme, token] = (bearer ?? "").split(" ");
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
    // Ortu penuh (access token sah dengan role PARENT)?
    const claims = jwtClaimsSchema.safeParse(payload);
    if (claims.success && claims.data.role === "PARENT") {
      return { kind: "full", parentUserId: claims.data.sub };
    }
    // Temp token registrasi?
    const p = payload as { purpose?: string; phone?: string };
    if (p?.purpose === ParentService.TEMP_PURPOSE && typeof p.phone === "string") {
      return { kind: "temp", phone: p.phone };
    }
    throw apiError("UNAUTHORIZED", "Token tidak berlaku untuk tautan anak.", HttpStatus.UNAUTHORIZED);
  }

  /** Untuk full: pakai id-nya. Untuk temp: buat/temukan akun ortu by phone. */
  private async resolveParentUserId(ctx: LinkContext, childSchoolId: string | null): Promise<string> {
    if (ctx.kind === "full") return ctx.parentUserId;

    const found = await this.prisma.user.findFirst({
      where: { phone: ctx.phone, role: "PARENT", deletedAt: null },
    });
    if (found) return found.id;

    // Akun ortu baru: password acak placeholder (tak terpakai) — ortu menetapkan
    // password sendiri lewat /auth/password/forgot+reset (OTP). mustChangePassword=true.
    const parent = await this.prisma.user.create({
      data: {
        schoolId: childSchoolId,
        role: "PARENT",
        username: ctx.phone,
        phone: ctx.phone,
        passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    return parent.id;
  }
}
