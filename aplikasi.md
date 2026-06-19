# MAGNOO — RENCANA PEMBANGUNAN APLIKASI (BUILD SPEC v1.4)

> **CATATAN REVISI**
> - **v1.4 — 19 Juni 2026**: Integrasi **roadmap engagement/karier/wellness** dari `docs/refs/konsep-engagement-karier.md` (disetujui owner). Ditambah **BAGIAN 12B — Adendum Roadmap Engagement/Karier/Wellness** yang memformalkan ARAH 10 fitur (F1 Open Class, F2 Skill Passport, F3 Ekonomi Poin, F4 Ruang Ilmu Guru, F5 pengumuman guru→ortu, F6 wellness dewasa, F7 dashboard kepsek, F8 prestasi terverifikasi, F9 profil guru, F10 reminder acara) + 5 ADR-baru placeholder (A–E), masing-masing dipetakan ke fase rumah, guardrail kunci, dan status buildable/gated. **Fase 0–8, BAGIAN 12A, dan ADR-001..008 TIDAK berubah.** Item ber-gerbang (F4-tahap2 uang, F2 showcase siswa-aktif, F6 kesehatan/telemedicine, F7) tetap tertahan sampai ADR + kajian hukum + persetujuan owner; **F7 wajib direkonsiliasi dengan guardrail 13.6 lebih dulu.** Ini roadmap (penambah arah), bukan scope baru yang langsung dibangun.
> - **v1.3 — 19 Juni 2026**: **Tambal celah Fase 2** (audit `magnoo-architect`, detail di `docs/refs/fase2-grounding.md`). Ditambah **BAGIAN 12A — Adendum Spec Fase 2 (mengikat)** yang melengkapi 3 BLOCKER + 2 celah ringan: koordinat+CIDR WiFi sekolah di `School.settings` (A-1), model `DeviceToken` + endpoint `/me/devices` untuk FCM (B-1), pemutus izin = wali kelas + SCHOOL_ADMIN di RBAC (C-2), mekanisme token QR TOTP server-side + anti-replay/anti-foto (A-2/A-3), state machine izin (C-1), plus pengetatan notif/izin/pengumuman & 7 kode error baru. ADR & fase 0–8 tidak berubah; ini klarifikasi build, bukan scope baru.
> - **v1.2 — 19 Juni 2026**: Sinkron dari **Big Blueprint v2** (`01-Strategi/magnoo-big-blueprint-v2.html`). Ditambah: subbagian **1.1 Visi Jangka Panjang (5 Lapisan)** sebagai konteks arah produk — *tanpa mengubah fase teknis 0–8* (build saat ini tetap fokus app sekolah). Ditambah **guardrail 13.13 (Tembok Pemisah Data Anak)**: produk iklan/OOH/data-marketplace lapisan 2–5 hanya boleh memakai data agregat/anonim & sumber non-anak/non-sekolah; data anak tidak pernah menjadi barang dagangan. Lapisan bisnis 2–5 (OOH, platform OOH, programmatic, data marketplace) BELUM menjadi fase buildable — perlu ADR + kajian hukum (PDP/PSE) tersendiri sebelum dibangun. Fase 0–8 & semua ADR tidak berubah.
> - **v1.1 — 17 Juni 2026**: Modul **Startup Center (Fase 8)** diperluas dari kerangka dasar menjadi modul penuh — 6 model data baru (IdeaSupport, IdeaComment, Competition, CompetitionEntry, MentorProfile, MentorSession) + StartupIdea diperluas, ~30 endpoint API, layar mobile (tab Startup untuk Siswa & Guru, tab Mentor untuk Alumni), dashboard web Sekolah & HQ, aturan bisnis 10.12, ThreadType `STARTUP_ROOM`, dan 2 cron job baru. Fase 1–7 tidak berubah.
> - **v1.0 — Juni 2026**: Versi awal.

> **Dokumen ini adalah spesifikasi build untuk Claude Code (CLI).**
> Bahasa: Indonesia untuk penjelasan, Inggris untuk semua identifier teknis (nama tabel, endpoint, variabel, commit).
> Cara pakai: letakkan file ini di root repo. Buat `CLAUDE.md` berisi: "Baca dan patuhi `aplikasi.md` sebagai sumber kebenaran. Kerjakan sesuai BAGIAN 12 (Urutan Build). Jangan keluar dari guardrails BAGIAN 13."
> Jika ada hal yang ambigu/tidak tercakup: **berhenti dan tanya**, jangan berasumsi pada hal yang menyentuh data anak, uang, atau keamanan.

---

## DAFTAR ISI

1. Ringkasan Produk & Tujuan
2. Keputusan Arsitektur (ADR) — WAJIB DIPATUHI
3. Lini Aplikasi (App Lines) — Apa Saja yang Dibangun
4. Tech Stack & Versi
5. Struktur Monorepo
6. Model Data (Skema Database Lengkap)
7. Auth, RBAC & Manajemen Sesi
8. Spesifikasi API (Konvensi + Daftar Endpoint per Modul)
9. Spesifikasi Layar (Mobile per Role + Web per Area + Portal)
10. Aturan Bisnis Inti (Business Rules)
11. Layanan Pendukung: AI Service, Notification, Sync Box↔Cloud, Box Services
12. Urutan Build (Fase → Milestone → Definition of Done)
13. Guardrails — Yang DILARANG Dibangun / Dilakukan
14. Keamanan, NFR & Target Performa
15. Testing & QA Gate per Fase
16. Environment, Konfigurasi & Deployment
17. Konvensi Kerja untuk Claude Code

---

## BAGIAN 1 — RINGKASAN PRODUK & TUJUAN

**Magnoo** = ekosistem digital sekolah (SMA/SMK Indonesia). Sekolah mendapat semuanya gratis; pendapatan dari mitra (kampus, perusahaan, sponsor). Komponen nilai inti v1:

1. **WiFi sekolah ber-akun** (login WiFi = akun Magnoo, via captive portal + RADIUS di perangkat lokal "Magnoo Box").
2. **Absensi otomatis** (QR dinamis dulu; face recognition fase lanjut) + **notifikasi real-time ke orang tua**.
3. **AI Asisten Guru** (generate modul ajar/soal, bantu koreksi, narasi rapor — human-in-the-loop).
4. **Komunikasi sekolah**: pengumuman, izin digital, pesan ortu↔wali kelas.
5. Fase lanjut: gamifikasi+iklan tersaring, alumni & career center, AI Tutor siswa (hanya jika ada sponsor), early warning system, startup center.

**Konteks krusial yang memengaruhi semua keputusan teknis:**
- Sebagian besar pengguna adalah **anak di bawah umur** → privasi & keamanan anak adalah requirement nomor satu, bukan fitur.
- HP siswa/ortu banyak yang low-end (RAM 2–3GB, storage sempit) → app harus ringan.
- Internet & listrik sekolah tidak stabil → sistem lokal (Box) harus tetap hidup offline.
- Tim kecil → arsitektur harus sederhana untuk dioperasikan (boring tech, modular monolith).

### 1.1 Visi Jangka Panjang (5 Lapisan) — KONTEKS, BUKAN SCOPE BUILD SAAT INI

> Sumber: **Big Blueprint v2** (`01-Strategi/magnoo-big-blueprint-v2.html`). Bagian ini hanya **konteks arah** agar keputusan teknis hari ini tidak menutup pintu ke masa depan. **Tidak mengubah fase teknis 0–8.** Lapisan 2–5 BELUM buildable — masing-masing butuh ADR + kajian hukum (PDP/PSE) tersendiri sebelum mulai.

Magnoo dirancang tumbuh dari app sekolah menjadi jaringan *audience intelligence* dalam 5 lapisan bisnis:

1. **Lapisan 1 — Sekolah & Komunitas** *(SEKARANG; = fase teknis 0–8 dokumen ini).* App sekolah gratis; fondasi data audience terverifikasi institusi.
2. **Lapisan 2 — Layar & Lokasi Fisik** *(≈ tahun 2).* Layar digital di gerbang sekolah + traffic counting (kamera) + titik non-sekolah.
3. **Lapisan 3 — Network Media Owner / Platform OOH** *(≈ tahun 3).* Marketplace OOH: pemilik billboard bergabung; Magnoo Audience Index (MAI); kontrak pemerintah/Smart City.
4. **Lapisan 4 — Programmatic & AI (DOOH)** *(≈ tahun 4).* Self-serve advertiser, dynamic trigger/pricing, API agency.
5. **Lapisan 5 — Data Marketplace Nasional** *(≈ tahun 5+).* Mobility/audience intelligence dijual ke enterprise & pemerintah via subscription.

**Garis mati yang berlaku untuk SEMUA lapisan di atas:** lihat **Guardrail 13.13** — data anak/sekolah tidak pernah menjadi produk iklan/data. Lapisan 2–5 dibangun di atas data agregat/anonim & sumber non-anak. Setiap lapisan baru = keputusan pemilik + ADR + kajian hukum, bukan diturunkan otomatis dari dokumen ini.

---

## BAGIAN 2 — KEPUTUSAN ARSITEKTUR (ADR)

Setiap ADR di bawah bersifat FINAL untuk v1. Claude Code tidak boleh menggantinya tanpa persetujuan eksplisit pemilik proyek.

### ADR-001: Mobile = SATU aplikasi Flutter, multi-role
- **Keputusan**: 1 app untuk role `student`, `teacher`, `parent`, `alumni`. Role ditentukan saat login (dari JWT), UI me-render shell sesuai role.
- **Alasan**: (a) satu orang bisa multi-role (guru yang juga ortu) → fitur *role switcher* dalam 1 akun; (b) 1 codebase = 1 CI, 1 store listing, maintenance ½; (c) onboarding ortu lebih mudah ("download Magnoo" — satu nama).
- **Mitigasi "berat"**: role-based routing (modul role lain tidak pernah di-mount), Flutter **deferred components** untuk modul berat (kamera/scanner, media), aset dikompresi, target APK **< 40MB**, cold start < 3 detik di perangkat RAM 2GB.
- **Ditolak**: app terpisah per role (4× biaya rilis, membingungkan multi-role).

### ADR-002: Web = SATU aplikasi Next.js multi-area, captive portal TERPISAH
- **Keputusan**: 1 codebase Next.js dengan route groups: `/school/*` (admin sekolah & kepsek), `/hq/*` (Magnoo pusat), `/partner/*` (mitra/pengiklan). Captive portal = micro-app terpisah (`apps/portal`) karena wajib **< 200KB** dan di-serve juga dari Box secara lokal.
- **Alasan**: dashboard berbagi komponen & auth; portal punya constraint ekstrem (HP kentang, koneksi lambat, harus jalan offline dari Box).

### ADR-003: Backend = MODULAR MONOLITH (NestJS), bukan microservices
- **Keputusan**: 1 service NestJS dengan module boundaries ketat (`auth`, `school`, `attendance`, `comms`, `ai`, `gamification`, `ads`, `career`, `sync`, `notification`, `analytics`, `billing`). 1 database PostgreSQL. Queue via Redis + BullMQ.
- **Alasan**: tim kecil; microservices menambah kompleksitas operasional tanpa manfaat di skala < 100 sekolah. Module boundaries dijaga agar kelak bisa diekstrak bila perlu.
- **Aturan boundary**: antar-module hanya berkomunikasi via service interface yang di-export, TIDAK boleh import repository/entity module lain langsung.

### ADR-004: Monorepo
- **Keputusan**: satu repo berisi semua (lihat BAGIAN 5), dikelola pnpm workspaces + melos (Flutter). Shared types di `packages/shared` (skema zod + tipe TS yang juga jadi sumber generate model Dart via script).

### ADR-005: Identitas = UUID di cloud, PII di Box
- **Keputusan**: cloud hanya menyimpan `user_id (UUID)` + atribut non-identitas (role, school_id, class_id, status). **Nama, NIS/NISN, tanggal lahir, kontak siswa = hanya di database Box** sekolah masing-masing. Dashboard sekolah menampilkan nama dengan menarik dari Box-nya sendiri melalui kanal `box-bridge` (lihat 11.3). Pengecualian terukur: nama **guru/ortu/alumni dewasa** boleh di cloud (diperlukan untuk login & komunikasi), nama **siswa tidak**.
- **Konsekuensi untuk developer**: dilarang menulis nama siswa ke log cloud, ke tabel cloud, ke payload analytics, ke prompt AI tanpa pseudonimisasi.

### ADR-006: Offline-first untuk Box
- Box harus berfungsi (WiFi auth, absensi, bel, portal lokal) **≥ 72 jam tanpa internet**. Semua event antri di `sync_queue` lokal, terkirim idempotent saat online.

