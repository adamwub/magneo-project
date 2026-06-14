# Magnoo Dashboard (Next.js) — dev image.
# PENTING: build context = AKAR repo (monorepo pnpm, memakai @magnoo/shared).
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile

# Paket bersama dulu, baru build web (Next meng-transpile @magnoo/shared).
RUN pnpm --filter @magnoo/shared build \
  && pnpm --filter @magnoo/web build

EXPOSE 3001

# Halaman status di-render server-side & memanggil API saat diminta; alamat API via env.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD node -e "fetch('http://localhost:3001').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "--filter", "@magnoo/web", "start"]
