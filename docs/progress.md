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

- **⚠️ KONSTITUSI DIPERBARUI (2026-06-19): `aplikasi.md` v1.3 → v1.4** — Ditambah **BAGIAN 12B (Adendum Roadmap Engagement/Karier/Wellness)**: 10 fitur (F1–F10) + 5 ADR-baru placeholder, dipetakan ke fase+guardrail+status buildable/gated. **Fase 0–8, 12A, ADR-001..008 TIDAK berubah.** Sumber detail: `docs/refs/konsep-engagement-karier.md`. F7 (dashboard kepsek) **diselesaikan jadi berpusat-siswa/kelas** (13.6 tetap utuh). + Filosofi Desain Inti & F11–F14 (BK, TU, Ruang Kreasi UGC, sambungan Startup→investor) — semua gated. Item uang/showcase-anak/kesehatan tetap gated (ADR+hukum). Tidak mengubah pekerjaan Fase 2 berjalan.

- **⚠️ KONSTITUSI DIPERBARUI (2026-06-19): `aplikasi.md` naik v1.2 → v1.3 — TAMBAL CELAH FASE 2.** Hasil audit agen `magnoo-architect` (3 BLOCKER + 2 ringan). Ditambah **BAGIAN 12A — Adendum Spec Fase 2 (mengikat)**: koordinat+CIDR WiFi sekolah (A-1), model `DeviceToken`+`/me/devices` utk FCM (B-1), pemutus izin=wali kelas+SCHOOL_ADMIN (C-2), token QR TOTP server-side + anti-replay/foto (A-2/3), state machine izin (C-1), pengetatan notif/izin/pengumuman + 7 kode error baru. Detail & sumber: `docs/refs/fase2-grounding.md`. Backup: `_backup/aplikasi.SEBELUM-tambalfase2.*.md`. **Spec Fase 2 kini "siap dibangun lurus".** ADR & fase 0–8 tidak berubah.
- **⚠️ KONSTITUSI DIPERBARUI (2026-06-19): `aplikasi.md` naik v1.1 → v1.2.** Sinkron dari **Big Blueprint v2** (dokumen STRATEGI, disimpan di `01-Strategi/magnoo-big-blueprint-v2.html`). **Hanya 2 tambahan; FASE TEKNIS 0–8 & semua ADR TIDAK BERUBAH:** (1) subbagian **1.1 Visi Jangka Panjang (5 Lapisan)** — konteks arah bisnis (Sekolah → OOH/Layar → Platform OOH → Programmatic → Data Marketplace); lapisan 2–5 BELUM buildable (butuh ADR + kajian hukum tersendiri). (2) **Guardrail 13.13 — Tembok Pemisah Data Anak**: data anak/sekolah tak pernah jadi produk iklan/OOH/data-marketplace; lapisan 2–5 hanya boleh data agregat/anonim & sumber non-anak. Backup pra-sinkron: `_backup/aplikasi.SEBELUM-sinkron-v2.*.md`. **Tidak berdampak ke Fase 2.**
- **⚠️ KONSTITUSI DIPERBARUI (2026-06-17): `aplikasi.md` naik v1.0 → v1.1.** Pemilik mengirim revisi via Telegram bot. **Satu-satunya perubahan isi:** modul **Startup Center (Fase 8)** diperluas dari kerangka dasar jadi modul penuh — 6 model data baru (IdeaSupport, IdeaComment, Competition, CompetitionEntry, MentorProfile, MentorSession) + StartupIdea diperluas, ~30 endpoint, layar mobile (tab Startup Siswa & Guru, tab Mentor Alumni), dashboard web Sekolah & HQ, aturan bisnis **10.12**, ThreadType `STARTUP_ROOM`, 2 cron job baru. **Fase 0–7 TIDAK berubah** → tidak berdampak ke pekerjaan saat ini (kita di ambang Fase 2). Versi lama dibackup di `_backup/aplikasi.20260617-083507.md`. Catatan revisi ada di header `aplikasi.md`.
- **Posisi sekarang:** Fase 0 ✅, **🎉 FASE 1 TUNTAS (1a–1k ✅)**. **FASE 2 berjalan (mode otonom) — 2a–2f ✅, 2g-1 ✅, 2h-pondasi ✅, 2i ✅, 2j ✅, 2k ✅ (semua backend Fase 2 lengkap; notif tinggal swap adapter saat Firebase).** 2a=pondasi data. 2b=verifikasi lokasi (geofence+IP-CIDR, trust proxy=1, radius 150). 2c=token QR server-side (secret TOTP per-sekolah terenkripsi AES-256-GCM, period=30/digits=8/SHA256, `GET /attendance/qr/current`). 2d=check-in QR siswa (token+lokasi+double<5mnt+anti-replay, status PRESENT/LATE). 2e=status harian + koreksi absen (10.3/10.4). 2f=laporan kehadiran (me/class/school). 2g-1=registrasi device /me/devices ✅. 2i=izin/permit ✅. 2j=pengumuman ✅. 2k=thread ortu↔wali kelas ✅. 2h-pondasi notif ✅ (stub, siap-swap Firebase). **Berikutnya: 2l (web /school)** / 2m (mobile) / 2n (E2E+QA-4); 2h-nyata saat Firebase masuk.
- **Sedang menuju:** **FASE 2** (2a ✅ → 2b berikutnya) — Attendance (QR), Notifikasi (FCM nyata; WA stub), Izin, Pengumuman. Rencana potongan 2a–2n disusun arsitek (lihat entri "Potongan 2a"). DoD Fase 2: scan QR→notif <60dtk, rule 10.2–10.4 ada unit test, QA-4 lulus.
- **Uji E2E Fase 1:** `pnpm --filter @magnoo/api test:e2e` (`test/e2e/fase1.e2e.ts`) — butuh backend hidup (`PORT=3100`) + Postgres/Redis; OTP dibaca dari log server (`E2E_API_LOG`). 23 cek lulus.
- **Catatan QA visual:** web diuji via Playwright+Chrome; mobile (Flutter) via `flutter analyze` + 5 widget test + `flutter build web` + screenshot. Server lokal uji: backend `PORT=3100`, web `next start -p 3005`, flutter web `python3 -m http.server 3007` di `build/web`.
- **QA visual web:** Playwright + Chrome-for-Testing terpasang manual di `/opt/cft/chrome-linux64/chrome` (CDN Playwright keblokir firewall). Pakai `executablePath` itu. Web dev lokal: `API_URL=http://localhost:3100 next start -p 3005` (port 3001 dipakai kontainer web compose lama).
- **Migrasi DB baru:** `20260616055242_student_import_job_and_nis_key` (tabel `ImportJob` + kolom `School.nisKey` untuk penyamaran NIS per sekolah). Sudah diterapkan ke DB dev. (Sebelumnya: `20260615123600_device_pairing_token_expiry`, `20260614141855_session_prev_refresh_hash`.)
- **Keputusan NIS sudah DIAMBIL (2026-06-14):** NIS siswa **DISAMARKAN** di cloud (hash berkunci per sekolah jadi `User.username`), NIS mentah TIDAK pernah disimpan di cloud. Detail di "Keputusan Penting" di bawah. *Penerapan transform NIS→samaran masih menyusul di 1f (impor) & disambung ke login; saat ini login siswa mencocokkan `username` apa adanya + butuh `schoolId`.*
- **Bukti terakhir yang berjalan (1h):** consent & audit diuji **end-to-end ke server+DB nyata** (port 3100, 2 sekolah): grant consent (GENERAL_DATA, evidenceRef tersimpan) ✅; consent aktif ganda tipe sama → **CONFLICT 409** ✅; list + filter subjectUserId/type ✅; **IDOR lintas sekolah → 404** (grant & list) ✅; `GET /school/audit-log` memuat CONSENT_GRANT, **ter-scope** (entri sekolah B tak muncul di A), tanpa before/after, filter action + limit + limit-invalid 400 ✅; **RBAC:** guru → audit-log & grant consent = **403** ✅. Tes unit: api **86/86** (5 baru consent), shared 24/24. typecheck (4 proyek)/lint/build ✅. *(Bukti 1b–1g sebelumnya tetap berlaku.)*
- **Bukti 1g yang berjalan:** alur undangan ortu diuji **end-to-end ke server+DB nyata** (port 3100): admin generate kode utk 1 kelas → **3 kode** + **PDF batch (dengan QR)** ✅; ortu register → OTP (diambil dari log stub) → verify → **temp token** ✅; link anak #1 (temp token) → akun ortu dibuat (role PARENT, phone, schoolId anak) + ParentLink ACTIVE + kode ditandai terpakai ✅; kode dipakai-ulang → **INVITE_CODE_USED** ✅; ortu set password via **forgot→OTP→reset** → login phone+password (role PARENT) ✅; link anak #2 (token penuh) → tertaut 2 anak ✅; sudah-tertaut → **PARENT_ALREADY_LINKED (409)**, revoked/expired/invalid → ditolak benar ✅; audit INVITE_GENERATE & PARENT_LINK_CHILD tercatat ✅. Tes unit: api **81/81** (9 baru: OTP 7, PDF 2), shared 24/24. typecheck (4 proyek)/lint/build ✅. *(Bukti 1b–1f sebelumnya tetap berlaku.)*
- **Bukti 1f yang berjalan:** impor XLSX diuji **end-to-end terhadap server + DB nyata** (port 3100, worker in-process aktif): admin login → unggah file **505 baris (500 valid + 5 rusak)** → job COMPLETED dengan total 505 / succeeded 500 / **created 500** / failed 5 ✅; 5 jenis error tertangkap (NIS kosong/format/ganda-dalam-file, kelas tak ada, nama kosong) ✅; **DB: 500 siswa, username = samaran 64-hex, displayName/phone/email NULL, nol NIS mentah** ✅; `nisKey` sekolah dibuat saat impor pertama ✅; `credentials.csv` (500 baris) sekali-unduh — unduh kedua **404** ✅; `errors.csv` (5 baris) ✅; **idempotensi:** unggah file sama lagi → created **0**, succeeded 500 (di-update), jumlah siswa tetap **500** (tak menggandakan) ✅; audit `IMPORT_COMPLETE` ×2 ✅. Tes unit: api **72/72** (23 baru: pseudonym 6, validasi 11, xlsx 6), shared 24/24. typecheck (4 proyek)/lint/build ✅. *(Bukti 1b–1e sebelumnya tetap berlaku.)*
- **GitHub:** ✅ **SUDAH ter-push (2026-06-19)** ke `git@github.com:adamwub/magneo-project.git` (branch `main`, 36 commit). Backup off-site beres. **Cara tembus:** HTTPS ke GitHub tetap diblok (TLS-SNI di-drop level ISP — `gh` & `git https` mati), tapi **SSH JALAN** (port 22 & SSH-over-443). Server pakai SSH key `~/.ssh/id_ed25519` (sudah terdaftar di akun `adamwub`). Push berikutnya cukup `git push`. Catatan: `gh` CLI (pakai api.github.com HTTPS) tetap nggak bisa dari server ini → buat repo/PR lewat web atau dari laptop.
- **Catatan infra:** PostgreSQL dev kini lewat **compose resmi** (`infra/docker-compose.dev.yml`), volume bernama `magnoo-postgres-data` → **data persisten**. Nyalakan semua: `pnpm dev:infra` (atau `docker compose -f infra/docker-compose.dev.yml up --build`); matikan: `pnpm dev:infra:down`. API otomatis `prisma migrate deploy` saat start. Kontainer Postgres lama yang berdiri sendiri sudah dihapus (digantikan compose).
- **Commit terakhir:** lihat `git log --oneline` (1a = `feat(shared): Fase 1 auth & school schemas`).
- **Tanggal sesi terakhir:** 2026-06-17.
- **Peta lengkap potongan Fase 0:** lihat bagian "🧱 RENCANA FASE 0" di bawah (centang = selesai).
- **Catatan lingkungan:** perkakas (Git/Node20/pnpm9/Docker) terpasang. **Flutter 3.44.2 terpasang di `/opt/flutter`** — sesi baru WAJIB tambahkan ke PATH: `export PATH="/opt/flutter/bin:$PATH"` (dan `git config --global --add safe.directory /opt/flutter`). Dokumen "manusia" (21 file) tertata di folder `00–05` DI LUAR repo ini; folder coding dijaga bersih.

-----

