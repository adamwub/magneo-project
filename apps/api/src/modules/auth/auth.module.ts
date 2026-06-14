import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

/**
 * Modul auth (ADR-003 modular monolith) — Fase 1b: login, token, sesi, first-login.
 * Aturan boundary: antar-modul hanya lewat service yang di-export.
 *
 * JwtModule dipakai untuk menandatangani & memverifikasi ACCESS token saja.
 * Refresh token bukan JWT (lihat tokens.ts) — string acak, hash-nya di tabel Session.
 * Secret diberikan eksplisit per-operasi (auth.service / jwt-auth.guard) dari env.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
