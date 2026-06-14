import type { z } from "zod";
import { loginRequestSchema, loginResponseSchema, jwtClaimsSchema } from "../auth.js";
import {
  qrCheckinRequestSchema,
  attendanceEventSchema,
  dailyAttendanceStatusSchema,
} from "../attendance.js";

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
];
