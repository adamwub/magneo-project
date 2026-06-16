import { Global, Module, type OnModuleDestroy, type Provider, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { type Redis } from "ioredis";
import type { Env } from "../config/env";
import { buildRedisConnection } from "./redis-connection";
import {
  REDIS_CONNECTION_TOKEN,
  STUDENT_IMPORT_QUEUE,
  STUDENT_IMPORT_QUEUE_TOKEN,
} from "./queue.constants";

/** Koneksi ioredis bersama untuk sisi PRODUSEN (enqueue). Worker punya koneksi sendiri. */
const connectionProvider: Provider = {
  provide: REDIS_CONNECTION_TOKEN,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => buildRedisConnection(config),
};

/** Instance Queue student-import — dipakai service impor untuk menambah job. */
const queueProvider: Provider = {
  provide: STUDENT_IMPORT_QUEUE_TOKEN,
  inject: [REDIS_CONNECTION_TOKEN],
  useFactory: (connection: Redis) => new Queue(STUDENT_IMPORT_QUEUE, { connection }),
};

/**
 * Modul antrean (Fase 1f) — global agar token Queue bisa di-inject modul fitur mana pun.
 * Menyediakan satu koneksi Redis produsen + satu Queue student-import, dan menutup
 * keduanya rapi saat aplikasi berhenti.
 */
@Global()
@Module({
  providers: [connectionProvider, queueProvider],
  exports: [STUDENT_IMPORT_QUEUE_TOKEN, REDIS_CONNECTION_TOKEN],
})
export class QueueModule implements OnModuleDestroy {
  constructor(
    @Inject(STUDENT_IMPORT_QUEUE_TOKEN) private readonly queue: Queue,
    @Inject(REDIS_CONNECTION_TOKEN) private readonly connection: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.connection.disconnect();
  }
}