### ADR-007: AI selalu lewat proxy internal (`ai` module)
- Aplikasi klien TIDAK pernah memanggil LLM provider langsung. Pipeline wajib: anonymize → quota check → cache check → call provider (adapter pattern, provider-agnostic) → safety filter → de-anonymize → cost log.

### ADR-008: Feature flags per sekolah
- Semua fitur non-inti dibungkus flag (tabel `feature_flags`), bisa on/off per `school_id` dari HQ tanpa deploy.

---

## BAGIAN 3 — LINI APLIKASI (APP LINES)

| # | App Line | Platform | Pengguna | Catatan |
|---|----------|----------|----------|---------|
| 1 | `apps/mobile` — Magnoo App | Flutter (Android prioritas, iOS menyusul) | Siswa, Guru, Ortu, Alumni | Single app multi-role (ADR-001) |
| 2 | `apps/web` — Magnoo Dashboard | Next.js (web) | Admin sekolah, Kepsek, HQ, Mitra | Multi-area (ADR-002) |
| 3 | `apps/portal` — Captive Portal | HTML/Preact super ringan | Semua pengguna WiFi | < 200KB, di-serve dari Box & cloud |
| 4 | `apps/api` — Backend API | NestJS + PostgreSQL + Redis | Semua klien | Modular monolith (ADR-003) |
| 5 | `box/` — Magnoo Box Suite | Docker Compose di mini PC Linux | Per sekolah | RADIUS, portal lokal, DB lokal, face service, sync agent, bell, mgmt |
| 6 | `packages/shared` | TypeScript + generator Dart | — | Skema, tipe, konstanta, error codes |
| 7 | `infra/` | Docker, skrip deploy, monitoring | — | Compose untuk dev & prod awal; Prometheus+Grafana |

---

## BAGIAN 4 — TECH STACK & VERSI

| Lapisan | Pilihan | Catatan versi |
|---|---|---|
| Mobile | Flutter stable terbaru (≥ 3.x), Dart ≥ 3.x | State: Riverpod. Routing: go_router. Storage aman: flutter_secure_storage. HTTP: dio. Push: firebase_messaging |
| Web | Next.js ≥ 14 (App Router), React ≥ 18, TypeScript strict | UI: Tailwind + shadcn/ui. Data: TanStack Query. Form: react-hook-form + zod |
| Portal | Preact + vite (atau vanilla TS) | Tanpa framework berat. Inline CSS. Total bundle < 200KB |
| API | NestJS ≥ 10, TypeScript strict | ORM: Prisma. Validasi: zod (via packages/shared). Queue: BullMQ. Auth: JWT (jose) |
| DB | PostgreSQL ≥ 15 (cloud & Box) | Migrasi: Prisma Migrate. Box memakai subset skema |
| Cache/Queue | Redis ≥ 7 | |
| Face | Python 3.11 service di Box: InsightFace (buffalo_l) + ONNX Runtime CPU, FastAPI | Hanya di Box, tidak pernah di cloud |
| Notif | FCM (Android), APNs (iOS), WA gateway adapter (provider WhatsApp Business API — interface dulu, implementasi belakangan) | |
| AI | Adapter pattern: `LlmProvider` interface; implementasi pertama: Anthropic API; mudah ganti | Model murah untuk tugas ringan, model pintar untuk generate kompleks |
| VPN Box | WireGuard | Box → NOC, untuk mgmt & box-bridge |
| Observability | Prometheus + Grafana + Loki (logs) + alert Telegram | Dipasang sejak Fase 1 |
| CI | GitHub Actions: lint, typecheck, test, build per workspace | |

---

## BAGIAN 5 — STRUKTUR MONOREPO

```
magnoo/
├── CLAUDE.md                 # pointer ke aplikasi.md + perintah kerja
├── aplikasi.md               # dokumen ini (sumber kebenaran)
├── package.json              # pnpm workspaces root
├── apps/
│   ├── api/                  # NestJS modular monolith
│   │   └── src/modules/
│   │       ├── auth/         ├── school/       ├── attendance/
│   │       ├── comms/        ├── ai/           ├── gamification/
│   │       ├── ads/          ├── career/       ├── sync/
│   │       ├── notification/ ├── analytics/    ├── billing/
│   │       └── feature-flags/
│   ├── web/                  # Next.js: /school /hq /partner
│   ├── portal/               # captive portal micro-app
│   └── mobile/               # Flutter multi-role
│       └── lib/
│           ├── core/         # auth, api client, theme, router
│           ├── features/
│           │   ├── student/  ├── teacher/  ├── parent/  ├── alumni/
│           │   └── common/   # announcements, profile, notifications
│           └── main.dart
├── box/
│   ├── docker-compose.yml    # semua service Box
│   ├── radius/               # FreeRADIUS config + rest-auth bridge
│   ├── portal-local/         # serve apps/portal build secara lokal
│   ├── facesvc/              # Python FastAPI + InsightFace
│   ├── sync-agent/           # Node service: queue → cloud
│   ├── box-bridge/           # API lokal: nama siswa utk dashboard sekolah
│   ├── bell/                 # scheduler bel (GPIO/relay via USB)
│   └── mgmt-agent/           # healthcheck, auto-update, WireGuard
├── packages/
│   └── shared/               # zod schemas, types, error codes, constants
│                             # + script generate Dart models (build step)
├── infra/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── monitoring/
└── scripts/                  # seed, box-image-build, dsb.
```

---

## BAGIAN 6 — MODEL DATA (SKEMA LENGKAP)

Konvensi: semua tabel punya `id UUID PK default gen_random_uuid()`, `created_at`, `updated_at`. Soft-delete via `deleted_at` untuk entitas bersejarah. Waktu disimpan UTC (`timestamptz`).

### 6.1 Cloud — Core

```prisma
// ===== TENANCY & IDENTITY =====
model School {
  id          String  @id @default(uuid())
  npsn        String  @unique
  name        String
  city        String
  province    String  @default("Jawa Timur")
  timezone    String  @default("Asia/Jakarta")
  status      SchoolStatus // ONBOARDING | ACTIVE | PAUSED | TERMINATED
  settings    Json     // jam_masuk, late_cutoff, absent_cutoff, wifi_hours, dst (lihat 10.1)
  boxes       Device[]
}

model User {
  id          String  @id @default(uuid())
  schoolId    String? // null untuk HQ & partner user
  role        Role    // STUDENT | TEACHER | SCHOOL_ADMIN | PRINCIPAL | PARENT | ALUMNI | PARTNER | HQ_ADMIN | HQ_OPS
  username    String  // siswa: NIS (unik per sekolah); dewasa: email/phone
  passwordHash String
  status      UserStatus // ACTIVE | INACTIVE | LOCKED | PENDING_CONSENT
  // PII dewasa boleh; PII SISWA DILARANG di tabel ini (ADR-005):
  displayName String? // null untuk STUDENT — nama siswa hanya di Box
  phone       String? // hanya dewasa
  email       String? // hanya dewasa
  classId     String? // untuk STUDENT
  graduationYear Int? // untuk STUDENT/ALUMNI
  mustChangePassword Boolean @default(true)
  failedLoginCount Int @default(0)
  lockedUntil DateTime?
  @@unique([schoolId, username])
}

model UserRoleLink { // dukung multi-role 1 manusia (guru yang juga ortu)
  id        String @id @default(uuid())
  primaryUserId String   // akun login utama
  linkedUserId  String   // akun role lain milik orang yang sama
  verifiedBy    String?  // school admin yang memverifikasi
}

model Session {
  id        String @id @default(uuid())
  userId    String
  deviceId  String   // fingerprint perangkat
  deviceName String?
  refreshTokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  @@index([userId])
}

model Class {
  id        String @id @default(uuid())
  schoolId  String
  academicYear String  // "2026/2027"
  grade     Int        // 10 | 11 | 12
  major     String?    // jurusan SMK
  label     String     // "XI-TKJ-2"
  homeroomTeacherId String? // wali kelas
}

model ParentLink {
  id        String @id @default(uuid())
  parentUserId  String
  studentUserId String
  inviteCodeId  String
  status    LinkStatus // ACTIVE | REVOKED
  @@unique([parentUserId, studentUserId])
}

model InviteCode {
  id        String @id @default(uuid())
  code      String @unique  // 8 char alfanumerik
  studentUserId String
  expiresAt DateTime        // 30 hari
  usedAt    DateTime?
  revokedAt DateTime?
}

model ConsentRecord {
  id        String @id @default(uuid())
  subjectUserId String   // siswa ybs
  grantedByUserId String? // ortu (atau alumni sendiri saat 18+)
  type      ConsentType // GENERAL_DATA | FACE | PUBLICATION | ALUMNI_CAREER | TOS
  docVersion String
  grantedAt DateTime
  revokedAt DateTime?
  evidenceRef String?    // nomor arsip formulir fisik
}

model AuditLog { // APPEND-ONLY: tidak ada update/delete. Enforce di service layer.
  id        String @id @default(uuid())
  actorUserId String
  action    String     // "ATTENDANCE_CORRECT", "USER_DEACTIVATE", ...
  entity    String
  entityId  String
  before    Json?
  after     Json?
  ip        String?
  createdAt DateTime @default(now())
}
```

### 6.2 Cloud — Attendance & Comms

```prisma
model AttendanceEvent { // IMMUTABLE: koreksi = event baru type CORRECTION
  id        String @id @default(uuid())
  userId    String
  schoolId  String
  date      String      // "2026-07-21" (tanggal sekolah, timezone sekolah)
  type      AttType     // IN | OUT | CORRECTION
  method    AttMethod   // QR | FACE | MANUAL
  status    AttStatus   // PRESENT | LATE | (CORRECTION: nilai baru)
  occurredAt DateTime
  sourceEventId String? // utk CORRECTION: menunjuk event yang dikoreksi
  correctedBy String?
  correctionReason String?
  boxEventId String? @unique // idempotency key dari Box
  @@index([schoolId, date])
  @@index([userId, date])
}

model DailyAttendanceStatus { // materialized hasil hitung per siswa per hari
  id        String @id @default(uuid())
  userId    String
  schoolId  String
  date      String
  finalStatus FinalAtt // PRESENT | LATE | PERMIT | SICK | ABSENT_NO_INFO
  firstInAt  DateTime?
  lastOutAt  DateTime?
  @@unique([userId, date])
}

model Permit {
  id        String @id @default(uuid())
  studentUserId String
  requestedByUserId String // siswa atau ortu
  type      PermitType // SICK | FAMILY | DISPENSATION | OTHER
  dateStart String
  dateEnd   String
  note      String
  attachmentUrl String?  // max 5MB, jpg/png/pdf
  status    PermitStatus // SUBMITTED | APPROVED | REJECTED | CANCELLED
  decidedByUserId String?
  decidedAt DateTime?
  decisionNote String?
}

model Announcement {
  id        String @id @default(uuid())
  schoolId  String
  authorUserId String
  scope     AnnScope  // CLASS | GRADE | SCHOOL | PARENTS
  scopeIds  String[]  // classIds / grade numbers
  title     String
  body      String
  attachments Json?
  publishedAt DateTime
  retractedAt DateTime? // boleh ≤15 menit setelah publish (rule 10.6)
}

model Thread { // pesan ortu↔wali kelas & ruang kelas guru→siswa
  id        String @id @default(uuid())
  schoolId  String
  type      ThreadType // PARENT_HOMEROOM | CLASS_ROOM | APPLICATION (career)
  contextId String     // classId / applicationId
  participantIds String[]
}
model Message {
  id        String @id @default(uuid())
  threadId  String
  senderUserId String
  body      String
  templateKey String? // ortu mulai dari template (rule 10.7)
  createdAt DateTime @default(now())
}
```

### 6.3 Cloud — Gamification, Ads, AI, Career, Ops

