import IORedis, { type Redis } from "ioredis";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env";

/**
 * Bangun koneksi ioredis untuk BullMQ (Fase 1f).
 *
 * BullMQ MEWAJIBKAN `maxRetriesPerRequest: null` pada koneksi yang dipakai Worker
 * (blocking commands). Queue & Worker sebaiknya pakai koneksi terpisah; pemanggil
 * memanggil helper ini sekali per peran.
 */
export function buildRedisConnection(config: ConfigService<Env, true>): Redis {
  const url = config.get("REDIS_URL", { infer: true });
  return new IORedis(url, { maxRetriesPerRequest: null });
}
