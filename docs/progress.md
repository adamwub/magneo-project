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

- **Posisi sekarang:** **FASE 1 BERJALAN.** Fase 0 (Pondasi) SELESAI (0a–0j ✅). Fase 1: **1a ✅** (skema bersama), **1b ✅** (auth inti), **1c ✅** (RBAC + audit append-only). Lihat "RENCANA FASE 1" di bawah.
- **Sedang menuju:** **Potongan 1d** — Sesi & peran: batas perangkat (siswa 2 / lain 3), refresh reuse-detection → revoke semua sesi, role-switch (linkRoles), list/revoke sesi. *Menunggu aba-aba pemilik sebelum mulai.*
- **Keputusan NIS sudah DIAMBIL (2026-06-14):** NIS siswa **DISAMARKAN** di cloud (hash berkunci per sekolah jadi `User.username`), NIS mentah TIDAK pernah disimpan di cloud. Detail di "Keputusan Penting" di bawah. *Penerapan transform NIS→samaran masih menyusul di 1f (impor) & disambung ke login; saat ini login siswa mencocokkan `username` apa adanya + butuh `schoolId`.*
- **Bukti terakhir yang berjalan:** API auth diuji **terhadap database nyata** (port lokal 3100): login guru & siswa ✅ (token JWT terbit, klaim sub/sid/role/schoolId benar), password salah → error generik ✅, refresh berputar (token baru) ✅, endpoint terproteksi tanpa token → 401 ✅, setuju ToS → 204 & re-login `mustAcceptTos:false` ✅, login siswa tanpa schoolId ditolak ✅. Tes unit: shared 24/24, api 15/15 (lockout, rotasi, dll). typecheck 4/4 ✅, build API ✅.
- **GitHub:** **belum bisa push** — firewall environment ini memblokir TLS ke `github.com`/`api.github.com` (TCP nyambung, TLS di-drop). Internet umum jalan (cli.github.com & Cloudflare OK). Token & `gh` 2.94 sudah siap. Tindakan: buka firewall (allowlist github.com, api.github.com, codeload.github.com, *.githubusercontent.com:443) ATAU push dari laptop. Backup off-site jadi PR penting — sementara hanya ada satu salinan di server ini.
- **Catatan infra:** PostgreSQL dev kini lewat **compose resmi** (`infra/docker-compose.dev.yml`), volume bernama `magnoo-postgres-data` → **data persisten**. Nyalakan semua: `pnpm dev:infra` (atau `docker compose -f infra/docker-compose.dev.yml up --build`); matikan: `pnpm dev:infra:down`. API otomatis `prisma migrate deploy` saat start. Kontainer Postgres lama yang berdiri sendiri sudah dihapus (digantikan compose).
- **Commit terakhir:** lihat `git log --oneline` (1a = `feat(shared): Fase 1 auth & school schemas`).
- **Tanggal sesi terakhir:** 2026-06-14.
- **Peta lengkap potongan Fase 0:** lihat bagian "🧱 RENCANA FASE 0" di bawah (centang = selesai).
- **Catatan lingkungan:** perkakas (Git/Node20/pnpm9/Docker) terpasang. **Flutter 3.44.2 terpasang di `/opt/flutter`** — sesi baru WAJIB tambahkan ke PATH: `export PATH="/opt/flutter/bin:$PATH"` (dan `git config --global --add safe.directory /opt/flutter`). Dokumen "manusia" (21 file) tertata di folder `00–05` DI LUAR repo ini; folder coding dijaga bersih.

-----

## 📋 PETA FASE (centang saat selesai — sumber: aplikasi.md BAGIAN 12)

- [x] **Fase 0** — Pondasi: kerangka monorepo, database, CI/CD
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
- [x] **0d** Prisma + seluruh skema database BAGIAN 6 (cloud 6.1–6.3) + migrasi pertama
- [x] **0e** `apps/web` (Next.js) — rangka + halaman cek status API
- [x] **0f** `apps/portal` (Preact) — rangka super ringan + cek status (<200KB)
- [x] **0g** `apps/mobile` (Flutter) — rangka + layar cek status API (Flutter dipasang saat potong ini)
- [x] **0h** `infra/docker-compose.dev.yml` (postgres, redis, api, web)
- [x] **0i** Skrip seed: 1 sekolah, 1 kelas, 1 admin, 5 siswa, 2 guru, 2 ortu
- [x] **0j** GitHub Actions (lint, typecheck, test, build)

**DoD Fase 0:** `docker compose up` semua hijau ✅ (0h); ketiga klien menampilkan status API → web ✅ live (0h), portal ✅ & mobile ✅ (terbukti build/test di 0f/0g; tampilan live perlu HP/browser); CI ✅ semua langkah lulus lokal (push ke GitHub utk centang hijau resmi).

-----

## 🧱 RENCANA FASE 1 — 11 POTONGAN (disetujui pemilik 2026-06-14)

> Backend dulu, baru tampilan, baru uji E2E. Tiap potong: kerjakan → buktikan jalan → catat → commit → berhenti & lapor. Sumber: aplikasi.md BAGIAN 7, 8.2 (auth & school), 12 (Fase 1), 15 (QA-1, QA-2).