```prisma
model PointLedger { // APPEND-ONLY. Saldo = SUM(delta). Tidak ada kolom "balance" yang diedit.
  id        String @id @default(uuid())
  userId    String
  delta     Int
  source    PointSource // QUIZ | CHALLENGE | REDEMPTION | ADJUSTMENT
  refId     String?
  createdAt DateTime @default(now())
}
model Quiz { id String @id @default(uuid()); schoolScope Json; title String; questions Json; rewardPoints Int; sponsorCampaignId String?; activeDate String }
model QuizAttempt { id String @id @default(uuid()); quizId String; userId String; answers Json; score Int; durationMs Int; flagged Boolean @default(false); @@unique([quizId, userId]) }
model RewardItem { id String @id @default(uuid()); name String; cost Int; type RewardType; stock Int; active Boolean }
model Redemption { id String @id @default(uuid()); userId String; rewardItemId String; status RedemptionStatus; idempotencyKey String @unique; fulfilledAt DateTime? }

model Partner { id String @id @default(uuid()); name String; type PartnerType /* UNIVERSITY|COMPANY|BRAND|SPONSOR|RESEARCH */; status PartnerStatus; billingInfo Json }
model AdCampaign {
  id String @id @default(uuid()); partnerId String
  package String // KENALAN | KOTA | KORIDOR | BRAND_SLOT | ...
  target Json   // { cities[], schoolIds[], grades[], majors[], roles[] } — HANYA field ini (rule 10.8)
  periodStart String; periodEnd String
  status CampaignStatus // DRAFT | PENDING_PAYMENT | ACTIVE | PAUSED | ENDED
  pausedReason String?
}
model AdCreative {
  id String @id @default(uuid()); campaignId String
  assetUrl String; landingUrl String?; copy String
  status CreativeStatus // SUBMITTED | AI_FLAGGED | APPROVED | REJECTED
  aiScreenResult Json?; reviewerUserId String?; rejectReason String?
}
model AdImpression { // TANPA userId — hanya agregat-able (privasi by design)
  id String @id @default(uuid()); creativeId String; schoolId String
  role Role; surface AdSurface /* PORTAL | APP_SLOT */; ts DateTime @default(now())
}
model AdClick { id String @id @default(uuid()); creativeId String; schoolId String; role Role; ts DateTime @default(now()) }

model AiUsage { id String @id @default(uuid()); schoolId String; userId String; feature AiFeature /* TEACHER_GEN | TEACHER_GRADE | REPORT_NARRATIVE | TUTOR | BIZ_MENTOR | PARENT_DIGEST */; tokensIn Int; tokensOut Int; costEstimate Decimal; cached Boolean; createdAt DateTime @default(now()) }
model AiQuota  { id String @id @default(uuid()); scope String /* "school:<id>" | "user:<id>" */; feature AiFeature; dailyLimit Int; monthlyCostCapIdr Int }
model TeacherMaterial { id String @id @default(uuid()); schoolId String; classId String; authorUserId String; type MaterialType; title String; content Json; status MaterialStatus /* DRAFT | APPROVED */; sharedToSchool Boolean @default(false) }

model AlumniProfile {
  id String @id @default(uuid()); userId String @unique
  visibilityOptIn Boolean @default(false) // default TERSEMBUNYI (rule 10.9)
  careerStatus CareerStatus // WORKING | STUDYING | BUSINESS | SEEKING | UNKNOWN
  verifiedData Json   // jurusan, tahun lulus — dari sekolah, read-only utk alumni
  selfData Json       // skill, pengalaman — diisi alumni
}
model JobPost { id String @id @default(uuid()); partnerId String; title String; majorTargets String[]; cityTargets String[]; salaryMin Int; salaryMax Int; type JobType /* FULLTIME | INTERN | PKL */; status JobStatus; expiresAt DateTime }
model JobApplication { id String @id @default(uuid()); jobPostId String; alumniUserId String; status AppStatus /* APPLIED | SHORTLIST | INTERVIEW | HIRED | REJECTED | WITHDRAWN */; threadId String? ; @@unique([jobPostId, alumniUserId]) }

model Device { // Magnoo Box fleet
  id String @id // = box serial "MAGNOO-0001"
  schoolId String?
  pairedAt DateTime?
  pairingTokenHash String?
  swVersion String?
  lastSeenAt DateTime?
  health Json? // disk, temp, queueDepth, services
}
model FeatureFlag { id String @id @default(uuid()); key String; schoolId String?; enabled Boolean; @@unique([key, schoolId]) }
model NotificationLog { id String @id @default(uuid()); userId String; channel NotifChannel /* PUSH | WA | INAPP */; templateKey String; payloadRef Json; status NotifStatus /* QUEUED | SENT | DELIVERED | FAILED */; createdAt DateTime @default(now()) }

model CampaignLead { // produk "paket leads" kampus: pendaftar open day, OPT-IN eksplisit
  id String @id @default(uuid()); campaignId String; schoolId String
  consentChecked Boolean // wajib true; siswa/ortu mengisi sendiri formnya
  payload Json   // {nama, kontak, minatJurusan} — diberikan SUKARELA oleh subjek utk diteruskan ke partner
  forwardedAt DateTime?; createdAt DateTime @default(now())
}
model UserPreference { id String @id @default(uuid()); userId String @unique; mutedOfferCategories String[]; notifSettings Json }
model EwsAlert { // Fase 8 — privat wali kelas/BK, TANPA skor ranking
  id String @id @default(uuid()); studentUserId String; schoolId String; classId String
  ruleTriggered String  // "ABSENT_3_CONSECUTIVE" | "LATE_TREND_UP"
  evidence Json; status EwsStatus /* OPEN | ACTIONED | DISMISSED */
  actionedByUserId String?; actionNote String?; createdAt DateTime @default(now())
}
// ===== STARTUP CENTER (Fase 8) =====
model StartupIdea {
  id           String  @id @default(uuid())
  schoolId     String
  ownerUserId  String                         // siswa pemilik ide
  coOwnerIds   String[]                       // anggota tim (maks 5 siswa, sekolah sama)
  title        String
  tagline      String                         // 1 kalimat, max 120 karakter
  summary      String                         // deskripsi lengkap
  category     IdeaCategory                   // TECH | FOOD | CREATIVE | SOCIAL | GREEN | OTHER
  batch        String                         // "2026/2027" — satu angkatan per siklus
  pitchDeckUrl String?                        // PDF/PPT max 10MB (via presigned upload)
  coverImageUrl String?
  status       IdeaStatus                     // DRAFT | SUBMITTED | SHORTLISTED | INCUBATED | GRADUATED | REJECTED
  advisorUserIds String[]                     // guru pembimbing (opsional, max 2)
  mentorIds    String[]                       // mentor resmi dari MentorProfile
  threadId     String?                        // thread diskusi STARTUP_ROOM
  sponsorCampaignId String?                   // terhubung ke AdCampaign CSR
  demoDay      Boolean @default(false)        // tampil di Demo Day
  viewCount    Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([schoolId, batch])
  @@index([status])
}

model IdeaSupport {                           // dukungan/vote dari siswa lain (bukan like kosong)
  id        String @id @default(uuid())
  ideaId    String
  userId    String                            // siswa yang mendukung
  message   String?                          // boleh tambah pesan pendek (max 100 karakter)
  createdAt DateTime @default(now())
  @@unique([ideaId, userId])                 // satu siswa satu dukungan per ide
}

model IdeaComment {                           // diskusi publik di halaman ide (teraudit)
  id        String @id @default(uuid())
  ideaId    String
  authorUserId String
  body      String
  parentId  String?                          // untuk reply (max 1 level)
  pinned    Boolean @default(false)          // guru/mentor bisa pin komentar penting
  createdAt DateTime @default(now())
}

model Competition {                           // lomba ide — dibuat oleh sekolah atau HQ
  id          String @id @default(uuid())
  schoolId    String?                        // null = lomba lintas kota (dibuat HQ)
  title       String
  description String
  category    IdeaCategory?                  // null = semua kategori
  batch       String
  phase       CompetitionPhase               // OPEN | JUDGING | CLOSED | ANNOUNCED
  submissionStart DateTime
  submissionEnd   DateTime
  announcedAt     DateTime?
  maxEntries      Int?                       // batas maksimal peserta
  prize           String?                    // deskripsi hadiah
  sponsorCampaignId String?
  judgeUserIds    String[]                   // HQ/kepsek/mentor sebagai juri
  createdAt   DateTime @default(now())
}

model CompetitionEntry {                      // ide yang ikut serta lomba
  id            String @id @default(uuid())
  competitionId String
  ideaId        String
  submittedAt   DateTime @default(now())
  scores        Json?                        // {judgeId: score} — diisi juri
  finalScore    Float?
  rank          Int?
  notes         String?                      // catatan juri
  @@unique([competitionId, ideaId])
}

model MentorProfile {                        // profil mentor (alumni 18+ atau tamu eksternal)
  id          String @id @default(uuid())
  userId      String? @unique               // null = mentor eksternal tanpa akun
  displayName String
  expertise   String[]                      // ["Teknologi", "Kuliner", "Sosial"]
  bio         String
  linkedinUrl String?
  availableSlots Int @default(2)            // berapa mentee aktif yang bisa ditangani
  schoolIds   String[]                      // sekolah yang boleh diakses; kosong = semua
  status      MentorStatus                  // ACTIVE | PAUSED | INACTIVE
  approvedBy  String                        // HQ yang menyetujui
  createdAt   DateTime @default(now())
}

model MentorSession {                        // sesi mentoring terjadwal
  id          String @id @default(uuid())
  mentorId    String
  ideaId      String
  scheduledAt DateTime
  durationMin Int    @default(60)
  medium      SessionMedium                 // ONLINE | OFFLINE
  link        String?                       // Gmeet/Zoom link bila online
  notes       String?                       // ringkasan sesi (diisi mentor setelah selesai)
  status      SessionStatus                 // SCHEDULED | DONE | CANCELLED
  createdAt   DateTime @default(now())
}
```

### 6.4 Box — skema lokal (subset + PII)

```sql
-- HANYA di PostgreSQL Box. TIDAK pernah di-sync mentah ke cloud.
CREATE TABLE student_pii (
  user_id UUID PRIMARY KEY,      -- sama dengan cloud User.id
  nis TEXT NOT NULL, nisn TEXT,
  full_name TEXT NOT NULL,
  birth_date DATE, gender TEXT,
  class_id UUID, photo_consent BOOLEAN DEFAULT false
);
CREATE TABLE face_template (
  user_id UUID PRIMARY KEY REFERENCES student_pii,
  embedding BYTEA NOT NULL,       -- terenkripsi at-rest (LUKS disk + app-level AES)
  enrolled_at TIMESTAMPTZ, model_version TEXT
);
CREATE TABLE sync_queue (
  event_id UUID PRIMARY KEY,
  kind TEXT NOT NULL,             -- ATTENDANCE | HEALTH | PORTAL_METRIC
  payload JSONB NOT NULL,         -- TANPA PII (di-strip sebelum masuk queue)
  status TEXT DEFAULT 'PENDING',  -- PENDING | SENT | ACKED
  retry_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE local_cache (key TEXT PRIMARY KEY, value JSONB, synced_at TIMESTAMPTZ);
-- cache: jadwal bel, daftar user utk RADIUS, materi portal, settings sekolah
```

---

## BAGIAN 7 — AUTH, RBAC & SESI

### 7.1 JWT
- Access token (1 jam): claims `{ sub, role, schoolId, scopes[], linkRoles[] }`.
- Refresh token (30 hari, rotating, hash disimpan di `Session`). Refresh reuse-detection → revoke seluruh sesi user.
- `linkRoles`: daftar role lain milik orang yang sama (UserRoleLink) untuk role switcher tanpa logout.

### 7.2 Aturan login
- Siswa login dengan `NIS + password`. Dewasa: `phone/email + password` (ortu registrasi via OTP WA/SMS + invite code).
- First login: wajib ganti password + setujui ToS sesuai role (versi pelajar untuk siswa). Password policy: min 8, tolak yang sama dengan NIS/tanggal lahir/123456-class.
- Gagal 5× → lock 15 menit (`lockedUntil`). Pesan error TIDAK membedakan "username salah" vs "password salah".
- Limit perangkat: STUDENT max 2 session aktif; role lain max 3. Sesi ke-N+1 me-revoke sesi tertua (beri tahu user).

### 7.3 RBAC — enforce di BACKEND per request
- Setiap endpoint mendeklarasikan `@Roles(...)` + `@Scope('self'|'class'|'school'|'global')`.
- Guard memvalidasi: role cocok DAN resource berada dalam scope (mis. guru → hanya class yang diampu; lihat `Class.homeroomTeacherId` + tabel pengampu). Pelanggaran → `403` + AuditLog.
- HQ role TIDAK punya endpoint untuk membaca PII siswa (endpointnya memang tidak ada — ADR-005).

### 7.4 Matriks ringkas
| Aksi | HQ | SchAdmin | Kepsek | Guru | Siswa | Ortu | Alumni | Mitra |
|---|---|---|---|---|---|---|---|---|
| Provision sekolah/Box | ✅ | — | — | — | — | — | — | — |
| Impor massal user | — | ✅ | — | — | — | — | — | — |
| Lihat PII siswa | ❌ | ✅sekolah | ✅sekolah | ✅kelas | ✅diri | ✅anak | ✅diri | ❌ |
| Koreksi absen | ❌ | ✅+audit | ❌ | ✅kelas+audit | ❌ | ❌ | ❌ | ❌ |
| Approve iklan | ✅ | view | view | — | — | — | — | submit |
| Analytics global | ✅ | — | — | — | — | — | — | kampanyenya |

