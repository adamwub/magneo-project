# 📓 PROGRESS — Buku Harian Proyek Magnoo

> **Ini ingatan proyek. Claude Code TIDAK punya ingatan antar-sesi — file inilah ingatannya.**
> 
> **ATURAN WAJIB (untuk Claude Code):**
> 
> 1. **Baca file ini dari atas setiap memulai sesi**, sebelum mengerjakan apa pun.
> 1. **Setiap selesai membuat / mengubah / memperbaiki APA PUN — sekecil apa pun — langsung tulis di sini.** Setiap `create file`, setiap fitur, setiap perbaikan bug, dicatat. **Kalau belum tercatat di sini, pekerjaan dianggap belum selesai.**
> 1. Format catatan: tanggal, apa yang dikerjakan, file yang tersentuh, keputusan kecil yang diambil, status (selesai/belum), dan apa langkah berikutnya.
> 1. Tulis dengan bahasa manusia sederhana — pemilik proyek bukan programmer dan ikut membaca file ini.
> 
> *Bagian terbaru ditulis di ATAS (yang paling baru paling mudah dilihat).*

-----

## 🧭 STATUS SAAT INI — BACA INI DULU SETIAP SESI BARU

> Papan status sekali-lihat. Selalu diperbarui setiap ada perubahan. Kalau bingung "sampai mana?", jawabannya ada di sini.

- **Posisi sekarang:** Fase 0 (Pondasi) → potongan **0a, 0b & 0c SELESAI**. ✅
- **Sedang menuju:** potongan **0d** — Prisma + seluruh skema database BAGIAN 6 + migrasi pertama (butuh PostgreSQL; pakai Docker). *Belum mulai; menunggu aba-aba pemilik.*
- **Bukti terakhir yang berjalan:** `apps/api` — server NestJS boot, `GET /health` membalas `{"status":"ok"}` HTTP 200, 13 modul termuat, prefix `/api/v1` aktif. typecheck/build/test hijau.
- **Commit terakhir:** lihat `git log --oneline` di folder ini (potongan 0c ter-commit).
- **Tanggal sesi terakhir:** 2026-06-14.
- **Peta lengkap potongan Fase 0:** lihat bagian "🧱 RENCANA FASE 0" di bawah (centang = selesai).
- **Catatan lingkungan:** perkakas (Git/Node20/pnpm9/Docker) sudah terpasang di server. Flutter dipasang nanti (potong 0g). Dokumen "manusia" (21 file) tertata di folder `00–05` DI LUAR repo ini; folder coding sengaja dijaga bersih (kode + 3 file inti saja).

-----

## 📋 PETA FASE (centang saat selesai — sumber: aplikasi.md BAGIAN 12)

- [ ] **Fase 0** — Pondasi: kerangka monorepo, database, CI/CD
- [ ] **Fase 1** — Akun & pintu masuk: login semua peran, impor siswa, kode undangan ortu
- [ ] **Fase 2** — Jantung harian: absen QR, kabar ke ortu, izin, pengumuman
- [ ] **Fase 3** — Magnoo Box & WiFi (bagian paling berisiko)
- [ ] **Fase 4** — AI Asisten Guru
- [ ] **Fase 5** — Kuis berhadiah & modul iklan (mesin uang)
- [ ] **Fase 6** — Absensi wajah (setelah sistem stabil + izin ortu terkumpul)
- [ ] **Fase 7** — Alumni & pusat karier
- [ ] **Fase 8** — Analitik, deteksi dini siswa, riset, startup center

-----

## 🧱 RENCANA FASE 0 — 10 POTONGAN (disetujui pemilik 2026-06-14)

> Dikerjakan berurutan. Tiap potong: kerjakan → buktikan jalan → catat di sini → commit. Berhenti & lapor sebelum potong berikutnya.

