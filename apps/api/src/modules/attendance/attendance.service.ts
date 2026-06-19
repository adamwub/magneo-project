import { Inject, Injectable, HttpStatus } from "@nestjs/common";
import type { Redis } from "ioredis";
import {
  SCHOOL_SETTING_DEFAULTS,
  type QrCheckinRequest,
  type AttendanceEvent,
  type JwtClaims,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { apiError } from "../../common/api-error";
import { REDIS_CONNECTION_TOKEN } from "../../queue/queue.constants";
import { QrTokenService } from "./qr-token.service";
import { DailyStatusService } from "./daily-status.service";
import { isWithinRadius, isIpInAnyCidr, type GeoPoint } from "./location";
import { schoolLocalTime, presentOrLate } from "./school-time";

/** Bentuk longgar settings sekolah (kolom Json) — hanya field yang dipakai check-in. */
interface CheckinSettings {
  geo?: GeoPoint;
  wifi_cidrs?: string[];
  qr_geo_radius_m: number;
  late_cutoff: string;
}

/**
 * Absensi check-in QR (BAGIAN 10.2 & 12A.1) — potongan 2d.
 *
 * Alur: validasi token TOTP (2c) → validasi lokasi OR (geofence ATAU IP WiFi, 2b) →
 * double-event <5 mnt diabaikan diam-diam → anti-replay per (userId, step) → catat
 * AttendanceEvent IN (PRESENT/LATE). `occurredAt` = waktu SERVER (tak percaya klien).
 */
@Injectable()
export class AttendanceService {
  private static readonly DOUBLE_WINDOW_MS = 5 * 60 * 1000; // 10.2: double <5 mnt diabaikan
  private static readonly REPLAY_TTL_SEC = 90; // 12A.1: kunci anti-replay per (userId, step)

  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrTokenService,
    private readonly daily: DailyStatusService,
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis,
  ) {}

  /**
   * Check-in siswa. `clientIp` = `req.ip` (Express trust proxy=1) — JANGAN dari header mentah.
   * Mengembalikan event (baru atau, bila double <5 mnt, event terakhir secara idempoten).
   */
  async checkin(user: JwtClaims, dto: QrCheckinRequest, clientIp?: string): Promise<AttendanceEvent> {
    const schoolId = user.schoolId;
    if (!schoolId) {
      throw apiError("FORBIDDEN", "Akun tanpa sekolah tidak bisa absen.", HttpStatus.FORBIDDEN);
    }
    const studentUserId = user.sub;

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true, settings: true },
    });
    if (!school) throw apiError("NOT_FOUND", "Sekolah tidak ditemukan.", HttpStatus.NOT_FOUND);
    const settings = {
      ...SCHOOL_SETTING_DEFAULTS,
      ...(school.settings as Record<string, unknown>),
    } as unknown as CheckinSettings;

    // 1) Token TOTP valid? (step dipakai sebagai kunci anti-replay)
    const step = await this.qr.validateToken(schoolId, dto.qrToken);
    if (step === null) {
      throw apiError("ATTENDANCE_INVALID_TOKEN", "Token QR tidak valid atau kedaluwarsa.", HttpStatus.BAD_REQUEST);
    }

    // 2) Lokasi: geofence ATAU IP WiFi sekolah. Settings kosong → fail-closed.
    const geo = settings.geo;
    const cidrs = settings.wifi_cidrs ?? [];
    if (!geo && cidrs.length === 0) {
      throw apiError(
        "ATTENDANCE_LOCATION_REQUIRED",
        "Sekolah belum mengatur lokasi (GPS/WiFi). Hubungi admin.",
        HttpStatus.BAD_REQUEST,
      );
    }
    const radius = settings.qr_geo_radius_m ?? SCHOOL_SETTING_DEFAULTS.qr_geo_radius_m;
    const byGeo =
      !!geo &&
      dto.geoLat !== undefined &&
      dto.geoLng !== undefined &&
      isWithinRadius(geo, { lat: dto.geoLat, lng: dto.geoLng }, radius);
    const byIp = clientIp ? isIpInAnyCidr(clientIp, cidrs) : false;
    if (!byGeo && !byIp) {
      throw apiError("ATTENDANCE_OUT_OF_AREA", "Kamu sepertinya tidak berada di sekolah.", HttpStatus.FORBIDDEN);
    }

    const now = new Date();

    // 3) Double-event <5 mnt → sukses idempoten "silent" (tidak buat event baru). (10.2)
    const recent = await this.prisma.attendanceEvent.findFirst({
      where: {
        userId: studentUserId,
        schoolId,
        type: "IN",
        occurredAt: { gte: new Date(now.getTime() - AttendanceService.DOUBLE_WINDOW_MS) },
      },
      orderBy: { occurredAt: "desc" },
    });
    if (recent) return this.toDto(recent);

    // 4) Anti-replay: tiap (schoolId, userId, step) sekali pakai (Redis SET NX EX 90). (12A.1)
    const replayKey = `attreplay:${schoolId}:${studentUserId}:${step}`;
    const acquired = await this.redis.set(replayKey, "1", "EX", AttendanceService.REPLAY_TTL_SEC, "NX");
    if (acquired !== "OK") {
      throw apiError("ATTENDANCE_INVALID_TOKEN", "Token QR ini sudah dipakai.", HttpStatus.CONFLICT);
    }

    // 5) Status & tanggal dari waktu SERVER dikonversi ke timezone sekolah.
    const local = schoolLocalTime(now, school.timezone);
    const status = presentOrLate(local.hhmm, settings.late_cutoff);

    const event = await this.prisma.attendanceEvent.create({
      data: {
        userId: studentUserId,
        schoolId,
        date: local.date,
        type: "IN",
        method: "QR",
        status,
        occurredAt: now,
      },
    });

    // Materialisasi status harian tiap event masuk (BAGIAN 10.3).
    await this.daily.recompute(studentUserId, schoolId, local.date);
    return this.toDto(event);
  }

  /** Map baris AttendanceEvent → DTO shared (occurredAt ISO string). Tanpa PII anak. */
  private toDto(e: {
    id: string;
    userId: string;
    schoolId: string;
    date: string;
    type: string;
    method: string;
    status: string;
    occurredAt: Date;
  }): AttendanceEvent {
    return {
      id: e.id,
      userId: e.userId,
      schoolId: e.schoolId,
      date: e.date,
      type: e.type as AttendanceEvent["type"],
      method: e.method as AttendanceEvent["method"],
      status: e.status as AttendanceEvent["status"],
      occurredAt: e.occurredAt.toISOString(),
    };
  }
}