## 📋 PETA FASE (centang saat selesai — sumber: aplikasi.md BAGIAN 12)

- [x] **Fase 0** — Pondasi: kerangka monorepo, database, CI/CD
- [x] **Fase 1** — Akun & pintu masuk: login semua peran, impor siswa, kode undangan ortu
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
- [x] **1d** Sesi & peran — batas perangkat (siswa 2 / lain 3), refresh reuse-detection→revoke semua, role-switch (linkRoles), list/revoke sesi
- [x] **1e** Provisioning — HQ buat sekolah, pairing token Box, akun admin (sekali tampil), setting sekolah, CRUD kelas, wizard kenaikan kelas (preview→confirm)
- [x] **1f** Impor XLSX — job BullMQ + validasi per-baris + laporan error ramah + idempotent + **penyamaran NIS** (hash berkunci per sekolah)
- [x] **1g** Undangan ortu — kode undangan + PDF batch (render server), register ortu + OTP (WA = adapter stub/log), verify-otp, link anak
- [x] **1h** Consent & audit — arsip ConsentRecord + audit-log (append-only ditegakkan di service)
- [x] **1i** Web — `/hq` wizard provision + `/school` Pengguna & Kelas
- [x] **1j** Mobile — login + first-login semua peran + OTP ortu & link anak
- [x] **1k** Uji E2E + QA — HQ buat sekolah → impor 500 siswa (ada baris rusak) → siswa login → ortu register & link. Gate QA-1 & QA-2

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

## 2026-06-19 — Fase 2 / Potongan 2h (pondasi): Pipeline notifikasi (mode STUB) + wiring check-in

**Yang dikerjakan:** Pondasi pengiriman notifikasi (11.2/12A.2), siap nyala begitu Firebase masuk. Sekarang mode **STUB** (belum kirim nyata) tapi sudah tercatat & ter-wiring — saat service account FCM tersedia, tinggal ganti 1 provider.

**File (apps/api/src/modules/notification/):** `push-sender.ts` (baru: interface `PushSender` + `StubPushSender` enabled=false + token `PUSH_SENDER` — seam FCM), `notification.service.ts` (baru: dedup Redis NX EX 86400, kirim ke DeviceToken aktif, cabut token mati, log `NotificationLog`, payload **tanpa PII**), `notification.module.ts` (+NotificationService, provider PUSH_SENDER=Stub). Wiring: `attendance.service.ts` checkin → `notifyCheckin` (ke semua ortu ParentLink ACTIVE, dedup per siswa+tanggal). Tanpa migrasi.

**Bukti:** 5 tes notif (stub→QUEUED, payload non-PII, dedup, notifyCheckin per-ortu, token-mati→FAILED+dicabut); check-in tetap 8/8; **full api 173/173** (26 file, nol regresi); typecheck ✅.
**Audit security: PASS (AMAN)** — stub jujur, payload bebas PII, token aman & tak di-log, dedup & wiring benar (notif hanya setelah event IN valid, bukan saat double-silent).

**Sisa untuk 2h-nyata (saat Firebase owner masuk):** ganti `StubPushSender`→`FcmPushSender` (firebase-admin). **Peringatan WAJIB (dari audit):** service account via vault/env (gitignore, jangan commit); JANGAN log token/payload PII; cabut token hanya untuk UNREGISTERED/INVALID (bukan error transien); retry/backoff via BullMQ (bukan loop sinkron — jaga DoD <60dtk); teks tetap dirakit klien via templateKey; WA fallback hanya kategori kritis (check-in rutin TIDAK memicu WA). Utang LOW: tambah deeplink/type/entityId di payload.

**Status:** Selesai & terbukti (pondasi). **Notif <60dtk akan AKTIF begitu Firebase masuk** (swap 1 provider). Berikutnya: 2l (web /school) / 2m (mobile) / 2n (E2E+QA-4).

-----

## 2026-06-19 — Fase 2 / Potongan 2k: Thread ortu↔wali kelas (PARENT_HOMEROOM, 10.7/12A.5)

**Yang dikerjakan:** Kanal pesan ortu↔wali kelas — aman & tercatat, tanpa siswa (guardrail 13.5).

**File (apps/api/src/modules/comms/):** `thread.service.ts` (baru), `thread.controller.ts` (baru), `comms.module.ts` (+Thread). `packages/shared/src/thread.ts` (baru) + index. Pakai model `Thread`/`Message`. Tanpa migrasi.
- `POST /threads` — ortu (ParentLink ACTIVE) mulai thread dengan wali kelas anaknya; peserta = [ortu, wali kelas]; pesan pertama dari templateKey.
- `POST /threads/:id/messages` & `GET /threads/:id/messages` — **hanya peserta**, **hanya tipe PARENT_HOMEROOM** (CLASS_ROOM/APPLICATION ditolak di Fase 2), **STUDENT ditolak** (13.5).
- `GET /threads` — daftar thread peserta. Semua pesan tercatat (Message append-only).

**Bukti:** 8 tes (start ortu-link/no-link/no-wali/non-ortu; send peserta/non-peserta/tipe-salah/siswa-ditolak); **full api 168/168** (25 file, nol regresi); typecheck ✅; shared build ✅.
**Audit security: PASS (AMAN)** — 13.5 berlapis (tipe dikunci, siswa ditolak controller+service, peserta hardcode ortu+wali, pesan terlog), IDOR tertutup (ParentLink + keanggotaan), nol PII anak, append-only.

**Utang (dari audit) → Ide & Utang:** (MED) tulis AuditLog THREAD_START/MESSAGE_SEND; (MED) tambah assert `thread.schoolId===actor.schoolId` (defense-in-depth lintas sekolah); (LOW) batasi panjang `body` (z.max).

**Status:** Selesai & terbukti. **Backend Fase 2 inti praktis lengkap** (absensi, izin, pengumuman, thread). Sisa: **2g-2/2h push FCM** (nunggu Firebase owner), **2l web /school**, **2m mobile**, **2n E2E + QA-4**. Berikutnya autopilot: 2l (web) atau 2h saat Firebase siap.

-----

## 2026-06-19 — Fase 2 / Potongan 2j: Pengumuman (scope×role + retract 10.6/12A.4)

**Yang dikerjakan:** Pengumuman sekolah/kelas/angkatan/ortu dengan kontrol siapa boleh kirim ke siapa, dan bisa ditarik dalam 15 menit.

**File (apps/api/src/modules/comms/):** `announcement.service.ts` (baru), `announcement.controller.ts` (baru), `comms.module.ts` (+Announcement). Pakai model `Announcement` + skema shared (2a). Tanpa migrasi.
- `POST /announcements` — scope×role **12A.4 (mengikat)**: CLASS=TEACHER(kelas yang dia-homeroom)+SCHOOL_ADMIN; GRADE/SCHOOL/PARENTS=SCHOOL_ADMIN/PRINCIPAL. Pelanggaran → `ANNOUNCEMENT_SCOPE_FORBIDDEN`. (Usulan F5 guru→ortu **TIDAK** diterapkan — PARENTS tetap admin/kepsek; F5 nunggu approval terpisah.)
- `POST /announcements/:id/retract` — penulis/admin, conditional updateMany (≤15 mnt) → `ANNOUNCEMENT_RETRACT_EXPIRED`; AuditLog `ANNOUNCEMENT_RETRACT`.
- `GET /announcements` — audiens: siswa (SCHOOL/kelas/angkatannya), ortu (anak ber-ParentLink), staf (sekolahnya). Pengiriman push = nanti (pipeline FCM).

**Bukti:** 8 tes (scope×role: CLASS wali/non-wali, SCHOOL guru-ditolak/admin-ok, GRADE tanpa scopeIds; retract in-window/expired/non-author; filter audiens siswa); **full api 160/160** (24 file, nol regresi); typecheck ✅.
**Audit security: PASS (AMAN)** — scope×role tak bisa di-bypass, retract atomik, isolasi lintas-sekolah, tembok PII anak utuh, append-only audit. F5 benar tak diterapkan.

**Utang (LOW, dari audit) → Ide & Utang:** (1) validasi `scopeIds` GRADE (angka grade ada di sekolah) & PARENTS-filter-kelas (classId milik sekolah); (2) kecocokan GRADE bergantung stringify — tambatkan validasi numerik; (3) list siswa/ortu filter in-memory (take 200→slice 100) — pindah ke query Prisma bila sekolah ramai.

**Status:** Selesai & terbukti. **Berikutnya: 2k** (Thread PARENT_HOMEROOM) — buildable. Lalu 2g-2/2h (push FCM) saat Firebase owner siap, dan 2l/2m (web/mobile), 2n (E2E+QA-4).

-----

## 2026-06-19 — Fase 2 / Potongan 2i: Izin/Permit (workflow + state machine 10.3/12A.3)

**Yang dikerjakan:** Alur izin lengkap. Siswa/ortu ajukan → wali kelas/admin putuskan → izin APPROVED otomatis ubah status kehadiran harian.

**File (apps/api/src/modules/comms/):** `permit.service.ts` (baru), `permit.controller.ts` (baru), `comms.module.ts` (diisi; import AttendanceModule utk DailyStatusService). Pakai model `Permit`+`ParentLink` & skema shared `permit.ts` (2a) — tanpa migrasi.
- `POST /permits` — siswa (untuk diri, studentUserId dari sesi) / ortu (anak ber-ParentLink ACTIVE); tolak tumpang-tindih → `PERMIT_DUPLICATE`.
- `POST /permits/:id/decision` — wali kelas (homeroom) + SCHOOL_ADMIN sekolah-sama; **state machine** conditional `updateMany where status=SUBMITTED` (idempoten/anti-race); transisi ilegal → `PERMIT_INVALID_TRANSITION`; **APPROVED → recompute DailyAttendanceStatus per tanggal** (10.3); AuditLog `PERMIT_DECIDE` before/after.
- `POST /permits/:id/cancel` — pembuat, selama SUBMITTED. `GET /permits?scope=me|class|child`.

**Bukti:** 10 tes (create siswa-self/ortu-link/no-link/duplicate; decide approve+recompute/reject/non-wali/sudah-diputus; cancel pembuat/non-pembuat/non-submitted); **full api 152/152** (23 file, nol regresi); typecheck ✅.
**Audit security: PASS (AMAN)** — state machine benar, RBAC/IDOR aman (siswa=sesi, ortu=ParentLink, decide=homeroom+sekolah, list ter-scope), anti-duplikat, append-only audit, nol PII.

**Utang (dari audit):** (1) **2m: validasi `attachmentUrl` = presign milik sekolah** (anti-SSRF/phishing; size≤5MB, mime jpg/png/pdf) — sekarang `z.string()` disimpan apa adanya (tak di-fetch, jadi tak ada SSRF di 2i). (2) idempotensi: keputusan ulang status terminal sekarang balas 409, spec 12A.3 mau 200-no-op — konfirmasi owner. (3) validasi panjang rentang tanggal di zod (batas 92 hari).

**Status:** Selesai & terbukti. **Berikutnya: 2j** (Pengumuman: CRUD + scope×role + retract 15mnt) — buildable tanpa Firebase. (2g-2/2h notif tetap nunggu Firebase owner.)

-----

## 2026-06-19 — Fase 2 / Potongan 2g (bagian-1): Registrasi device push (/me/devices)

**Yang dikerjakan:** Endpoint daftar/cabut token push FCM (12A.2). `POST /me/devices` (upsert by token, diikat `user.sub`, set lastSeenAt, reset revokedAt) & `DELETE /me/devices/:token` (hapus hanya token milik pemanggil). Mengisi modul `notification` (stub→aktif).

**File:** `apps/api/src/modules/notification/{device.service.ts, device.controller.ts, notification.module.ts}` + tes `device.service.test.ts`. Pakai model `DeviceToken` (2a) — tanpa migrasi.

**Bukti:** 3 tes (register upsert+ikat userId; remove filter userId; token orang-lain→removed:false); **full api 142/142** (22 file, nol regresi); typecheck ✅. Inline review: token diikat sesi (bukan body), hapus difilter userId (nol IDOR), token tak di-echo → AMAN.

**DITUNDA (butuh input owner): kirim push FCM nyata.** Perlu **service account Firebase (FCM)** dari owner + dependency `firebase-admin`. Begitu owner sediakan kredensial, bagian-2 (queue `notifications` + adapter FCM + NotificationLog + dedup + WA stub) dibangun → ini yang memenuhi DoD "<60 dtk". Sampai itu, registrasi device sudah siap menampung token.