- [x] **1a** `packages/shared` — skema zod + error codes + enum untuk auth & school (kontrak data, belum ada logika)
- [x] **1b** Auth inti — JWT access+refresh rotating, `Session`, login (siswa NIS+schoolId / dewasa HP-email), lockout 5×→15 mnt, password policy, first-login (ganti pw + setuju ToS)
- [x] **1c** RBAC — guard `@Roles` + `@Scope`, enforce scope (guru→kelasnya, admin→sekolahnya, siswa→diri, ortu→anak, HQ→global), 403 + AuditLog append-only
- [ ] **1d** Sesi & peran — batas perangkat (siswa 2 / lain 3), refresh reuse-detection→revoke semua, role-switch (linkRoles), list/revoke sesi
- [ ] **1e** Provisioning — HQ buat sekolah, pairing token Box, akun admin (sekali tampil), setting sekolah, CRUD kelas, wizard kenaikan kelas (preview→confirm)
- [ ] **1f** Impor XLSX — job BullMQ + validasi per-baris + laporan error ramah + idempotent + **penyamaran NIS** (hash berkunci per sekolah)
- [ ] **1g** Undangan ortu — kode undangan + PDF batch (render server), register ortu + OTP (WA = adapter stub/log), verify-otp, link anak
- [ ] **1h** Consent & audit — arsip ConsentRecord + audit-log (append-only ditegakkan di service)
- [ ] **1i** Web — `/hq` wizard provision + `/school` Pengguna & Kelas
- [ ] **1j** Mobile — login + first-login semua peran + OTP ortu & link anak
- [ ] **1k** Uji E2E + QA — HQ buat sekolah → impor 500 siswa (ada baris rusak) → siswa login → ortu register & link. Gate QA-1 & QA-2

**DoD Fase 1 (aplikasi.md BAGIAN 12):** skenario E2E di atas jalan; QA-1 (auth: lockout, first-login, IDOR antar scope = 403+audit) & QA-2 (impor: campur valid/invalid, idempotent, 5.000 baris ditolak ramah) lulus.

-----

## 💡 IDE & UTANG (jangan dikerjakan sekarang — catat dulu, kerjakan di fasenya)

> Tempat menampung ide bagus yang muncul di tengah jalan, supaya tidak mengganggu fase yang sedang berjalan. Juga utang teknis yang sengaja ditunda.

- [contoh] Ide: tambah fitur notifikasi suara — tunda, bahas saat Fase 2.
- [contoh] Utang: validasi nomor HP ortu masih sederhana, perlu diperketat di Fase 1 akhir.
- **Utang (0d):** sifat *append-only* `AuditLog` & `PointLedger` belum ditegakkan — baru aturan di dokumen. Tegakkan di lapisan service saat tabel ini mulai dipakai (AuditLog: Fase 1; PointLedger: Fase 5).
- **Utang (0d):** kolom waktu pakai `timestamp` biasa; pertimbangkan pindah ke `timestamptz` bila perlu ketegasan zona waktu di level DB. Saat ini UTC dijaga di aplikasi.
- **Utang (0d):** UUID dibuat di aplikasi; bila ingin persis spec (`gen_random_uuid()` sisi DB), ganti `@default(uuid())` → `@default(dbgenerated("gen_random_uuid()")) @db.Uuid` (butuh migrasi).
- **Utang (0d):** nilai enum `RewardType/RedemptionStatus/PartnerStatus/JobStatus` dipilih sendiri — konfirmasi/sesuaikan saat fitur terkait dibangun (Fase 5 & 7).
- **Utang (0g):** model Dart masih DISALIN manual dari `packages/shared/generated` ke `apps/mobile/lib/generated`. Jadikan langkah build otomatis (skrip generate menulis langsung ke mobile, atau melos hook) saat mulai garap layar HP sungguhan (Fase 1).
- ✅ **KEPUTUSAN NIS sudah diambil (2026-06-14)** — dipindah ke bagian "Keputusan Penting" di bawah. (Dulu tertunda dari 0i; pemilik memilih opsi "disamarkan".)

-----

## ⚠️ KEPUTUSAN PENTING YANG SUDAH DIAMBIL (jangan diubah tanpa bahas pemilik)

> Catat di sini setiap keputusan yang akan memengaruhi banyak hal ke depan, supaya sesi berikutnya tidak menebak ulang atau memutuskan berbeda.

