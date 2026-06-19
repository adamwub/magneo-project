# Konsep Fitur: Engagement, Konsultasi & Karier — PROPOSAL (v1)

> **Status:** PROPOSAL, belum mengikat. Dokumen ini **bukan** pengganti `aplikasi.md`
> (konstitusi). Setelah disetujui owner — dan untuk bagian *uang* & *data anak* setelah
> kajian hukum PDP/PSE — bagian yang matang akan digabung ke `aplikasi.md` sebagai
> **adendum (mis. BAGIAN 12B)** + ADR baru. Disusun 2026-06-19 dari diskusi owner.
> Owner akan memperbarui daftar fitur ini secara berkala.

## 0. Tujuan bisnis (kata owner)
Guru dapat **penghasilan tambahan** dari berbagi ilmu; siswa punya **rekam jejak skill**
yang bikin dilirik perusahaan; dan **siswa + guru lebih sering buka app & senang**
(engagement + retensi), supaya Magneo jadi kebiasaan harian, bukan sekadar alat absen.

## 1. Prinsip kunci (alasan konsep ini aman & layak investasi)
1. **Pisahkan "membangun nilai" dari "memamerkan/transaksi".** Nilai (skill, poin)
   dibangun sekarang dengan aman; pamer ke perusahaan & uang-nyata menyala saat dewasa/
   alumni atau dengan rambu ketat. Siswa = **anak di bawah umur** — itu sumber semua rambu.
2. **Transparansi, bukan pelarangan.** Komunikasi guru–siswa boleh, asal **terang & tercatat**
   (bukan DM gelap). Ini menegakkan guardrail 13.5 sekaligus jadi nilai jual ("lebih aman dari WhatsApp").
3. **Identitas anak tetap di Box** (ADR-005); **data anak tak pernah jadi produk** (13.13).
4. **Uang nyata menunggu badan hukum + lisensi pembayaran (PJP) + pajak.** Mulai dari
   **ekonomi poin** internal supaya Magneo belum jadi perantara uang.
5. **Pisahkan kuasa.** Fungsi guru "menilai/menjaga" dipisah dari "menjual" → cegah konflik
   kepentingan & paksaan terhadap siswa.

## 2. Fitur → pemetaan arsitektur

### F1. Open Class — Konsultasi Spesialis (tercatat)
- **Apa:** siswa tanya guru mapel (mis. "lemah matematika → tanya guru matematika"), gaya
  Halodoc. Dua bentuk: (a) **Open Class** = forum tanya-jawab per mapel, jawaban guru dilihat
  banyak siswa; (b) **Sesi konsultasi 1-on-1** yang *privat dari teman, terang ke sistem*.
- **Cara kerja aman:** semua pesan **tercatat & bisa diaudit sekolah**, fokus akademik,
  ortu/wali kelas dapat melihat; **tidak ada chat gelap/tak-terlog** (13.5). Sesi dibuka–ditutup
  (seperti sesi Halodoc), bisa diberi rating.
- **Rumah fase:** ekstensi modul `comms` (ThreadType baru, mis. `OPEN_CLASS` / `CONSULT`).
  Dekat Fase 2 (comms) tapi dijadwalkan setelah Fase 2 inti selesai.
- **Model data (perkiraan):** `ThreadType` += OPEN_CLASS/CONSULT; reuse `Thread`/`Message`;
  `ConsultSession{ id, studentUserId, teacherUserId, subject, status, openedAt, closedAt, rating? }`.
- **Guardrail:** 13.5 (tak ada chat tersembunyi), 13.1/13.2 (PII), audit append-only 13.9.
- **UI:** dibuat **menyenangkan** (bukan form sekolah) — penting untuk adopsi.

### F2. Skill Passport → Profil Karier (LinkedIn)
- **Apa:** siswa kumpulkan skill/pencapaian; **guru verifikasi** jadi badge terpercaya
  (rekam jejak tumbuh sepanjang sekolah). "Mekar" jadi profil publik yang dilirik perusahaan.