**Status:** Selesai (bagian-1). **Berikutnya: 2g bagian-2 / 2h** menunggu kredensial FCM owner; sementara autopilot bisa lanjut potongan lain bila ada.

-----

## 2026-06-19 — Fase 2 / Potongan 2f: Laporan kehadiran (me/class/school)

**Yang dikerjakan:** 3 endpoint baca laporan kehadiran dari `DailyAttendanceStatus` (materialized 2e).
- `GET /attendance/me?month=YYYY-MM` [STUDENT diri sendiri] — rekap sebulan.
- `GET /attendance/class/:classId?date=` [TEACHER wali kelas / SCHOOL_ADMIN, @Scope class] — rekap kelas; siswa tanpa catatan → ABSENT_NO_INFO.
- `GET /attendance/school/summary?date=` [PRINCIPAL / SCHOOL_ADMIN, @Scope school] — jumlah per status + total.

**File:** `attendance-read.service.ts` (baru) + 3 endpoint di `attendance.controller.ts` + `attendance.module.ts`; `packages/shared/src/attendance.ts` (+query & response schema: month/date, mine/class/summary).

**Privasi (ADR-005 / 13.2):** respons cloud **TANPA nama/NIS** — hanya `userId` pseudonim + status (+firstInAt). Tes membuktikan baris kelas cuma `{userId,finalStatus,firstInAt}`. Nama asli hanya di Box (Fase 3).

**Bukti:** 3 tes read service (filter bulan, default ABSENT_NO_INFO + nol field nama, summary counts+total); **full api 139/139** (21 file, nol regresi); typecheck ✅; shared build ✅. Tanpa migrasi.
**Audit:** agen masih berisiko API 529 → **review INLINE**: konformansi cocok spek BAGIAN 8.2 (662–665); IDOR aman (semua identifier dari JWT/@Scope, bukan body); nol PII. Re-run agen saat infra pulih.

**Status:** Selesai & terbukti. **Berikutnya: 2g** (registrasi device `/me/devices` + queue notifikasi + FCM nyata). Mode otonom.

-----

## 2026-06-19 — Fase 2 / Potongan 2e: Status harian + koreksi absen (rule 10.3/10.4)

**Yang dikerjakan:** Menghitung status kehadiran harian tiap siswa (10.3) + endpoint koreksi absen guru/admin (10.4).

**File (apps/api/src/modules/attendance/):**
- `daily-status.service.ts` (baru) — `computeDailyFinalStatus()` MURNI (10.3: IN pertama→PRESENT/LATE; permit APPROVED override SICK→SICK / lainnya→PERMIT per 12A.1; tanpa keduanya→ABSENT_NO_INFO; koreksi terbaru menang atas IN) + `DailyStatusService.recompute()` upsert `DailyAttendanceStatus`.
- `corrections.service.ts` (baru) — RBAC TEACHER (wali kelas) / SCHOOL_ADMIN sekolah-sama; jendela **≤H+3** (waktu sekolah, tolak masa depan); buat `AttendanceEvent` CORRECTION; AuditLog `ATTENDANCE_CORRECT` before/after; recompute.
- `school-time.ts` (+`daysBetweenSchoolDates`); `attendance.controller.ts` (+`POST /attendance/corrections`); `attendance.service.ts` (check-in panggil `daily.recompute()` tiap event); `attendance.module.ts`; `packages/shared/src/attendance.ts` (+`attendanceCorrectionRequestSchema`).

**Bukti:** 14 tes baru (daily-status 7 + corrections 7); **full api 136/136** (20 file, nol regresi); typecheck ✅; shared 31/31. Tanpa migrasi (model sudah ada).
**Audit:** agen arsitek+security kena **API 529 2×** → **review INLINE (mandor)**: konformansi 10.3/10.4 PASS; keamanan AMAN (RBAC koreksi solid, audit append-only, nol PII anak, recompute idempoten, permit APPROVED-only). Re-run agen saat infra pulih.

**Ditunda (sah) ke 2f/2h:** cron `recompute-daily-status` 09:05 & 16:00 (penjadwalan per-timezone) + notif "pulang lebih awal"/ABSENT_NO_INFO (butuh modul notifikasi 2g/2h). `lastOutAt` sudah disiapkan.

**Status:** Selesai & terbukti. **Berikutnya: 2f** (read endpoints: /me, /class, /school summary). Mode otonom.

-----

## 2026-06-19 — Fase 2 / Potongan 2d: Check-in QR siswa (rule 10.2 inti)

**Yang dikerjakan:** Endpoint absen siswa `POST /attendance/qr/checkin` (rule 10.2 / 12A.1). Siswa scan QR → server cek: token TOTP valid (2c) → lokasi (GPS dalam radius ATAU IP WiFi sekolah, 2b) → kalau baru absen <5 mnt lalu diabaikan diam-diam (sukses) → anti-replay (token sekali pakai) → catat kehadiran IN dengan status PRESENT/LATE. Waktu & status dihitung dari jam SERVER (timezone sekolah).

**File dibuat/diubah (di apps/api/src/modules/attendance/):**
- `attendance.service.ts` (baru) — orkestrasi check-in: token→lokasi→double<5mnt→anti-replay(Redis SET NX EX 90 `attreplay:{schoolId}:{userId}:{step}`)→buat AttendanceEvent IN.
- `school-time.ts` (baru) — `schoolLocalTime` (UTC→timezone sekolah via Intl) + `presentOrLate` (vs late_cutoff). Tanpa lib tanggal.
- `attendance.controller.ts` — `POST qr/checkin` @Roles("STUDENT"), pakai `req.ip` (trust proxy=1, BUKAN XFF mentah).
- `attendance.module.ts` — daftarkan AttendanceService.

**Bukti & audit:**
- Test: 12 baru (`attendance.service` 8 cabang: token invalid/lokasi-required/out-of-area/lulus-GPS/lulus-IP/double-silent/replay-ditolak/no-schoolId; `school-time` 4). **Full api suite 122/122** (18 file, nol regresi); typecheck ✅. (Tak ubah DB/migrasi.)
- Audit: arsitek-konformansi **PASS** (urutan 10.2 benar, anti-replay per step, occurredAt server, fail-closed, nol scope-creep — tak sentuh recompute/notif). Security & simplifier: **agen kena API 529 (overload) 2×** → dilakukan **review security INLINE** (mandor): AMAN — IP=req.ip, anti-replay per-step deterministik, occurredAt server, nol PII, RBAC tutup lintas-user, fail-closed. **Disarankan re-run agen security saat infra pulih.**

**Utang/peringatan:**
- (MED, 2n) belum ada **rate-limit** di endpoint checkin (anti brute-force token 8-digit). Risiko rendah (token tampil di gerbang + tetap harus lolos cek lokasi). Tambah ThrottlerGuard.
- (2e) **recompute DailyAttendanceStatus** belum dilakukan di sini (sesuai scope — 2d hanya buat event IN). 2e: hitung status harian + override permit + pulang-awal + cron.

**Status:** Selesai & terbukti (kode+tes; review security inline AMAN, agen ditunda krn 529). 2e=status harian + koreksi absen (10.3/10.4). 2f=laporan kehadiran (me/class/school). 2g-1=registrasi device /me/devices ✅. 2i=izin/permit ✅. 2j=pengumuman ✅. 2k=thread ortu↔wali kelas ✅. 2h-pondasi notif ✅ (stub, siap-swap Firebase). **Berikutnya: 2l (web /school)** / 2m (mobile) / 2n (E2E+QA-4); 2h-nyata saat Firebase masuk. Mode otonom.

-----

## 2026-06-19 — Fase 2 / Potongan 2c: Token QR server-side (TOTP terenkripsi)

**Yang dikerjakan:** Mesin token QR absensi yang aman (BAGIAN 10.2 / 12A.1). Tiap sekolah punya "kunci rahasia" TOTP yang **disimpan terenkripsi** di DB dan **tidak pernah** dikirim ke HP siapa pun; layar gerbang cuma menampilkan token 8-digit yang berganti tiap 30 detik via `GET /attendance/qr/current`.

**File dibuat/diubah:**
- `apps/api/src/common/crypto/aes-gcm.ts` (baru) — enkripsi AES-256-GCM (IV acak 12B ‖ tag 16B ‖ ciphertext), key dari env.
- `apps/api/src/modules/attendance/totp.ts` (baru) — TOTP HMAC-SHA256, period=30, digits=8, validate window=±1 (12A.1).
- `apps/api/src/modules/attendance/qr-token.service.ts` (baru) — secret per sekolah (dibuat acak `randomBytes(32)` saat pertama, simpan terenkripsi, anti-balapan); `current()` (token tanpa secret) + `validateToken()` (untuk 2d).
- `apps/api/src/modules/attendance/attendance.controller.ts` + `attendance.module.ts` (baru) — `GET /attendance/qr/current` (role SCHOOL_ADMIN/TEACHER/PRINCIPAL + scope school).
- `apps/api/prisma/schema.prisma` (+`School.qrTotpSecretEnc`) + migrasi `20260619052427_school_qr_totp_secret` (ALTER ADD COLUMN nullable — aditif).
- `apps/api/src/config/env.ts` (+`QR_TOTP_ENC_KEY`); `.env`/`.env.example`/compose diisi key dev.
- tes: `aes-gcm.test.ts` (6), `totp.test.ts` (6), `qr-token.service.test.ts` (5).

**Keputusan & konflik:** period TOTP — 10.2 (& daftar API) bilang "60 dtk" tapi **12A.1 (mengikat) = `period=30`** → pakai **30** (12A "perjelas 10.2", menang). Endpoint juga mengizinkan **PRINCIPAL** (selain SCHOOL_ADMIN/TEACHER) — read-only token publik, wajar; **flag ke owner** kalau mau dibatasi.

**Bukti & audit:**
- Test: 17/17 baru (kripto 6 + TOTP 6 + service 5); **full api suite 110/110** (nol regresi); typecheck ✅; migrasi aditif diterapkan; **data Fase 1 utuh** (users=11, schools=1).
- Audit: arsitek **PASS** (period 30 benar, secret tak ke klien, role wajar). Security **PASS/AMAN** (AES-GCM benar: IV acak per-enkripsi, auth-tag diverifikasi, key 32B tervalidasi; secret tak bocor ke response/log/DTO; RBAC tutup siswa & HQ; nol CRITICAL/HIGH). Simplifier **RAMPING** (nol dependency, pakai node:crypto).

**Utang (non-blocking, dari audit) — kerjakan terpisah/2d:**
- (MED, housekeeping) dev-secret di `infra/docker-compose.dev.yml` (termasuk `QR_TOTP_ENC_KEY` dev) ke-commit — pola lama (JWT/pepper dev juga). Sebaiknya eksternalkan SEMUA dev-secret ke `infra/.env.dev` (gitignore). PROD wajib via vault (sudah diwajibkan).
- (LOW) `school.service.listSchools` `findMany` tanpa `select` eksplisit — aman sekarang (toSchoolDto memfilter), tapi tambah `select` biar kolom `qrTotpSecretEnc`/`nisKey` tak mungkin bocor bila DTO berubah.
- (opsional) `validateTotp` pakai `===`; bisa `timingSafeEqual` (risiko rendah, token publik).
- **Peringatan 2d (check-in):** anti-replay pakai `(userId,schoolId,step)` cakup semua step window (token valid ~90 dtk); `occurredAt`=waktu server; rate-limit anti brute-force token; PII anak jangan di payload; append-only.

**Status:** Selesai & terbukti. **Berikutnya: 2d** (`POST /attendance/qr/checkin` — rule 10.2 inti: validasi token+lokasi+anti-replay, test-first). Mode otonom.

-----

## 2026-06-19 — Fase 2 / Potongan 2b: Verifikasi lokasi sekolah (geofence + IP WiFi)

**Yang dikerjakan:** Helper murni untuk memastikan siswa benar-benar di sekolah saat absen (BAGIAN 10.2 / 12A.1) — dipakai endpoint check-in nanti (2c). Aturan OR: lolos bila GPS dalam radius sekolah ATAU IP klien di jaringan WiFi sekolah.