---

## BAGIAN 8 — SPESIFIKASI API

### 8.1 Konvensi
- REST JSON, prefix `/api/v1`. Error format: `{"error":{"code":"PERMIT_DUPLICATE","message":"<id, manusiawi>","traceId":"..."}}`. Error codes terpusat di `packages/shared/errors.ts`.
- Pagination: cursor (`?cursor=&limit=`, default 25, max 100).
- Idempotency: header `Idempotency-Key` WAJIB untuk: semua endpoint sync Box, `POST /redemptions`, semua endpoint billing. Server menyimpan hasil per key 48 jam.
- Rate limit: 120 req/menit/user; login 10/menit/IP → `429` + `Retry-After`.
- Semua waktu ISO-8601 UTC; field tanggal-sekolah bertipe string `YYYY-MM-DD`.

### 8.2 Endpoint per modul (daftar lengkap v1)

**auth**
```
POST /auth/login                     {username|phone|email, password, deviceId, deviceName}
POST /auth/refresh                   {refreshToken}
POST /auth/logout                    (revoke sesi ini)
POST /auth/password/change           {old, new}
POST /auth/password/forgot           {phone|email} → OTP (role dewasa; siswa reset via admin sekolah)
POST /auth/password/reset            {phone|email, otp, newPassword}
POST /auth/parent/register           {phone} → kirim OTP
POST /auth/parent/verify-otp         {phone, otp} → temp token
POST /auth/parent/link-child         {inviteCode}     [PARENT temp/full]
POST /auth/role-switch               {targetUserId}   (dari linkRoles)
GET  /auth/sessions  · DELETE /auth/sessions/:id
```

**files & meta**
```
POST /files/presign                  {purpose: PERMIT_ATTACHMENT|AD_CREATIVE|PORTFOLIO, mime, size} → presigned URL (limit: permit ≤5MB jpg/png/pdf; creative ≤2MB)
GET  /meta/app-version               → {minVersion, latestVersion, forceUpdateMessage}  (mobile cek saat launch; di bawah minVersion → layar wajib update)
GET  /meta/legal/:doc                → ToS/privacy per versi (ditampilkan in-app)
```

**school (provisioning & master data)**
```
POST /hq/schools                      [HQ_OPS]
POST /hq/schools/:id/pair-box         {boxSerial} → pairingToken sekali pakai
POST /hq/schools/:id/admin-account    → kredensial admin sekolah (sekali tampil)
GET/PUT /school/settings              [SCHOOL_ADMIN]
POST /school/users/import             multipart XLSX [SCHOOL_ADMIN]  → jobId
GET  /school/users/import/:jobId      → progress + downloadable error report
POST /school/users  · PATCH /school/users/:id (deactivate, reset, dsb.)
CRUD /school/classes  · POST /school/classes/promote   (wizard kenaikan kelas: preview→confirm)
POST /school/invite-codes/generate    {classId|studentIds} → PDF batch
POST /school/invite-codes/:id/revoke
GET  /school/audit-log                [SCHOOL_ADMIN]
GET/POST /school/consents             (arsip ConsentRecord; gate utk face enrollment)
```

**attendance**
```
POST /attendance/qr/checkin           {qrToken, geo?} [STUDENT]   (validasi rule 10.2)
GET  /attendance/qr/current           [tampilan gerbang/guru: token berputar 60 dtk]
POST /attendance/events/batch         [BOX only, HMAC] (face/QR events dari Box)
GET  /attendance/me?month=            [STUDENT]
GET  /attendance/class/:classId?date= [TEACHER scope]
POST /attendance/corrections          {eventId|userId+date, newStatus, reason} [TEACHER kelasnya ≤H+3, SCHOOL_ADMIN]
GET  /attendance/school/summary?date= [PRINCIPAL, SCHOOL_ADMIN]
```

**comms**
```
CRUD /announcements                   (retract ≤15 menit; scope per role)
POST /permits  · POST /permits/:id/decision  · POST /permits/:id/cancel
GET  /permits?scope=me|class|child
GET/POST /threads/:id/messages        (tipe thread sesuai rule 10.7)
```

**ai**
```
POST /ai/teacher/generate             {type: MODULE|QUESTION_SET|REPORT_NARRATIVE, subject, topic, grade, options}
POST /ai/teacher/grade                {rubric, answers[] (sudah pseudonim di server)}
POST /ai/materials/:id/approve        (DRAFT → APPROVED; wajib aksi guru)
POST /ai/tutor/chat                   {classContextId, message} [STUDENT, flag TUTOR_ENABLED]
GET  /ai/quota/me                     (sisa kuota hari ini)
GET  /hq/ai/costs?by=school|feature   [HQ]
```

**gamification**
```
GET  /quizzes/today  · POST /quizzes/:id/attempt   (1×; flag jika durasi/jawaban mencurigakan)
GET  /points/me  (saldo = sum ledger) · GET /points/me/history
GET  /rewards  · POST /redemptions {rewardItemId, Idempotency-Key}   (rule 10.5: endap 7 hari)
```

**ads**
```
[PARTNER] POST /partner/campaigns  · POST /partner/campaigns/:id/creatives
[PARTNER] GET  /partner/campaigns/:id/report      (agregat saja)
[HQ]      GET  /hq/creatives?status=PENDING  · POST /hq/creatives/:id/review {approve|reject, reason}
[PUBLIC-authed] GET /ads/serve?surface=PORTAL|APP_SLOT   (server-side pick sesuai rule 10.8; mengembalikan creative + tracking ids)
POST /ads/impression  · POST /ads/click            (tanpa userId di body — role & school dari token)
POST /ads/leads                                     {campaignId, payload, consentChecked:true}  (form open day diisi sukarela oleh siswa/ortu; tolak bila consent false)
[PARTNER] GET /partner/campaigns/:id/leads          (hanya leads kampanyenya sendiri; export csv)
[PRINCIPAL] GET /school/ads/active  · POST /school/ads/:creativeId/object   (auto-pause di sekolah itu)
```

**career**
```
GET/PUT /alumni/profile  · POST /alumni/profile/visibility {optIn}
GET  /jobs?filters  · POST /jobs/:id/apply  · GET /applications/me
[PARTNER] CRUD /partner/jobs  · GET /partner/jobs/:id/applications  · PATCH /partner/applications/:id/status
[SCHOOL] GET /school/tracer-report?year=    (agregat keterserapan; export xlsx)
```

**sync (Box↔Cloud) — lihat 11.4**
```
POST /sync/events            [BOX, HMAC, batch ≤500, per-event ACK]
GET  /sync/manifest          [BOX] (user list utk RADIUS — username+passhash+role+quota, TANPA nama siswa; settings; bell schedule; portal content; flags)
POST /sync/health            [BOX]
```

**hq ops & billing**
```
GET /hq/fleet  · POST /hq/fleet/:boxId/restart-service  · POST /hq/fleet/update-rollout {stage}
GET /hq/analytics/engagement?by=school     (DAU/WAU/MAU per sekolah — alarm adoption)
GET /hq/youthpulse/generate {questions, minN:50}   (tolak hasil n<50)
CRUD /hq/partners  · POST /hq/invoices  · webhook pembayaran → campaign ACTIVE
CRUD /hq/feature-flags
```

**notification & preferensi**
```
POST /notifications/test [HQ]  · GET /notifications/me  (in-app inbox)
GET/PUT /me/preferences          (mute kategori penawaran, pengaturan notif)
(pengiriman lewat queue internal — lihat 11.2)
```

**ews (Fase 8)**
```
GET  /ews/alerts?classId=        [TEACHER wali kelas, BK, PRINCIPAL agregat]
POST /ews/alerts/:id/action      {note} → status ACTIONED
```

**startup center (Fase 8)**
```
// === IDE ===
[STUDENT] POST /startup/ideas                          {title,tagline,summary,category,coOwnerIds[]} → DRAFT
[STUDENT] PUT  /startup/ideas/:id                      (edit selama DRAFT; field + lampiran)
[STUDENT] POST /startup/ideas/:id/submit               DRAFT → SUBMITTED (tidak bisa tarik kembali)
[STUDENT] POST /startup/ideas/:id/support              {message?} — 1 dukungan per siswa per ide
[STUDENT] DELETE /startup/ideas/:id/support            (cabut dukungan)
GET  /startup/ideas?schoolId=&batch=&status=&category= (publik dalam sekolah; DRAFT hanya milik sendiri)
GET  /startup/ideas/:id                                (detail + komentar + statistik dukungan)
[STUDENT/TEACHER/MENTOR] POST /startup/ideas/:id/comments  {body, parentId?}
[TEACHER/MENTOR] POST /startup/ideas/:id/comments/:cid/pin
[SCHOOL_ADMIN/HQ] PATCH /startup/ideas/:id            {status, advisorUserIds, mentorIds, demoDay}

// === LOMBA ===
[SCHOOL_ADMIN/HQ] POST /startup/competitions                   {title,description,category?,submissionStart,submissionEnd,judgeUserIds[],prize?,maxEntries?}
[SCHOOL_ADMIN/HQ] PATCH /startup/competitions/:id             {phase, announcedAt}
GET  /startup/competitions?schoolId=&batch=&phase=
[STUDENT] POST /startup/competitions/:id/entries      {ideaId} — daftarkan ide ke lomba
[JUDGE]  POST  /startup/competitions/:id/entries/:entryId/score {score, notes}
[SCHOOL_ADMIN/HQ] POST /startup/competitions/:id/announce     (hitung finalScore, set rank, kirim notif)

// === MENTOR ===
[HQ] POST /startup/mentors                            {displayName,expertise[],bio,schoolIds[]} → ACTIVE
[HQ] PATCH /startup/mentors/:id                       {status, availableSlots}
GET  /startup/mentors?schoolId=&expertise=            (daftar mentor aktif untuk sekolah)
[SCHOOL_ADMIN/HQ] POST /startup/ideas/:id/mentor-assign  {mentorId}
[MENTOR] POST /startup/sessions                       {ideaId, scheduledAt, durationMin, medium, link?}
[MENTOR] PATCH /startup/sessions/:id                  {notes, status:DONE|CANCELLED}
GET  /startup/sessions?mentorId=|ideaId=
[STUDENT] GET /startup/sessions?ideaId=               (lihat jadwal sesinya sendiri)

// === DEMO DAY ===
[HQ/SCHOOL_ADMIN] POST /startup/demoday               {batch, schoolId, eventDate, sponsorCampaignId?}
GET  /startup/demoday/:id/ideas                       (ide yang demoDay=true, urut finalScore)
[HQ] GET /startup/report?batch=&schoolId=             (rekap: jumlah ide, jumlah peserta lomba, mentoring hours, pemenang)
```

---

## BAGIAN 9 — SPESIFIKASI LAYAR

### 9.1 Mobile (Flutter) — shell per role

**Umum (semua role):** splash → login → (first-login: ganti password + ToS) → home sesuai role. Komponen common: notification inbox, profil & sesi perangkat, pengaturan bahasa/notifikasi, role switcher (jika `linkRoles` ada).

**STUDENT — bottom nav: Beranda · Belajar · Kuis · 🚀 Startup · Profil**
1. `Beranda`: kartu status absen hari ini, jadwal hari ini, pengumuman terbaru, slot iklan APP_SLOT (max 1 kartu, kategori tersaring).
2. `Absen`: tombol Scan QR (kamera, deferred module) → hasil + status; riwayat kalender bulan.
3. `Izin`: form (jenis, tanggal, catatan, lampiran ≤5MB) + daftar status.
4. `Belajar (AI Tutor)`: chat UI; indikator kuota; hanya tampil bila flag `TUTOR_ENABLED` sekolah aktif; banner sponsor "powered by X" bila ada.
5. `Kuis`: kuis harian (timer per soal), hasil + poin; katalog reward; riwayat penukaran.
6. `Portofolio`: daftar prestasi/sertifikat (read-only dari sekolah + tambah mandiri berstatus "menunggu verifikasi").
7. **`Startup` (Fase 8, flag `STARTUP_ENABLED`):**
   - **Tab Jelajah**: feed ide dari angkatan sendiri — kartu ide (judul, tagline, kategori, jumlah dukungan, status); filter kategori; tap buka detail.
   - **Halaman Detail Ide**: cover + tagline + deskripsi + pitch deck viewer (PDF in-app), jumlah pendukung + tombol dukung (+ pesan opsional), kolom komentar publik (reply 1 level, guru/mentor bisa pin), badge mentor & pembimbing, status (SUBMITTED/SHORTLISTED/dll), tab Lomba (lomba yang diikuti ide ini).
   - **Tab Ideku**: ide milik saya + tim saya. Bila belum ada → tombol besar "Tulis Ide Pertamamu". Form buat ide: judul, tagline, kategori, deskripsi, unggah pitch deck (PDF/PPT ≤10MB), tambah anggota tim (cari NIS teman sekolah). Simpan sebagai DRAFT, submit bila siap (konfirmasi — tidak bisa tarik balik). Setelah submit: lihat status, komentar masuk, jadwal sesi mentoring.
   - **Tab Lomba**: daftar lomba aktif (OPEN) → detail → tombol "Ikutkan Ideku" (pilih dari ide yang SUBMITTED+). Setelah terdaftar: lihat skor & peringkat (bila sudah diumumkan).
   - **Tab Mentor**: daftar mentor aktif + keahlian; bila sudah ditugaskan → lihat profil, riwayat sesi, tombol lihat jadwal sesi berikutnya.