- [contoh] Memakai PostgreSQL untuk database cloud dan Box (sesuai ADR aplikasi.md).
- [contoh] Nama tabel pakai bahasa Inggris, teks UI pakai bahasa Indonesia.
- **2026-06-14** Versi mesin dikunci: **Node 20** + **pnpm 9** (pnpm terbaru menuntut Node 22). Dicatat di `package.json` (`engines`, `packageManager`) dan `.nvmrc`.
- **2026-06-14** Akar repository = folder `magnoo-project` ini; branch utama `main`.
- **2026-06-14 — PENYIMPANAN NIS SISWA = DISAMARKAN.** (Pemilik memutuskan di awal Fase 1.) NIS mentah **TIDAK pernah** disimpan di cloud. `User.username` siswa = NIS yang sudah disamarkan dengan **hash berkunci per sekolah** (kunci unik tiap sekolah). Saat login: siswa ketik NIS asli → cloud menyamarkan dengan cara & kunci yang sama → cocokkan dengan `username` tersimpan. NIS asli nanti hanya tinggal di perangkat Box sekolah (Fase 3). Sesuai ADR-005 + Guardrail 13.2. **Implementasi:** penyamaran di 1f (impor) & 1b (login). *Utang terkait: tampilan "NIS + badge Box offline" di dashboard (11.3) perlu dipikirkan di Fase 3 karena cloud tak punya NIS asli.*

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

## 2026-06-14 — Fase 1c: RBAC (hak akses) + Audit append-only

**Yang dikerjakan:** Membangun "penjaga pintu" hak akses. Tiap endpoint nanti bisa diberi label peran (`@Roles`) dan batas data (`@Scope`). Saat ada permintaan, penjaga (`RolesGuard`) memastikan: (1) peran pemanggil termasuk yang diizinkan, dan (2) data yang disentuh masih dalam jangkauannya — **guru hanya kelas yang ia ampu (wali), admin/kepsek hanya sekolahnya, siswa hanya dirinya, ortu hanya anaknya yang tertaut, HQ hanya area global**. Kalau melanggar → ditolak **403** + otomatis **dicatat di Audit Log**. Sekalian saya buat penulis Audit Log yang **append-only** (cuma bisa menambah, tak bisa diubah/dihapus) — ini melunasi utang dari 0d.

**File yang dibuat/diubah:**
- `apps/api/src/common/rbac/` — **(baru)** `roles.decorator.ts` (@Roles), `scope.decorator.ts` (@Scope), `scope.service.ts` (resolusi kepemilikan kelas/sekolah/anak via DB), `roles.guard.ts` (penjaga otorisasi), `rbac.module.ts` (global).
- `apps/api/src/common/audit/` — **(baru)** `audit.service.ts` (append-only — hanya `write()`), `audit.module.ts` (global).
- `apps/api/src/app.module.ts` — pasang AuditModule & RbacModule.
- Tes: `roles.guard.test.ts` (6), `scope.service.test.ts` (9).

**Keputusan kecil:** (1) Penulisan audit tidak boleh menggagalkan operasi utama — kalau gagal, error ditelan + dicatat ke log (audit bersifat pendukung). (2) `RolesGuard` dipakai BERSAMA `JwtAuthGuard` (autentikasi dulu, baru otorisasi). (3) Endpoint tanpa label @Roles/@Scope = lolos otorisasi (cukup autentikasi) — supaya tidak memaksa label di tempat yang tak perlu. (4) HQ TIDAK otomatis lolos scope sekolah/kelas/diri (sesuai ADR-005: HQ tak boleh PII siswa) — HQ hanya untuk scope global.

**Utang baru:** "Guru pengampu" selain wali kelas belum bisa dicek karena skema BAGIAN 6 hanya punya `Class.homeroomTeacherId` (tak ada tabel pengampu). Untuk sekarang scope kelas bagi guru = wali kelas saja. Dicatat juga di komentar `scope.service.ts`. Perlu tabel pengampu bila fitur multi-guru per kelas dibutuhkan (kemungkinan Fase 2).

**Sudah dibuktikan jalan?** Ya: tes unit menyeluruh untuk guard & scope (peran salah→403+audit, scope sekolah/diri/anak/kelas benar & salah) — **api 30/30, shared 24/24** (total 54). typecheck 4/4 ✅, build API ✅, lint ✅. App **boot bersih** dengan AuditModule & RbacModule ter-load. *Validasi IDOR end-to-end lewat HTTP nyata (QA-1) menyusul di 1k saat endpoint sekolah sudah ada.*

**Sudah di-commit?** Ya — `feat(rbac): roles+scope guard with audit-logged denials, append-only AuditService (1c)`.

**Status:** SELESAI.

**Langkah berikutnya:** Potongan **1d** — batas perangkat, refresh reuse-detection, role-switch, daftar/revoke sesi. Tunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 1b: Auth inti (login, token, sesi, first-login)

**Yang dikerjakan:** Membuat sistem login sungguhan. Siswa login pakai NIS + kode sekolah (aplikasi HP terikat satu sekolah); guru/admin/ortu pakai email/HP. Saat berhasil, server menerbitkan dua "tiket": **access token** (berlaku 1 jam, untuk akses harian) dan **refresh token** (30 hari, untuk perpanjang tanpa login ulang). Refresh token disimpan **hanya hash-nya** di tabel sesi (kalau DB bocor, token mentah tidak ikut). Tiap perpanjangan, token diputar (yang lama tak berlaku). Pengaman: salah password **5×** → akun **terkunci 15 menit**; pesan error sengaja tidak membedakan "user salah" vs "password salah" (biar tidak bisa ditebak). Alur pertama-login: wajib ganti password + setujui Syarat & Ketentuan (ToS). Password divalidasi (min 8, tolak yang umum/lemah & yang sama dengan identitas). Password di-hash argon2id.

