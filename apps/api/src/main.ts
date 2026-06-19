import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { API_PREFIX } from "@magnoo/shared";
import { AppModule } from "./app.module";
import type { Env } from "./config/env";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