**File yang dibuat/diubah:**
- `apps/api/src/modules/attendance/location.ts` (baru) — fungsi murni: `haversineMeters`, `isWithinRadius` (geofence), `ipv4ToLong`, `ipInCidr`, `isIpInAnyCidr` (cek IP ∈ CIDR WiFi). Tanpa I/O.
- `apps/api/src/modules/attendance/location.test.ts` (baru) — 7 tes (jarak Haversine, radius dalam/luar, CIDR /0…/32, octet invalid).
- `apps/api/src/main.ts` — `app.set("trust proxy", 1)` (NestExpressApplication) agar `req.ip` = IP asli klien yang dilihat Caddy (1 hop).
- `packages/shared/src/constants.ts` — default `qr_geo_radius_m` **300→150**.

**Keputusan & konflik spek (PENTING, untuk owner):**
- **Default radius: 10.1 menulis `300`, tapi 12A.1 (adendum MENGIKAT v1.3) menulis `150`.** Resolusi: **12A menang** (adendum mengikat + lebih spesifik + lebih baru) → default = **150 m** (lebih ketat anti-curang). Tetap bisa di-override per sekolah. Saran ke owner: tambahkan catatan silang di 10.1 (baris 878) agar tak membingungkan. *(Disetujui dua agen audit.)*
- **Sumber IP penegakan = `req.ip` (Express, trust proxy=1), BUKAN header XFF mentah.**

**Bukti & audit:**
- Test: util lokasi **7/7**; shared **31/31** (default baru tak memecah tes); typecheck api ✅.
- **Audit security menemukan BLOCKER (HIGH):** versi awal pakai `trust proxy: true` + helper `leftmostXff` → leftmost-XFF bisa dipalsukan klien (siswa dari rumah ngaku di WiFi sekolah) + cemar audit IP. **Diperbaiki:** `trust proxy=1`, `leftmostXff` **dihapus total**. **Re-audit security: PASS.** Arsitek-konformansi: PASS (radius 150 benar, OR-lokasi siap, nol scope-creep, Haversine/CIDR benar).

**Utang/peringatan WAJIB untuk 2c (dari audit):**
- Endpoint check-in: sumber IP = `req.ip` saja (jangan parse XFF). Validasi settings: **tolak `wifiCidrs` `/0`/overbroad**. Settings kosong (tak ada geo & wifiCidrs) → **fail-closed** `ATTENDANCE_LOCATION_REQUIRED`. TOTP secret server-side only. Anti-replay per (userId,step). Audit append-only tanpa PII/lat-lng presisi.
- Operasional: pastikan port app TIDAK pernah ter-expose langsung ke internet (hanya via Caddy) — syarat `trust proxy=1` aman.

**Status:** Selesai & terbukti. **Berikutnya: 2c** (token QR server-side: secret TOTP terenkripsi + `GET /attendance/qr/current`). Mode otonom — lanjut.

-----

## 2026-06-19 — Fase 2 / Potongan 2a: Pondasi data (DeviceToken + error codes + skema shared)

**Yang dikerjakan:** Membuka Fase 2 dari pondasi data (paling aman, tanpa logika bisnis) — seperti cara kita buka Fase 1. (1) Tambah model **DeviceToken** (12A.2, untuk token push HP ortu/FCM) + enum `Platform{ANDROID,IOS}` ke skema DB + migrasi. (2) Tambah **7 kode error** Fase 2 (12A.5). (3) Tambah skema data bersama (`packages/shared`): izin, pengumuman, registrasi device, token QR "current" (tanpa secret), serta koordinat sekolah (`geo`) + daftar CIDR WiFi (`wifi_cidrs`) di settings (12A.1). (4) Regen model Dart untuk HP.

**File yang dibuat/diubah:**
- `apps/api/prisma/schema.prisma` — enum `Platform` + model `DeviceToken{id,userId,token@unique,platform,lastSeenAt,createdAt,revokedAt?}` `@@index([userId])`.
- `apps/api/prisma/migrations/20260619041317_device_token_fase2/` — migrasi **aditif murni** (CREATE TYPE + CREATE TABLE + index; nol DROP/ALTER tabel lama).
- `packages/shared/src/errors.ts` — 7 kode (ATTENDANCE_INVALID_TOKEN/OUT_OF_AREA/LOCATION_REQUIRED, PERMIT_DUPLICATE/INVALID_TRANSITION, ANNOUNCEMENT_RETRACT_EXPIRED/SCOPE_FORBIDDEN).
- `packages/shared/src/enums.ts` — PERMIT_TYPES, PERMIT_STATUSES, ANN_SCOPES, PLATFORMS + ENUM_REGISTRY (Dart).
- baru: `packages/shared/src/{device,permit,announcement}.ts`; `attendance.ts` (+`qrCurrentResponseSchema`); `school.ts` (+`geo`,+`wifi_cidrs`); `index.ts` + `generate/registry.ts`.
- tes: `errors.test.ts` (+blok 7 kode), `fase2.test.ts` (baru, 6 tes).
- `apps/mobile/lib/generated/magnoo_models.dart` — ter-regen (23 model + 12 enum; model Fase 2 baru ada).

**Keputusan kecil:** Kunci settings pakai **snake_case** (`geo`, `wifi_cidrs`, `qr_geo_radius_m`) menyesuaikan konvensi settings existing (bukan camelCase spec) — kunci kanonik ini WAJIB dipakai pembaca settings di 2g/2h. FK `DeviceToken.userId` skalar tanpa relasi navigasi (konvensi skema repo).

**Sudah dibuktikan jalan?** Ya:
- `pnpm --filter @magnoo/shared test` → **31 lulus** (6 Fase 2 + 7-kode-error). typecheck+build shared hijau.
- Migrasi diterapkan (create-only→deploy, **tanpa seed**); tabel `DeviceToken` ada di DB; **data Fase 1 utuh** (users=11, schools=1 sebelum=sesudah).
- **typecheck api ✅, web ✅; flutter analyze mobile ✅** (model Dart baru kompilasi: No issues found).
- **Audit tim agen (read-only) sebelum commit:** arsitek-konformansi **LULUS 7/7** (cocok 12A, nol scope-creep, migrasi aditif); security **AMAN** (nol PII/secret/kredensial, nol pelonggaran Fase 1); simplifier **RAMPING** (nol dependency baru).

**Utang guardrail (WAJIB ditegakkan di potongan logika lanjut — dari audit security):**
- 2i (permit backend): `attachmentUrl` saat ini `z.string()` bebas → backend WAJIB anti-SSRF (allowlist host storage Magneo / terima object-key, jangan fetch URL klien) + presign berotorisasi & berdurasi pendek + cegah akses lintas-sekolah. RBAC putusan = wali kelas + SCHOOL_ADMIN; state machine + AuditLog.
- 2h (push/FCM): registrasi device diikat `userId` **sesi** (bukan body); payload/log FCM TANPA nama/NIS (13.2); jangan log token utuh; set `revokedAt` saat `UNREGISTERED`; jangan ekspos `token` di response list.
- 2j (announcement): tegakkan scope×role + retract ≤15 mnt + filter `schoolId` + AuditLog.

**Status:** Selesai & terbukti. **Berikutnya: 2b** (settings sekolah geo+wifi_cidrs+radius: endpoint + helper geofence Haversine + cek IP-in-CIDR + `trust proxy`). Menunggu aba-aba owner.

-----

## 2026-06-19 — Rebranding: Magnoo → Magneo (teks brand) + backup GitHub

**Latar:** Nama "Magnoo" ternyata sudah dipakai & semua domainnya habis. Owner memutuskan rebrand ke **Magneo** (akar "magn-" dipertahankan → logo/warna magnet tetap relevan; "neo" = baru). Domain target **`magneo.id`** (+ `magneo.ai` on-brand AI) — belum dibeli (langkah owner). Backronym publik: **M**agnet · **A**ttention · **G**rowth · **N**etwork · **E**ngine(AI) · **O**utreach (versi investor: "O" = OOH).

**Yang dikerjakan:** Ganti SEMUA teks-brand "Magnoo" (kapital) → "Magneo" di sumber UI/metadata: logo & judul web (dashboard-shell, layout, login, school), portal (logo + title WiFi), mobile (judul app, AppBar, login, deviceName, kelas `MagnooApp`→`MagneoApp`), teks PDF undangan ortu, log API, deskripsi package.json (web/api/portal), pubspec, komentar tema/schema/Caddyfile. Assertion widget test diikutkan.

**Yang SENGAJA TIDAK disentuh (jaga stack & data):** scope package `@magnoo/*`, nama container/volume Docker `magnoo-*`, project compose `magnoo-dev`, nama DB `magnoo`, health id `magnoo-api`, tmp dir `magnoo-imports`, folder repo `magnoo-project`, **password test/seed** (`Magnoo!2026`, `MagnooDemo#2026`, "SMK Magnoo Demo"), dan **serial Box `MAGNOO-0001`** (identifier hardware — keputusan label fisik device ada di owner; tidak ada validasi regex yang memaksanya). Ini bisa diganti terpisah nanti bila owner mau.

**Sudah dibuktikan jalan?** Ya:
- Mobile: `flutter analyze` → **No issues found**; widget test **5/5 lulus** (termasuk test "Login menampilkan brand" yang kini mengecek teks **'Magneo'**).
- Web: container `magnoo-web` di-**rebuild** dari sumber baru → **healthy**. Situs **live lewat Caddy**: `<title>Magneo Dashboard</title>` ✅, logo halaman login = **"Magneo"** ✅, **0** kemunculan "Magnoo" di HTML. HTTP `:2180`→200, HTTPS `:21443`→200 (via IP SNI), tanpa regresi.

**Catatan/utang:** (1) Build artifacts lama (`apps/web/.next`, `dist/`) masih memuat string lama tapi regenerate tiap build — diabaikan (gitignore). (2) Rebrand identifier teknis (package scope/DB/container) & serial Box ditunda — perlu downtime terencana + persetujuan, di luar scope "teks brand". (3) Author commit ke depan di-set `Magneo Owner`.

**Status:** Selesai & terbukti. (Pekerjaan rebranding, di luar urutan fase — tidak mengubah logika Fase 0–8.)

-----

## 2026-06-19 — Infra: akses publik app via reverse proxy Caddy (HTTP/HTTPS)

**Yang dikerjakan:** Supaya app Magnoo bisa dibuka dari luar (HP/internet), saya pasang "penjaga pintu depan" (reverse proxy **Caddy**) di server. Caddy duduk di port 80 (HTTP) & 443 (HTTPS) dan meneruskan tamu ke `web` (Next.js, port 3001). Backend (`api` 3000) dan database (Postgres/Redis) **tidak** dibuka ke luar — hanya web yang tampil. Karena belum ada domain, HTTPS pakai **sertifikat sementara buatan-sendiri** (self-signed) untuk IP `203.175.127.254` — browser akan kasih peringatan "tidak tepercaya", itu wajar; nanti diganti sertifikat resmi saat domain siap.

**File yang dibuat/diubah:**
- `infra/Caddyfile` *(baru)* — aturan proxy: `:80` & `:443` → `web:3001`; `tls internal` + `default_sni 203.175.127.254` (perlu karena akses via IP mentah tidak mengirim SNI).
- `infra/docker-compose.dev.yml` — tambah service `caddy` (image `caddy:2-alpine`, `restart: unless-stopped`, port 80/443, volume cert `magnoo-caddy-data`/`-config`).

**Keputusan kecil yang diambil:**
- Strategi TLS dipilih **self-signed dulu → Let's Encrypt DNS-01 saat domain siap** (atas persetujuan pemilik "ikut rekomendasi"). TIDAK pakai jalur "forward 80/443 standar" karena IP publik itu sudah penuh dipakai layanan lain (PVE, proxy Sahabat) → risiko bentrok.
- Hanya `web` yang diekspos; `api`/DB tetap internal.

**Sudah dibuktikan jalan?** Ya (sisi server):
- `http://localhost:80/` → **200**, body = HTML app Magnoo asli (`lang="id"`, Next.js, ~4.6 KB).
- `https://localhost:443/` (self-signed, `-k`) → **200**; cert SAN = `IP:203.175.127.254`, issuer = Caddy Local Authority.
- Container `magnoo-caddy` Up & listen `0.0.0.0:80,443`.

**Sisa langkah (di pemilik / router Mikrotik):** tambah 2 NAT dst-nat di router agar publik nyambung ke server `10.35.46.23`:
- `:2180 → 10.35.46.23:80` (HTTP), `:21443 → 10.35.46.23:443` (HTTPS). Setelah itu `http://203.175.127.254:2180` & `https://203.175.127.254:21443` bisa dibuka dari luar.

