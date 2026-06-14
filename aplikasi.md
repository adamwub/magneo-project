# MAGNOO — RENCANA PEMBANGUNAN APLIKASI (BUILD SPEC v1.0)

> **Dokumen ini adalah spesifikasi build untuk Claude Code (CLI).**
> Bahasa: Indonesia untuk penjelasan, Inggris untuk semua identifier teknis (nama tabel, endpoint, variabel, commit).
> Cara pakai: letakkan file ini di root repo. Buat `CLAUDE.md` berisi: “Baca dan patuhi `aplikasi.md` sebagai sumber kebenaran. Kerjakan sesuai BAGIAN 12 (Urutan Build). Jangan keluar dari guardrails BAGIAN 13.”
> Jika ada hal yang ambigu/tidak tercakup: **berhenti dan tanya**, jangan berasumsi pada hal yang menyentuh data anak, uang, atau keamanan.

-----

## DAFTAR ISI

1. Ringkasan Produk & Tujuan
1. Keputusan Arsitektur (ADR) — WAJIB DIPATUHI
1. Lini Aplikasi (App Lines) — Apa Saja yang Dibangun
1. Tech Stack & Versi
1. Struktur Monorepo
1. Model Data (Skema Database Lengkap)
1. Auth, RBAC & Manajemen Sesi
1. Spesifikasi API (Konvensi + Daftar Endpoint per Modul)
1. Spesifikasi Layar (Mobile per Role + Web per Area + Portal)
1. Aturan Bisnis Inti (Business Rules)
1. Layanan Pendukung: AI Service, Notification, Sync Box↔Cloud, Box Services
1. Urutan Build (Fase → Milestone → Definition of Done)
1. Guardrails — Yang DILARANG Dibangun / Dilakukan
1. Keamanan, NFR & Target Performa
1. Testing & QA Gate per Fase
1. Environment, Konfigurasi & Deployment
1. Konvensi Kerja untuk Claude Code

-----

## BAGIAN 1 — RINGKASAN PRODUK & TUJUAN

**Magnoo** = ekosistem digital sekolah (SMA/SMK Indonesia). Sekolah mendapat semuanya gratis; pendapatan dari mitra (kampus, perusahaan, sponsor). Komponen nilai inti v1:

1. **WiFi sekolah ber-akun** (login WiFi = akun Magnoo, via captive portal + RADIUS di perangkat lokal “Magnoo Box”).
1. **Absensi otomatis** (QR dinamis dulu; face recognition fase lanjut) + **notifikasi real-time ke orang tua**.
1. **AI Asisten Guru** (generate modul ajar/soal, bantu koreksi, narasi rapor — human-in-the-loop).
1. **Komunikasi sekolah**: pengumuman, izin digital, pesan ortu↔wali kelas.
1. Fase lanjut: gamifikasi+iklan tersaring, alumni & career center, AI Tutor siswa (hanya jika ada sponsor), early warning system, startup center.

**Konteks krusial yang memengaruhi semua keputusan teknis:**

- Sebagian besar pengguna adalah **anak di bawah umur** → privasi & keamanan anak adalah requirement nomor satu, bukan fitur.
- HP siswa/ortu banyak yang low-end (RAM 2–3GB, storage sempit) → app harus ringan.
- Internet & listrik sekolah tidak stabil → sistem lokal (Box) harus tetap hidup offline.
- Tim kecil → arsitektur harus sederhana untuk dioperasikan (boring tech, modular monolith).

-----

## BAGIAN 2 — KEPUTUSAN ARSITEKTUR (ADR)

Setiap ADR di bawah bersifat FINAL untuk v1. Claude Code tidak boleh menggantinya tanpa persetujuan eksplisit pemilik proyek.

### ADR-001: Mobile = SATU aplikasi Flutter, multi-role

