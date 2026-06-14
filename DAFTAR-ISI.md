# 🗂️ DAFTAR ISI — Semua Dokumen Magnoo

> Peta seluruh dokumen Magnoo: file apa, untuk siapa, dipakai kapan, dan ditaruh di folder mana.
> 
> **Dokumen ini juga bisa dipakai sebagai perintah penataan.** Lihat bagian “Cara merapikan otomatis” di bawah.
> 
> **PENTING:** folder `magnoo-project/` (tempat coding) JANGAN diutak-atik isinya — tiga file di dalamnya sedang dipakai membangun aplikasi. Semua dokumen manusia ditata di folder-folder TERPISAH di sebelahnya.

-----

## 🏗️ STRUKTUR FOLDER YANG DIINGINKAN

```
Magnoo/                                  ← folder besar pembungkus semuanya
│
├── magnoo-project/                      ← 🔒 FOLDER CODING — JANGAN DIUBAH
│   ├── CLAUDE.md                            (surat perintah Claude Code)
│   ├── aplikasi.md                          (konstitusi/spek teknis)
│   └── docs/
│       └── progress.md                      (buku harian proyek)
│
├── 00-Daftar-Isi/
│   └── DAFTAR-ISI.md                        (file ini)
│
├── 01-Strategi/                         ← untuk diskusi tim & investor
│   ├── magnoo-master-blueprint.html         (ringkasan besar 10 divisi — BACA INI DULU)
│   ├── magnoo-blueprint-final.html          (konsep lengkap)
│   ├── magnoo-teknis.html                   (cara kerja + 8 keputusan kunci)
│   ├── magnoo-prd.html                      (spesifikasi pembangunan)
│   ├── magnoo-fitur-per-pengguna.html       (nilai per pengguna + jujur kekurangannya)
│   ├── magnoo-sales-playbook.html           (psikologi & rencana jualan)
│   ├── magnoo-jualan-sekolah.html           (bank keberatan + integritas lapangan)
│   ├── magnoo-paket-mitra.html              (keuntungan & paket mitra)
│   └── magnoo-persiapan-realisasi.html      (checklist realisasi + hardware)
│
├── 02-Legal/                            ← untuk konsultan hukum & arsip
│   ├── magnoo-legal-pse-tnc-privasi.md      (PSE Komdigi, T&C, kebijakan privasi)
│   ├── magnoo-paket-perjanjian.md           (NDA bisnis, kontrak developer, perjanjian pendiri)
│   ├── magnoo-kebijakan-internal.md         (pedoman iklan, keluhan publik, anti-gratifikasi)
│   └── magnoo-dokumen-operasional.md        (BAST, SOP insiden data, pemusnahan data)
│
├── 03-Sekolah/                          ← untuk tim sales & onboarding sekolah
│   ├── magnoo-dokumen-sekolah.md            (Piagam, MoU, formulir izin ortu, surat pengantar)
│   ├── magnoo-brosur-sekolah.html           (brosur 1 lembar siap cetak A4)
│   └── magnoo-sop-pendampingan-90hari.md    (panduan tim sukses dampingi sekolah baru)
│
├── 04-Mitra-Komersial/                  ← untuk ketemu kampus, perusahaan, sponsor, developer
│   ├── magnoo-company-profile.html          (profil 4 halaman untuk mitra)
│   ├── magnoo-dokumen-komersial.md          (RFP developer, LOI kampus, pakta integritas)
│   └── magnoo-kontrak-sponsorship.md        (kontrak mitra, proposal sponsorship, invoice)
│
└── 05-Keuangan/                         ← untuk keputusan modal & bicara investor
    └── magnoo-model-keuangan.xlsx           (model keuangan hidup — geser asumsi, lihat dampak)
```

-----

## 📌 SETIAP DOKUMEN: UNTUK SIAPA & DIPAKAI KAPAN

### 🔒 Folder coding (magnoo-project/) — JANGAN DIUBAH

|File            |Untuk      |Kapan dipakai                    |
|----------------|-----------|---------------------------------|
|CLAUDE.md       |Claude Code|Otomatis dibaca tiap sesi coding |
|aplikasi.md     |Claude Code|Konstitusi pembangunan aplikasi  |
|docs/progress.md|Claude Code|Buku harian, diperbarui tiap sesi|

### 01 — Strategi