**Catatan/utang:** (1) Postgres & Redis masih bind `0.0.0.0` (aman dari internet karena router tak forward 5432/6379, tapi terbuka di LAN) — hardening nanti. (2) Filter Mikrotik rule aktif `drop forward → 149.154.161.0/24` (satu subnet Telegram) — kemungkinan tak ganggu bot (API di 149.154.167.x), tapi tersangka kalau bot ngadat. (3) Upgrade ke cert resmi (Let's Encrypt DNS-01) saat domain siap.

**Status:** Sisi server **selesai & terbukti**. Akses dari luar menunggu owner menambah NAT di router. (Pekerjaan infra, di luar urutan fase — tidak mengubah Fase 0–8.)

-----

## 2026-06-19 — Sinkron Big Blueprint v2 → aplikasi.md v1.2 (visi 5 lapisan + guardrail data anak)

**Yang dikerjakan:** Pemilik mengirim **Big Blueprint v2** (HTML, dokumen strategi/bisnis untuk CEO) via Telegram. Robot deep-analyze: ternyata ini **bukan spec teknis** — fase teknis yang disebutnya (0 Pondasi → 5 Kuis+Iklan) **persis sama** dengan `aplikasi.md`, jadi **tidak ada yang bentrok di sisi koding**. "Tambahan fase besar"-nya = **5 lapisan BISNIS** (Sekolah → OOH/Layar → Platform OOH → Programmatic DOOH → Data Marketplace nasional), arah tahun 2–5. Atas keputusan pemilik (2 pertanyaan dijawab): (1) catat visi sebagai konteks di `aplikasi.md` TANPA mengubah fase teknis; (2) pasang **tembok pemisah data anak** sebagai garis mati.

**File yang dibuat/diubah:**
- `01-Strategi/magnoo-big-blueprint-v2.html` — **(dipindah dari _inbox)** dokumen strategi, di luar repo coding.
- `aplikasi.md` — naik **v1.1 → v1.2**; +catatan revisi header; +subbagian **1.1 Visi Jangka Panjang (5 Lapisan)** (ditandai KONTEKS, bukan scope build); +**guardrail 13.13 Tembok Pemisah Data Anak**. Fase 0–8, 8 ADR, model data, API — semua tidak berubah.
- `_backup/aplikasi.SEBELUM-sinkron-v2.20260619-073052.md` — backup pra-sinkron.

**Keputusan penting (pemilik, 2026-06-19):** Lapisan bisnis 2–5 (OOH/iklan/data) **BELUM buildable** — tiap lapisan butuh ADR + kajian hukum (PDP/PSE) tersendiri. **Data anak/sekolah TIDAK PERNAH jadi produk iklan/data** (guardrail 13.13, memperkuat 13.2 & 13.4); produk lapisan 2–5 hanya boleh data agregat/anonim & non-anak.

**Sudah dibuktikan?** Ya — verifikasi struktur: header v1.2 ✅, subbagian 1.1 ✅, guardrail 13.13 ✅, **17 BAGIAN tetap utuh** (tak ada heading rusak), BAGIAN 12 (urutan build) tak tersentuh. Ini perubahan dokumen (spec), bukan kode — tak ada tes program.

**Sudah di-commit?** (lihat commit berikutnya `docs(spec): aplikasi.md v1.2 …`).

**Status:** SELESAI. Konstitusi diperbarui aman, tanpa membongkar apa pun.

**Langkah berikutnya:** **FASE 2** tetap jadi pekerjaan teknis berikutnya (tidak terdampak). Menunggu aba-aba pemilik ("go") untuk membuka gerbang autopilot.

-----

## 2026-06-16 — Fase 1k: Uji E2E menyeluruh + gerbang QA-1 & QA-2 — 🎉 FASE 1 TUNTAS

**Yang dikerjakan:** (1) **Menyambung transform NIS→samaran ke login siswa** (utang 1f): di `auth.service.findLoginUser`, login via username kini coba cocokkan apa adanya (staf), lalu — bila tak ketemu — **menyamarkan NIS yang diketik** (nisKey sekolah + pepper) dan cocokkan ke `username` tersamar. Inilah yang membuat "siswa login pakai NIS asli" benar-benar jalan setelah impor. (2) **Uji E2E Fase 1** (`apps/api/test/e2e/fase1.e2e.ts`, skrip ter-commit + script `test:e2e`) yang menjalankan skenario DoD utuh + butir QA-1 & QA-2 terhadap server+DB nyata.

**File yang dibuat/diubah:**
- `apps/api/src/modules/auth/auth.service.ts` — login siswa via pseudonim NIS (impor `pseudonymizeNis`).
- `apps/api/test/e2e/fase1.e2e.ts` — **(baru)** uji E2E Fase 1 (23 cek).
- `apps/api/package.json` — script `test:e2e`.

**Sudah dibuktikan jalan?** Ya — typecheck (4 proyek)/lint ✅; api unit **86/86**; mobile analyze bersih + 5 widget test ✅. **E2E Fase 1: 23 cek LULUS** terhadap server nyata:
- **DoD:** HQ login → buat sekolah A (ONBOARDING) → pairing Box → akun admin → **admin first-login wajib ganti password** → buat 5 kelas → **impor 500 siswa (5 baris rusak) → COMPLETED, berhasil 500/baru 500/gagal 5** → **siswa login PAKAI NIS ASLI** (pseudonim tersambung) → first-login ganti password → **ortu register→OTP→verify→link anak (ACTIVE)**.
- **QA-1:** first-login ✅; **lockout → 423** ✅; IDOR/akses: tanpa token 401, siswa→buat kelas 403, HQ→endpoint sekolah 403, **admin A→siswa sekolah B 404** ✅.
- **QA-2:** campur valid/invalid (500+5) ✅; **idempotent** (impor ulang created 0, tetap 500) ✅; **file >3000 baris → FAILED + pesan ramah** ✅.

**Sudah di-commit?** Ya — `test(api): Fase 1 E2E (DoD + QA-1 + QA-2) + wire student NIS-pseudonym login (1k)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI. **🎉🎉 FASE 1 (Akun & pintu masuk) RESMI TUNTAS** — 11 potongan 1a–1k semua hijau & terbukti. **DoD Fase 1 (BAGIAN 12) terpenuhi.**

**Langkah berikutnya:** **FASE 2** — Attendance (QR dinamis, rule 10.2–10.4) + Notifikasi (FCM nyata, WA stub) + Izin + Pengumuman. Baca BAGIAN 10.2–10.4 dulu; rencanakan potongan; tunggu aba-aba pemilik. **Disarankan: push 13+ commit ke GitHub dari laptop dulu** (backup off-site sebelum mulai fase besar berikutnya).

-----

## 2026-06-16 — Fase 1j: Mobile (Flutter) — login, first-login, onboarding ortu

**Yang dikerjakan:** Mengisi aplikasi HP (sebelumnya hanya rangka cek-health 0g) dengan alur masuk semua peran. (1) **Login:** satu layar dengan pilihan **Siswa** (NIS + Kode Sekolah + password) atau **Guru/Ortu** (email/HP + password). (2) **First-login:** bila wajib, layar ganti password baru + centang setuju Syarat & Ketentuan. (3) **Onboarding orang tua:** alur 4 langkah — daftar nomor HP (kirim OTP) → verifikasi OTP → masukkan kode undangan (tautkan anak) → buat password (OTP + password baru) → selesai. (4) **Home minimal** per peran (sambutan + peran + tombol keluar; fitur lengkap menyusul Fase 2+). Semua memanggil endpoint backend 1b–1h yang sudah ada (tak ada perubahan backend).

**File yang dibuat/diubah (apps/mobile):**
- `lib/theme.dart` — **(baru)** warna brand + ThemeData.
- `lib/api/api_client.dart` — **(baru)** klien API (login, change/forgot/reset password, tos, parent register/verify/link) + `ApiException` ramah; method virtual agar mudah di-fake saat test.
- `lib/api/session.dart` — **(baru)** sesi di memori (token + role + deviceId; decode schoolId dari JWT).
- `lib/screens/{login,first_login,parent_onboarding,home}_screen.dart` — **(baru)** layar.
- `lib/main.dart` — rakit MaterialApp (tema + LoginScreen). `test/widget_test.dart` — 5 tes alur (pakai FakeApi).

**Keputusan kecil:** (1) **State sederhana** (setState + ApiClient injectable + sesi global di memori) — cukup untuk Fase 1, tanpa paket state-management berat. (2) Token disimpan **di memori** (belum persisten) — utang: `flutter_secure_storage` saat polish. (3) Onboarding ortu langsung menyambung ke **buat-password via OTP** (forgot→reset) agar ortu langsung bisa login. (4) ToS `docVersion = "v1"` (placeholder).

**Sudah dibuktikan jalan?** Ya — `flutter analyze` **bersih (No issues)**; **`flutter test` 5/5 lulus** (login render & toggle siswa/dewasa, login sukses→Home, login gagal→error, first-login ganti password→Home, onboarding ortu register→otp→link→password→selesai dgn urutan panggilan API benar); **`flutter build web` sukses** (compile penuh ke JS). **Bukti visual:** build web di-serve & di-screenshot via Playwright+Chrome — layar login ter-render rapi (brand, toggle, field, tombol). **Catatan jujur:** E2E interaktif penuh di perangkat/emulator nyata belum (tak ada emulator di server); perilaku dijamin widget test + backend sudah teruji E2E di 1b–1h.

**Sudah di-commit?** Ya — `feat(mobile): auth flows — login, first-login, parent onboarding (OTP+link child) (1j)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI.

**Utang baru:**
- Token sesi **belum persisten** (hilang saat app ditutup) — pakai `flutter_secure_storage` saat polish.
- Login siswa pakai **Kode Sekolah = schoolId (UUID)** mentah — kurang ramah; tambah lookup/QR saat polish (sama seperti utang web).
- E2E mobile di emulator/perangkat nyata + integration_test menyusul (idealnya di 1k atau saat ada perangkat).

**Langkah berikutnya:** **1k** — Uji E2E menyeluruh + gerbang QA-1 & QA-2 (penutup Fase 1).

-----

## 2026-06-16 — Fase 1i.4: Web `/school` Pengguna (impor XLSX + kode undangan) — PENUTUP 1i

**Yang dikerjakan:** Halaman **/school/pengguna** dengan dua panel. (1) **Impor Siswa (XLSX):** unggah file → progress bar real-time (status, total, berhasil, baru, gagal) dengan polling job → tombol **unduh laporan error** & **unduh kredensial sekali-pakai** (NIS + password sementara). (2) **Kode Undangan Ortu:** pilih kelas → generate kode → **unduh PDF kartu (berisi QR)**. Memakai endpoint impor (1f) & undangan (1g) — tak ada perubahan backend.

**File yang dibuat/diubah (apps/web):**
- `app/school/actions.ts` — tambah `startImportAction` (teruskan multipart ke backend), `importStatusAction` (polling), `generateInvitesAction`.
- `app/api/school/import/[jobId]/[file]/route.ts` — **(baru)** proxy unduh BFF errors.csv/credentials.csv (token via cookie).
- `app/api/school/invite/[batchId]/route.ts` — **(baru)** proxy unduh BFF PDF undangan.
- `components/school/import-panel.tsx` — **(baru)** upload + progress + unduhan.
- `components/school/invite-panel.tsx` — **(baru)** pilih kelas + generate + unduh PDF.
- `app/school/pengguna/page.tsx` — muat daftar kelas (server) + render dua panel.

**Keputusan kecil:** unduhan file (CSV/PDF) lewat **route handler BFF** yang men-proxy ke backend dengan token cookie (klien tak pernah pegang token); polling status impor tiap 1,5 dtk via Server Action.

**Sudah dibuktikan jalan?** Ya — typecheck/lint/`next build` ✅. **QA visual Playwright (admin uji, kelas X-IPA-1; file XLSX 4 baris = 3 valid + 1 rusak):** 10 cek lulus — dua panel tampil; impor → **COMPLETED, Berhasil 3, Gagal 1**; tombol unduh error & kredensial tampil; **kredensial.csv benar-benar terunduh** (CSV, 3 baris NIS) via BFF; generate kode undangan → "X kode dibuat"; **PDF undangan benar-benar terunduh** (`%PDF`) via BFF. Screenshot ditinjau (rapi, progress bar penuh). Data uji & server lokal dibersihkan; skrip QA tak di-commit.

**Sudah di-commit?** Ya — `feat(web): /school users — XLSX import (progress+downloads) & parent invite codes (PDF) (1i.4)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI. **🎉 Potongan 1i (dashboard web) TUNTAS** — `/hq` provisioning + `/school` Kelas & Pengguna, semua terverifikasi di browser nyata via Playwright.

**Langkah berikutnya:** **1j** — Mobile (Flutter): login semua peran + first-login + OTP ortu & link anak.

-----

## 2026-06-16 — Fase 1i.3: Web `/school` Kelas (CRUD + wizard kenaikan kelas)

**Yang dikerjakan:** Halaman **/school/kelas**: tabel kelas (label, tingkat, jurusan, tahun ajaran) + **tambah/ubah/hapus** lewat dialog (hapus = konfirmasi; ditolak ramah bila masih ada siswa) + tombol **"Kenaikan Kelas"** (wizard: isi dari/ke tahun ajaran → **pratinjau** rencana tanpa mengubah apa pun → **konfirmasi**; kelas 10/11 naik + siswa pindah, kelas 12 ditandai lulus & diarsipkan). Memakai endpoint kelas dari 1e (tak ada perubahan backend).

**File yang dibuat/diubah (apps/web):**
- `app/school/actions.ts` — **(baru)** Server Actions: create/update/delete class + promote (dryRun & confirm).
- `lib/api.ts` — tambah helper `apiAction`/`ActionResult` (tak-throw, untuk Server Action).
- `components/school/class-form-dialog.tsx` — **(baru)** form tambah/ubah (dipakai ulang via prop `trigger`).
- `components/school/class-row-actions.tsx` — **(baru)** ubah + hapus (konfirmasi) per baris.
- `components/school/promote-wizard.tsx` — **(baru)** wizard kenaikan kelas (pratinjau→konfirmasi).
- `app/school/kelas/page.tsx` — tabel kelas (server, `apiFetch GET /school/classes`) + tombol.

**Sudah dibuktikan jalan?** Ya — typecheck/lint/`next build` ✅. **QA visual Playwright (admin uji, 2 kelas + 1 siswa seed):** 9 cek lulus — daftar kelas tampil; buat kelas baru → muncul; ubah label → ter-update; hapus (tanpa siswa) → hilang; wizard pratinjau menampilkan "Naik ke kelas 11" (1 siswa) & "Lulus (arsip)" utk kelas 12; konfirmasi → ringkasan "1 siswa naik kelas". Screenshot pratinjau ditinjau (rapi). Data uji & server lokal dibersihkan; skrip QA tak di-commit.

**Sudah di-commit?** Ya — `feat(web): /school classes — CRUD + class-promotion wizard (preview→confirm) (1i.3)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI (sub-potong 1i.3 dari 4).

**Langkah berikutnya:** **1i.4** — `/school` Pengguna (impor XLSX: upload→pantau progres→unduh laporan/kredensial; kode undangan: generate→unduh PDF). Penutup 1i.

-----

## 2026-06-16 — Fase 1i.2: Web `/hq` wizard provisioning sekolah

**Yang dikerjakan:** Halaman **/hq** untuk pusat: tabel daftar sekolah (NPSN, nama, kota, status berwarna) + tombol **"Sekolah Baru"** yang membuka **wizard 3 langkah**: (1) isi data sekolah → buat (status ONBOARDING), (2) masukkan serial Box → terbitkan **token pairing** (tampil SEKALI + tombol salin), (3) terbitkan **akun admin** (username + password sementara, tampil SEKALI + salin). Selesai → tabel ter-refresh menampilkan sekolah baru. Memakai endpoint HQ dari 1e (tak ada perubahan backend).

**File yang dibuat/diubah (apps/web):**
- `app/hq/actions.ts` — **(baru)** Server Actions (BFF): `createSchoolAction`, `pairBoxAction`, `createAdminAccountAction` (panggil backend via cookie httpOnly; `revalidatePath` setelah akun admin).
- `components/hq/new-school-wizard.tsx` — **(baru)** wizard dialog 3 langkah + field salin kredensial sekali-tampil.
- `components/ui/dialog.tsx` — **(baru)** komponen Dialog (Radix, shadcn-style).
- `app/hq/page.tsx` — daftar sekolah (server component, `apiFetch GET /hq/schools`) + tombol wizard.

**Keputusan kecil:** pakai **Next Server Actions** (bukan banyak route handler) untuk mutasi — lebih ringkas, token tetap di server. Kredensial sekali-tampil ditegaskan di UI (label "sekali tampil" + tombol salin).

**Sudah dibuktikan jalan?** Ya — typecheck/lint/`next build` ✅. **QA visual Playwright (browser nyata, user HQ uji):** 8 cek lulus — login HQ (email, tanpa schoolId) → /hq; tabel & judul tampil; wizard langkah 1→2→3; token pairing tampil; kredensial admin tampil; **sekolah baru muncul di tabel dengan status ONBOARDING**. Screenshot tiap langkah ditinjau (dialog rapi, sesuai brand). Data uji & server lokal dibersihkan; skrip QA tak di-commit.

**Sudah di-commit?** Ya — `feat(web): /hq provisioning wizard (create school → pair box → admin account) (1i.2)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI (sub-potong 1i.2 dari 4).

**Langkah berikutnya:** **1i.3** — `/school` Kelas (tabel + tambah/ubah/hapus + wizard kenaikan kelas preview→konfirmasi).

-----

## 2026-06-16 — Fase 1i.1: Fondasi dashboard web (Tailwind/shadcn + login cookie + kerangka)

**Yang dikerjakan:** Membangun fondasi dashboard web (Next.js) supaya potongan /hq & /school tinggal diisi. (1) **Tampilan:** pasang Tailwind + komponen shadcn-style (Button/Input/Label/Card) + **tema warna brand Magnoo** (ink/merah/biru/emas/paper, font Plus Jakarta Sans). (2) **Login aman (BFF):** halaman login → dikirim ke "lapisan tipis" server web (route handler) → diteruskan ke backend → token disimpan di **cookie httpOnly** (tak terbaca JavaScript, tahan XSS). Web menempelkan token saat memanggil API; klien tak pernah memegang token mentah. (3) **Kerangka & penjaga:** layout dashboard (sidebar menu + topbar peran + tombol Keluar), middleware yang mengalihkan ke /login bila belum masuk & menyaring akses per-peran (HQ vs sekolah), redirect root ke home sesuai peran. **Keputusan pemilik:** Tailwind+shadcn + cookie httpOnly (dua-duanya opsi aman/rekomendasi). **Pemilik juga minta pasang Playwright** untuk QA visual.

**File yang dibuat/diubah (apps/web):**
- `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css` (tema HSL brand), `tsconfig.json` (alias `@/*`).
- `lib/jwt.ts` (decode JWT pure utk Edge), `lib/session.ts` (getSession server), `lib/api.ts` (apiFetch server menempel Bearer dari cookie), `lib/utils.ts` (cn).
- `components/ui/{button,input,label,card}.tsx` (shadcn-style), `components/{dashboard-shell,sidebar-nav,logout-button}.tsx`.
- `app/api/auth/{login,logout}/route.ts` (BFF: set/hapus cookie httpOnly).
- `middleware.ts` (penjaga /hq & /school + gerbang peran), `app/login/page.tsx`, `app/page.tsx` (redirect), `app/hq/{layout,page}.tsx`, `app/school/{layout,page,kelas/page,pengguna/page}.tsx` (kelas/pengguna = placeholder utk 1i.3–1i.4).
- `playwright.config.ts`; deps: tailwindcss/postcss/autoprefixer/tailwindcss-animate, class-variance-authority/clsx/tailwind-merge/lucide-react, @radix-ui/react-{slot,label,dialog,dropdown-menu}, @playwright/test.

**Catatan perkakas (penting):** CDN Playwright + mirror-nya **keblokir firewall** server ini → `playwright install` gagal. Solusi: unduh **Chrome-for-Testing** langsung dari Google storage ke `/opt/cft/chrome-linux64/chrome` (+ `playwright install-deps` via apt). Pakai lewat `executablePath`. (Disimpan juga di memory Claude.) `unzip` tak ada → pakai python; WAJIB `chmod +x chrome_crashpad_handler chrome_sandbox`.

**Sudah dibuktikan jalan?** Ya — typecheck/lint/`next build` ✅ (11 route + middleware). **QA visual Playwright (browser nyata, web :3005 → backend :3100, admin uji):** 9 cek lulus — halaman login tampil; akses /school tanpa login → dialihkan ke /login; password salah → pesan error; login benar → masuk /school; sidebar brand + menu Pengguna + topbar "Admin Sekolah" tampil; klik menu → pindah halaman; Keluar → balik /login. Screenshot login & dashboard ditinjau (rapi, sesuai brand). Data uji & server lokal dibersihkan; skrip QA tidak di-commit.

**Sudah di-commit?** Ya — `feat(web): dashboard foundation — tailwind/shadcn theme, httpOnly-cookie auth (BFF), role-gated shell (1i.1)`. *(Belum di-push: firewall GitHub.)*

**Status:** SELESAI (sub-potong 1i.1 dari 4). 

**Utang baru:**
- Kontainer **web di docker-compose masih build lama** (menempati port 3001) — rebuild compose saat siap demo (`pnpm dev:infra` / rebuild image web).
- Font **Plus Jakarta Sans belum di-self-host** (sementara fallback ke font sistem) — self-host/`next/font` saat polish (hindari unduh saat build di env terbatas).
- Login admin pakai **schoolId (UUID) mentah** sebagai "Kode Sekolah" — kurang ramah; tambah lookup NPSN→schoolId saat polish UX.
- First-login ganti password admin di web belum ada layar khusus (backend tak memblokir; ditambah saat perlu).

**Langkah berikutnya:** **1i.2** — `/hq` wizard provisioning (buat sekolah → pairing Box → akun admin), lalu 1i.3 Kelas, 1i.4 Pengguna.

-----

## 2026-06-16 — Fase 1h: Consent & Audit-log (arsip persetujuan + baca audit ter-scope)

**Yang dikerjakan:** (1) **Arsip persetujuan (consent):** sekolah bisa mencatat persetujuan per siswa (jenis: GENERAL_DATA / FACE / PUBLICATION / ALUMNI_CAREER / TOS) beserta versi dokumen, siapa yang memberi (ortu), dan nomor arsip formulir fisik (`evidenceRef`). Bisa mencatat (`POST`) dan melihat daftar (`GET`, bisa difilter per siswa/jenis). Semua dikunci ke sekolah pemanggil — admin tak bisa menyentuh siswa sekolah lain. (2) **Baca audit log:** admin bisa melihat jejak audit sekolahnya (`GET /school/audit-log`) dengan pagination + filter aksi/entitas. Daftar audit hanya menampilkan metadata (siapa, aksi, kapan) — **tanpa** isi `before/after` yang bisa sensitif.

**Penegakan append-only (melunasi utang 0d untuk AuditLog):** penulis audit (`AuditService`, dibuat 1c) memang **hanya punya `write()`** — tak ada update/delete. Di 1h saya tambah jalur **baca terpisah** (`AuditReadService`, hanya `findMany`) supaya sifat tak-bisa-diubah itu tetap terjaga (penulisan & pembacaan dipisah). Guardrail 13.9 (AuditLog append-only) terpenuhi di lapisan service.

**Keputusan pemilik (sesi ini):** **Cabut consent (revoke) DITUNDA ke Fase 6** — di 1h hanya grant + list. Pencabutan + pemicu hapus template wajah di Box dibangun bareng alur wajah (job `face-consent-revocation`, BAGIAN 10.10).

**File yang dibuat/diubah:**
- `apps/api/src/modules/school/consent/consent.service.ts` + `consent.controller.ts` — **(baru)** grant + list, di-scope ke siswa sekolah (cegah IDOR), tolak consent aktif ganda, audit `CONSENT_GRANT`.
- `apps/api/src/modules/school/audit/audit-read.service.ts` + `audit.controller.ts` — **(baru)** `GET /school/audit-log` (pagination cursor, filter action/entity), ter-scope ke aksi user sekolah.
- `apps/api/src/modules/school/school.module.ts` — daftarkan ConsentController/Service & AuditController/AuditReadService.
- Tes baru: `consent/consent.service.test.ts` (5, pakai Prisma tiruan).

**Keputusan kecil:** (1) Scope consent/audit ke sekolah lewat relasi siswa/user→`schoolId` (model `AuditLog`/`ConsentRecord` memang tak punya kolom `schoolId` sesuai spec BAGIAN 6) — cukup untuk skala Fase 1. (2) Daftar audit memakai cursor pagination (`orderBy createdAt desc, id desc`), default 50/maks 100. (3) `GET /school/consents` boleh SCHOOL_ADMIN & PRINCIPAL (lihat); `POST` hanya SCHOOL_ADMIN. (4) Grant menolak bila sudah ada consent aktif jenis sama (cabut dulu untuk ganti — revoke di Fase 6).

**Sudah dibuktikan jalan?** Ya, dua lapis. **Tes unit:** api **86/86** (5 baru); typecheck (4 proyek)/lint/build ✅. **Uji E2E ke server+DB nyata (port 3100, 2 sekolah):** 16 cek lulus — grant + list + filter, consent-ganda 409, **IDOR lintas sekolah 404**, audit-log ter-scope (entri sekolah lain tak bocor) + tanpa before/after + filter/limit + limit-invalid 400, **RBAC guru 403**. Data uji & skrip uji dibersihkan (tidak di-commit).

**Sudah di-commit?** Ya — `feat(school): consent archive + scoped audit-log read, append-only enforced (1h)`. *(Belum di-push: firewall blokir TLS ke GitHub — push dari laptop.)*

**Status:** SELESAI. **🎉 Seluruh BACKEND Fase 1 (1a–1h) TUNTAS.**

**Utang baru (dicatat, kerjakan nanti):**
- Scope consent/audit memakai daftar id user/siswa sekolah (query 2-langkah). Bila ingin lebih hemat di skala besar, tambah kolom `schoolId` di `AuditLog`/`ConsentRecord` + indeks (perubahan aditif + migrasi) — pertimbangkan saat data membesar.
- Cabut consent (revoke) + pemicu hapus template Box = Fase 6 (sudah diputuskan).

**Langkah berikutnya:** Potongan **1i** — Web `/hq` wizard provision + `/school` Pengguna & Kelas (mulai kerja front-end; putuskan Tailwind/shadcn yang ditunda sejak 0e). Tunggu aba-aba pemilik.

-----

## 2026-06-16 — Fase 1g: Undangan ortu (kode + PDF/QR, OTP, link anak, reset password)

**Yang dikerjakan:** Membuat alur lengkap **mengundang & mendaftarkan orang tua**. (1) **Kode undangan (admin sekolah):** admin membuat kode untuk siswa (per kelas atau daftar id) → sistem menerbitkan kode 8-karakter unik (berlaku 30 hari) + **PDF kartu** untuk dicetak & dibagikan ke ortu; tiap kartu memuat **QR kode** (agar app ortu tinggal pindai), label kelas, tanggal kadaluarsa, dan ID siswa opaque (cloud tak punya nama siswa — ADR-005). Admin juga bisa **membatalkan** kode. (2) **Registrasi ortu via OTP:** ortu daftar dengan nomor HP → kode OTP 6 digit dikirim (untuk saat ini **stub yang dicatat ke log** — kanal WA asli fase lanjut, BAGIAN 11.2) → ortu masukkan OTP → dapat **temp token** → tukar **kode undangan** untuk menautkan diri ke anaknya. Satu ortu bisa menautkan beberapa anak. (3) **Set/Reset password (OTP):** karena registrasi ortu tak memberi password, dibangun `forgot`→OTP→`reset` sehingga ortu (dan user dewasa lain) bisa menetapkan password lalu login normal (HP + password).

**Keputusan pemilik (sesi ini):** (1) **Bangun set-password via OTP sekarang** (`/auth/password/forgot` + `/auth/password/reset`) supaya di akhir 1g ortu bisa login penuh. (2) **PDF kartu memakai QR code** (tambah library `qrcode`).

**File yang dibuat/diubah:**
- `apps/api/src/modules/auth/otp/otp.service.ts` + `otp-notifier.ts` — **(baru)** OTP berbasis **Redis** (kode disimpan sebagai hash, TTL 5 mnt, batas 5 percobaan, rate-limit 3/10 mnt) + pengirim stub (log).
- `apps/api/src/modules/auth/parent/parent.service.ts` — **(baru)** register → OTP, verify → temp token, link-child (validasi kode + buat/temukan akun ortu + ParentLink + tandai kode terpakai). Temp token = JWT `{purpose:PARENT_LINK, phone}` (ditolak otomatis oleh JwtAuthGuard biasa karena gagal `jwtClaimsSchema`).
- `apps/api/src/modules/auth/auth.service.ts` — tambah `forgotPassword`/`resetPassword` (OTP) + cabut semua sesi setelah reset.
- `apps/api/src/modules/auth/auth.controller.ts` — endpoint `parent/register`, `parent/verify-otp`, `parent/link-child`, `password/forgot`, `password/reset`.
- `apps/api/src/modules/auth/auth.module.ts` — daftarkan OtpService/OtpNotifier/ParentService.
- `apps/api/src/modules/school/invite/` — **(baru)** `invite.service.ts` (generate kode + PDF + revoke + unduh), `invite.controller.ts` (`/school/invite-codes/generate`, `/:id/revoke`, `GET /batch/:batchId`), `invite-pdf.ts` (render PDF + QR via pdf-lib & qrcode), `invite-storage.ts` (PDF per-sekolah di disk, izin 0600).
- `apps/api/src/modules/school/school.module.ts` — daftarkan InviteController/Service.
- `apps/api/src/queue/queue.module.ts` — ekspor token koneksi Redis (dipakai bersama OtpService).
- `apps/api/package.json` — tambah `pdf-lib`, `qrcode`, `@types/qrcode`.
- Tes baru: `otp/otp.service.test.ts` (7, pakai Redis tiruan), `invite/invite-pdf.test.ts` (2).

**Keputusan kecil:** (1) OTP & temp token **tidak menyentuh DB** (Redis + JWT pendek) → ringan, otomatis kedaluwarsa. (2) Akun ortu baru dibuat dgn password placeholder acak + `mustChangePassword`; password sesungguhnya via reset OTP. (3) `link-child` menerima Bearer **temp token ATAU token ortu penuh** (untuk tautkan anak berikutnya). (4) PDF di-scope per-sekolah lewat path folder (admin hanya bisa unduh batch sekolahnya). (5) `forgot`/`reset` hanya untuk user dewasa (punya phone/email); siswa reset lewat admin (BAGIAN 7.2).

**Sudah dibuktikan jalan?** Ya, dua lapis. **Tes unit:** api **81/81** (9 baru); typecheck (4 proyek)/lint/build ✅. **Uji E2E ke server+DB nyata (port 3100):** 22 cek lulus — generate 3 kode + PDF/QR, register→OTP→verify→temp token, link anak #1 (temp) + akun ortu dibuat + kode terpakai, kode dipakai-ulang ditolak, set password via OTP reset → login penuh, link anak #2 (token penuh) → 2 anak, sudah-tertaut/revoked/expired/invalid semua ditolak benar, audit tercatat. OTP diambil dari log stub. Data uji & skrip uji dibersihkan (tidak di-commit).

**Sudah di-commit?** Ya — `feat(auth,school): parent invitation flow — invite codes + PDF/QR, OTP register/verify, link-child, OTP password reset (1g)`. *(Belum di-push: firewall blokir TLS ke GitHub — push dari laptop.)*

**Status:** SELESAI.

**Utang baru (dicatat, kerjakan nanti):**
- Pengirim OTP masih **stub log** — ganti dgn adapter WA/SMS nyata (BAGIAN 11.2) + biaya; **jangan log kode OTP di produksi** (saat ini sengaja di-log utk dev/uji).
- PDF batch undangan disimpan **file di disk** server (0600) — pindah ke object storage + tautan sekali-pakai (sama seperti utang impor 1f).
- Kartu PDF belum menampilkan **nama siswa** (cloud tak punya) — tampilkan via Box bridge saat Fase 3.
- Akun ortu `schoolId` = sekolah anak pertama; bila ortu punya anak lintas sekolah perlu dipikirkan ulang (scope ortu→anak sudah lewat ParentLink, jadi aman; schoolId hanya penanda).

**Langkah berikutnya:** Potongan **1h** — Consent & audit (arsip ConsentRecord + penegakan audit-log append-only di service). Tunggu aba-aba pemilik.

-----

## 2026-06-16 — Fase 1f: Impor XLSX siswa (antrean + validasi + penyamaran NIS + idempotent)

**⚠️ Catatan jujur di awal:** saat sesi ini mulai, ternyata **sebagian pekerjaan 1f sudah ada di kode tapi BELUM tercatat di sini & BELUM di-commit** (pondasi: library exceljs/bullmq/ioredis, tabel `ImportJob` + kolom `School.nisKey` + migrasi, rangka antrean `queue/`, dan 4 "alat" di `import/`: penyamaran NIS, pembaca XLSX, validasi, penyimpanan file). Sesi sebelumnya tampaknya keburu mulai lalu terputus. Bagian itu berkualitas baik jadi DILANJUTKAN (bukan ditulis ulang); sesi ini menambah "perakitan" + bukti + commit. (Catatan tambahan: file lama itu ternyata belum pernah lolos `typecheck` — ada error versi ioredis & tipe Buffer/`REQUIRED` di xlsx; sudah diperbaiki, lihat bawah.)

**Yang dikerjakan:** Membuat fitur **impor massal siswa dari file Excel (.xlsx)** yang berjalan di latar belakang. Admin sekolah mengunggah file daftar siswa → sistem menaruhnya di antrean → "pekerja" (worker) memprosesnya tanpa membuat admin menunggu: membaca file, **memeriksa tiap baris** (NIS wajib & berupa angka, tidak ganda dalam file, nama wajib, kelas harus sudah ada di sekolah; kolom opsional NISN/JK/Tgl-lahir dicek format), lalu untuk baris yang lolos **membuat akun siswa**. Inti privasi (ADR-005 / guardrail 13.2): **NIS asli TIDAK PERNAH disimpan di cloud** — yang disimpan sebagai `username` siswa adalah NIS yang **disamarkan** (HMAC dengan DUA rahasia: `nisKey` acak per sekolah di DB + `NIS_PSEUDONYM_PEPPER` di env). Karena penyamaran deterministik + ada aturan unik `[schoolId, username]`, impor jadi **idempotent**: file yang sama diunggah dua kali tidak menggandakan siswa (yang kedua hanya meng-update). Hasil impor: **laporan error** yang ramah (CSV) + **kredensial sekali-unduh** (NIS + password sementara siswa baru; admin bagikan, lalu file dihapus). File unggahan (berisi NIS asli) **dihapus** setelah diproses.

**Keputusan pemilik (sesi ini, 2026-06-16):** (1) **Worker jalan satu-proses dengan API** (in-process) — cukup untuk skala awal di server 4GB; dipisah jadi proses sendiri nanti (utang). (2) **Kredensial diserahkan via file CSV sekali-unduh** (admin unduh, file langsung dihapus & ditandai; tak bisa diunduh dua kali).

**File yang dibuat/diubah:**
- `apps/api/src/modules/school/import/import.service.ts` — **(baru)** otak impor: terima unggahan→buat `ImportJob`→antrekan; `process(jobId)` (baca→validasi→samarkan→upsert siswa→tulis CSV); status; unduh error & kredensial (sekali pakai).
- `apps/api/src/modules/school/import/import.controller.ts` — **(baru)** endpoint `POST /school/users/import` (multipart, batas 10MB), `GET .../:jobId` (progres), `GET .../:jobId/errors.csv`, `GET .../:jobId/credentials.csv`. Scope `school` + role `SCHOOL_ADMIN`.
- `apps/api/src/modules/school/import/import.worker.ts` — **(baru)** worker BullMQ in-process (lifecycle Nest: nyala saat start, tutup rapi saat berhenti; koneksi Redis sendiri; concurrency 2).
- `apps/api/src/modules/school/import/{pseudonym,xlsx,validation,import-storage}.ts` — (dari sesi lalu) dipertahankan; `validation.ts` diperbaiki kecil (tandai NIS pertama yang valid agar duplikat tertangkap); `xlsx.ts` perbaikan tipe (`REQUIRED` & cast Buffer exceljs).
- `apps/api/src/modules/school/school.module.ts` — daftarkan ImportController/Service/Worker.
- `packages/shared/src/school.ts` — `importJobStatusSchema` tambah `created`, `message`, `credentialsReportUrl` (bentuk respons; regenerate Dart).
- `apps/api/package.json` — **kunci `ioredis` ke `5.10.1`** (persis seperti yang dipakai bullmq) agar tidak ada dua salinan ioredis yang bikin tipe koneksi bentrok.
- Tes baru: `import/{pseudonym,validation,xlsx}.test.ts` (23 tes).
- (dari sesi lalu, kini ter-commit) migrasi `20260616055242_student_import_job_and_nis_key`, `queue/*`, env `REDIS_URL`/`NIS_PSEUDONYM_PEPPER`/`IMPORT_STORAGE_DIR`, `QueueModule` di app, shutdown hooks di main.

**Keputusan kecil:** (1) Batas **3.000 baris** per file impor; di atas itu ditolak ramah (memenuhi QA-2 "5.000 baris ditolak ramah"). (2) Header XLSX menerima sinonim (Nama/Nama Lengkap, Kelas/Rombel) & tak peka huruf besar/kecil; **dibaca sebagai TEKS** agar NIS dengan nol di depan / angka panjang tidak rusak. (3) Validasi mengumpulkan SEMUA error per baris (bukan berhenti di error pertama). (4) Kredensial CSV memuat NIS asli (perlu agar admin tahu password milik siapa) — bersifat sementara, izin file 0600, dihapus setelah diunduh sekali.

**Sudah dibuktikan jalan?** Ya, dua lapis. **Tes unit:** api **72/72** (23 baru), shared 24/24; typecheck (4 proyek)/lint/build ✅. **Uji end-to-end ke server+DB nyata (port 3100, worker in-process):** unggah 505 baris (500 valid + 5 rusak) → COMPLETED (500 dibuat, 5 gagal dengan 5 jenis error benar); DB berisi 500 siswa ber-username samaran 64-hex, tanpa PII, nol NIS mentah; kredensial sekali-unduh (unduh kedua 404); **idempotensi terbukti** (impor ulang: created 0, jumlah siswa tetap 500); audit tercatat. Data uji & file sementara sudah dibersihkan; skrip uji sementara dihapus (tidak di-commit).

**Sudah di-commit?** Ya — `feat(school): student XLSX import — queue worker, per-row validation, NIS pseudonymization, idempotent (1f)`. *(Belum di-push: firewall blokir TLS ke GitHub — push dari laptop.)*

**Status:** SELESAI.

**Utang baru (dicatat, kerjakan nanti):**
- Worker impor **in-process** — pisahkan jadi proses/kontainer sendiri saat trafik naik (skala).
- `credentials.csv` & `errors.csv` disimpan sebagai **file di disk** server (izin 0600); pindah ke object storage + tautan sekali-pakai terenkripsi (rapikan di fase infra/keamanan).
- Pencocokan kelas via **label** memetakan ke semua kelas non-arsip; bila ada label sama di lintas tahun ajaran bisa ambigu — pertimbangkan menyaring per tahun ajaran aktif saat UI impor dibangun (1i).
- Hash argon2 per siswa baru dijalankan **berurutan** di worker (500 siswa ≈ puluhan detik) — cukup untuk latar belakang; optimalkan bila perlu.

**Langkah berikutnya:** Potongan **1g** — Undangan ortu (kode undangan + PDF batch, register ortu + OTP, link anak). Tunggu aba-aba pemilik.

-----

## 2026-06-15 — Fase 1e: Provisioning (HQ buat sekolah, pairing Box, akun admin, setelan, kelas, kenaikan kelas)

**Yang dikerjakan:** Membangun "otak" untuk menyiapkan sekolah baru di sistem. (1) **HQ buat sekolah** — orang pusat mendaftarkan sekolah (NPSN unik, status awal ONBOARDING). (2) **Pairing Box** — pusat menerbitkan satu kode-pasangan untuk alat Box sekolah; kode mentah hanya muncul SEKALI, yang disimpan di database cuma "sidik jari"-nya (hash + pepper rahasia). (3) **Akun admin sekolah** — pusat menerbitkan akun admin (username `admin`, lalu `admin2` dst.), dengan password sementara yang juga muncul SEKALI; admin wajib menggantinya saat login pertama. (4) **Setelan sekolah** — admin bisa baca/ubah jam masuk, jam WiFi, kuota, dll.; yang dikirim saja yang berubah, sisanya tetap pakai default standar (BAGIAN 10.1). (5) **Kelola kelas** — buat/lihat/ubah/hapus kelas (hapus = diarsipkan, baris tetap ada untuk riwayat; tak bisa dihapus kalau masih ada siswa). (6) **Wizard kenaikan kelas** — mode pratinjau dulu (lihat rencana tanpa mengubah apa pun), lalu konfirmasi: kelas 10→11 dan 11→12 naik (siswa ikut pindah), kelas 12 ditandai "lulus". Ini potongan pertama yang memakai penjaga RBAC 1c di endpoint sungguhan.

**File yang dibuat/diubah:**
- `apps/api/src/modules/school/school.service.ts` — **(baru)** seluruh logika provisioning & master data.
- `apps/api/src/modules/school/hq.controller.ts` — **(baru)** endpoint `/hq/schools` (+ `/pair-box`, `/admin-account`), semua scope `global` (hanya HQ).
- `apps/api/src/modules/school/school.controller.ts` — **(baru)** endpoint `/school/settings` & `/school/classes` (+ `/promote`), scope `school`.
- `apps/api/src/modules/school/provisioning.ts` — **(baru)** pembuat password sementara & pairing token (hash + pepper).
- `apps/api/src/modules/school/school.module.ts` — isi modul (dulu stub); impor AuthModule.
- `apps/api/src/modules/auth/auth.module.ts` — re-export `JwtModule` agar `JwtAuthGuard` bisa dipakai modul lain (memperbaiki error DI saat SchoolModule memakainya).
- `packages/shared/src/school.ts` — tambah bentuk respons wizard kenaikan kelas (`classPromoteResultSchema`, `classPromotionPlanSchema`) — bentuk respons ini belum dipatok di 1a.
- `apps/api/src/config/env.ts` + `.env` + `.env.example` + `infra/docker-compose.dev.yml` — tambah `BOX_PAIRING_PEPPER` (wajib sejak 1e, BAGIAN 16).
- `apps/api/prisma/schema.prisma` + migrasi `20260615123600_device_pairing_token_expiry` — kolom `Device.pairingTokenExpiresAt`.
- `apps/api/prisma/seed.ts` — tambah user **HQ_OPS demo** (`hq@magnoo.demo`, password sama dgn demo lain) agar endpoint `/hq` bisa diuji.
- `school.service.test.ts` — **(baru)** 13 tes unit.

**Keputusan kecil yang diambil:** (1) **Kelas 12 saat kenaikan kelas TIDAK diubah jadi alumni** — itu job harian otomatis `graduation-transition` di Fase 7 (BAGIAN 10.9); wizard hanya menandai "lulus" & mengarsipkan kelasnya. *(Disetujui pemilik di awal sesi.)* (2) Pairing token di-hash `sha256(token + BOX_PAIRING_PEPPER)`, berlaku 7 hari. (3) Username admin otomatis `admin`/`admin2`/… unik per sekolah. (4) Setelan disimpan sebagai "override" saja; saat dibaca = default 10.1 + override. (5) Penghapusan kelas = soft-delete & ditolak bila masih ada siswa aktif. (6) Audit dicatat untuk semua aksi provisioning (SCHOOL_CREATE, BOX_PAIR, ADMIN_ACCOUNT_CREATE, SETTINGS_UPDATE, CLASS_* , CLASS_PROMOTE).

**Sudah dibuktikan jalan?** Ya, dua lapis. **Tes unit:** api **49/49** (13 baru), shared 24/24. **Uji langsung ke DB nyata (port 3100):** seluruh alur HQ→sekolah→pair-box→admin→login admin→setelan→kelas→kenaikan kelas (pratinjau & konfirmasi) BERHASIL; tahun ajaran baru berisi kelas 11, kelas lama terarsip. **RBAC nyata:** admin→`/hq` = 403, HQ→`/school` = 403, tanpa token = 401. typecheck/lint/build ✅. Data uji sudah dibersihkan dari DB dev.

**Sudah di-commit?** Ya — `feat(school): provisioning — schools, box pairing, admin accounts, settings, classes, promote (1e)`. *(Belum di-push: firewall blokir TLS ke GitHub — push dari laptop di kantor.)*

**Status:** SELESAI. Push GitHub masih tertunda (firewall) — akan di-push dari laptop di kantor.

**Langkah berikutnya:** Potongan **1f** — Impor XLSX (job BullMQ + validasi per-baris + laporan error + idempotent + penyamaran NIS). Tunggu aba-aba pemilik.

-----

## 2026-06-14 — Fase 1d: Sesi & peran (batas perangkat, reuse-detection, role-switch)

**Yang dikerjakan:** Mematangkan pengelolaan sesi login. (1) **Batas perangkat:** satu siswa maks login di 2 perangkat aktif, peran lain 3; bila login di perangkat ke-3 (siswa), sesi **tertua** otomatis dicabut & perangkat baru diberi tahu (`sessionEvicted`). (2) **Deteksi pencurian token:** kalau token perpanjangan (refresh) yang lama — yang sudah diputar — dipakai ulang, sistem menganggap token bocor/digandakan lalu **mencabut SEMUA sesi** orang itu (harus login ulang). (3) **Ganti peran tanpa logout:** orang yang punya >1 akun peran (mis. guru yang juga ortu) dan tautannya sudah diverifikasi admin bisa pindah akun; daftar peran lain ikut di token (`linkRoles`). (4) **Kelola sesi:** lihat daftar sesi aktif & cabut salah satunya.

**File yang dibuat/diubah:**
- `apps/api/prisma/schema.prisma` + migrasi `20260614141855_session_prev_refresh_hash` — kolom `Session.prevRefreshTokenHash` (untuk reuse-detection).
- `apps/api/src/modules/auth/auth.service.ts` — tambah: batas perangkat (`enforceDeviceLimit`), reuse-detection di `refresh`, `roleSwitch`, `listSessions`, `revokeSession`, `getLinkRoles` (isi `linkRoles` di token).
- `apps/api/src/modules/auth/auth.controller.ts` — endpoint `POST /auth/role-switch`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`.
- `packages/shared/src/auth.ts` — `loginResponse` tambah `sessionEvicted`. Regenerate Dart.
- `auth.service.test.ts` — tes batas perangkat, reuse-detection, role-switch, list/revoke sesi.

**Keputusan kecil:** (1) Reuse-detection memakai *satu* hash sebelumnya (`prevRefreshTokenHash`) — cukup menangkap skenario nyata (token lama dipakai setelah klien sah memutarnya); riwayat penuh tidak disimpan agar sederhana. (2) Role-switch menerbitkan sesi baru pada **perangkat yang sama** (ambil deviceId dari sesi saat ini). (3) Tautan peran wajib `verifiedBy` terisi (diverifikasi admin) baru bisa dipakai.

**Sudah dibuktikan jalan?** Ya, dua lapis. **Tes unit:** api 36/36 (shared 24) — termasuk batas perangkat, reuse→revoke-all, role-switch izin/tolak, list/revoke. **Uji langsung ke DB:** (a) siswa login dev-A/B/C → sesi ke-3 men-set `sessionEvicted=true` & sisa sesi aktif tepat **2**; (b) login→refresh R1→R2, lalu **pakai ulang R1** → `TOKEN_REUSE_DETECTED` + semua sesi dicabut (R2 pun ikut mati). typecheck 4/4, build, lint ✅.

**Sudah di-commit?** Ya — `feat(auth): device limits, refresh reuse-detection, role-switch, session mgmt (1d)`.

**Status:** SELESAI.

**Langkah berikutnya:** Potongan **1e** — Provisioning sekolah (HQ buat sekolah, akun admin, setting, kelas). Ini akan jadi pemakai pertama guard RBAC 1c di endpoint nyata. Tunggu aba-aba pemilik.

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