**TEACHER — bottom nav: Kelas · AI Asisten · Pesan · 🚀 Startup · Profil**
1. `Kelas`: pilih kelas diampu → absen real-time hari ini (hadir/terlambat/belum), tombol koreksi (wajib alasan), rekap bulanan, daftar izin menunggu keputusan (approve/reject + catatan).
2. `AI Asisten`: tab Generate (form: jenis/mapel/topik/kelas → hasil DRAFT → editor → "Setujui & Simpan"), tab Koreksi (upload rubrik+jawaban → skor saran → konfirmasi per siswa), tab Rapor (narasi). Indikator kuota.
3. `Pengumuman`: compose ke kelas diampu (retract ≤15 m).
4. `Pesan`: thread per ortu (balasan), kartu Early Warning (fase lanjut; hanya wali kelas/BK).
5. **`Startup` (Fase 8, flag `STARTUP_ENABLED`):**
   - Daftar ide dari siswa di kelas yang diampu — guru bisa melihat semua ide (termasuk DRAFT milik siswanya).
   - Tombol "Jadikan Pembimbing" di tiap ide → nama guru muncul sebagai advisor di halaman ide.
   - Bisa memberikan komentar dan pin komentar di ide yang dibimbing.
   - Ringkasan: berapa siswa di kelasnya yang punya ide aktif, berapa yang ikut lomba.

**PARENT — bottom nav: Anak · Izin · Info · Profil**
1. `Anak`: kartu per anak (multi-anak): status hari ini + jam masuk/pulang; riwayat; ringkasan mingguan AI (Jumat).
2. `Izin`: ajukan untuk anak (badge "diajukan orang tua") + status.
3. `Info`: pengumuman sekolah + kalender kegiatan; tab terpisah `Penawaran` (max 1 baru/minggu, ada "sembunyikan kategori").
4. `Pesan`: ke wali kelas (mulai dari template + teks bebas).
5. Onboarding khusus: register OTP → masukkan kode undangan → tersambung (boleh tambah anak lagi).

**ALUMNI — bottom nav: Karier · Lowongan · Komunitas · 🧑‍🏫 Mentor · Profil**
1. Wizard transisi & re-consent (sekali, saat pertama login pasca-lulus).
2. `Profil karier`: data terverifikasi (read-only) + data mandiri; toggle besar "Buka profil untuk rekruter" (default OFF) + update status karier (mengisi tracer).
3. `Lowongan`: cari/filter → detail → lamar 1-klik → tracking status; thread per lamaran.
4. `Komunitas`: direktori angkatan (opt-in), program mentor.
5. **`Mentor` (Fase 8 — hanya bila alumni punya MentorProfile ACTIVE):**
   - Daftar mentee aktif (ide yang ditugaskan ke dia): judul ide, nama siswa (pseudonim di tampilan awal — buka lengkap saat klik), status ide, sesi terakhir.
   - Tiap mentee: lihat detail ide, baca komentar, jadwalkan sesi baru (pilih tanggal/waktu/medium), isi catatan sesi setelah selesai.
   - Tab Jadwal: kalender sesi mendatang.

### 9.2 Web (Next.js)

**/school (SCHOOL_ADMIN & PRINCIPAL — menu menyesuaikan role)**
- Dashboard: kehadiran hari ini (donut + list belum hadir), tren 30 hari, ortu tersambung %, keaktifan app.
- Pengguna: tabel + impor XLSX (upload → preview validasi per-baris → konfirmasi → progress → unduh laporan error), reset/nonaktif, kode undangan (generate batch → PDF).
- Kelas & Tahun Ajaran: CRUD + wizard kenaikan kelas (preview → konfirmasi ganda).
- Kehadiran: per kelas/per hari, ekspor xlsx; koreksi (admin).
- Izin & Pengumuman: kelola.
- Consent: arsip per siswa (GENERAL/FACE/PUBLICATION), unggah bukti, pencabutan (memicu penghapusan template ≤24 jam — tampilkan status).
- WiFi: jam akses, kuota per role.
- Bel: jadwal normal/ujian/Ramadan + override tanggal.
- Iklan (transparansi): daftar materi aktif di sekolah ini + tombol "Keberatan".
- Tracer (kepsek): laporan keterserapan per angkatan + ekspor.
- Audit log (read-only).
- **Startup Center (Fase 8, flag `STARTUP_ENABLED`):**
  - Daftar semua ide sekolah per batch (filter status/kategori), tindakan: shortlist, incubate, reject + alasan.
  - Kelola lomba: buat lomba, buka/tutup pendaftaran, input juri, umumkan hasil.
  - Assign mentor ke ide.
  - Dashboard Demo Day: pilih ide yang tampil, urutan penampilan, cetak rundown.

**/hq (HQ_ADMIN, HQ_OPS)**
- Sekolah: provision wizard (data sekolah → pairing Box via serial+token → terbitkan akun admin).
- Fleet: tabel Box (online/offline, queue depth, versi, disk/temp), aksi restart service, rollout update bertahap.
- Review Iklan: antrean creative (preview + hasil AI screen) → approve/reject+alasan; kelola kategori terlarang.
- Mitra & Billing: CRUD partner, invoice, status bayar (belum lunas → campaign auto-pause).
- Analytics: DAU/WAU/MAU per sekolah (alarm merah <40%), biaya AI per sekolah/fitur, Youth Pulse generator (enforce n≥50).
- Feature flags per sekolah.
- **Startup Center HQ (Fase 8):**
  - Kelola MentorProfile: approve/pause mentor, set sekolah yang boleh diakses.
  - Lomba lintas kota: buat Competition dengan schoolId=null, pantau entries lintas sekolah.
  - Laporan per batch: jumlah ide, peserta lomba, jam mentoring, pemenang — ekspor PDF untuk sponsor CSR.

**/partner (PARTNER)**
- Kampanye: buat (paket → target kota/sekolah/kelas/jurusan/role → periode) → upload creative → status review.
- Laporan: impressions/clicks/leads per sekolah & kota (agregat; tidak ada endpoint identitas).
- Lowongan: CRUD, pipeline pelamar (kanban status), thread per lamaran.
- Tagihan: invoice & status.

### 9.3 Portal (apps/portal)
- 1 halaman: logo sekolah + Magnoo, form login (username/password), info jam WiFi.
- Setelah login: status koneksi + 1 banner pengumuman sekolah + 1 slot iklan (PORTAL surface, server-pick) + tombol "buka aplikasi Magnoo" (deeplink).
- Mode offline (Box tanpa internet): tetap autentikasi via Box, banner "mode lokal — notifikasi akan terkirim saat online".
- Constraint: total transfer < 200KB, render < 1,5 dtk di HP RAM 2GB, tanpa font eksternal saat offline.

---

## BAGIAN 10 — ATURAN BISNIS INTI (single source of truth)

**10.1 Settings sekolah (default, semua configurable per sekolah):** `jam_masuk=07:00`, `late_cutoff` (setelah ini = LATE), `absent_cutoff=09:00` (tanpa event & tanpa permit = ABSENT_NO_INFO → trigger notif ortu), `jam_pulang=15:30`, `wifi_hours=06:00–17:00`, `qr_geo_radius_m=300`, `student_wifi_mbps=5`, `tutor_daily_quota=30`, `teacher_gen_daily_quota=20`.

**10.2 Validasi QR check-in:** token QR berganti tiap 60 dtk (TOTP-like, secret per sekolah); valid bila (GPS dalam radius `qr_geo_radius_m` dari koordinat sekolah) ATAU (request datang dari IP WiFi sekolah). Double event <5 menit → diabaikan diam-diam (return sukses, tidak buat event).

**10.3 Status harian:** event IN pertama menentukan PRESENT/LATE; permit APPROVED meng-override jadi PERMIT/SICK; OUT sebelum `jam_pulang` tanpa permit → notif "pulang lebih awal" ke ortu. Job `recompute-daily-status` jalan tiap event masuk + cron 09:05 & 16:00 waktu sekolah.

**10.4 Koreksi absen:** hanya TEACHER (kelas diampu, ≤ H+3) & SCHOOL_ADMIN; wajib reason; membuat AttendanceEvent type CORRECTION; AuditLog mencatat before/after; DailyAttendanceStatus di-recompute.

**10.5 Poin & penukaran:** saldo = SUM(ledger); poin baru bisa ditukar setelah mengendap 7 hari (hitung FIFO per entry); max 1 penukaran pulsa/minggu/user; redemption idempotent; pola curang (≥10 jawaban berturut <1 dtk) → `flagged=true` → review HQ.

**10.6 Pengumuman:** retract hanya ≤15 menit setelah publish; scope SCHOOL hanya SCHOOL_ADMIN/PRINCIPAL.

**10.7 Chat:** HANYA tipe thread yang ada di skema. PARENT_HOMEROOM: ortu memulai dari template; CLASS_ROOM: guru→kelas, siswa boleh bertanya, terlihat seisi kelas + bisa diaudit admin; APPLICATION: alumni↔partner dalam lamaran. **TIDAK ADA DM siswa↔siswa dan TIDAK ADA partner→siswa** (jangan dibuat endpoint-nya).

**10.8 Ads serving:** pick server-side berdasarkan target {city, schoolId, grade, major, role} + status ACTIVE + budget periode; role STUDENT hanya kategori whitelist (`EDU, CAMPUS, SCHOLARSHIP, EVENT, FOOD_GENERAL, STATIONERY`); blacklist permanen di pre-screen: rokok/vape, alkohol, judi, pinjol, dewasa, politik praktis. Frekuensi: max 3 creative berbeda/hari/user (dihitung dari impressions per role+school — bukan per user tracking; gunakan client-side frequency cap di app dengan localStorage per hari). Surface AI Tutor & jadwal = bebas iklan.

**10.9 Alumni:** transisi otomatis saat `graduationDate` angkatan (job harian); akun mode terbatas sampai re-consent; profil default tersembunyi; perusahaan hanya melihat profil dari lamaran masuk atau opt-in; pelamar <18 tidak bisa apply FULLTIME.

**10.10 Consent gating:** enrollment wajah TERKUNCI tanpa ConsentRecord FACE aktif; pencabutan FACE → job hapus face_template di Box ≤24 jam + tulis bukti penghapusan ke AuditLog; siswa tanpa consent berjalan via QR selamanya tanpa degradasi pengalaman.

**10.11 AI:** semua output edukasi berstatus DRAFT sampai aksi eksplisit guru; pseudonimisasi sebelum provider (mapping di memori server, TTL request); kuota harian + monthly cost cap per sekolah (lewat cap → fitur AI menampilkan "istirahat", fitur non-AI tidak terganggu); cache berdasarkan hash(prompt-normalized) TTL 7 hari; log prompt tanpa PII, retensi 30 hari.

**10.12 Startup Center:**
- Ide hanya bisa dibuat oleh siswa STUDENT aktif; anggota tim maksimal 5, semua harus dari sekolah yang sama.
- Status DRAFT tidak terlihat siswa lain — hanya pemilik, co-owner, dan guru pembimbing.
- Setelah SUBMITTED tidak bisa kembali ke DRAFT; untuk mengubah isi, harus lewat komentar/diskusi dengan admin sekolah.
- SHORTLISTED dan INCUBATED hanya bisa ditetapkan oleh SCHOOL_ADMIN atau HQ.
- Dukungan (IdeaSupport): satu siswa satu dukungan per ide; siswa tidak bisa mendukung ide milik sendiri atau timnya.
- Komentar bersifat publik dalam sekolah (semua siswa, guru, mentor bisa baca); diaudit admin; konten tidak pantas dapat dihapus admin sekolah.
- Lomba: satu ide boleh ikut banyak lomba, tapi tidak boleh ikut dua lomba dari sekolah yang sama dalam batch yang sama.
- Skor lomba diisi juri (judgeUserIds) dan tidak terlihat peserta sampai status Competition = ANNOUNCED.
- Mentor maksimal menangani `availableSlots` mentee aktif sekaligus; penugasan lebih dari itu ditolak.
- Thread Startup (type STARTUP_ROOM): semua pemilik ide, co-owner, guru pembimbing, dan mentor yang ditugaskan; HQ/SCHOOL_ADMIN bisa baca tapi tidak ikut kecuali diundang.
- Flag `STARTUP_ENABLED` per sekolah: default false, diaktifkan HQ. Siswa di sekolah yang belum aktif tidak melihat tab Startup.
- Pitch deck: hanya PDF/PPT, maksimal 10MB, disimpan di object storage (bukan di Box), tidak di-index AI.