- [x] **0a** Pasang perkakas + `git init` + kerangka monorepo (BAGIAN 5)
- [x] **0b** `packages/shared` — skema zod inti (auth, error codes, attendance) + skrip generate model Dart
- [x] **0c** `apps/api` (NestJS) — rangka + pembaca `.env` + endpoint `/health` + stub 13 modul
- [ ] **0d** Prisma + seluruh skema database BAGIAN 6 + migrasi pertama
- [ ] **0e** `apps/web` (Next.js) — rangka + halaman cek status API
- [ ] **0f** `apps/portal` (Preact) — rangka super ringan + cek status (<200KB)
- [ ] **0g** `apps/mobile` (Flutter) — rangka + layar cek status API (Flutter dipasang saat potong ini)
- [ ] **0h** `infra/docker-compose.dev.yml` (postgres, redis, api, web)
- [ ] **0i** Skrip seed: 1 sekolah, 1 kelas, 1 admin, 5 siswa, 2 guru, 2 ortu
- [ ] **0j** GitHub Actions (lint, typecheck, test, build)

**DoD Fase 0:** `docker compose up` semua hijau; ketiga klien menampilkan status API; CI hijau.

-----

## 💡 IDE & UTANG (jangan dikerjakan sekarang — catat dulu, kerjakan di fasenya)

> Tempat menampung ide bagus yang muncul di tengah jalan, supaya tidak mengganggu fase yang sedang berjalan. Juga utang teknis yang sengaja ditunda.

- [contoh] Ide: tambah fitur notifikasi suara — tunda, bahas saat Fase 2.
- [contoh] Utang: validasi nomor HP ortu masih sederhana, perlu diperketat di Fase 1 akhir.

-----

## ⚠️ KEPUTUSAN PENTING YANG SUDAH DIAMBIL (jangan diubah tanpa bahas pemilik)

> Catat di sini setiap keputusan yang akan memengaruhi banyak hal ke depan, supaya sesi berikutnya tidak menebak ulang atau memutuskan berbeda.

- [contoh] Memakai PostgreSQL untuk database cloud dan Box (sesuai ADR aplikasi.md).
- [contoh] Nama tabel pakai bahasa Inggris, teks UI pakai bahasa Indonesia.
- **2026-06-14** Versi mesin dikunci: **Node 20** + **pnpm 9** (pnpm terbaru menuntut Node 22). Dicatat di `package.json` (`engines`, `packageManager`) dan `.nvmrc`.
- **2026-06-14** Akar repository = folder `magnoo-project` ini; branch utama `main`.

-----

# 📅 CATATAN HARIAN (terbaru di atas)

> **Format tiap entri — salin pola ini:**
> 
> ```
> ## [TANGGAL] — [Fase X: judul singkat]
> **Yang dikerjakan:** (jelaskan dengan bahasa manusia)
> **File yang dibuat/diubah:** (daftar)
> **Keputusan kecil yang diambil:** (kalau ada)
> **Sudah dibuktikan jalan?** (ya/belum — bagaimana cara membuktikannya)
> **Sudah di-commit?** (ya/belum — pesan commit-nya)
> **Status:** (selesai / setengah / terhambat karena ...)
> **Langkah berikutnya:** (apa yang dikerjakan sesi depan)
> ```

-----

## 2026-06-14 — Fase 0c: rangka backend apps/api (NestJS)

**Yang dikerjakan:** Membuat "mesin utama" aplikasi (backend) dalam bentuk rangka. Dia sudah bisa dinyalakan dan menjawab "saya sehat" lewat alamat `/health`. Juga sudah ada 13 "ruang kosong" (modul) — tempat fitur-fitur nanti dipasang satu per satu. Backend juga sudah membaca berkas pengaturan `.env` dan menolak menyala kalau pengaturannya salah.