- **Cara kerja aman:** identitas + detail skill = **sisi Box** (ADR-005); cloud hanya
  non-identitas/agregat. **Showcase ke perusahaan = saat ALUMNI** (sudah dewasa) — *keputusan
  owner: mulai dari alumni dulu*. Versi siswa-aktif (opsional, nanti): **wajib izin ortu** +
  **perusahaan tidak boleh kontak anak langsung** (minat lewat sekolah/ortu).
- **Rumah fase:** badge & verifikasi skill = **Fase 5**; showcase/rekrutmen = **Fase 7 (Alumni & Karier)**.
- **Model data:** `SkillBadge{ id, studentUserId, skill, level, verifiedByUserId, verifiedAt }`
  (detail identitas di Box); profil publik = entitas alumni di Fase 7.
- **Guardrail:** ADR-005 (identitas anak di Box), 13.13 (tak jadi produk; showcase = izin/agregat),
  PDP (profil minor butuh consent ortu).

### F3. Ekonomi Poin + 3 lapisan "kenapa siswa betah"
- **Apa:** poin mengalir **dua arah** (siswa & guru). Engagement bertumpu 3 lapisan:
  1. **Hadiah instan (pancingan harian):** poin + streak + tukar reward nyata (voucher kopi/pulsa/kuota — mitra Fore/Tomorow dll).
  2. **Status & identitas:** badge skill terverifikasi, level, pangkat → menyambung ke F2.
  3. **Sosial & pengakuan:** "siswa minggu ini", papan peringkat kelas (tim, bukan permaluan), bantu-membantu di Open Class.
- **Anti-curang:** poin hanya dari **aktivitas belajar terukur** (kuis, kehadiran, skill terverifikasi,
  ikut sesi guru) — **BUKAN** dari "ngobrol/curhat" (rawan & gampang digame). Pakai aturan
  anti-fraud 10.5 (endap 7 hari, FIFO, flag pola curang).
- **Magic loop:** tiap aksi harian memberi poin instan **dan** menambah isi Skill Passport →
  dopamin sekarang membangun aset masa depan yang terlihat tumbuh.
- **Rumah fase:** **Fase 5** (Gamifikasi). Mekanisme reward & redemption (10.5) **sudah ada**.

### F4. Ruang Ilmu Guru (sidejob guru)
- **Apa:** guru bikin materi/sesi tambahan (rekaman, kelas live, tantangan) & dapat imbalan.
- **Imbalan — bertahap:**
  - **Tahap-1 (aman, lebih cepat — keputusan owner):** **imbalan POIN**. Guru dapat poin saat
    ilmunya dipakai/diapresiasi; poin → reward. Magneo **bukan perantara uang** → bebas lisensi pembayaran.
  - **Tahap-2 (uang nyata):** marketplace les berbayar lewat **payment gateway berlisensi** →
    **butuh badan hukum + kajian PJP/pajak + ADR**, dan **pemisahan peran** (guru yang menilai
    siswa dipisah dari yang menjual ke siswa itu) / pembayaran di luar app dulu.
- **Rumah fase:** imbalan-poin = **Fase 5**; uang-nyata = fase berbadan-hukum / ADR khusus.
- **Guardrail:** anti konflik kepentingan; 13.x; hukum konsumen + pajak (tahap-2).

### F5. Pengumuman Guru → Orang Tua (penyesuaian kecil)
- **Apa:** wali kelas bisa kirim pengumuman ke **orang tua kelas yang diampu** (bukan se-sekolah).
- **Status:** pengumuman guru→siswa (CLASS) **sudah ada** (12A.4, dibangun di Fase 2 / potongan 2j).
  Yang ditambah: longgarkan scope `PARENTS` →
  **`PARENTS` = SCHOOL_ADMIN/PRINCIPAL + wali kelas (khusus ortu kelas yang diampu, filter classId).**
- **Rumah fase:** **Fase 2** (penyesuaian 12A.4) — kecil, aman, nyambung dengan PARENT_HOMEROOM.

### F6. Analisa Kesehatan untuk Dewasa — Guru & Orang Tua (AI wellness → koneksi dokter)
- **Apa:** **guru DAN orang tua** input data kesehatan manual → **AI** kasih analisa + **disclaimer**;
  ke depan bisa terhubung ke dokter. *Subjek = dewasa (guru/ortu), BUKAN siswa.*
