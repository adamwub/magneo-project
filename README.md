# Magnoo

Ekosistem digital sekolah (SMA/SMK Indonesia). Monorepo.

> **Sumber kebenaran proyek ini adalah [`aplikasi.md`](./aplikasi.md).** Aturan kerja ada di [`CLAUDE.md`](./CLAUDE.md). Ingatan/jurnal proyek ada di [`docs/progress.md`](./docs/progress.md).

## Struktur (BAGIAN 5 aplikasi.md)

```
apps/
  api/        NestJS modular monolith (backend)
  web/        Next.js dashboard (/school /hq /partner)
  portal/     Captive portal super ringan (<200KB)
  mobile/     Flutter multi-role (siswa/guru/ortu/alumni)
box/          Magnoo Box suite (docker-compose di mini PC sekolah)
packages/
  shared/     Skema (zod) + tipe + error codes; sumber generate model Dart
infra/        docker-compose dev/prod + monitoring
scripts/      seed, box-image-build, dsb.
```

## Perkakas

- Node ≥ 20, pnpm ≥ 9 (lihat `.nvmrc`, `packageManager`)
- Docker + Docker Compose (untuk database/redis lokal)
- Flutter (dipasang saat menyentuh `apps/mobile`)

## Mulai (dev)

```bash
pnpm install
pnpm dev:infra   # menyalakan postgres + redis + api + web (Fase 0h ke atas)
```

Status build: **Fase 0 (pondasi) — sedang dibangun.** Belum ada fitur.