---

## BAGIAN 11 — LAYANAN PENDUKUNG

### 11.1 AI Service (module `ai`)
- `LlmProvider` interface: `generate(req): Response` + `estimateCost()`. Implementasi v1: Anthropic adapter (model murah utk klasifikasi/saringan, model pintar utk generate materi). Provider dipilih per-feature via config.
- Pipeline (urutan tetap): authz → quota → anonymize → cacheGet → provider → outputSafetyFilter (klasifikasi konten tidak pantas utk minor) → deanonymize → cacheSet → costLog (AiUsage).
- Anonymizer: ganti token `displayName/NIS` dengan `Siswa-07` style; untuk teacher grading, payload jawaban dikirim tanpa identitas sama sekali.

### 11.2 Notification Service
- Abstraksi `NotifChannel`: PUSH (FCM/APNs), WA (adapter interface — implementasi nyata fase lanjut; selalu cek biaya), INAPP.
- Template terdaftar (templateKey) + payload; antrean BullMQ dengan retry/backoff; NotificationLog untuk delivery tracking.
- Routing kebijakan (hybrid): event rutin (masuk/pulang) → PUSH+INAPP; event kritis (`ABSENT_NO_INFO`, permit decision, kode undangan) → PUSH, fallback WA bila push gagal/uninstalled (flag per sekolah `WA_FALLBACK`).
- Kalimat notifikasi "belum tercatat hadir" wajib netral + deeplink ajukan izin.

### 11.3 Box Bridge (nama siswa untuk dashboard)
- Service kecil di Box: REST read-only `GET /bridge/names?ids=` mengembalikan `{userId→fullName}`; hanya menerima koneksi dari cloud via WireGuard dengan mTLS; dashboard sekolah memanggil API cloud → cloud mem-proxy realtime ke Box sekolah ybs → merge di response (cloud TIDAK menyimpan hasilnya). Bila Box offline: dashboard menampilkan NIS + badge "Box offline".

### 11.4 Sync Protocol Box↔Cloud
- Outbound (Box→Cloud): batch ≤500 event, signature HMAC-SHA256 per Box (`X-Box-Signature`, secret saat pairing), tiap event punya `event_id` UUID; cloud meng-ACK per event; tanpa ACK → retry backoff (max interval 5 menit), `retry_count` tercatat; cloud menolak duplikat by `boxEventId` unique.
- Inbound (Cloud→Box): Box poll `GET /sync/manifest` tiap 60 dtk (etag); isi: radius user list (username+bcrypt hash+role+quota — TANPA nama siswa), settings, bell schedule, portal bundle version, feature flags.
- Jam Box disinkron NTP; event menyimpan waktu kejadian lokal Box.

### 11.5 Box Services (docker-compose di mini PC)
| Service | Isi | Catatan |
|---|---|---|
| `freeradius` | Auth WiFi; module rest → `radius-bridge` lokal yang cek tabel user cache | MikroTik → RADIUS ini |
| `portal-local` | nginx serve build `apps/portal` + proxy auth lokal | offline-capable |
| `postgres-box` | skema 6.4 | disk LUKS |
| `facesvc` | FastAPI: `/enroll` `/identify` (frame in → userId/score); threshold configurable; ≥0.6 conf → event; di bawah → abaikan (no false present) | tidak menyimpan frame |
| `sync-agent` | Node: flush sync_queue, poll manifest | |
| `box-bridge` | 11.3 | |
| `bell` | cron dari manifest → relay USB | jadwal terakhir tetap jalan offline |
| `mgmt-agent` | WireGuard up, healthcheck push, watchdog restart service, auto-update window 22:00–04:00, rollback bila health gagal pasca-update, **backup harian DB Box ke partisi lokal + mingguan terenkripsi ke cloud** | |

### 11.6 Scheduled Jobs (terpusat — semua via BullMQ repeatable, timezone per sekolah)
| Job | Jadwal | Isi | Fase |
|---|---|---|---|
| `recompute-daily-status` | per event + 09:05 & 16:00 | hitung DailyAttendanceStatus (rule 10.3) | 2 |
| `absent-noinfo-notifier` | 09:05 | siswa tanpa event & tanpa permit → notif ortu (kalimat netral) | 2 |
| `permit-sla-reminder` | tiap jam | izin >24 jam belum diputus → ingatkan wali kelas | 2 |
| `invite-code-expiry` | harian 02:00 | kedaluwarsakan kode >30 hari | 1 |
| `points-settlement` | harian 02:10 | tandai poin yang lewat masa endap 7 hari | 5 |
| `campaign-lifecycle` | harian 02:20 | aktifkan/akhiri kampanye sesuai periode; pause yang telat bayar >14 hari | 5 |
| `face-consent-revocation` | tiap jam | consent FACE dicabut → perintahkan Box hapus template; verifikasi ACK ≤24 jam | 6 |
| `graduation-transition` | harian 02:30 | tanggal lulus angkatan → role STUDENT→ALUMNI + mode terbatas | 7 |
| `parent-weekly-digest` | Jumat 15:00 | ringkasan mingguan AI per anak (feature PARENT_DIGEST, kuota & cap berlaku; data anak itu saja, tanpa pembanding) | 8 |
| `ews-scan` | harian 16:30 | rule EWS (absen 3 hari berturut / tren LATE) → EwsAlert privat | 8 |
| `engagement-rollup` | harian 03:00 | DAU/WAU/MAU per sekolah + alarm <40% | 8 |
| `db-backup-verify` | mingguan | uji restore backup cloud ke instance sementara | 3 |
| `startup-competition-auto-close` | harian 23:55 | tutup lomba yang sudah lewat submissionEnd → phase JUDGING | 8 |
| `startup-demoday-reminder` | harian 07:00 | H-7 & H-1 sebelum Demo Day → notif ke semua peserta & mentor | 8 |

---

## BAGIAN 12 — URUTAN BUILD (untuk Claude Code)

> Kerjakan berurutan. Setiap fase punya **DoD** — jangan lanjut sebelum DoD terpenuhi & lulus QA gate (BAGIAN 15). Setiap fase = serangkaian commit kecil + ringkasan di `docs/progress.md`.

**FASE 0 — Skeleton & fondasi (mulai DI SINI)**
- Init monorepo (pnpm workspaces) sesuai BAGIAN 5; `packages/shared` (zod schemas inti: auth, error codes, attendance) + script generate Dart.
- `apps/api`: NestJS skeleton + Prisma + skema BAGIAN 6 (migrasi pertama) + healthcheck + config/env loader + module stubs.
- `apps/web`, `apps/portal`, `apps/mobile`: skeleton + koneksi ke API health.
- `infra/docker-compose.dev.yml` (postgres, redis, api, web) + GitHub Actions (lint, typecheck, test, build).
- Seed script: 1 sekolah demo + 1 kelas + admin + 5 siswa + 2 guru + 2 ortu.
- **DoD**: `docker compose up` → semua hijau; ketiga klien menampilkan status API; CI hijau.

**FASE 1 — Auth, RBAC, Provisioning, Impor**
- Module `auth` lengkap (7.1–7.4) + Session + role switcher.
- Module `school`: provision HQ, pairing token, admin account, CRUD class, **impor XLSX** (job + validasi per-baris + laporan error + idempotent), invite codes (+PDF batch via server render), consent records, audit log (append-only enforce).
- Web `/hq` provision wizard + `/school` Pengguna & Kelas. Mobile: login + first-login flow semua role + parent OTP & link-child.
- **DoD**: skenario E2E: HQ buat sekolah → admin impor 500 siswa dari file contoh (termasuk baris rusak) → siswa login di emulator → ortu register & link. QA-1, QA-2 lulus.

**FASE 2 — Attendance + Notifikasi + Izin + Pengumuman**
- Module `attendance` (QR dinamis, rules 10.2–10.4, daily status job), `comms` (permit workflow, announcements, thread PARENT_HOMEROOM), `notification` (FCM nyata; WA = adapter stub + log).
- Mobile: layar absen siswa, kelas guru (real-time via polling 15 dtk — websocket belum perlu), izin (siswa/ortu/guru-decision), pengumuman, kartu anak ortu.
- Web `/school`: dashboard kehadiran, kehadiran per kelas, izin, pengumuman, bel (CRUD jadwal — eksekusi nyata menunggu Box).
- **DoD**: scan QR → notif push sampai ke device ortu <60 dtk; semua rule 10.2–10.4 punya unit test; QA-4 lulus.

**FASE 3 — Box Suite v1 + Portal + WiFi**
- `box/`: compose lengkap (tanpa facesvc dulu), radius+bridge, portal-local, sync-agent (protokol 11.4 penuh), box-bridge, bell, mgmt-agent dasar; skrip build image Box (`scripts/box-image-build`).
- `apps/portal` final (<200KB) + `/sync/*` endpoints cloud + manifest.
- **DoD**: di mesin uji (atau VM): login WiFi via portal → event ke cloud; cabut "internet" → tetap auth lokal, antrian terkirim saat tersambung lagi tanpa duplikat; QA-3, QA-10 (subset offline) lulus.

**FASE 4 — AI Asisten Guru**
- Module `ai` (pipeline 11.1 penuh, quota, cache, cost dashboard HQ), TeacherMaterial draft→approve.
- Mobile teacher: 3 tab AI; Web `/hq` biaya AI.
- **DoD**: sadap request keluar = tanpa PII; kuota & cost cap teruji dengan ambang kecil; QA-5 lulus.

**FASE 5 — Gamifikasi + Ads**
- Module `gamification` (10.5) + `ads` (10.8 + review workflow + AI pre-screen klasifikasi kategori) + `billing` minimal (invoice manual + status → campaign ACTIVE/PAUSE).
- Mobile siswa: kuis/poin/reward. Web `/partner` penuh + `/hq` review + `/school` transparansi & tombol keberatan. Portal: slot iklan.
- **DoD**: creative kategori terlarang tertolak otomatis; tidak ada jalur tayang tanpa approve manusia; QA-6, QA-7 lulus.

**FASE 6 — Face Recognition (hanya setelah F3 stabil + consent flow dipakai)**
- `facesvc` + enrollment flow web sekolah (consent-gated) + event FACE via sync; pencabutan consent → penghapusan terbukti.
- **DoD**: QA-8 lulus penuh, termasuk uji 50 wajah & fallback QR.

**FASE 7 — Alumni & Career**
- Module `career` penuh (10.9), job transisi angkatan, thread APPLICATION, tracer report.
- Mobile alumni + Web partner jobs + school tracer.
- **DoD**: QA-9 lulus.

**FASE 8 — Analytics, EWS, Youth Pulse, Startup Center**
- DAU/WAU/MAU per sekolah + alarm; EWS rule sederhana (pola absen ≥3 hari berturut ATAU tren LATE naik — kartu privat wali kelas/BK; TANPA skor ranking); Youth Pulse generator (n≥50 enforced).
- **Startup Center** (modul penuh): module `startup` dengan semua model baru (StartupIdea, IdeaSupport, IdeaComment, Competition, CompetitionEntry, MentorProfile, MentorSession), seluruh endpoint, layar mobile (student tab Startup + teacher tab Startup + alumni tab Mentor), web sekolah (kelola ide + lomba + Demo Day) + HQ (kelola mentor + lomba lintas kota + laporan CSR), aturan bisnis 10.12, cron job `startup-demoday-reminder` (H-7 & H-1 sebelum Demo Day → notif ke peserta), dan cron `startup-competition-auto-close` (menutup lomba saat submissionEnd lewat).
- **Thread baru** ditambahkan ke `ThreadType`: `STARTUP_ROOM` — menggunakan infrastruktur thread yang ada, bukan dibangun ulang.
- **DoD**: alarm engagement berfungsi pada data seed; query Youth Pulse n<50 ditolak; siswa bisa submit ide → didukung siswa lain → ikut lomba → diberi mentor → sesi terjadwal → Demo Day — seluruh alur diuji E2E; laporan CSR ter-generate dengan data seed.

---

