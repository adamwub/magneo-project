import { Module } from "@nestjs/common";

/**
 * Modul sync (ADR-003 modular monolith). Stub Fase 0c — diisi pada fasenya.
 * Aturan boundary: antar-modul hanya lewat service interface yang di-export,
 * dilarang import repository/entity modul lain langsung.
 */
@Module({})
export class SyncModule {}