**File yang dibuat:**
- `apps/api/` — `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `vitest.config.ts`, `.env.example`.
- `src/main.ts` (titik nyala server), `src/app.module.ts` (perakit), `src/config/env.ts` (pembaca + pemeriksa `.env` pakai zod).
- `src/health/` — controller + module + tes untuk `/health`.
- `src/modules/<13 modul>/<nama>.module.ts` — stub kosong: auth, school, attendance, comms, ai, gamification, ads, career, sync, notification, analytics, billing, feature-flags.

**Keputusan kecil yang diambil:**
- `/health` sengaja TIDAK ikut prefix `/api/v1` supaya gampang dicek oleh infra & klien.
- Di Fase 0c env yang wajib hanya `NODE_ENV` & `PORT` (default 3000); DATABASE_URL dll. dibuat opsional dulu, dijadikan wajib di fase yang memakainya (0d).
- Backend menyambung ke kamus bersama `@magnoo/shared` (memakai konstanta `API_PREFIX`) — membuktikan paket bersama benar-benar terhubung.

**Sudah dibuktikan jalan?** Ya — server dinyalakan sungguhan: log NestJS memuat 13 modul, dan `curl http://localhost:3000/health` membalas `{"status":"ok","service":"magnoo-api",...}` dengan HTTP 200. typecheck hijau, `nest build` sukses, 1/1 tes lulus.

**Sudah di-commit?** Ya — `feat(api): NestJS skeleton with health endpoint, env loader, and 13 module stubs (Fase 0c)`.

**Status:** Selesai (potongan 0c dari 10).

**Langkah berikutnya:** Potongan **0d** — Prisma + seluruh skema database BAGIAN 6 + migrasi pertama (butuh PostgreSQL via Docker). Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0b: packages/shared (kamus bersama)

**Yang dikerjakan:** Membuat "kamus bersama" `@magnoo/shared` — satu tempat untuk aturan bentuk data yang dipakai backend, web, dan HP supaya tidak beda-beda. Isinya: daftar enum inti (peran pengguna, status absen), daftar kode error terpusat, dan skema pemeriksaan data untuk login & absensi. Plus satu "mesin penerjemah" yang mengubah skema itu jadi berkas model untuk aplikasi HP (Dart) secara otomatis.

**File yang dibuat:**
- `packages/shared/` — `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`.
- `src/enums.ts` (enum inti), `src/errors.ts` (kode error + bentuk respons), `src/constants.ts` (default setelan sekolah BAGIAN 10.1, pagination), `src/auth.ts` & `src/attendance.ts` (skema zod), `src/index.ts` (pintu ekspor).
- `src/generate/registry.ts` + `src/generate/dart.ts` (mesin penerjemah ke Dart: zod → JSON Schema → `.dart`).
- `src/auth.test.ts` + `src/errors.test.ts` (tes).
- Output: `generated/dart/magnoo_models.dart` (6 enum + 6 model).

**Keputusan kecil yang diambil:**
- Koordinat GPS pada check-in dibuat datar (`geoLat`/`geoLng`) agar penerjemah Dart sederhana & andal di tahap pondasi.
- Field bertipe enum dicocokkan otomatis ke enum Dart berdasarkan kumpulan nilainya; kata kunci Dart (mis. `in`) diberi akhiran `_`.
- Aturan bisnis BAGIAN 10 BELUM dibuat di sini (itu Fase 2) — di 0b hanya bentuk datanya.

**Sudah dibuktikan jalan?** Ya: `pnpm typecheck` hijau (strict, tanpa `any`), `pnpm test` 7/7 lulus, `pnpm build` sukses (ESM+CJS+types), `pnpm generate:dart` menghasilkan berkas Dart yang benar (field `accessToken` terjaga, enum `Role` terpetakan). Perintah level-root `pnpm typecheck`/`pnpm test` juga hijau (yang dipakai CI nanti).

**Catatan jujur:** berkas `.dart` belum diverifikasi oleh compiler Dart karena Flutter/Dart baru dipasang di potongan 0g. Di situ nanti dipastikan benar-benar meng-compile.

**Sudah di-commit?** Ya — `feat(shared): core enums, error codes, zod schemas, and Dart model generator (Fase 0b)`.

**Status:** Selesai (potongan 0b dari 10).

**Langkah berikutnya:** Potongan **0c** — rangka backend `apps/api` (NestJS) + `/health` + stub modul. Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Housekeeping: penataan dokumen + bot unggah (di luar fase coding)