- **Kabar baik:** karena subjeknya **dewasa**, ini bebas dari landmine data-anak. Makin banyak
  pengguna dewasa (guru+ortu) juga memperkuat nilai kemitraan telemedicine nanti. Tapi
  **data kesehatan = kategori khusus PDP** (tetap perlu consent + keamanan tinggi).
- **Cara kerja aman / bertahap:**
  - **Tahap-1 (doable):** *self-tracker wellness* (tidur, mood, BMI, dll) + **AI insight gaya hidup**,
    BUKAN diagnosis. Disclaimer kuat "bukan pengganti nasihat dokter". Data terenkripsi & terpisah.
  - **Tahap-2 (koneksi dokter):** **JANGAN bangun telemedicine sendiri.** Kemitraan dengan
    penyedia telemedicine **berlisensi** (Halodoc/Alodokter/Good Doctor dll) yang punya dokter
    ber-STR/SIP, tanggung jawab medis, & kepatuhan Permenkes. Magneo = pintu masuk + (dengan
    consent) berbagi data self-track ke mitra.
- **Guardrail KHUSUS:** data kesehatan **PRIVAT milik orangnya** — guru tak terlihat admin/kepsek
  (privasi kerja); ortu tak terlihat sekolah; AI = **wellness, bukan diagnosis/resep**;
  consent eksplisit; enkripsi at-rest.
- **Rumah fase:** dekat modul **AI (Fase 4)** sebagai modul *wellness* terpisah; **koneksi dokter
  = fase kemitraan + kajian hukum** (Permenkes telemedicine + PDP data kesehatan).
- **Catatan strategi:** menarik & memperkuat "guru happy", tapi ini masuk ranah **healthtech/
  telemedicine** yang berat regulasinya — pendekatan kemitraan (bukan bangun sendiri) menjaga
  Magneo tetap fokus di core sekolah.

### F7. Dashboard Kepala Sekolah (pemetaan guru↔siswa by AI + alat sederhana)
- **Apa:** kepsek dapat **analisa AI** yang memetakan guru terhadap siswanya (keterlibatan,
  pola kehadiran, kelas yang perlu perhatian) → bisa menyesuaikan (dukungan/penempatan).
- **Cara kerja aman:** jalan di atas **data internal sekolah** (kehadiran, aktivitas) yang kepsek
  memang berhak lihat; pakai **ID/agregat**, tak butuh nama siswa (ADR-005). Tidak keluar sekolah.
- **Guardrail KETENAGAKERJAAN (penting):** AI = **decision-support, bukan vonis otomatis.**
  Output = insight + alasan (explainable); **kepsek yang memutuskan.** Jangan jadi skor hukuman
  otomatis untuk guru; transparan ke guru; waspada bias algoritmik.
- **Alat sederhana yang dibutuhkan kepsek (simpel, bertumpu data yang sudah ada):**
  - Ringkasan kehadiran harian + **tren mingguan** (kembangkan summary 2f).
  - **Papan aktivitas guru** (siapa aktif di Open Class/pengumuman/koreksi) — untuk apresiasi, bukan hukuman.
  - **Alarm dini (EWS):** kelas dengan kehadiran turun / banyak ABSENT_NO_INFO → kepsek tindak lanjut.
    (Enum `EwsStatus` sudah ada di skema — nyambung.)
- **Rumah fase:** **Fase 8 (Analitik)** + modul **AI (Fase 4)**.
- **⚠️ TABRAKAN GUARDRAIL (temuan arsitek):** F7 berbenturan dengan **guardrail 13.6** yang melarang
  *"dashboard kinerja/ranking/laporan pemakaian per guru yang diakses kepsek."* F7 **BELUM buildable**
  sampai **owner secara eksplisit merekonsiliasi/mengamandemen 13.6** (bersama ADR-baru-E). Jangan
  dilonggarkan diam-diam. Keputusan owner.

### F8. Prestasi Terverifikasi (kebanggaan sekolah)
- **Apa:** siswa/guru catat prestasi (lomba, juara, sertifikasi) → **diverifikasi** (guru/admin) →
  jadi catatan terpercaya. Kepsek lihat **agregat** di dashboard ("X siswa berprestasi tahun ini")
  — untuk dibanggakan & jadi bahan promosi sekolah.