**File yang dibuat/diubah:**
- `apps/api/src/modules/auth/` — **(baru)** `password.ts` (kebijakan + hash), `tokens.ts` (refresh acak + hash), `auth.service.ts` (logika inti), `auth.controller.ts` (endpoint), `jwt-auth.guard.ts` (verifikasi token), `current-user.decorator.ts`, + isi `auth.module.ts`.
- `apps/api/src/common/` — **(baru)** `api-error.ts` (format error standar BAGIAN 8.1) & `zod-validation.pipe.ts` (validasi body pakai zod).
- `apps/api/src/config/env.ts` — `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` jadi wajib (min 32) + masa berlaku token.
- `apps/api/.env.example`, `apps/api/.env` (lokal), `infra/docker-compose.dev.yml` — tambah secret JWT dev.
- `apps/api/package.json` — tambah `@nestjs/jwt`.
- `packages/shared/src/auth.ts` — `loginRequest` tambah `schoolId` (opsional, utk siswa); `loginResponse` tambah `mustAcceptTos`; klaim JWT tambah `sid` (id sesi, utk logout). Regenerate model Dart.
- Tes: `password.test.ts`, `auth.service.test.ts`.

**Endpoint aktif:** `POST /api/v1/auth/login`, `/refresh`, `/logout`, `/password/change`, `/tos/accept`.

**Keputusan kecil:** (1) Login siswa butuh `schoolId` karena NIS hanya unik per sekolah & aplikasi HP siswa terikat satu sekolah. (2) Refresh token = string acak buram (bukan JWT), hash SHA-256 di DB. (3) `sid` (id sesi) ditaruh di access token agar "logout sesi ini" bisa tahu sesi mana. (4) Status 423 (Locked) ditulis manual karena tak ada di enum Nest versi ini. (5) Otorisasi peran/scope (RBAC) sengaja BELUM di sini — itu potongan 1c; `scopes`/`linkRoles` di token sementara kosong.

**Utang baru:** Kebijakan password belum bisa menolak "password = tanggal lahir" (spec 7.2) karena tanggal lahir adalah PII yang tak disimpan di cloud (ADR-005) — hanya bisa dicek di Box (fase lanjut). Dicatat juga di komentar `password.ts`.

**Sudah dibuktikan jalan?** Ya, dua lapis. (a) **Tes otomatis:** shared 24/24, api 15/15 (termasuk: terkunci, gagal ke-5 mengunci, error generik, rotasi refresh, logout). typecheck 4/4, build API sukses. (b) **Uji langsung ke database nyata** (API dijalankan lokal di :3100 atas Postgres dev): login guru & siswa berhasil terbitkan token; password salah → `INVALID_CREDENTIALS` generik; refresh → token baru; tos/accept tanpa token → 401, dengan token → 204; re-login menunjukkan `mustAcceptTos` berubah jadi false; login siswa tanpa schoolId ditolak.

**Sudah di-commit?** Ya — `feat(auth): core auth — login, JWT, sessions, first-login (1b)`.

**Status:** SELESAI.

**Langkah berikutnya:** Potongan **1c** — RBAC (guard peran + scope, 403 + AuditLog). Tunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 1a: Skema bersama auth & sekolah

**Yang dikerjakan:** Membuat "kamus data" (kontrak bentuk data) untuk seluruh fitur Fase 1 di `packages/shared`. Ini fondasi tipe yang dipakai bareng oleh server, web, dan HP — belum ada logika yang jalan, baru cetakan datanya. Mencakup: login & token, lupa/reset password, registrasi ortu + OTP, kode undangan & link anak, role-switch, persetujuan ToS, daftar sesi; lalu sisi sekolah: buat sekolah (HQ), pairing Box, akun admin, setting sekolah, kelas (CRUD + kenaikan kelas), impor XLSX (request + laporan progres/error), kode undangan + batch, consent, dan audit log. Semua dijaga **tanpa PII siswa** (ADR-005).

**File yang dibuat/diubah:**
- `packages/shared/src/enums.ts` — tambah enum: SchoolStatus, LinkStatus, ConsentType, ImportJobStatus, InviteCodeStatus; daftarkan LinkStatus & ConsentType ke generator Dart.
- `packages/shared/src/errors.ts` — tambah kode error Fase 1 (ToS, OTP, kode undangan, role-switch, impor).
- `packages/shared/src/auth.ts` — tambah ~13 skema auth (lupa/reset pw, parent register/verify/link, role-switch, ToS, sesi) + validator OTP 6 digit & kode undangan 8 char.
- `packages/shared/src/school.ts` — **(baru)** seluruh skema provisioning & master data sekolah.
- `packages/shared/src/index.ts` — ekspor `school.ts`.
- `packages/shared/src/generate/registry.ts` — daftarkan 10 model Dart baru (alur HP).
- `packages/shared/src/auth.test.ts` + `school.test.ts` — tes validasi skema.
- `packages/shared/generated/dart/magnoo_models.dart` — hasil regenerate (16 model + 8 enum).

