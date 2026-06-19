import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";
import type { QrCurrentResponse, JwtClaims } from "@magnoo/shared";
import { apiError } from "../../common/api-error";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { Scope } from "../../common/rbac/scope.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { QrTokenService } from "./qr-token.service";

/**
 * Endpoint absensi (BAGIAN 8.2 `/attendance/...`).
 * Fase 2 — 2c: tampilan token QR gerbang. Check-in siswa (2d) menyusul.
 */
@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly qr: QrTokenService) {}

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

  /** schoolId pemanggil; tolak akun tanpa sekolah (mis. HQ) — bukan operator gerbang. */
  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun tanpa sekolah tidak boleh menampilkan QR.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