- **Cara kerja aman:** catatan prestasi = bagian dari **Skill Passport (F2)** (mekanisme verifikasi
  guru sama). Dashboard kepsek = **hitungan/agregat** → aman. **Papan kebanggaan publik dengan NAMA
  siswa** (mis. ke calon ortu) = butuh **izin ortu** (anak); versi **tanpa nama / agregat** = bebas.
- **Rumah fase:** catatan + verifikasi = **Fase 5** (nyambung badge F2); agregat dashboard = **Fase 8/F7**;
  showcase publik-bernama = consent.
- **Guardrail:** ADR-005 (nama anak hanya dengan consent untuk paparan publik), 13.13 (bukan produk);
  internal/agregat aman.

### F9. Profil Guru untuk Orang Tua (tanpa kontak pribadi)
- **Apa:** ortu bisa lihat **profil guru** (nama, mapel, kelas yang diampu, kualifikasi/prestasi
  terverifikasi, jadwal Open Class) — **TANPA nomor HP / kontak pribadi.**
- **Cara kerja aman:** data **profesional** guru (dewasa) boleh di cloud (pengecualian dewasa ADR-005).
  Kontak pribadi (HP, email pribadi, alamat) **tidak ditampilkan**; komunikasi ortu↔guru lewat kanal
  app yang **tercatat** (PARENT_HOMEROOM / Open Class), bukan telepon → memperkuat "lewat app, bukan WA".
- **Rumah fase:** modul `common/profile` + `comms`; dekat **Fase 2** (PARENT_HOMEROOM sudah ada).
- **Guardrail:** privasi kontak guru; komunikasi terang & tercatat (13.5).

### F10. Pengingat Acara (Reminder pengumuman)
- **Apa:** pengumuman yang punya **waktu acara** (mis. "pengambilan raport, Sabtu 09:00–10:00")
  otomatis memicu **notifikasi pengingat** sebelum acara (mis. Jumat sore: *"besok pengambilan raport"*).
- **Data:** `Announcement` + kolom opsional `eventStart` (+`eventEnd`, `location`). Tanpa `eventStart`
  = pengumuman biasa (tak ada pengingat). Tabel kecil `Reminder{ id, announcementId, fireAt, status, sentAt? }`
  untuk jadwal + anti-dobel.
- **Aturan:**
  - Default offset **H-1** (dikirim sore hari sebelumnya, jam wajar — mis. 17:00 waktu sekolah);
    opsional **H-1 jam**. Pembuat bisa atur/matikan. Maks ~2 pengingat/pengumuman (anti-spam).
  - Audiens pengingat = audiens pengumuman (kelas/angkatan/sekolah/ortu).
- **Mekanis:** saat publish → `fireAt = eventStart − offset` (zona waktu sekolah) → simpan `Reminder`.
  **Cron penyapu** (~tiap 10–15 mnt, pola seperti recompute) ambil reminder jatuh-tempo & belum terkirim
  → kirim via pipeline notifikasi → tandai `sentAt` (dedup).
- **Edge case:** retract pengumuman (≤15 mnt) → batalkan reminder belum-terkirim; acara <offset saat dibuat
  (H-1 sudah lewat) → dilewati / kirim "hari ini"; clamp ke jam wajar (tak kirim tengah malam).
- **Rumah fase / ketergantungan:** ekstensi **Announcement + Notification (Fase 2)**; penjadwalan bisa
  dibangun lebih dulu, **pengiriman menunggu pipeline FCM** (2g-2/2h, butuh service account Firebase owner).
- **Guardrail:** isi pengingat tanpa PII sensitif (judul acara saja); dedup; hormati audiens/scope pengumuman.