**Keputusan kecil:** OTP = 6 digit angka; kode undangan = 8 karakter huruf besar/angka; respons link-anak hanya kirim `studentUserId` + status (tanpa nama siswa). Status job impor & status kode undangan dibuat sebagai tipe bersama (bukan enum DB) karena dilacak di BullMQ/turunan kolom.

**Sudah dibuktikan jalan?** Ya: `pnpm --filter @magnoo/shared typecheck` ✅; `test` ✅ **24/24** (auth 10, school 11, errors 3); `generate:dart` ✅ (16 model + 8 enum).

**Sudah di-commit?** Ya — `feat(shared): Fase 1 auth & school schemas (1a)`.

**Status:** SELESAI.

**Langkah berikutnya:** Potongan **1b** — Auth inti (JWT access+refresh rotating, `Session`, login siswa NIS / dewasa, lockout, password policy, first-login). Tunggu aba-aba pemilik sebelum mulai.

-----

## 2026-06-14 — Fase 0j: CI GitHub Actions (penutup Fase 0)

**Yang dikerjakan:** Memasang "penjaga otomatis" (CI) yang akan memeriksa kode setiap ada perubahan: memeriksa gaya kode (lint), memeriksa tipe data (typecheck), menjalankan tes, dan mencoba membangun semuanya. Kalau salah satu gagal, perubahan ditandai merah. Ada 2 pemeriksa: satu untuk bagian backend/web (Node), satu untuk aplikasi HP (Flutter).

**File yang dibuat/diubah:**
- `.github/workflows/ci.yml` — 2 job: **node** (install → generate Prisma → lint → typecheck → test → build; Node 20, pnpm 9, cache) & **flutter** (analyze + test; Flutter 3.44.2).
- `apps/web/.eslintrc.json` — konfigurasi ESLint Next.js (`next/core-web-vitals`).
- `apps/web/package.json` — `lint` jadi `next lint --max-warnings 0` (gagal kalau ada peringatan) + paket `eslint` & `eslint-config-next`.
- `pnpm-lock.yaml` — terkunci ulang.

**Keputusan kecil yang diambil:**
- `next lint` sebelumnya minta setup interaktif → bakal bikin CI merah. Diperbaiki dengan menyiapkan konfigurasi ESLint Next.js standar (bukan menambal/menonaktifkan lint).
- Job Flutter dipisah karena butuh toolchain berbeda (bukan Node).
- `concurrency` dipasang agar run lama dibatalkan saat ada push baru (hemat menit CI).
- Prisma Client digenerate sebelum typecheck/test/build api (kalau tidak, api gagal kompil).

**Sudah dibuktikan jalan?** Ya — YAML divalidasi (parser Python, 2 job terbaca) DAN semua langkah pipeline dijalankan **lokal di mesin ini** dan lulus: lint ✅ ("No ESLint warnings or errors"), typecheck ✅ (api+web+portal+shared), test ✅ (**8/8**: shared 7, api 1), build ✅ (shared, api, web, portal), flutter analyze ✅ ("No issues found"), flutter test ✅ (**1/1**).

**Catatan jujur (penting):** repo **belum tersambung ke GitHub** (tidak ada `git remote`). Jadi centang hijau resmi di tab Actions GitHub **belum muncul** — itu butuh pemilik membuat repo di GitHub lalu `git push`. Yang sudah pasti: begitu di-push, semua langkah CI akan jalan karena terbukti lulus lokal.

**Sudah di-commit?** Ya — `ci: GitHub Actions pipeline (node lint/typecheck/test/build + flutter analyze/test) + web eslint setup (Fase 0j)`.

**Status:** Selesai (potongan 0j dari 10). **🎉 FASE 0 TUNTAS** — pondasi monorepo lengkap.

**Langkah berikutnya:** **Fase 1** — Auth, RBAC, provisioning, impor XLSX, invite code ortu. Sebelum mulai: baca BAGIAN 7 aplikasi.md, dan **putuskan skema pseudonim NIS** (lihat Ide & Utang). Menunggu aba-aba pemilik. Disarankan juga: sambungkan repo ke GitHub agar CI berjalan resmi.

-----

## 2026-06-14 — Fase 0i: skrip seed (data contoh)

**Yang dikerjakan:** Membuat satu perintah yang mengisi database dengan data contoh, supaya fase berikutnya punya bahan untuk diuji: 1 sekolah, 1 kelas, 1 admin, 2 guru, 5 siswa, 2 orang tua (masing-masing ditautkan ke satu siswa). Sebelum koding, dilakukan analisis mendalam soal cara menyimpan data siswa agar tidak melanggar perlindungan data anak (lihat keputusan di bawah).

