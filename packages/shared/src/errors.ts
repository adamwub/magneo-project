import { z } from "zod";

/**
 * Kode error terpusat (BAGIAN 8.1 aplikasi.md).
 *
 * Format respons error API:
 *   { "error": { "code": "PERMIT_DUPLICATE", "message": "<manusiawi>", "traceId": "..." } }
 *
 * Satu daftar kode di sini = sumber kebenaran untuk backend, web, dan HP.
 * Pesan untuk pengguna akhir TIDAK ditaruh di sini (dilokalkan terpisah, BAGIAN 8/17).
 */
export const ERROR_CODES = {
  // generic
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL: "INTERNAL",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  IDEMPOTENCY_KEY_REQUIRED: "IDEMPOTENCY_KEY_REQUIRED",

  // authn / authz (BAGIAN 7)
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_REUSE_DETECTED: "TOKEN_REUSE_DETECTED",
  PASSWORD_POLICY: "PASSWORD_POLICY",
  MUST_CHANGE_PASSWORD: "MUST_CHANGE_PASSWORD",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Bentuk respons error yang dipakai semua endpoint. */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]]),
    message: z.string(),
    traceId: z.string().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** Helper membentuk respons error secara konsisten. */
export function makeErrorResponse(
  code: ErrorCode,
  message: string,
  traceId?: string,
): ErrorResponse {
  return { error: { code, message, ...(traceId ? { traceId } : {}) } };
}