## BAGIAN 12A — ADENDUM SPEC FASE 2 (v1.3 — MENGIKAT)

> Penambal celah hasil audit arsitek (detail & sumber di `docs/refs/fase2-grounding.md`). Bagian ini **mengikat** dan melengkapi BAGIAN 6/7/8/10 untuk Fase 2. Tidak mengubah ADR. Tujuan: pembangun tidak menebak.

### 12A.1 Absensi QR
- **Lokasi sekolah (lengkapi 6.1/10.1):** `School.settings` WAJIB memuat `geo: {lat,lng}`, `qrGeoRadiusM` (default 150), dan `wifiCidrs: string[]` (daftar CIDR WiFi sekolah). Validasi IP klien pakai `app.set('trust proxy', <hop>)` + `X-Forwarded-For` paling kiri tepercaya. Bila `geo` & `wifiCidrs` kosong → check-in QR ditolak `ATTENDANCE_LOCATION_REQUIRED`.
- **Token QR (perjelas 10.2):** secret TOTP **per sekolah** disimpan **terenkripsi** (AES-256-GCM, key di vault — BAGIAN 14); **TIDAK PERNAH** dikirim ke klien siswa. Token ditampilkan via `GET /attendance/qr/current` (role gerbang/`SCHOOL_ADMIN`/`TEACHER`), UI rotasi tiap 30 dtk. Param TOTP: `period=30, digits=8, algo=SHA256`. Server `validate(window=1)`; token mengikat `schoolId`.
- **Validasi lokasi (OR):** LULUS bila GPS dalam `qrGeoRadiusM` dari `geo` **ATAU** IP klien ∈ `wifiCidrs`. Gagal → `ATTENDANCE_OUT_OF_AREA`.
- **Anti-replay & anti-foto (penuhi QA-4):** tiap `(userId, tokenStep)` sekali pakai — kunci Redis `attreplay:{schoolId}:{userId}:{step}` `SET NX EX 90`. QA-4 dianggap lulus bila aktif: rotasi pendek + geofence/IP + anti-replay per-user + double-event sejenis <5 mnt diabaikan (10.2). (Device-binding = ide untuk dibahas pemilik, BUKAN Fase 2.)
- **Waktu:** server set `occurredAt=now()` (jangan percaya klien). PRESENT/LATE & `date` dihitung dari `occurredAt` dikonversi ke `School.timezone`. Check-in QR tanpa Idempotency-Key; dedup via aturan double <5 mnt (sukses idempoten "silent").

### 12A.2 Notifikasi (FCM nyata + WA stub)
- **Model baru `DeviceToken`** (6.2): `{ id, userId→User, token @unique, platform: ANDROID|IOS, lastSeenAt, createdAt, revokedAt? }`. Endpoint: `POST /me/devices {token, platform}` (upsert + set lastSeenAt) & `DELETE /me/devices/:token` (atau saat logout). Bersihkan token >30 hari tak aktif.
- **Pengiriman:** lewat BullMQ queue `notifications` (pola seperti import worker); job di-enqueue **setelah** event tersimpan. Target `<60 dtk` diukur dari event tercatat s/d FCM API success; catat `enqueuedAt/sentAt` di `NotificationLog`. Retry `attempts:5` backoff eksponensial+jitter; jangan retry error permanen.
- **Dedup (cegah banjir cron 09:05/16:00):** sebelum kirim, `SET notifsent:{userId}:{templateKey}:{dedupeKey} NX EX 86400` (mis. `dedupeKey=absent:{date}`); plus FCM `collapseKey` per kategori.
- **Payload:** kombinasi `notification` + `data{type,entityId,deeplink,templateKey,dedupeKey}`; event kritis `android.priority=high`. Teks **dilokalkan di klien** via `templateKey` (jangan kalimat di server). Tanpa PII siswa di payload/log (13.2).
- **Penerima:** semua `ParentLink.status=ACTIVE` untuk siswa ybs (dedup per ortu).
- **WA stub:** `interface WaChannel { send(to, templateKey, params) }`; Fase 2 = stub tulis `NotificationLog channel=WA status=QUEUED` + log (tak panggil provider). Fallback WA HANYA bila: user tak punya DeviceToken aktif ATAU FCM `UNREGISTERED` untuk semua token user, DAN `WA_FALLBACK` aktif, DAN kategori kritis.

### 12A.3 Izin (Permit)
- **State machine (mengikat):** transisi sah `SUBMITTED→APPROVED`, `SUBMITTED→REJECTED` (oleh pemutus), `SUBMITTED→CANCELLED` (oleh pembuat, hanya selama SUBMITTED). `APPROVED`/`REJECTED` = terminal. Decision/cancel **idempoten** (ulang pada status terminal sama → 200 tanpa efek; transisi ilegal → `PERMIT_INVALID_TRANSITION`). Implementasi pakai conditional update Prisma (`where:{id,status:'SUBMITTED'}`) untuk cegah race; side-effect hanya saat state benar-benar berubah.
- **Pemutus izin (lengkapi RBAC 7.4):** `POST /permits/:id/decision` = **wali kelas** (`Class.homeroomTeacherId` siswa ybs) + **SCHOOL_ADMIN** (scope class/school). Guru non-wali, PRINCIPAL, PARENT → ❌ 403. AuditLog `PERMIT_DECIDE` (before/after) wajib.
- **Pembuat & duplikat:** `requestedByUserId` = siswa ybs ATAU ortu dengan `ParentLink ACTIVE` ke siswa; selain itu `FORBIDDEN`. Tolak izin overlap tanggal dengan SUBMITTED/APPROVED siswa sama → `PERMIT_DUPLICATE`.
- **Efek ke absen (10.3):** APPROVED memicu recompute `DailyAttendanceStatus` tiap tanggal di `[dateStart..dateEnd]`. Map: `SICK`→SICK; `FAMILY|DISPENSATION|OTHER`→PERMIT. Sebelum kirim notif ABSENT_NO_INFO, cek dulu ada permit APPROVED.
- **Lampiran:** presign `PERMIT_ATTACHMENT` enforce di server `size≤5MB` & `mime∈{image/jpeg,image/png,application/pdf}`; `attachmentUrl` harus hasil presign milik sekolah ybs (anti-SSRF).

### 12A.4 Pengumuman (Announcement)
- **Scope × role:** `CLASS` = TEACHER (hanya kelas yang diampu; `scopeIds`=classIds) + SCHOOL_ADMIN. `GRADE` = SCHOOL_ADMIN/PRINCIPAL (`scopeIds`=angka grade). `SCHOOL` = SCHOOL_ADMIN/PRINCIPAL (`scopeIds`=[]). `PARENTS` = SCHOOL_ADMIN/PRINCIPAL (opsional filter kelas di `scopeIds`). Semua dibatasi `schoolId` penulis; selain itu `ANNOUNCEMENT_SCOPE_FORBIDDEN`.
- **Notif:** pengumuman → INAPP ke audiens; PUSH ringkas (judul) opsional; non-kritis → tanpa WA fallback.
- **Retract (10.6):** valid hanya bila `now-publishedAt ≤ 15 mnt` (basis server) else `ANNOUNCEMENT_RETRACT_EXPIRED`; menyembunyikan dari daftar+inbox; AuditLog `ANNOUNCEMENT_RETRACT`.

### 12A.5 Lintas-topik
- **Thread Fase 2 = HANYA `PARENT_HOMEROOM`** (ortu↔wali kelas, ortu mulai dari `templateKey`). `CLASS_ROOM`/`APPLICATION` BUKAN Fase 2. Jangan buat DM siswa↔siswa / luar→siswa (guardrail 13.5).
- **Kode error baru** (tambahkan ke `packages/shared/src/errors.ts`): `ATTENDANCE_INVALID_TOKEN, ATTENDANCE_OUT_OF_AREA, ATTENDANCE_LOCATION_REQUIRED, PERMIT_DUPLICATE, PERMIT_INVALID_TRANSITION, ANNOUNCEMENT_RETRACT_EXPIRED, ANNOUNCEMENT_SCOPE_FORBIDDEN`.
- **Pakai infrastruktur existing:** RBAC `@Roles`/`@Scope` & `AuditService.write()` (append-only) yang sudah ada — jangan tulis ulang authz.

---

## BAGIAN 12B — ADENDUM ROADMAP ENGAGEMENT/KARIER/WELLNESS (v1.4)

> **SIFAT BAGIAN INI = ROADMAP (memformalkan ARAH produk), BUKAN scope buildable baru.**
> Fase 0–8 (BAGIAN 12), BAGIAN 12A (mengikat, Fase 2), dan ADR-001..008 **TIDAK BERUBAH**
> oleh bagian ini. Semua item ber-gerbang (gated) **TETAP TERTAHAN** sampai lengkap:
> **ADR baru diratifikasi + kajian hukum (PDP/PSE, dan untuk uang: PJP/pajak; untuk kesehatan:
> Permenkes telemedicine) + persetujuan eksplisit owner.** Detail rancangan, alasan, dan catatan
> hukum ada di `docs/refs/konsep-engagement-karier.md` (sumber; bukan konstitusi). Penomoran
> ADR di sini memakai label sementara **ADR-baru-A..E**; nomor final ditetapkan saat ratifikasi.
>
> **Catatan tabrakan yang WAJIB diselesaikan owner sebelum F7 dibangun:** F7 berbenturan dengan
> **guardrail 13.6** (larang dashboard kinerja/ranking/pemakaian per guru yang diakses kepsek).
> 12B TIDAK melonggarkan 13.6. F7 hanya boleh dibangun setelah owner secara eksplisit
> merekonsiliasi/mengamandemen 13.6 bersama ADR-baru-E.

### Peta fitur F1–F10

| Fitur | Apa (1 baris) | Rumah fase | Guardrail kunci | Status |
|---|---|---|---|---|
| **F1 Open Class / Consult** | Forum tanya-jawab per mapel + sesi konsultasi 1-on-1 yang privat-dari-teman tapi terang-ke-sistem, semua tercatat & auditable. | Ekstensi `comms` (ThreadType `OPEN_CLASS`/`CONSULT`), setelah Fase 2 inti. | 13.5 (tak ada chat gelap), 13.1/13.2 (PII), 13.9 (audit append-only); perkuat via ADR-baru-C. | gated-ADR (C) |
| **F2 Skill Passport → Profil Karier** | Siswa kumpulkan skill, guru verifikasi jadi badge; "mekar" jadi profil yang dilirik perusahaan. | Badge/verifikasi = Fase 5; showcase/rekrutmen (alumni) = Fase 7. | ADR-005 (identitas anak di Box; cloud hanya non-identitas/agregat), 13.13, PDP. | Fase 5 (badge non-PII): buildable saat fasenya. Showcase alumni: Fase 7. **Showcase siswa-aktif & papan bernama: gated-ADR+hukum (B)** |
| **F3 Ekonomi Poin + 3 lapisan engagement** | Poin dua-arah (siswa & guru): hadiah instan+streak+reward, status/badge, sosial/pengakuan; poin hanya dari aktivitas belajar terukur. | Fase 5 (Gamifikasi), reuse mekanisme 10.5. | 10.5 anti-fraud (endap 7 hari, FIFO, flag), 13.9 (PointLedger append-only). Poin BUKAN dari "ngobrol/curhat". | buildable-now (saat Fase 5 tiba) |
| **F4 Ruang Ilmu Guru (sidejob guru)** | Guru bikin materi/sesi tambahan & dapat imbalan. | Tahap-1 (imbalan POIN) = Fase 5; Tahap-2 (uang nyata) = fase berbadan-hukum. | Anti konflik kepentingan; 13.9; (tahap-2) hukum konsumen + pajak + PJP. | Tahap-1: buildable-now (Fase 5). **Tahap-2 (uang nyata): gated-ADR+hukum (A) — BELUM buildable** |
| **F5 Pengumuman Guru → Ortu kelas** | Wali kelas kirim pengumuman ke ortu kelas yang diampu (bukan se-sekolah). | Fase 2 (penyesuaian 12A.4). | 13.5 (terang & tercatat), scope diikat `schoolId`+`classId`. | **Amandemen kecil 12A.4 — perlu persetujuan terpisah owner sebelum diterapkan ke kode Fase 2** (12B hanya mencatat arah; tidak mengubah 12A) |
| **F6 Wellness/Kesehatan Dewasa + AI** | Guru/ortu (DEWASA, bukan siswa) input data kesehatan → AI insight gaya hidup + disclaimer; ke depan koneksi dokter. | Modul wellness dekat Fase 4 (AI); koneksi dokter = fase kemitraan. | ADR-007 (AI via proxy), data kesehatan = kategori khusus PDP (consent + enkripsi at-rest), privat dari sekolah; AI = wellness, BUKAN diagnosis. **Siswa di luar scope.** | Tahap-1: **gated-ADR (D)**. **Tahap-2 (koneksi dokter): gated-ADR+hukum (D, Permenkes telemedicine, mitra berlisensi) — BELUM buildable** |
| **F7 Dashboard Kepsek (pemetaan guru↔siswa by AI)** | Analisa AI advisory untuk kepsek: tren kehadiran, papan aktivitas guru, EWS, pemetaan guru↔siswa. | Fase 8 (Analitik) + AI (Fase 4). | **BENTROK 13.6** (dashboard kinerja/pemakaian per guru); ADR-005 (ID/agregat, tanpa nama siswa); ADR-baru-E (AI = decision-support, explainable, bukan auto-skor punitif). | **gated-ADR+rekonsiliasi-13.6 (E) — BELUM buildable.** Wajib owner menyelesaikan tabrakan 13.6 lebih dulu |
| **F8 Prestasi Terverifikasi** | Siswa/guru catat prestasi → diverifikasi → catatan terpercaya; kepsek lihat AGREGAT. | Catatan+verifikasi = Fase 5 (mekanisme badge F2); agregat dashboard = Fase 8/F7. | ADR-005, 13.13. Internal/agregat = aman; papan publik BERNAMA = consent ortu. | Catatan+agregat: buildable saat fasenya. **Showcase publik-bernama: gated-hukum (consent ortu, B)** |
| **F9 Profil Guru untuk Ortu** | Ortu lihat profil profesional guru (mapel, kelas, kualifikasi, jadwal Open Class) — TANPA kontak pribadi. | `common/profile` + `comms`, dekat Fase 2. | Eksepsi dewasa ADR-005 (data profesional guru boleh di cloud); kontak pribadi disembunyikan; komunikasi via kanal tercatat (13.5). | buildable-now (saat fasenya tiba) |
| **F10 Pengingat Acara (Reminder)** | Pengumuman ber-`eventStart` memicu notif pengingat (default H-1 sore, jam wajar; maks 2/pengumuman). | Ekstensi Announcement + Notification (Fase 2); cron penyapu pola recompute. | Payload tanpa PII sensitif (judul saja); dedup; hormati audiens/scope pengumuman. | buildable-now (penjadwalan); pengiriman menunggu pipeline FCM (2g/2h) |