- **Keputusan**: 1 app untuk role `student`, `teacher`, `parent`, `alumni`. Role ditentukan saat login (dari JWT), UI me-render shell sesuai role.
- **Alasan**: (a) satu orang bisa multi-role (guru yang juga ortu) → fitur *role switcher* dalam 1 akun; (b) 1 codebase = 1 CI, 1 store listing, maintenance ½; (c) onboarding ortu lebih mudah (“download Magnoo” — satu nama).
- **Mitigasi “berat”**: role-based routing (modul role lain tidak pernah di-mount), Flutter **deferred components** untuk modul berat (kamera/scanner, media), aset dikompresi, target APK **< 40MB**, cold start < 3 detik di perangkat RAM 2GB.
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

-----

## BAGIAN 3 — LINI APLIKASI (APP LINES)

|#|App Line                      |Platform                                 |Pengguna                        |Catatan                                                             |
|-|------------------------------|-----------------------------------------|--------------------------------|--------------------------------------------------------------------|
|1|`apps/mobile` — Magnoo App    |Flutter (Android prioritas, iOS menyusul)|Siswa, Guru, Ortu, Alumni       |Single app multi-role (ADR-001)                                     |
|2|`apps/web` — Magnoo Dashboard |Next.js (web)                            |Admin sekolah, Kepsek, HQ, Mitra|Multi-area (ADR-002)                                                |
|3|`apps/portal` — Captive Portal|HTML/Preact super ringan                 |Semua pengguna WiFi             |< 200KB, di-serve dari Box & cloud                                  |
|4|`apps/api` — Backend API      |NestJS + PostgreSQL + Redis              |Semua klien                     |Modular monolith (ADR-003)                                          |
|5|`box/` — Magnoo Box Suite     |Docker Compose di mini PC Linux          |Per sekolah                     |RADIUS, portal lokal, DB lokal, face service, sync agent, bell, mgmt|
|6|`packages/shared`             |TypeScript + generator Dart              |—                               |Skema, tipe, konstanta, error codes                                 |
|7|`infra/`                      |Docker, skrip deploy, monitoring         |—                               |Compose untuk dev & prod awal; Prometheus+Grafana                   |

-----

## BAGIAN 4 — TECH STACK & VERSI

|Lapisan      |Pilihan                                                                                                                 |Catatan versi                                                                                                 |
|-------------|------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
|Mobile       |Flutter stable terbaru (≥ 3.x), Dart ≥ 3.x                                                                              |State: Riverpod. Routing: go_router. Storage aman: flutter_secure_storage. HTTP: dio. Push: firebase_messaging|
|Web          |Next.js ≥ 14 (App Router), React ≥ 18, TypeScript strict                                                                |UI: Tailwind + shadcn/ui. Data: TanStack Query. Form: react-hook-form + zod                                   |
|Portal       |Preact + vite (atau vanilla TS)                                                                                         |Tanpa framework berat. Inline CSS. Total bundle < 200KB                                                       |
|API          |NestJS ≥ 10, TypeScript strict                                                                                          |ORM: Prisma. Validasi: zod (via packages/shared). Queue: BullMQ. Auth: JWT (jose)                             |
|DB           |PostgreSQL ≥ 15 (cloud & Box)                                                                                           |Migrasi: Prisma Migrate. Box memakai subset skema                                                             |
|Cache/Queue  |Redis ≥ 7                                                                                                               |                                                                                                              |
|Face         |Python 3.11 service di Box: InsightFace (buffalo_l) + ONNX Runtime CPU, FastAPI                                         |Hanya di Box, tidak pernah di cloud                                                                           |
|Notif        |FCM (Android), APNs (iOS), WA gateway adapter (provider WhatsApp Business API — interface dulu, implementasi belakangan)|                                                                                                              |
|AI           |Adapter pattern: `LlmProvider` interface; implementasi pertama: Anthropic API; mudah ganti                              |Model murah untuk tugas ringan, model pintar untuk generate kompleks                                          |
|VPN Box      |WireGuard                                                                                                               |Box → NOC, untuk mgmt & box-bridge                                                                            |
|Observability|Prometheus + Grafana + Loki (logs) + alert Telegram                                                                     |Dipasang sejak Fase 1                                                                                         |
|CI           |GitHub Actions: lint, typecheck, test, build per workspace                                                              |                                                                                                              |

