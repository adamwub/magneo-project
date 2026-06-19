import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import {
  qrCheckinRequestSchema,
  attendanceCorrectionRequestSchema,
  type QrCurrentResponse,
  type QrCheckinRequest,
  type AttendanceCorrectionRequest,
  type AttendanceEvent,
  type JwtClaims,
} from "@magnoo/shared";
import { apiError } from "../../common/api-error";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { Scope } from "../../common/rbac/scope.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { QrTokenService } from "./qr-token.service";
import { AttendanceService } from "./attendance.service";
import { CorrectionsService, type CorrectionResult } from "./corrections.service";

/**
 * Endpoint absensi (BAGIAN 8.2 `/attendance/...`).
 * Fase 2 — 2c: tampilan token QR gerbang. 2d: check-in siswa.
 */
@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly qr: QrTokenService,
    private readonly attendance: AttendanceService,
    private readonly corrections: CorrectionsService,
  ) {}

  /**
   * GET /attendance/qr/current — token QR berjalan untuk layar gerbang (12A.1).
   * Hanya operator gerbang sekolah: SCHOOL_ADMIN / TEACHER / PRINCIPAL. Secret TOTP
   * tidak pernah ikut; hanya token 8-digit + sisa detik rotasi.
   */
  @Get("qr/current")
  @Roles("SCHOOL_ADMIN", "TEACHER", "PRINCIPAL")
  @Scope("school")
  qrCurrent(@CurrentUser() user: JwtClaims): Promise<QrCurrentResponse> {
    return this.qr.current(this.schoolIdOf(user));
  }

  /**
   * POST /attendance/qr/checkin — siswa absen dengan scan QR (rule 10.2 / 12A.1).
   * Hanya STUDENT (untuk dirinya sendiri via JWT `sub`). `req.ip` (trust proxy=1) dipakai
   * validasi WiFi sekolah — bukan header XFF mentah. Server set `occurredAt`.
   */
  @Post("qr/checkin")
  @Roles("STUDENT")
  @HttpCode(HttpStatus.OK)
  qrCheckin(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(qrCheckinRequestSchema)) dto: QrCheckinRequest,
    @Req() req: Request,
  ): Promise<AttendanceEvent> {
    return this.attendance.checkin(user, dto, req.ip);
  }

  /**
   * POST /attendance/corrections — koreksi absen (rule 10.4). Wali kelas (≤H+3) / SCHOOL_ADMIN.
   * Membuat event CORRECTION, mencatat AuditLog before/after, lalu recompute status harian.
   */
  @Post("corrections")
  @Roles("TEACHER", "SCHOOL_ADMIN")
  @HttpCode(HttpStatus.OK)
  correct(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(attendanceCorrectionRequestSchema)) dto: AttendanceCorrectionRequest,
  ): Promise<CorrectionResult> {
    return this.corrections.correct(user, dto);
  }

  /** schoolId pemanggil; tolak akun tanpa sekolah (mis. HQ) — bukan operator gerbang. */
  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun tanpa sekolah tidak boleh menampilkan QR.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