## 3. Roadmap bertahap (dipetakan ke fase yang sudah ada)
| Saat | Yang dibangun |
|---|---|
| **Fase 2 (sekarang)** | Selesaikan absensi+notifikasi+izin+pengumuman. **Tambahan kecil:** F5 (pengumuman guru→ortu kelas). |
| **Fase 5 (Gamifikasi)** | F3 ekonomi poin + 3 lapisan engagement; F2 badge skill dasar; F4 Ruang Ilmu Guru (imbalan **poin**). |
| **Comms ext.** | F1 Open Class + sesi konsultasi tercatat (setelah Fase 2 inti). |
| **Fase 7 (Alumni & Karier)** | F2 "mekar" → profil publik / rekrutmen perusahaan (subjek sudah dewasa). |
| **Fase berbadan-hukum / ADR khusus** | F4 tahap-2 (les berbayar uang-nyata) + F2 showcase siswa-aktif (izin ortu). |
| **Modul wellness (dekat Fase 4 AI) + fase kemitraan** | F6 tahap-1 (self-tracker + AI wellness guru); F6 tahap-2 (koneksi dokter via mitra telemedicine berlisensi). |
| **Fase 8 (Analitik) + AI (Fase 4)** | F7 dashboard kepsek: tren kehadiran, papan aktivitas guru, EWS, pemetaan guru↔siswa (AI advisory). |

## 4. ADR baru yang dibutuhkan (sebelum bagian berisiko dibangun)
- **ADR-baru-A — Model monetisasi guru:** poin dulu; uang-nyata hanya via PJP + badan hukum + pemisahan peran.
- **ADR-baru-B — Penempatan & paparan data skill anak:** badge di Box; showcase = alumni / consent ortu; tak pernah jadi produk (perkuat ADR-005 & 13.13).
- **ADR-baru-C — Model komunikasi terang (Open Class/Consult):** semua tercatat & auditable; tak ada kanal tersembunyi (perkuat 13.5).
- **ADR-baru-E — AI advisory untuk evaluasi guru (F7):** AI = decision-support, bukan auto-skor punitif; explainable; kepsek yang memutuskan; transparan ke guru; data internal/agregat (ADR-005).
- **ADR-baru-D — Data kesehatan & wellness AI (F6):** subjek dewasa (guru) saja; consent eksplisit; data kesehatan terenkripsi & **privat dari sekolah**; AI = wellness bukan diagnosis (disclaimer); koneksi dokter hanya via mitra telemedicine **berlisensi** (Permenkes). Data kesehatan siswa = TIDAK dalam scope (anak + kesehatan = langkah hukum jauh lebih berat).

## 5. Keputusan
**Terkunci (owner, 2026-06-19):**
- Konsultasi = **Open Class + tercatat**; chat privat-gelap **dibuang**. UI dibuat menyenangkan.
- Imbalan guru = **mulai dari poin** (uang-nyata menyusul setelah badan hukum).
- Showcase siswa = **mulai dari alumni** (versi siswa-aktif + izin ortu menyusul).
- Pengumuman: **wali kelas boleh ke ortu kelasnya** (penyesuaian 12A.4).

**Terbuka / menunggu:**
- Detail mitra reward (Fore/Tomorow dll) & kurs poin.
- Kapan & bagaimana naik ke uang-nyata (perlu badan hukum + PJP).
- Apakah versi showcase siswa-aktif diaktifkan (butuh desain consent ortu).
- F6 kesehatan guru: lingkup tahap-1 (wellness self-track) & pilihan mitra telemedicine untuk tahap-2.

## 6. Catatan hukum (WAJIB sebelum bagian uang & paparan-anak)
PDP/PSE: data anak = kategori khusus; profil/paparan minor butuh **consent wali**; konsultasi
emosional = data sensitif. Pembayaran ke guru = **PJP + pajak + perlindungan konsumen**.
**Data kesehatan guru (F6) = kategori khusus PDP** + koneksi dokter tunduk **Permenkes telemedicine**
(dokter ber-STR/SIP, tanggung jawab medis) → tempuh lewat **mitra berlisensi**, bukan bangun sendiri.
Setiap item ini memicu guardrail 13.13 ("berhenti → ADR + kajian hukum + persetujuan owner").

---
*Cara pakai: owner menambah/mengubah fitur di sini secara berkala. Saat sebuah fitur matang &
disetujui (dan lolos kajian hukum bila perlu), arsitek menariknya menjadi adendum `aplikasi.md`
+ ADR, lalu masuk antrean fase yang sesuai. Dokumen ini = ruang rancang, bukan konstitusi.*
