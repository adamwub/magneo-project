# MAGNOO — Kesiapan & Grounding FASE 2 (Jantung Harian)
> Disusun subagent **magnoo-architect** (READ-ONLY) — 2026-06-19. Dokumen DATA untuk mandor-bot.
> Sumber kebenaran: `aplikasi.md` v1.2. Scope: HANYA Fase 2 (absen QR, notif FCM + WA stub, izin, pengumuman).

## VERDIKT
**Spec Fase 2 BELUM "cukup untuk dibangun lurus" — ada 3 BLOCKER yang harus ditambal pemilik dulu** (kalau tidak, mandor-bot pasti menebak / menyentuh data anak tanpa panduan):
- **A-1** Koordinat sekolah + daftar IP/CIDR WiFi tidak ada di `model School` → rule 10.2 (validasi lokasi absen) tak bisa dijalankan.
- **B-1** Tidak ada model token FCM (`DeviceToken`) + endpoint registrasi → push FCM mustahil; DoD "<60 dtk" tak tercapai.
- **C-2** Pemutus izin tidak ada di matriks RBAC 7.4 → keputusan atas izin anak tanpa otorisasi terdefinisi (sentuh data anak).

BLOCKER ringan (sangat dianjurkan sebelum mulai): **A-2** mekanisme/secret/TTL token QR (TOTP-like), **A-3** kontrol anti-foto untuk QA-4, **C-1** state machine izin (transisi + idempoten + anti-race).

Sisanya = ambiguitas MAJOR/MINOR dengan usulan teks tambal cepat (di bawah).

---

# MODE A — Celah spec (lokasi → risiko → usulan tambal)

## Absensi QR
- **A-1 (BLOCKER)** 6.1 `School` tak punya `lat/lng` & `wifi_cidrs[]` → rule 10.2 mati. Usulan: simpan di `School.settings`; validasi IP via `trust proxy`+`X-Forwarded-For`; tanpa keduanya → `ATTENDANCE_LOCATION_REQUIRED`.
- **A-2 (BLOCKER ringan)** 10.2 "TOTP-like 60 dtk" multitafsir; tak ada kolom secret/where, window, isi token. Usulan: secret QR per sekolah terenkripsi (AES-256-GCM, vault, BAGIAN 14), TIDAK ke klien siswa; token TOTP step 30 dtk ditampilkan via `GET /attendance/qr/current` (gerbang/guru); server window ±1; token mengikat `schoolId`; anti-replay `attreplay:{schoolId}:{userId}:{step}` TTL 90s.
- **A-3** Anti-foto QR (QA-4) tak dirinci. Usulan: QA-4 lulus bila aktif: rotasi pendek + geofence/IP + anti-replay per token-step per user + double-event <5 mnt diabaikan. Device-binding = "untuk dibahas pemilik", bukan Fase 2.
- **A-4** OR GPS vs IP perlu ditegaskan: LULUS bila salah satu benar; bila tak ada geo & IP di luar CIDR → `ATTENDANCE_OUT_OF_AREA`.
- **A-5** LATE/PRESENT & `date`: pakai `occurredAt` dikonversi ke `School.timezone`; server set `occurredAt=now()` (jangan percaya klien).
- **A-6** Check-in QR tanpa Idempotency-Key; dedup via rule 10.2 (abaikan event sejenis <5 mnt, sukses idempoten).

## Notifikasi
- **B-1 (BLOCKER)** Tak ada model token push. Usulan: `model DeviceToken { id; userId; token @unique; platform; lastSeenAt; createdAt; revokedAt? }` + `POST /me/devices` & `DELETE /me/devices/:token`.
- **B-2** "<60 dtk" tak terdefinisi titik ukurnya. Usulan: ukur dari event tercatat s/d FCM API success; kirim lewat BullMQ; catat `enqueuedAt/sentAt` di NotificationLog.
- **B-3** Dedup notif tak ada (risiko banjir dari cron 09:05/16:00 + event). Usulan: `notifsent:{userId}:{templateKey}:{dedupeKey}` NX TTL 24 jam + FCM `collapseKey`.
- **B-4** Payload FCM tak distandar. Usulan: `notification`+`data`({type,entityId,deeplink,templateKey,dedupeKey}); event kritis `android.priority=high`; teks dilokalkan di klien via `templateKey`.
- **B-5** WA stub: definisikan `interface WaChannel`; Fase 2 = stub tulis NotificationLog QUEUED + log; fallback HANYA bila user tak punya DeviceToken aktif ATAU FCM `UNREGISTERED` semua token + `WA_FALLBACK` + kategori kritis.
- **B-6** Penerima = semua `ParentLink.status=ACTIVE` untuk siswa (dedup per ortu).

