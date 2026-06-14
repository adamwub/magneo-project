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

  // Disiapkan untuk fase berikut (opsional dulu):
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
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
