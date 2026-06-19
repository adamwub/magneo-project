import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { API_PREFIX } from "@magnoo/shared";
import { AppModule } from "./app.module";
import type { Env } from "./config/env";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Di balik SATU reverse proxy tepercaya (Caddy → app). hop=1 berarti Express memercayai
  // tepat satu proxy: `req.ip` = IP asli klien yang DILIHAT Caddy (entri XFF paling kiri
  // TEPERCAYA, 12A.1) — bukan nilai paling kiri yang bisa dipalsukan klien. Penegakan IP
  // (validasi WiFi sekolah, audit) WAJIB pakai `req.ip`, JANGAN baca header XFF mentah.
  app.set("trust proxy", 1);

  // Semua endpoint fitur di bawah /api/v1 (BAGIAN 8.1); /health tetap di root utk infra.
  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ""), { exclude: ["health"] });

  // Tutup worker/queue & koneksi Redis rapi saat SIGTERM/SIGINT (Fase 1f).
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Env, true>);
  const port = config.get("PORT", { infer: true });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Magneo API jalan di http://localhost:${port} (health: /health)`);
}

void bootstrap();
