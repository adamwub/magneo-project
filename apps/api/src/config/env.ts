import { z } from "zod";

/**
 * Skema environment (BAGIAN 16 aplikasi.md).
 * Di Fase 0c hanya yang wajib untuk boot + healthcheck. Sisanya disiapkan opsional
 * dan akan dijadikan wajib pada fase yang memakainya (mis. DATABASE_URL di 0d).
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Wajib sejak Fase 0d (backend memerlukan database):
  DATABASE_URL: z.string().url(),

  // Wajib sejak Fase 1b (auth): rahasia penanda-tangan token, min 32 karakter.
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  // Masa berlaku token (BAGIAN 7.1): access 1 jam, refresh 30 hari (dalam detik).
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(60 * 60),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),

  // Wajib sejak Fase 1e (provisioning): pepper untuk hash pairing token Box (BAGIAN 16).
  // Token mentah hanya dikirim sekali; yang disimpan = hash(token + pepper).
  BOX_PAIRING_PEPPER: z.string().min(16),

  // Disiapkan untuk fase berikut (opsional dulu):
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Validasi & parse env. Dipakai oleh ConfigModule (lihat app.module.ts). */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Konfigurasi environment tidak valid:\n${issues}`);
  }
  return parsed.data;
}
