import { z } from "zod";
import { ROLES, LINK_STATUSES } from "./enums.js";

/** OTP WA/SMS — 6 digit (BAGIAN 7.2). */
const otpSchema = z.string().regex(/^\d{6}$/, "OTP harus 6 digit angka.");
/** Kode undangan ortu — 8 karakter alfanumerik huruf besar (BAGIAN 6.1 InviteCode). */
const inviteCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{8}$/, "Kode undangan harus 8 karakter (huruf besar/angka).");

/**
 * Skema auth (BAGIAN 7 & 8.2 aplikasi.md).
 * Catatan privasi: skema ini TIDAK memuat PII siswa (ADR-005). `displayName` hanya untuk dewasa.
 */

/**
 * POST /auth/login — {username|phone|email, password, deviceId, deviceName}.
 * `schoolId` dipakai saat login siswa (identifier = username/NIS): aplikasi HP siswa
 * terikat pada satu sekolah, sehingga NIS dicocokkan dalam lingkup sekolah tsb
 * (username siswa unik per sekolah, BAGIAN 6.1). Dewasa pakai phone/email global.
 */
export const loginRequestSchema = z
  .object({
    username: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    schoolId: z.string().min(1).optional(),
    password: z.string().min(1),
    deviceId: z.string().min(1),
    deviceName: z.string().optional(),
  })
  .refine(
    (v) => [v.username, v.phone, v.email].filter(Boolean).length === 1,
    { message: "Tepat satu dari username/phone/email harus diisi." },
  );
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Pasangan token hasil login/refresh. Access token 1 jam, refresh 30 hari (BAGIAN 7.1). */
export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokenPair = z.infer<typeof tokenPairSchema>;

/**
 * Respons login. First-login wajib ganti password DAN setujui ToS (BAGIAN 7.2),
 * jadi klien diberi tahu lewat dua flag ini sebelum mengizinkan akses penuh.
 */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  role: z.enum(ROLES),
  mustChangePassword: z.boolean(),
  mustAcceptTos: z.boolean(),
  /**
   * true bila login ini melampaui batas perangkat sehingga sesi TERTUA dicabut
   * (BAGIAN 7.2: "beri tahu user"). Klien menampilkan info ke perangkat baru.
   */
  sessionEvicted: z.boolean(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** POST /auth/refresh */
export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/** POST /auth/password/change — {old, new}. Policy min 8 (BAGIAN 7.2). */
export const passwordChangeRequestSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type PasswordChangeRequest = z.infer<typeof passwordChangeRequestSchema>;

/**
 * Klaim JWT access token (BAGIAN 7.1).
 * `sid` = id sesi penerbit token, dipakai untuk "logout sesi ini" (BAGIAN 8.2).
 */
export const jwtClaimsSchema = z.object({
  sub: z.string(),
  sid: z.string(),
  role: z.enum(ROLES),
  schoolId: z.string().nullable(),
  scopes: z.array(z.string()),
  linkRoles: z.array(z.enum(ROLES)),
});
export type JwtClaims = z.infer<typeof jwtClaimsSchema>;

/**
 * POST /auth/password/forgot — {phone|email} → OTP.
 * Hanya untuk role dewasa; reset password siswa lewat admin sekolah (BAGIAN 7.2).
 */
export const passwordForgotRequestSchema = z
  .object({
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((v) => [v.phone, v.email].filter(Boolean).length === 1, {
    message: "Tepat satu dari phone/email harus diisi.",
  });
export type PasswordForgotRequest = z.infer<typeof passwordForgotRequestSchema>;

/** POST /auth/password/reset — {phone|email, otp, newPassword}. Policy min 8 (BAGIAN 7.2). */
export const passwordResetRequestSchema = z
  .object({
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    otp: otpSchema,
    newPassword: z.string().min(8),
  })
  .refine((v) => [v.phone, v.email].filter(Boolean).length === 1, {
    message: "Tepat satu dari phone/email harus diisi.",
  });
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

/** POST /auth/parent/register — {phone} → kirim OTP (BAGIAN 8.2). */
export const parentRegisterRequestSchema = z.object({
  phone: z.string().min(1),
});
export type ParentRegisterRequest = z.infer<typeof parentRegisterRequestSchema>;

/** Respons setelah OTP dikirim — tidak membocorkan keberadaan akun. */
export const otpSentResponseSchema = z.object({
  expiresInSec: z.number().int().positive(),
});
export type OtpSentResponse = z.infer<typeof otpSentResponseSchema>;

/** POST /auth/parent/verify-otp — {phone, otp} → temp token (BAGIAN 8.2). */
export const parentVerifyOtpRequestSchema = z.object({
  phone: z.string().min(1),
  otp: otpSchema,
});
export type ParentVerifyOtpRequest = z.infer<typeof parentVerifyOtpRequestSchema>;

/** Token sementara untuk menyelesaikan registrasi ortu (link-child). */
export const tempTokenResponseSchema = z.object({
  tempToken: z.string(),
  expiresInSec: z.number().int().positive(),
});
export type TempTokenResponse = z.infer<typeof tempTokenResponseSchema>;

/** POST /auth/parent/link-child — {inviteCode} [PARENT temp/full] (BAGIAN 8.2). */
export const parentLinkChildRequestSchema = z.object({
  inviteCode: inviteCodeSchema,
});
export type ParentLinkChildRequest = z.infer<typeof parentLinkChildRequestSchema>;

/** Respons link-child — tanpa PII siswa (ADR-005): hanya userId + status tautan. */
export const linkChildResponseSchema = z.object({
  studentUserId: z.string(),
  status: z.enum(LINK_STATUSES),
});
export type LinkChildResponse = z.infer<typeof linkChildResponseSchema>;

/** POST /auth/role-switch — {targetUserId} dari linkRoles (BAGIAN 7.1). */
export const roleSwitchRequestSchema = z.object({
  targetUserId: z.string().min(1),
});
export type RoleSwitchRequest = z.infer<typeof roleSwitchRequestSchema>;

/**
 * First-login: setujui ToS sesuai role (versi pelajar untuk siswa) (BAGIAN 7.2).
 * docVersion = versi dokumen yang ditampilkan & disetujui.
 */
export const tosAcceptRequestSchema = z.object({
  docVersion: z.string().min(1),
});
export type TosAcceptRequest = z.infer<typeof tosAcceptRequestSchema>;

/** Satu sesi aktif (GET /auth/sessions). Tanpa token mentah — hanya metadata perangkat. */
export const sessionSchema = z.object({
  id: z.string(),
  deviceName: z.string().nullable(),
  createdAt: z.string(),
  current: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSchema),
});
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;
