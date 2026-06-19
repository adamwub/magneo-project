import type { z } from "zod";
import {
  loginRequestSchema,
  loginResponseSchema,
  jwtClaimsSchema,
  passwordChangeRequestSchema,
  parentRegisterRequestSchema,
  otpSentResponseSchema,
  parentVerifyOtpRequestSchema,
  tempTokenResponseSchema,
  parentLinkChildRequestSchema,
  linkChildResponseSchema,
  roleSwitchRequestSchema,
  tosAcceptRequestSchema,
  sessionSchema,
} from "../auth.js";
import {
  qrCheckinRequestSchema,
  qrCurrentResponseSchema,
  attendanceEventSchema,
  dailyAttendanceStatusSchema,
} from "../attendance.js";
import { deviceRegisterRequestSchema } from "../device.js";
import {
  permitCreateRequestSchema,
  permitDecisionRequestSchema,
  permitSchema,
} from "../permit.js";
import {
  announcementCreateRequestSchema,
  announcementSchema,
} from "../announcement.js";

/**
 * Daftar skema yang akan dijadikan kelas model Dart (ADR-004).
 * Tambahkan entri di sini saat sebuah skema perlu tersedia di aplikasi HP.
 */
export interface ModelEntry {
  dartName: string;
  schema: z.ZodTypeAny;
}

export const MODEL_REGISTRY: ModelEntry[] = [
  { dartName: "LoginRequest", schema: loginRequestSchema },
  { dartName: "LoginResponse", schema: loginResponseSchema },
  { dartName: "JwtClaims", schema: jwtClaimsSchema },
  { dartName: "QrCheckinRequest", schema: qrCheckinRequestSchema },
  { dartName: "AttendanceEvent", schema: attendanceEventSchema },
  { dartName: "DailyAttendanceStatus", schema: dailyAttendanceStatusSchema },
  // Fase 1 — alur HP: ganti password, registrasi ortu + OTP, link anak, role switch, ToS, sesi.
  { dartName: "PasswordChangeRequest", schema: passwordChangeRequestSchema },
  { dartName: "ParentRegisterRequest", schema: parentRegisterRequestSchema },
  { dartName: "OtpSentResponse", schema: otpSentResponseSchema },
  { dartName: "ParentVerifyOtpRequest", schema: parentVerifyOtpRequestSchema },
  { dartName: "TempTokenResponse", schema: tempTokenResponseSchema },
  { dartName: "ParentLinkChildRequest", schema: parentLinkChildRequestSchema },
  { dartName: "LinkChildResponse", schema: linkChildResponseSchema },
  { dartName: "RoleSwitchRequest", schema: roleSwitchRequestSchema },
  { dartName: "TosAcceptRequest", schema: tosAcceptRequestSchema },
  { dartName: "Session", schema: sessionSchema },
  // Fase 2 — layar HP: absen QR, registrasi device push, izin, pengumuman.
  { dartName: "QrCurrentResponse", schema: qrCurrentResponseSchema },
  { dartName: "DeviceRegisterRequest", schema: deviceRegisterRequestSchema },
  { dartName: "PermitCreateRequest", schema: permitCreateRequestSchema },
  { dartName: "PermitDecisionRequest", schema: permitDecisionRequestSchema },
  { dartName: "Permit", schema: permitSchema },
  { dartName: "AnnouncementCreateRequest", schema: announcementCreateRequestSchema },
  { dartName: "Announcement", schema: announcementSchema },
];