**File yang dibuat/diubah:**
- `apps/api/prisma/seed.ts` — skrip seed (idempotent: tiap baris di-upsert pakai id tetap → jalan ulang tidak menggandakan).
- `apps/api/package.json` — perintah `db:seed`, konfigurasi `prisma.seed` (pakai `tsx`), + paket `tsx` (penjalan TS) & `@node-rs/argon2` (hash argon2id siap-pakai, tanpa kompilasi native).
- `pnpm-lock.yaml` — terkunci ulang untuk 2 paket baru.

**Keputusan kecil + analisis penting:**
- **Perlindungan data anak (ADR-005 + Guardrail #13.2):** siswa di cloud HANYA UUID + atribut non-identitas (role, kelas, status). `displayName` = null, tanpa phone/email. Nama/NIS asli siswa = milik Box, bukan cloud.
- **Analisis ketegangan spec NIS** (ADR-005 vs Guardrail #13.2 vs login 7.2): kesimpulan = NIS boleh di cloud asal di-pseudonim; NIS asli hanya di Box. **Tidak dikunci di 0i** — seed pakai kode palsu `siswa-demo-1..5`. Detail rekomendasi & untuk diputuskan di Fase 1 → lihat "Ide & Utang".
- **Password argon2id** (BAGIAN 14), bukan teks polos (Guardrail #13.11). Password demo (terdokumentasi di skrip): `MagnooDemo#2026`. `mustChangePassword` = true (default) → wajib ganti saat login pertama.
- Memakai id tetap (deterministik) untuk semua entitas demo supaya idempotent. Setelan sekolah memakai `SCHOOL_SETTING_DEFAULTS` dari `@magnoo/shared` (BAGIAN 10.1).
- Seed ditaruh di `apps/api/prisma/seed.ts` (idiom Prisma, dekat skema & client) — bukan di `scripts/` akar; folder itu untuk skrip build/ops.

**Sudah dibuktikan jalan?** Ya — `pnpm --filter @magnoo/api db:seed` di atas stack yang hidup menghasilkan: **1 sekolah, 1 kelas, 1 admin, 2 guru, 5 siswa, 2 ortu, 2 tautan ortu-anak**. Dibuktikan via query Postgres langsung: (1) **idempotent** — dijalankan dua kali, jumlah persis sama; (2) **privasi** — kelima siswa `displayName`/`phone`/`email` = NULL, semua punya `classId`; (3) **password** = `$argon2id$v=1...` (panjang 97), bukan teks polos; (4) tautan ortu-anak `status=ACTIVE`. `pnpm --filter @magnoo/api typecheck` tetap hijau.

**Sudah di-commit?** Ya — `feat(api): idempotent seed (1 school, 1 class, admin, 2 teachers, 5 students, 2 parents) with PII-free students + argon2id (Fase 0i)`.

**Status:** Selesai (potongan 0i dari 10). Tersisa **0j** (CI) untuk menutup Fase 0.

**Langkah berikutnya:** Potongan **0j** — GitHub Actions (lint, typecheck, test, build). Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0h: infra/docker-compose.dev.yml (semua jadi satu perintah)

**Yang dikerjakan:** Menyatukan empat bagian (database Postgres, cache Redis, backend API, web) ke dalam SATU perintah `docker compose up`. Tiap bagian dibungkus jadi "kontainer" yang bisa dinyalakan bareng, saling kenal lewat nama (bukan localhost), dan menunggu satu sama lain sampai sehat sebelum lanjut. API otomatis menerapkan migrasi database saat menyala. Sekarang sesi baru cukup satu perintah untuk menghidupkan seluruh lingkungan dev.

**File yang dibuat/diubah:**
- `infra/docker-compose.dev.yml` — orkestrasi 4 service + healthcheck + volume persisten Postgres.
- `apps/api/Dockerfile` — image dev API (Node 20, openssl utk Prisma, pnpm; build @magnoo/shared → prisma generate → build API; start = migrate deploy lalu nyalakan server).
- `apps/web/Dockerfile` — image dev web (Node 20, pnpm; build @magnoo/shared → build Next.js).
- `.dockerignore` — kecualikan artefak besar & rahasia (.env) dari konteks build.
- `package.json` (akar) — skrip `dev:infra` (up --build) & `dev:infra:down`.

**Keputusan kecil yang diambil:**
- Build context tiap image = AKAR repo (monorepo pnpm; API & web pakai paket bersama `@magnoo/shared`).
- Postgres pakai **volume bernama** `magnoo-postgres-data` → data BERTAHAN walau kontainer dihapus (melunasi catatan "data belum persisten" dari 0d).
- Healthcheck pakai `fetch` bawaan Node 20 (tanpa perlu curl/wget di dalam image).
- **Build dilakukan satu-satu** (api lalu web), bukan serentak — build serentak sebelumnya mati exit 137 (kehabisan RAM di mesin 4GB).
- Kontainer Postgres lama yang berdiri sendiri (sisa 0d, isinya kosong) DIHAPUS atas persetujuan pemilik, supaya port 5432 dipakai Postgres versi compose.

**Sudah dibuktikan jalan?** Ya — `docker compose up -d` → **4 kontainer healthy** (postgres, redis, api, web). Bukti nyata: `curl http://localhost:3000/health` → **HTTP 200** `{"status":"ok","service":"magnoo-api"}`; Postgres compose berisi **39 tabel** (API otomatis migrasi saat start); `curl http://localhost:3001` → **HTTP 200**, halaman menampilkan **"API terhubung · magnoo-api"** — artinya web memanggil API lewat jaringan internal `http://api:3000` dan berhasil (rantai web → api → db tersambung).

**Sudah di-commit?** Ya — `feat(infra): dev docker-compose (postgres, redis, api, web) with healthchecks + Dockerfiles (Fase 0h)`.

**Status:** Selesai (potongan 0h dari 10). DoD Fase 0 "docker compose up semua hijau + klien menampilkan status API" → terpenuhi untuk web; portal & mobile bukan bagian compose 0h.

**Langkah berikutnya:** Potongan **0i** — skrip seed (1 sekolah, 1 kelas, 1 admin, 5 siswa, 2 guru, 2 ortu). Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0g: rangka aplikasi HP apps/mobile (Flutter)

**Yang dikerjakan:** Memasang Flutter, lalu membuat rangka aplikasi HP. Ada satu layar yang menyapa backend dan menampilkan status koneksi (warna identitas Magnoo). Berkas model Dart hasil 0b ikut dipakai di layar ini, supaya terbukti benar-benar bisa dipakai di aplikasi HP.

**File yang dibuat/diubah (semua di `apps/mobile`):**
- Proyek Flutter (`flutter create`): `pubspec.yaml` (+`http`), `android/`, `web/`, `lib/`, `test/`, dll.
- `lib/main.dart` — layar status (panggil `/health`), tema warna Magnoo, memakai `Role` dari model bersama.
- `lib/generated/magnoo_models.dart` — SALINAN hasil generator 0b (dipakai → terbukti compile).
- `analysis_options.yaml` — kecualikan `lib/generated/**` dari lint gaya.
- `test/widget_test.dart` — tes: layar menampilkan brand + status awal.

**Keputusan kecil yang diambil:**
- Flutter dipasang via tarball resmi Google (GitHub clone gagal/terblokir) ke `/opt/flutter`.
- Model Dart untuk sementara DISALIN dari `packages/shared/generated`; penyatuan jadi langkah build otomatis = utang (lihat Utang).
- `melos` (manajer multi-paket Dart) ditunda — belum perlu untuk satu paket.

**Sudah dibuktikan jalan?** Ya — `flutter analyze` **bersih (No issues)**, `flutter test` **1/1 lulus**, `flutter build web` **sukses** (compile penuh ke JS, termasuk model 0b). Catatan jujur: layar tidak "ditunjukkan" karena tak ada emulator/Chrome; bukti = compile + test bersih. "Menyapa server di layar HP" terlihat saat dijalankan di HP/emulator nanti.

**Sudah di-commit?** Ya — `feat(mobile): Flutter skeleton with API health screen, consumes generated Dart models (Fase 0g)`.

**Status:** Selesai (potongan 0g dari 10). **Utang 0b lunas**: berkas Dart generator terbukti compile di Flutter.

**Langkah berikutnya:** Potongan **0h** — `infra/docker-compose.dev.yml` (postgres, redis, api, web) → `docker compose up` semua hijau. Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0f: rangka captive portal apps/portal (Preact)

**Yang dikerjakan:** Membuat rangka halaman login WiFi (captive portal) — halaman yang muncul saat siswa menyambung WiFi sekolah. Dibuat seringan mungkin karena harus cepat di HP murah & jalan dari Box. Berisi logo, kolom login (belum berfungsi — baru tampilan), info jam WiFi, dan indikator "server terhubung / mode lokal".

**File yang dibuat (semua di `apps/portal`):**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`.
- `src/main.tsx` (titik nyala), `src/app.tsx` (UI portal + cek `/health`), `src/style.css` (ringan, tanpa font eksternal), `src/vite-env.d.ts`.

**Keputusan kecil yang diambil:**
- Portal **TIDAK** memakai `@magnoo/shared` — paket itu membawa zod (berat) yang akan melanggar batas <200KB. Portal berdiri sendiri seramping mungkin (ADR-002).
- Indikator status dijalankan di sisi browser (client-side) — wajar untuk halaman statis yang juga di-serve dari Box.
- Tanpa font eksternal (syarat offline BAGIAN 9.3). Port preview = 3002. Alamat API via `VITE_API_URL`.

**Sudah dibuktikan jalan?** Ya — `vite build` hijau; total bundle **~15KB** (16.272 byte, ambang 200KB = 204.800 byte) → **jauh di bawah batas**; string `/health` terbukti tertanam di bundle (logika cek server ikut); `vite preview` melayani halaman dengan HTTP 200 & judul "Login WiFi Magnoo". typecheck hijau.

**Sudah di-commit?** Ya — `feat(portal): Preact captive portal skeleton, ~15KB, API health check (Fase 0f)`.

**Status:** Selesai (potongan 0f dari 10).

**Langkah berikutnya:** Potongan **0g** — rangka `apps/mobile` (Flutter). Flutter dipasang di potongan ini; bukti = ter-compile (tanpa emulator). Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0e: rangka web apps/web (Next.js)

**Yang dikerjakan:** Membuat rangka dashboard web. Ada satu halaman pembuka yang, saat dibuka, otomatis "menyapa" backend dan menampilkan apakah API terhubung — pakai warna identitas Magnoo. Tujuannya membuktikan web dan backend bisa saling bicara.

**File yang dibuat (semua di `apps/web`):**
- `package.json`, `next.config.mjs` (transpile `@magnoo/shared`), `tsconfig.json`.
- `app/layout.tsx`, `app/page.tsx` (halaman status, dirender di server agar bisa dibuktikan via curl), `app/globals.css` (warna identitas: ink/magnet-red/field-blue/gold/paper).
- `.gitignore`: tambah `next-env.d.ts`.

**Keputusan kecil yang diambil:**
- Halaman status dibuat **server-side** (`dynamic = force-dynamic`) supaya statusnya nyata saat diminta dan bisa diverifikasi tanpa browser.
- **Tailwind + shadcn/ui DITUNDA** ke Fase 1 (saat layar dashboard asli dibangun). Di 0e cukup CSS ringan — hindari menambah perkakas yang belum dipakai ("jangan optimasi prematur", BAGIAN 17).
- Web menyambung ke `@magnoo/shared` (memakai `API_PREFIX`) — bukti monorepo terhubung.
- Port web = 3001 (API = 3000), alamat API via env `API_URL` (default `http://localhost:3000`).

**Sudah dibuktikan jalan?** Ya — `next build` hijau (4 halaman). Web + API dijalankan bersama; `curl http://localhost:3001` mengembalikan HTML berisi "API terhubung" dan `magnoo-api`, HTTP 200. Artinya halaman benar-benar memanggil `/health` backend dan memantulkan hasilnya.

**Sudah di-commit?** Ya — `feat(web): Next.js skeleton with server-side API health status page (Fase 0e)`.

**Status:** Selesai (potongan 0e dari 10).

**Langkah berikutnya:** Potongan **0f** — rangka `apps/portal` (captive portal Preact, target <200KB) + cek status. Menunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 0d: database (Prisma + skema BAGIAN 6 + migrasi pertama)

**Yang dikerjakan:** Memberi bentuk nyata pada database. Menyalakan PostgreSQL (lewat Docker), menuliskan seluruh "denah" tabel sesuai BAGIAN 6 (sekolah, user, kelas, absensi, izin, pengumuman, poin, kuis, reward, mitra, iklan, AI, alumni, lowongan, box, notifikasi, EWS, startup), lalu menjalankan "migrasi" pertama yang benar-benar membuat semua tabel itu. Backend kini punya penyambung ke database (`PrismaService`).

**File yang dibuat/diubah (semua di `apps/api`):**
- `prisma/schema.prisma` — 38 tabel + 32 enum (BAGIAN 6.1–6.3).
- `prisma/migrations/20260614040151_init/` — migrasi pertama (di-commit).
- `src/prisma/prisma.service.ts` + `prisma.module.ts` (global) — penyambung DB.
- `src/app.module.ts` — pasang `PrismaModule`.
- `src/config/env.ts` — `DATABASE_URL` jadi wajib.
- `package.json` (deps `prisma` + `@prisma/client`, skrip), `.env.example`, `.env` (lokal, tidak di-commit).

**Keputusan kecil yang diambil (mudah diubah, dicatat agar tidak ditebak ulang):**
- **PII siswa NOL di cloud** (ADR-005): tabel `User` tanpa nama/NIS/tgl-lahir siswa; `displayName` null untuk siswa. Tabel Box 6.4 (`student_pii` dll) sengaja DITUNDA ke Fase 3.
- UUID dibuat di sisi aplikasi (`@default(uuid())`) alih-alih `gen_random_uuid()` DB — setara fungsinya, lebih sederhana. (lihat Utang)
- Waktu disimpan sebagai `timestamp` biasa, diperlakukan UTC di aplikasi (bukan `timestamptz`). (lihat Utang)
- Beberapa enum yang nilainya tidak dirinci spec diisi wajar: `RewardType`, `RedemptionStatus`, `PartnerStatus`, `JobStatus`.
- Relasi keras hanya `School ↔ Device` (dicontohkan spec); referensi lain = ID string biasa demi batas modul (ADR-003).

**Sudah dibuktikan jalan?** Ya: `prisma migrate dev --name init` sukses; database berisi **38 tabel + 32 enum** (dihitung dari `information_schema`); Prisma Client menyambung & `school.count()` = 0, `user.count()` = 0; server NestJS boot dengan `PrismaModule` termuat dan `/health` HTTP 200; typecheck + `nest build` hijau.

**Sudah di-commit?** Ya — `feat(api): full BAGIAN 6 Prisma schema, first migration, PrismaService (Fase 0d)`.

**Status:** Selesai (potongan 0d dari 10).

**Langkah berikutnya:** Potongan **0e** — rangka `apps/web` (Next.js) + halaman cek status API. Menunggu aba-aba pemilik.

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