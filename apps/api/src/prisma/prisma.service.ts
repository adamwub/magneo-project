import { Injectable, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Penyambung backend ke database (BAGIAN 6). Modul-modul fitur memakai service ini
 * untuk membaca/menulis data. Koneksi dibuka saat aplikasi start, ditutup saat berhenti.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