|File               |Untuk                      |Kapan dipakai                                 |
|-------------------|---------------------------|----------------------------------------------|
|master-blueprint   |Tim, investor, diri sendiri|Pintu masuk — baca ini dulu sebelum yang lain |
|blueprint-final    |Tim, investor              |Memahami konsep utuh                          |
|teknis             |Tim teknis, investor       |Memahami cara kerja & keputusan kunci         |
|prd                |Developer (referensi)      |Bahan diskusi awal dengan developer           |
|fitur-per-pengguna |Tim, sales                 |Memahami nilai & kekurangan tiap pengguna     |
|sales-playbook     |Tim sales                  |Pegangan utama berjualan                      |
|jualan-sekolah     |Tim sales                  |Saat menghadapi keberatan & godaan di lapangan|
|paket-mitra        |Tim sales                  |Saat menyiapkan penawaran ke mitra            |
|persiapan-realisasi|Founder, teknisi           |Checklist sebelum & saat mulai jalan          |

### 02 — Legal

|File                 |Untuk                   |Kapan dipakai                                        |
|---------------------|------------------------|-----------------------------------------------------|
|legal-pse-tnc-privasi|Konsultan hukum, founder|Daftar PSE + tayangkan T&C/privasi di website        |
|paket-perjanjian     |Notaris, hukum          |Sebelum gandeng investor/developer/pendiri           |
|kebijakan-internal   |Seluruh tim             |Aturan rumah: iklan, keluhan publik, anti-gratifikasi|
|dokumen-operasional  |Teknisi, founder        |Saat pasang alat (BAST) & jika ada insiden data      |

### 03 — Sekolah

|File                   |Untuk         |Kapan dipakai                          |
|-----------------------|--------------|---------------------------------------|
|dokumen-sekolah        |Sales, sekolah|Saat MoU + sebar izin ke orang tua     |
|brosur-sekolah         |Sales         |Dibawa & dicetak saat kunjungan pertama|
|sop-pendampingan-90hari|Tim sukses    |Saat mendampingi sekolah baru 90 hari  |

### 04 — Mitra-Komersial

|File               |Untuk         |Kapan dipakai                               |
|-------------------|--------------|--------------------------------------------|
|company-profile    |Sales         |Dibawa saat ketemu kampus/perusahaan/sponsor|
|dokumen-komersial  |Founder, sales|RFP ke developer + LOI ke kampus            |
|kontrak-sponsorship|Founder, sales|Saat mitra deal + jalur sponsorship resmi   |

### 05 — Keuangan

|File               |Untuk            |Kapan dipakai                              |
|-------------------|-----------------|-------------------------------------------|
|model-keuangan.xlsx|Founder, investor|Sebelum keluar modal & saat bicara investor|

-----

## 🤖 CARA MERAPIKAN OTOMATIS (perintah untuk Claude Code / terminal)

Kalau semua file masih bercampur dalam satu tempat, kamu bisa minta Claude Code merapikannya. Beri perintah seperti ini:

> “Baca DAFTAR-ISI.md. Tolong rapikan semua file dokumen ke dalam folder-folder sesuai bagian ‘STRUKTUR FOLDER YANG DIINGINKAN’.
> 
> ATURAN PENTING:
> 
> 1. JANGAN sentuh, pindah, atau ubah folder `magnoo-project/` beserta isinya (CLAUDE.md, aplikasi.md, docs/progress.md) — itu sedang dipakai coding.
> 1. Buat folder 00 sampai 05 sesuai daftar, lalu pindahkan tiap file dokumen (.md, .html, .xlsx) ke folder yang benar sesuai daftar isi.
> 1. File DAFTAR-ISI.md ini masuk ke folder 00-Daftar-Isi/.
> 1. Setelah selesai, tunjukkan struktur akhirnya ke saya, dan konfirmasi bahwa folder magnoo-project/ tidak tersentuh.”

Claude Code akan memindahkan file-filenya ke tempat masing-masing, sementara folder coding tetap aman.

-----

## ✅ RINGKASAN SEDERHANA

- **Folder coding (`magnoo-project/`)** = isinya 3 file, dikunci, jangan diubah.
- **Folder 01–05** = semua dokumen manusia, ditata per kegunaan.
- **Folder 00** = daftar isi ini, petaannya.

Kapan pun bingung “file ini untuk apa?”, buka daftar isi ini. Kapan pun mau ketemu kampus → buka folder 04. Ke notaris → folder 02. Ke sekolah → folder 03. Mau lihat angka → folder 05. Tidak akan pernah tercampur lagi.