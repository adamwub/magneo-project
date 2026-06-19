# Magneo API (NestJS) — dev image.
# PENTING: build context = AKAR repo (lihat infra/docker-compose.dev.yml),
# karena ini monorepo pnpm dan API memakai paket workspace @magnoo/shared.
FROM node:20-slim AS base
# Prisma butuh openssl; ca-certificates untuk unduhan engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

# Salin seluruh workspace (artefak besar sudah dikecualikan via .dockerignore),
# lalu pasang dependensi persis sesuai lockfile.
COPY . .
RUN pnpm install --frozen-lockfile

# Bangun paket bersama dulu (API meng-import-nya), siapkan Prisma Client, lalu build API.
RUN pnpm --filter @magnoo/shared build \
  && pnpm --filter @magnoo/api exec prisma generate \
  && pnpm --filter @magnoo/api build

EXPOSE 3000

# Cek sehat tanpa perlu curl/wget — Node 20 punya fetch bawaan.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=10 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Saat start: terapkan migrasi yang sudah ada ke DB, baru nyalakan server.
CMD ["sh", "-c", "pnpm --filter @magnoo/api exec prisma migrate deploy && node apps/api/dist/main.js"]