-----

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

-----

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
model StartupIdea { // Fase 8 — modul wirausaha
  id String @id @default(uuid()); schoolId String; ownerUserId String
  title String; summary String; batch String
  status IdeaStatus /* SUBMITTED | SHORTLISTED | INCUBATED | ALUM */
  mentorUserIds String[]; threadId String?; sponsorCampaignId String?
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

-----

## BAGIAN 7 — AUTH, RBAC & SESI

### 7.1 JWT

- Access token (1 jam): claims `{ sub, role, schoolId, scopes[], linkRoles[] }`.
- Refresh token (30 hari, rotating, hash disimpan di `Session`). Refresh reuse-detection → revoke seluruh sesi user.
- `linkRoles`: daftar role lain milik orang yang sama (UserRoleLink) untuk role switcher tanpa logout.

### 7.2 Aturan login

- Siswa login dengan `NIS + password`. Dewasa: `phone/email + password` (ortu registrasi via OTP WA/SMS + invite code).
- First login: wajib ganti password + setujui ToS sesuai role (versi pelajar untuk siswa). Password policy: min 8, tolak yang sama dengan NIS/tanggal lahir/123456-class.
- Gagal 5× → lock 15 menit (`lockedUntil`). Pesan error TIDAK membedakan “username salah” vs “password salah”.
- Limit perangkat: STUDENT max 2 session aktif; role lain max 3. Sesi ke-N+1 me-revoke sesi tertua (beri tahu user).

### 7.3 RBAC — enforce di BACKEND per request

- Setiap endpoint mendeklarasikan `@Roles(...)` + `@Scope('self'|'class'|'school'|'global')`.
- Guard memvalidasi: role cocok DAN resource berada dalam scope (mis. guru → hanya class yang diampu; lihat `Class.homeroomTeacherId` + tabel pengampu). Pelanggaran → `403` + AuditLog.
- HQ role TIDAK punya endpoint untuk membaca PII siswa (endpointnya memang tidak ada — ADR-005).

### 7.4 Matriks ringkas

|Aksi                 |HQ|SchAdmin|Kepsek  |Guru        |Siswa|Ortu |Alumni|Mitra      |
|---------------------|--|--------|--------|------------|-----|-----|------|-----------|
|Provision sekolah/Box|✅ |—       |—       |—           |—    |—    |—     |—          |
|Impor massal user    |— |✅       |—       |—           |—    |—    |—     |—          |
|Lihat PII siswa      |❌ |✅sekolah|✅sekolah|✅kelas      |✅diri|✅anak|✅diri |❌          |
|Koreksi absen        |❌ |✅+audit |❌       |✅kelas+audit|❌    |❌    |❌     |❌          |
|Approve iklan        |✅ |view    |view    |—           |—    |—    |—     |submit     |
|Analytics global     |✅ |—       |—       |—           |—    |—    |—     |kampanyenya|

-----

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

**ews & startup (Fase 8)**

```
GET  /ews/alerts?classId=        [TEACHER wali kelas, BK, PRINCIPAL agregat]
POST /ews/alerts/:id/action      {note} → status ACTIONED
POST /startup/ideas  · GET /startup/ideas?batch=  [STUDENT submit; kurasi oleh HQ/sekolah]
PATCH /hq/startup/ideas/:id      {status, mentorUserIds}
```

-----

## BAGIAN 9 — SPESIFIKASI LAYAR

### 9.1 Mobile (Flutter) — shell per role

**Umum (semua role):** splash → login → (first-login: ganti password + ToS) → home sesuai role. Komponen common: notification inbox, profil & sesi perangkat, pengaturan bahasa/notifikasi, role switcher (jika `linkRoles` ada).

**STUDENT — bottom nav: Beranda · Belajar · Kuis · Profil**

1. `Beranda`: kartu status absen hari ini, jadwal hari ini, pengumuman terbaru, slot iklan APP_SLOT (max 1 kartu, kategori tersaring).
1. `Absen`: tombol Scan QR (kamera, deferred module) → hasil + status; riwayat kalender bulan.
1. `Izin`: form (jenis, tanggal, catatan, lampiran ≤5MB) + daftar status.
1. `Belajar (AI Tutor)`: chat UI; indikator kuota; hanya tampil bila flag `TUTOR_ENABLED` sekolah aktif; banner sponsor “powered by X” bila ada.
1. `Kuis`: kuis harian (timer per soal), hasil + poin; katalog reward; riwayat penukaran.
1. `Portofolio`: daftar prestasi/sertifikat (read-only dari sekolah + tambah mandiri berstatus “menunggu verifikasi”).

**TEACHER — bottom nav: Kelas · AI Asisten · Pesan · Profil**

1. `Kelas`: pilih kelas diampu → absen real-time hari ini (hadir/terlambat/belum), tombol koreksi (wajib alasan), rekap bulanan, daftar izin menunggu keputusan (approve/reject + catatan).
1. `AI Asisten`: tab Generate (form: jenis/mapel/topik/kelas → hasil DRAFT → editor → “Setujui & Simpan”), tab Koreksi (upload rubrik+jawaban → skor saran → konfirmasi per siswa), tab Rapor (narasi). Indikator kuota.
1. `Pengumuman`: compose ke kelas diampu (retract ≤15 m).
1. `Pesan`: thread per ortu (balasan), kartu Early Warning (fase lanjut; hanya wali kelas/BK).

**PARENT — bottom nav: Anak · Izin · Info · Profil**

1. `Anak`: kartu per anak (multi-anak): status hari ini + jam masuk/pulang; riwayat; ringkasan mingguan AI (Jumat).
1. `Izin`: ajukan untuk anak (badge “diajukan orang tua”) + status.
1. `Info`: pengumuman sekolah + kalender kegiatan; tab terpisah `Penawaran` (max 1 baru/minggu, ada “sembunyikan kategori”).
1. `Pesan`: ke wali kelas (mulai dari template + teks bebas).
1. Onboarding khusus: register OTP → masukkan kode undangan → tersambung (boleh tambah anak lagi).

**ALUMNI — bottom nav: Karier · Lowongan · Komunitas · Profil**

1. Wizard transisi & re-consent (sekali, saat pertama login pasca-lulus).
1. `Profil karier`: data terverifikasi (read-only) + data mandiri; toggle besar “Buka profil untuk rekruter” (default OFF) + update status karier (mengisi tracer).
1. `Lowongan`: cari/filter → detail → lamar 1-klik → tracking status; thread per lamaran.
1. `Komunitas`: direktori angkatan (opt-in), program mentor.

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
- Iklan (transparansi): daftar materi aktif di sekolah ini + tombol “Keberatan”.
- Tracer (kepsek): laporan keterserapan per angkatan + ekspor.
- Audit log (read-only).

**/hq (HQ_ADMIN, HQ_OPS)**

- Sekolah: provision wizard (data sekolah → pairing Box via serial+token → terbitkan akun admin).
- Fleet: tabel Box (online/offline, queue depth, versi, disk/temp), aksi restart service, rollout update bertahap.
- Review Iklan: antrean creative (preview + hasil AI screen) → approve/reject+alasan; kelola kategori terlarang.
- Mitra & Billing: CRUD partner, invoice, status bayar (belum lunas → campaign auto-pause).
- Analytics: DAU/WAU/MAU per sekolah (alarm merah <40%), biaya AI per sekolah/fitur, Youth Pulse generator (enforce n≥50).
- Feature flags per sekolah.

**/partner (PARTNER)**

- Kampanye: buat (paket → target kota/sekolah/kelas/jurusan/role → periode) → upload creative → status review.
- Laporan: impressions/clicks/leads per sekolah & kota (agregat; tidak ada endpoint identitas).
- Lowongan: CRUD, pipeline pelamar (kanban status), thread per lamaran.
- Tagihan: invoice & status.

### 9.3 Portal (apps/portal)

- 1 halaman: logo sekolah + Magnoo, form login (username/password), info jam WiFi.
- Setelah login: status koneksi + 1 banner pengumuman sekolah + 1 slot iklan (PORTAL surface, server-pick) + tombol “buka aplikasi Magnoo” (deeplink).
- Mode offline (Box tanpa internet): tetap autentikasi via Box, banner “mode lokal — notifikasi akan terkirim saat online”.
- Constraint: total transfer < 200KB, render < 1,5 dtk di HP RAM 2GB, tanpa font eksternal saat offline.

-----

## BAGIAN 10 — ATURAN BISNIS INTI (single source of truth)

**10.1 Settings sekolah (default, semua configurable per sekolah):** `jam_masuk=07:00`, `late_cutoff` (setelah ini = LATE), `absent_cutoff=09:00` (tanpa event & tanpa permit = ABSENT_NO_INFO → trigger notif ortu), `jam_pulang=15:30`, `wifi_hours=06:00–17:00`, `qr_geo_radius_m=300`, `student_wifi_mbps=5`, `tutor_daily_quota=30`, `teacher_gen_daily_quota=20`.

**10.2 Validasi QR check-in:** token QR berganti tiap 60 dtk (TOTP-like, secret per sekolah); valid bila (GPS dalam radius `qr_geo_radius_m` dari koordinat sekolah) ATAU (request datang dari IP WiFi sekolah). Double event <5 menit → diabaikan diam-diam (return sukses, tidak buat event).

**10.3 Status harian:** event IN pertama menentukan PRESENT/LATE; permit APPROVED meng-override jadi PERMIT/SICK; OUT sebelum `jam_pulang` tanpa permit → notif “pulang lebih awal” ke ortu. Job `recompute-daily-status` jalan tiap event masuk + cron 09:05 & 16:00 waktu sekolah.

**10.4 Koreksi absen:** hanya TEACHER (kelas diampu, ≤ H+3) & SCHOOL_ADMIN; wajib reason; membuat AttendanceEvent type CORRECTION; AuditLog mencatat before/after; DailyAttendanceStatus di-recompute.

**10.5 Poin & penukaran:** saldo = SUM(ledger); poin baru bisa ditukar setelah mengendap 7 hari (hitung FIFO per entry); max 1 penukaran pulsa/minggu/user; redemption idempotent; pola curang (≥10 jawaban berturut <1 dtk) → `flagged=true` → review HQ.

**10.6 Pengumuman:** retract hanya ≤15 menit setelah publish; scope SCHOOL hanya SCHOOL_ADMIN/PRINCIPAL.

**10.7 Chat:** HANYA tipe thread yang ada di skema. PARENT_HOMEROOM: ortu memulai dari template; CLASS_ROOM: guru→kelas, siswa boleh bertanya, terlihat seisi kelas + bisa diaudit admin; APPLICATION: alumni↔partner dalam lamaran. **TIDAK ADA DM siswa↔siswa dan TIDAK ADA partner→siswa** (jangan dibuat endpoint-nya).

**10.8 Ads serving:** pick server-side berdasarkan target {city, schoolId, grade, major, role} + status ACTIVE + budget periode; role STUDENT hanya kategori whitelist (`EDU, CAMPUS, SCHOLARSHIP, EVENT, FOOD_GENERAL, STATIONERY`); blacklist permanen di pre-screen: rokok/vape, alkohol, judi, pinjol, dewasa, politik praktis. Frekuensi: max 3 creative berbeda/hari/user (dihitung dari impressions per role+school — bukan per user tracking; gunakan client-side frequency cap di app dengan localStorage per hari). Surface AI Tutor & jadwal = bebas iklan.

**10.9 Alumni:** transisi otomatis saat `graduationDate` angkatan (job harian); akun mode terbatas sampai re-consent; profil default tersembunyi; perusahaan hanya melihat profil dari lamaran masuk atau opt-in; pelamar <18 tidak bisa apply FULLTIME.

**10.10 Consent gating:** enrollment wajah TERKUNCI tanpa ConsentRecord FACE aktif; pencabutan FACE → job hapus face_template di Box ≤24 jam + tulis bukti penghapusan ke AuditLog; siswa tanpa consent berjalan via QR selamanya tanpa degradasi pengalaman.

**10.11 AI:** semua output edukasi berstatus DRAFT sampai aksi eksplisit guru; pseudonimisasi sebelum provider (mapping di memori server, TTL request); kuota harian + monthly cost cap per sekolah (lewat cap → fitur AI menampilkan “istirahat”, fitur non-AI tidak terganggu); cache berdasarkan hash(prompt-normalized) TTL 7 hari; log prompt tanpa PII, retensi 30 hari.

-----

## BAGIAN 11 — LAYANAN PENDUKUNG

### 11.1 AI Service (module `ai`)

- `LlmProvider` interface: `generate(req): Response` + `estimateCost()`. Implementasi v1: Anthropic adapter (model murah utk klasifikasi/saringan, model pintar utk generate materi). Provider dipilih per-feature via config.
- Pipeline (urutan tetap): authz → quota → anonymize → cacheGet → provider → outputSafetyFilter (klasifikasi konten tidak pantas utk minor) → deanonymize → cacheSet → costLog (AiUsage).
- Anonymizer: ganti token `displayName/NIS` dengan `Siswa-07` style; untuk teacher grading, payload jawaban dikirim tanpa identitas sama sekali.

### 11.2 Notification Service

- Abstraksi `NotifChannel`: PUSH (FCM/APNs), WA (adapter interface — implementasi nyata fase lanjut; selalu cek biaya), INAPP.
- Template terdaftar (templateKey) + payload; antrean BullMQ dengan retry/backoff; NotificationLog untuk delivery tracking.
- Routing kebijakan (hybrid): event rutin (masuk/pulang) → PUSH+INAPP; event kritis (`ABSENT_NO_INFO`, permit decision, kode undangan) → PUSH, fallback WA bila push gagal/uninstalled (flag per sekolah `WA_FALLBACK`).
- Kalimat notifikasi “belum tercatat hadir” wajib netral + deeplink ajukan izin.

### 11.3 Box Bridge (nama siswa untuk dashboard)

- Service kecil di Box: REST read-only `GET /bridge/names?ids=` mengembalikan `{userId→fullName}`; hanya menerima koneksi dari cloud via WireGuard dengan mTLS; dashboard sekolah memanggil API cloud → cloud mem-proxy realtime ke Box sekolah ybs → merge di response (cloud TIDAK menyimpan hasilnya). Bila Box offline: dashboard menampilkan NIS + badge “Box offline”.

### 11.4 Sync Protocol Box↔Cloud

- Outbound (Box→Cloud): batch ≤500 event, signature HMAC-SHA256 per Box (`X-Box-Signature`, secret saat pairing), tiap event punya `event_id` UUID; cloud meng-ACK per event; tanpa ACK → retry backoff (max interval 5 menit), `retry_count` tercatat; cloud menolak duplikat by `boxEventId` unique.
- Inbound (Cloud→Box): Box poll `GET /sync/manifest` tiap 60 dtk (etag); isi: radius user list (username+bcrypt hash+role+quota — TANPA nama siswa), settings, bell schedule, portal bundle version, feature flags.
- Jam Box disinkron NTP; event menyimpan waktu kejadian lokal Box.

### 11.5 Box Services (docker-compose di mini PC)

|Service       |Isi                                                                                                                                                                                                         |Catatan                            |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
|`freeradius`  |Auth WiFi; module rest → `radius-bridge` lokal yang cek tabel user cache                                                                                                                                    |MikroTik → RADIUS ini              |
|`portal-local`|nginx serve build `apps/portal` + proxy auth lokal                                                                                                                                                          |offline-capable                    |
|`postgres-box`|skema 6.4                                                                                                                                                                                                   |disk LUKS                          |
|`facesvc`     |FastAPI: `/enroll` `/identify` (frame in → userId/score); threshold configurable; ≥0.6 conf → event; di bawah → abaikan (no false present)                                                                  |tidak menyimpan frame              |
|`sync-agent`  |Node: flush sync_queue, poll manifest                                                                                                                                                                       |                                   |
|`box-bridge`  |11.3                                                                                                                                                                                                        |                                   |
|`bell`        |cron dari manifest → relay USB                                                                                                                                                                              |jadwal terakhir tetap jalan offline|
|`mgmt-agent`  |WireGuard up, healthcheck push, watchdog restart service, auto-update window 22:00–04:00, rollback bila health gagal pasca-update, **backup harian DB Box ke partisi lokal + mingguan terenkripsi ke cloud**|                                   |

### 11.6 Scheduled Jobs (terpusat — semua via BullMQ repeatable, timezone per sekolah)

|Job                      |Jadwal                   |Isi                                                                                                              |Fase|
|-------------------------|-------------------------|-----------------------------------------------------------------------------------------------------------------|----|
|`recompute-daily-status` |per event + 09:05 & 16:00|hitung DailyAttendanceStatus (rule 10.3)                                                                         |2   |
|`absent-noinfo-notifier` |09:05                    |siswa tanpa event & tanpa permit → notif ortu (kalimat netral)                                                   |2   |
|`permit-sla-reminder`    |tiap jam                 |izin >24 jam belum diputus → ingatkan wali kelas                                                                 |2   |
|`invite-code-expiry`     |harian 02:00             |kedaluwarsakan kode >30 hari                                                                                     |1   |
|`points-settlement`      |harian 02:10             |tandai poin yang lewat masa endap 7 hari                                                                         |5   |
|`campaign-lifecycle`     |harian 02:20             |aktifkan/akhiri kampanye sesuai periode; pause yang telat bayar >14 hari                                         |5   |
|`face-consent-revocation`|tiap jam                 |consent FACE dicabut → perintahkan Box hapus template; verifikasi ACK ≤24 jam                                    |6   |
|`graduation-transition`  |harian 02:30             |tanggal lulus angkatan → role STUDENT→ALUMNI + mode terbatas                                                     |7   |
|`parent-weekly-digest`   |Jumat 15:00              |ringkasan mingguan AI per anak (feature PARENT_DIGEST, kuota & cap berlaku; data anak itu saja, tanpa pembanding)|8   |
|`ews-scan`               |harian 16:30             |rule EWS (absen 3 hari berturut / tren LATE) → EwsAlert privat                                                   |8   |
|`engagement-rollup`      |harian 03:00             |DAU/WAU/MAU per sekolah + alarm <40%                                                                             |8   |
|`db-backup-verify`       |mingguan                 |uji restore backup cloud ke instance sementara                                                                   |3   |

-----

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
- **DoD**: di mesin uji (atau VM): login WiFi via portal → event ke cloud; cabut “internet” → tetap auth lokal, antrian terkirim saat tersambung lagi tanpa duplikat; QA-3, QA-10 (subset offline) lulus.

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

**FASE 8 — Analytics, EWS, Youth Pulse, Startup module dasar**

- DAU/WAU/MAU per sekolah + alarm; EWS rule sederhana (pola absen ≥3 hari berturut ATAU tren LATE naik — kartu privat wali kelas/BK; TANPA skor ranking); Youth Pulse generator (n≥50 enforced); modul startup: submit ide + kurasi + thread mentoring (pakai infrastruktur thread).
- **DoD**: alarm engagement berfungsi pada data seed; query n<50 ditolak.

-----

## BAGIAN 13 — GUARDRAILS (DILARANG — jangan dibangun walau “kelihatannya berguna”)

1. ❌ Endpoint/fitur apa pun yang mengembalikan PII siswa lintas sekolah, atau PII siswa ke role HQ/PARTNER.
1. ❌ Menyimpan nama/NIS siswa di tabel cloud, log, analytics, atau prompt AI tanpa pseudonim.
1. ❌ Penyimpanan video/frame kamera; facesvc memproses lalu membuang.
1. ❌ Riwayat browsing per pengguna; tracking perilaku individu untuk iklan; targeting selain field di `AdCampaign.target`.
1. ❌ DM siswa↔siswa; kontak pihak luar→siswa; chat tersembunyi guru↔siswa di luar CLASS_ROOM.
1. ❌ Dashboard kinerja/ranking guru, atau laporan pemakaian per guru yang bisa diakses kepsek.
1. ❌ Auto-approve iklan tanpa review manusia.
1. ❌ Ekspor massal face template dalam bentuk apa pun.
1. ❌ Mengedit/menghapus AuditLog & PointLedger (append-only).
1. ❌ Memanggil LLM provider langsung dari klien atau dari module selain `ai`.
1. ❌ Menyimpan secret di repo; semua via env/vault.
1. ❌ Mengganti keputusan ADR tanpa konfirmasi pemilik proyek.

-----

## BAGIAN 14 — KEAMANAN & NFR

- Password: argon2id. TLS semua jalur; Box↔Cloud via WireGuard. Disk Box: LUKS. Kolom sensitif (face embedding) enkripsi aplikasi (AES-256-GCM, key per sekolah di vault).
- OWASP Top 10 clean (CI: dependency scan + semgrep). Rate limit & lockout sesuai 7.2/8.1. CORS ketat per app origin.
- Target performa: login p95 <2s; portal <1,5s di low-end; notif <60s; 500 login WiFi/10 menit/sekolah; uptime cloud 99,5%; Box offline ≥72 jam; APK <40MB; API p95 <300ms untuk read endpoints.
- Backup: cloud DB harian (retensi 30 hari) + uji restore bulanan; Box: dump harian lokal + mingguan terenkripsi ke cloud (tanpa PII mentah — kecuali blob terenkripsi yang hanya bisa dibuka key sekolah).
- Observability sejak Fase 1: metrics (RPS, latency, queue depth, sync lag per Box, AI cost), alert Telegram (Box offline >5m, error rate, cost cap 80%).

-----

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

-----

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

-----

## BAGIAN 17 — KONVENSI KERJA UNTUK CLAUDE CODE

1. **Bahasa**: kode, komentar API publik, commit message = Inggris. String UI = Indonesia, via file lokalisasi (`packages/shared/i18n` untuk web/portal, `lib/l10n` untuk Flutter) — tidak ada string UI hardcode.
1. **Commit**: conventional commits (`feat(attendance): qr rotating token`), kecil & sering; satu fitur = satu PR-able unit.
1. **TypeScript strict, no `any`** kecuali dengan komentar alasan. Dart: lints `flutter_lints` + analyzer fatal-infos.
1. **Validasi di tepi**: semua input request divalidasi zod (schema dari `packages/shared`) sebelum menyentuh service.
1. **Migrasi**: setiap perubahan skema = Prisma migration ber-nama jelas; tidak pernah edit migration lama.
1. **Setiap fase**: update `docs/progress.md` (apa selesai, keputusan kecil yang diambil, utang teknis) + `docs/adr/` bila ada keputusan baru (minta konfirmasi dulu bila menyimpang dari dokumen ini).
1. **Testing dulu untuk business rules**: BAGIAN 10 ditulis test-first.
1. **Jangan optimasi prematur**: polling boleh sebelum websocket; monolith sebelum pecah; index ditambah saat query terbukti lambat.
1. **Bila ragu** terhadap apa pun yang menyentuh: data anak, uang/poin, keamanan, atau guardrails BAGIAN 13 → **berhenti dan tanya pemilik proyek**. Untuk hal kosmetik (warna, copy, layout) → ambil keputusan wajar, catat di progress.
1. **Identitas visual**: ink `#10243A`, magnet red `#E4391F`, field blue `#1656C9`, gold `#F2A91C`, paper `#F7F9FB`; font display Bricolage Grotesque / body Plus Jakarta Sans (web) — Flutter pakai Plus Jakarta Sans.

-----

*MAGNOO Build Spec v1.0 — Juni 2026. Dokumen hidup: revisi dicatat bernomor di bagian atas. Tiga kompas saat dokumen tidak menjawab: jangan bahayakan anak, jangan gadaikan nama, jangan bangun yang tidak diminta.*