## Izin
- **C-1 (BLOCKER ringan)** State machine. Usulan: SUBMITTED→{APPROVED,REJECTED} (pemutus), SUBMITTED→CANCELLED (pembuat, selama SUBMITTED); APPROVED/REJECTED terminal; idempoten; transisi ilegal `PERMIT_INVALID_TRANSITION`; conditional update `WHERE status='SUBMITTED'`.
- **C-2 (BLOCKER)** Pemutus izin tak ada di RBAC. Usulan: tambah baris 7.4 — putuskan izin = **wali kelas** (`Class.homeroomTeacherId`) + **SCHOOL_ADMIN**; guru non-wali/PRINCIPAL/PARENT ❌; AuditLog `PERMIT_DECIDE`.
- **C-3** Izin↔DailyAttendanceStatus: APPROVED memicu recompute tiap tanggal [dateStart..dateEnd]; map `SICK`→SICK, `FAMILY|DISPENSATION|OTHER`→PERMIT; tahan ABSENT_NO_INFO bila ada permit APPROVED.
- **C-4** Validasi pembuat (siswa diri / ortu `ParentLink ACTIVE`) cegah IDOR; tolak overlap tanggal `PERMIT_DUPLICATE`.
- **C-5** Lampiran: presign enforce ≤5MB & MIME {jpeg,png,pdf}; URL milik sekolah ybs (anti-SSRF).

## Pengumuman
- **D-1** Semantik scope×role: CLASS=guru(kelas diampu)+admin; GRADE/SCHOOL=admin/principal; PARENTS=admin/principal; semua dibatasi `schoolId`.
- **D-2** Pengumuman→notif: INAPP ke audiens; PUSH ringkas opsional; non-kritis tanpa WA (cegah banjir).
- **D-3** Retract: valid bila `now-publishedAt≤15mnt` else `ANNOUNCEMENT_RETRACT_EXPIRED`; sembunyikan dari daftar+inbox; AuditLog.

## Lintas-topik
- **E-1** Thread Fase 2 HANYA `PARENT_HOMEROOM`; `CLASS_ROOM`/`APPLICATION` bukan Fase 2; jangan buat DM siswa↔siswa (13.5).
- **E-2** Tambah error code: `ATTENDANCE_INVALID_TOKEN, ATTENDANCE_OUT_OF_AREA, ATTENDANCE_LOCATION_REQUIRED, PERMIT_DUPLICATE, PERMIT_INVALID_TRANSITION, ANNOUNCEMENT_RETRACT_EXPIRED, ANNOUNCEMENT_SCOPE_FORBIDDEN`.
- **E-3** Pakai RBAC decorator existing (`@Roles`/`@Scope`) & `AuditService.write()`; jangan tulis ulang authz.

---

# MODE B — Grounding referensi (pola teruji, terikat BAGIAN 4)

## QR absen dinamis (NestJS)
- Library: **`otpauth`** (TOTP TS, `validate({token,window})`); anti-replay **ioredis** `SET k v NX EX ttl` (à la `OtpService`); geofence Haversine manual.
- Pola: secret per sekolah terenkripsi & server-display only (jangan ke HP siswa → cegah bypass geofence); TOTP SHA256 step 30; validate window 1; OR GPS/IP; anti-replay per (user,step); double<5mnt silent-idempoten; `occurredAt` server.
- Jebakan: bagikan secret ke klien (fatal); window kebesaran; lupa `trust proxy`; anti-replay in-memory pada multi-instance → Redis.
- Keamanan: secret AES-256-GCM (14); `@Roles('STUDENT')@Scope('self')` (anti-IDOR); tanpa PII di log (13.2); koreksi via AuditService append-only (13.9, 10.4).

## FCM push (NestJS)
- Library: **`firebase-admin`** `getMessaging().sendEachForMulticast({tokens})` (per-token result); service account via env/vault (13.11). **BullMQ** queue `notifications` (à la `import.worker.ts`).
- Pola: registry `DeviceToken` (+`lastSeenAt`); enqueue setelah event tersimpan; dedup NX + `collapseKey`; payload `notification`+`data`; hapus token `registration-token-not-registered`; `attempts:5` backoff eksponensial + jitter; NotificationLog QUEUED→SENT/FAILED.
- Jebakan: multicast >~200 token → batch (HTTP/2 GOAWAY); kirim sinkron di handler → lewat SLA; tak bersihkan token mati; service account di repo; PII di payload (13.2).

## Izin & pengumuman
- Teknik: Prisma **conditional `updateMany`** (transisi atomik anti-race); zod shared; AuditService; RBAC existing.
- Izin: decision `updateMany({where:{id,status:'SUBMITTED'}})`; count 0 → idempoten/`PERMIT_INVALID_TRANSITION`; side-effect (recompute, notif) hanya saat state benar berubah; pemutus wali kelas+admin; validasi pembuat anti-IDOR.
- Pengumuman: scope×role server-side; retract conditional `where:{retractedAt:null, publishedAt>=now-15m}`; notif INAPP + push ringkas non-kritis.
- Keamanan: `@Roles`+`@Scope`; lampiran presign server-validated; AuditLog append-only; hanya `PARENT_HOMEROOM` (13.5).

---

## Sumber
- https://firebase.google.com/docs/cloud-messaging/manage-tokens
- https://firebase.google.com/docs/cloud-messaging/error-codes
- https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type
- https://firebase.google.com/docs/cloud-messaging/customize-messages/collapsible-message-types
- https://github.com/firebase/firebase-admin-node/issues/2943
- https://github.com/hectorm/otpauth
- https://www.authgear.com/post/5-common-totp-mistakes/
- https://www.allgeo.com/using-qr-codes-to-track-attendance
- https://oneuptime.com/blog/post/2026-02-12-build-human-approval-workflows-with-step-functions/view
- https://www.xano.com/blog/backend-workflows-best-practices/
- https://www.prisma.io/docs/orm/reference/prisma-client-reference#updatemany
