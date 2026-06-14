import { z } from "zod";
import { ROLES } from "./enums.js";

/**
 * Skema auth (BAGIAN 7 & 8.2 aplikasi.md).
 * Catatan privasi: skema ini TIDAK memuat PII siswa (ADR-005). `displayName` hanya untuk dewasa.
 */

/** POST /auth/login — {username|phone|email, password, deviceId, deviceName} */
export const loginRequestSchema = z
  .object({
    username: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
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

/** Respons login. */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  role: z.enum(ROLES),
  mustChangePassword: z.boolean(),
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

/** Klaim JWT access token (BAGIAN 7.1). */
export const jwtClaimsSchema = z.object({
  sub: z.string(),
  role: z.enum(ROLES),
  schoolId: z.string().nullable(),
  scopes: z.array(z.string()),
  linkRoles: z.array(z.enum(ROLES)),
});
export type JwtClaims = z.infer<typeof jwtClaimsSchema>;