### ADR baru (label sementara — diratifikasi saat fitur matang; nomor final menyusul)

- **ADR-baru-A — Model monetisasi guru:** mulai dari ekonomi poin internal; uang-nyata hanya via PJP berlisensi + badan hukum + pajak + pemisahan peran (guru penilai ≠ guru penjual). Memicu 13.13.
- **ADR-baru-B — Penempatan & paparan data skill anak:** badge/identitas siswa di Box (ADR-005); showcase = alumni dewasa atau consent ortu; data anak tak pernah jadi produk. Memperkuat ADR-005 & 13.13.
- **ADR-baru-C — Model komunikasi terang (Open Class/Consult):** semua pesan tercatat & auditable; tak ada kanal tersembunyi guru↔siswa. Memperkuat 13.5.
- **ADR-baru-D — Data kesehatan & wellness AI (F6):** subjek dewasa saja (siswa di luar scope); consent eksplisit; data terenkripsi & privat dari sekolah; AI = wellness bukan diagnosis (disclaimer); koneksi dokter hanya via mitra telemedicine berlisensi (Permenkes). Memicu 13.13.
- **ADR-baru-E — AI advisory untuk evaluasi guru (F7):** AI = decision-support, bukan auto-skor punitif; explainable; kepsek yang memutuskan; transparan ke guru; data internal/agregat (ADR-005). **Wajib direkonsiliasi dengan guardrail 13.6 oleh owner sebelum F7 dibangun.**

> **Penegasan akhir:** tidak ada satu pun item di BAGIAN 12B yang boleh dibangun hanya karena tercantum di sini. Status "buildable" berarti boleh masuk antrean **saat fasenya tiba** dan tetap tunduk DoD + QA gate. Status "gated" berarti **berhenti** sampai gerbang ADR + (bila ditandai) hukum + owner terpenuhi. Bila pola umum/library bertabrakan dengan ADR atau guardrail, **konstitusi menang**.

---

## BAGIAN 13 — GUARDRAILS (DILARANG — jangan dibangun walau "kelihatannya berguna")

1. ❌ Endpoint/fitur apa pun yang mengembalikan PII siswa lintas sekolah, atau PII siswa ke role HQ/PARTNER.
2. ❌ Menyimpan nama/NIS siswa di tabel cloud, log, analytics, atau prompt AI tanpa pseudonim.
3. ❌ Penyimpanan video/frame kamera; facesvc memproses lalu membuang.
4. ❌ Riwayat browsing per pengguna; tracking perilaku individu untuk iklan; targeting selain field di `AdCampaign.target`.
5. ❌ DM siswa↔siswa; kontak pihak luar→siswa; chat tersembunyi guru↔siswa di luar CLASS_ROOM.
6. ❌ Dashboard kinerja/ranking guru, atau laporan pemakaian per guru yang bisa diakses kepsek.
7. ❌ Auto-approve iklan tanpa review manusia.
8. ❌ Ekspor massal face template dalam bentuk apa pun.
9. ❌ Mengedit/menghapus AuditLog & PointLedger (append-only).
10. ❌ Memanggil LLM provider langsung dari klien atau dari module selain `ai`.
11. ❌ Menyimpan secret di repo; semua via env/vault.
12. ❌ Mengganti keputusan ADR tanpa konfirmasi pemilik proyek.
13. ❌ **TEMBOK PEMISAH DATA ANAK** — Data anak/siswa/sekolah TIDAK PERNAH boleh menjadi produk iklan, OOH, atau data-marketplace (lapisan bisnis 2–5, lihat 1.1). Dilarang: menjual/membagikan/mengekspor data audience yang bersumber dari anak/sekolah; menautkan identitas individu anak ke produk iklan/intelligence; menurunkan profil komersial dari data siswa. Produk lapisan 2–5 HANYA boleh memakai data **agregat/anonim** (mis. hitungan traffic tanpa identitas) & sumber **non-anak/non-sekolah**. Setiap fitur yang menyentuh ini = berhenti, perlu ADR + kajian hukum (PDP/PSE) + persetujuan pemilik. Memperkuat 13.2 & 13.4.

---

## BAGIAN 14 — KEAMANAN & NFR

- Password: argon2id. TLS semua jalur; Box↔Cloud via WireGuard. Disk Box: LUKS. Kolom sensitif (face embedding) enkripsi aplikasi (AES-256-GCM, key per sekolah di vault).
- OWASP Top 10 clean (CI: dependency scan + semgrep). Rate limit & lockout sesuai 7.2/8.1. CORS ketat per app origin.
- Target performa: login p95 <2s; portal <1,5s di low-end; notif <60s; 500 login WiFi/10 menit/sekolah; uptime cloud 99,5%; Box offline ≥72 jam; APK <40MB; API p95 <300ms untuk read endpoints.
- Backup: cloud DB harian (retensi 30 hari) + uji restore bulanan; Box: dump harian lokal + mingguan terenkripsi ke cloud (tanpa PII mentah — kecuali blob terenkripsi yang hanya bisa dibuka key sekolah).
- Observability sejak Fase 1: metrics (RPS, latency, queue depth, sync lag per Box, AI cost), alert Telegram (Box offline >5m, error rate, cost cap 80%).

---

## BAGIAN 15 — TESTING & QA GATE

- Unit test wajib untuk seluruh BAGIAN 10 (business rules) — target coverage logika domain ≥70%.
- Integration test per module API (testcontainers postgres+redis).
- E2E smoke per fase (Playwright untuk web; integration test Flutter untuk alur login+absen).
- QA gate per fase memakai checklist QA-1 s.d. QA-12 (ringkas):
  - QA-1 Auth: lockout, first-login, IDOR antar scope (siswa→siswa lain, guru→kelas lain, admin→sekolah lain = 403+audit).
  - QA-2 Impor: file campuran valid/invalid, idempotent, 5.000 baris ditolak ramah.
  - QA-3 WiFi/Portal: 5 merek HP, load 500 login, offline→online tanpa duplikat, <200KB.
  - QA-4 Absen/Notif: batas jam, QR difoto→gagal, double-scan, notif <60s, koreksi teraudit.
  - QA-5 AI: tanpa PII di wire, draft-only, kuota+cost cap, 20 prompt nakal tutor ditolak sopan, provider down → graceful.
  - QA-6 Poin: ledger race-safe, redemption idempotent, endap 7 hari.
  - QA-7 Ads: blacklist auto-reject, no auto-publish, role isolation, keberatan kepsek pause ≤1m, laporan agregat-only.
  - QA-8 Face: consent gate, revoke→hapus ≤24h terbukti, no false-present, fallback QR.
  - QA-9 Alumni: transisi massal, default hidden, opt-in enforcement, <18 no fulltime.
  - QA-10 Box: power-cut recovery <5m, 72h offline replay, prosedur tukar Box, update rollback.
  - QA-11 Security: OWASP scan, secret scan, audit log immutable.
  - QA-12 UAT pilot (manual, di luar scope Claude Code — manusia yang menjalankan).
- Definisi bug: BLOCKER (rilis tertahan) / MAJOR / MINOR. Item bertanda blocker di atas gagal = fase tidak selesai.

---

## BAGIAN 16 — ENVIRONMENT & KONFIGURASI

```
# apps/api/.env.example
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET= / JWT_REFRESH_SECRET=
ANTHROPIC_API_KEY=            # via module ai saja
FCM_SERVICE_ACCOUNT_JSON=
WA_GATEWAY_URL= / WA_GATEWAY_TOKEN=   # boleh kosong (adapter stub)
OBJECT_STORAGE_*              # lampiran izin/creative (S3-compatible)
BOX_PAIRING_PEPPER=
APP_BASE_URL= / PORTAL_BASE_URL=
AI_MONTHLY_COST_CAP_DEFAULT_IDR=3000000

# box/.env.example
BOX_SERIAL=MAGNOO-0001
CLOUD_API_URL= / BOX_HMAC_SECRET=     # diisi saat pairing
WIREGUARD_*  / SCHOOL_ID=
FACE_THRESHOLD=0.6
```
- 3 environment: dev (compose lokal) → staging (VPS + 1 Box fisik kantor) → production. Deploy hanya dari tag; rollback = redeploy tag sebelumnya; migrasi DB selalu backward-compatible satu versi.

---

## BAGIAN 17 — KONVENSI KERJA UNTUK CLAUDE CODE

1. **Bahasa**: kode, komentar API publik, commit message = Inggris. String UI = Indonesia, via file lokalisasi (`packages/shared/i18n` untuk web/portal, `lib/l10n` untuk Flutter) — tidak ada string UI hardcode.
2. **Commit**: conventional commits (`feat(attendance): qr rotating token`), kecil & sering; satu fitur = satu PR-able unit.
3. **TypeScript strict, no `any`** kecuali dengan komentar alasan. Dart: lints `flutter_lints` + analyzer fatal-infos.
4. **Validasi di tepi**: semua input request divalidasi zod (schema dari `packages/shared`) sebelum menyentuh service.
5. **Migrasi**: setiap perubahan skema = Prisma migration ber-nama jelas; tidak pernah edit migration lama.
6. **Setiap fase**: update `docs/progress.md` (apa selesai, keputusan kecil yang diambil, utang teknis) + `docs/adr/` bila ada keputusan baru (minta konfirmasi dulu bila menyimpang dari dokumen ini).
7. **Testing dulu untuk business rules**: BAGIAN 10 ditulis test-first.
8. **Jangan optimasi prematur**: polling boleh sebelum websocket; monolith sebelum pecah; index ditambah saat query terbukti lambat.
9. **Bila ragu** terhadap apa pun yang menyentuh: data anak, uang/poin, keamanan, atau guardrails BAGIAN 13 → **berhenti dan tanya pemilik proyek**. Untuk hal kosmetik (warna, copy, layout) → ambil keputusan wajar, catat di progress.
10. **Identitas visual**: ink `#10243A`, magnet red `#E4391F`, field blue `#1656C9`, gold `#F2A91C`, paper `#F7F9FB`; font display Bricolage Grotesque / body Plus Jakarta Sans (web) — Flutter pakai Plus Jakarta Sans.

---

*MAGNOO Build Spec v1.1 — 17 Juni 2026. Dokumen hidup: revisi dicatat bernomor di bagian atas. Tiga kompas saat dokumen tidak menjawab: jangan bahayakan anak, jangan gadaikan nama, jangan bangun yang tidak diminta.*