**Yang dikerjakan:** Merapikan 21 dokumen "manusia" (strategi, legal, sekolah, mitra, keuangan) yang diunggah lewat bot Telegram ke folder-folder rapi **di luar** repo coding, sesuai `DAFTAR-ISI.md`. Bot Telegram dipakai sebagai jalur unggah; folder default-nya kini `_inbox`.

**File yang dibuat/diubah:**
- DI LUAR repo: folder `/root/00-Daftar-Isi` … `/root/05-Keuangan` (total 21 file tertata: 01=9, 02=4, 03=3, 04=3, 05=1, 00=1), `/root/_inbox`, dan skrip bot `/root/magnoo_bot.py`.
- DI DALAM repo (1 perubahan): **hapus `DAFTAR-ISI.md` yang tanpa sengaja ter-commit** ke akar repo (bot sempat menyimpan ke sini sebelum dialihkan). Sekarang repo coding bersih dari dokumen manusia.

**Keputusan kecil yang diambil:** Dokumen manusia TIDAK disimpan di dalam `magnoo-project` (sesuai DAFTAR-ISI.md: folder coding hanya kode + 3 file inti). Bot unggah diarahkan ke `_inbox`, file yang namanya dikenal otomatis dirutekan ke folder 00–05.

**Sudah dibuktikan jalan?** Ya — audit ulang: 21/21 file ada di folder yang benar, 0 hilang, 0 tak terduga. `git status` repo bersih.

**Sudah di-commit?** Ya — `chore: remove stray DAFTAR-ISI.md (belongs in human docs folder, not the coding repo)` (`4d26fb7`).

**Status:** Selesai. Ini pekerjaan housekeeping, bukan bagian dari potongan Fase 0.

**Langkah berikutnya:** Lanjut Fase 0b (menunggu aba-aba pemilik).

-----

## 2026-06-14 — Fase 0a: Pasang perkakas + kerangka monorepo

**Yang dikerjakan:** (1) Server kerja ternyata kosong dari perkakas — saya pasang Git, Node, pnpm, dan Docker dari nol. (2) Saya buat "kotak besar" proyek (monorepo) berisi folder-folder kosong untuk setiap bagian aplikasi (backend, web, portal, HP, Box, dll) supaya nanti semua tinggal diisi. Belum ada fitur, baru rangkanya.

**File yang dibuat/diubah:**
- `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc` — pengaturan "kotak besar" & versi mesin.
- `.gitignore` — daftar berkas yang tidak ikut disimpan (mis. file rahasia `.env`).
- `README.md` — penjelasan singkat proyek.
- Kerangka folder sesuai BAGIAN 5: `apps/{api,web,portal,mobile}`, `box/*`, `packages/shared`, `infra/`, `scripts/`, `docs/adr/` (semua diisi penanda `.gitkeep`).
- 12 folder modul kosong di `apps/api/src/modules/` (auth, school, attendance, dst).

**Keputusan kecil yang diambil:**
- Pakai Node 20 + pnpm 9 (versi pnpm terbaru menuntut Node 22). Tercatat juga di "Keputusan Penting".
- Branch git utama bernama `main`.

**Sudah dibuktikan jalan?** Ya:
- `git --version` 2.43, `node -v` 20.20.2, `pnpm -v` 9.15.9, `docker -v` 29.5.3.
- Docker daemon hidup & `docker run hello-world` **berhasil** (artinya `docker compose up` nanti bisa dibuktikan benar-benar di server ini).
- `pnpm install` jalan tanpa error (exit 0); workspace dikenali sebagai `magnoo@0.0.0`.

**Sudah di-commit?** Ya — `chore: bootstrap monorepo skeleton and toolchain (Fase 0a)`.

**Status:** Selesai (potongan 0a dari 10 potongan Fase 0).

**Langkah berikutnya:** Potongan **0b** — isi `packages/shared` dengan skema data inti (auth, kode error, absensi) + skrip generate model Dart. Menunggu aba-aba pemilik untuk lanjut.