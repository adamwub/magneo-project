# CLAUDE.md — Perintah Tetap untuk Claude Code

> File ini kamu (Claude Code) baca otomatis setiap memulai sesi. Patuhi sepenuhnya. Pemilik proyek BUKAN programmer — jadi jelaskan segala sesuatu dengan bahasa manusia, dan jangan pernah menganggap dia bisa membaca kode untuk memeriksa pekerjaanmu.

-----

## 0. SUMBER KEBENARAN

- **`aplikasi.md` adalah konstitusi proyek ini.** Satu-satunya sumber kebenaran. Bila ada keraguan, isi `aplikasi.md` yang menang.
- **`docs/progress.md` adalah ingatan proyek ini.** Kamu tidak punya ingatan antar-sesi — file inilah ingatanmu. WAJIB dibaca di awal tiap sesi, WAJIB diperbarui setiap selesai mengerjakan sesuatu.
- Jangan pernah membuat dokumen spesifikasi lain yang menyaingi `aplikasi.md`. Satu konstitusi, dikerjakan bab demi bab.

-----

## 1. RITUAL AWAL SESI (lakukan SEBELUM hal lain)

Setiap kali sesi dimulai, sebelum mengerjakan apa pun:

1. Baca `docs/progress.md` dari atas sampai bawah. Pahami: fase apa yang sudah selesai, apa yang sedang dikerjakan, dan utang/catatan yang tertinggal.
1. Baca bagian `aplikasi.md` yang relevan dengan fase yang akan dikerjakan.
1. Sampaikan ringkasan singkat ke pemilik: *“Sesi lalu kita sampai di [X]. Hari ini kita lanjut [Y]. Benar?”* — lalu tunggu konfirmasi.

Jangan langsung menulis kode di awal sesi tanpa ritual ini.

-----

## 2. RITUAL SEBELUM MENULIS KODE (plan mode)

Untuk setiap fase atau potongan pekerjaan baru:

1. **Rencanakan dulu, jangan langsung koding.** Jelaskan dengan bahasa sederhana: apa yang akan kamu bangun, file apa saja yang tersentuh, dan apa yang TIDAK akan kamu sentuh.
1. Tunggu persetujuan eksplisit pemilik (“lanjut” / “oke”) sebelum menulis kode.
1. Kerjakan **sepotong demi sepotong**, bukan seluruh fase sekaligus. Selesaikan satu bagian, buktikan jalan, baru bagian berikutnya.

-----

## 3. RITUAL SETELAH SELESAI (WAJIB — JANGAN PERNAH DILEWATI)

**Setiap kali kamu selesai membuat, mengubah, atau memperbaiki APA PUN — sekecil apa pun — kamu WAJIB:**

1. **Tulis ke `docs/progress.md`** apa yang baru saja kamu lakukan (lihat format di file itu). Ini bukan opsional. Setiap `create file`, setiap perubahan, setiap perbaikan bug — catat. Aturannya: **kalau belum tercatat di progress.md, pekerjaan itu dianggap belum selesai.**
1. **Buktikan ke pemilik bahwa itu jalan** — jangan cuma bilang “selesai”. Jalankan, tunjukkan hasilnya, atau jalankan tesnya dan tunjukkan lulus. Pemilik tidak bisa membaca kode; dia hanya percaya pada bukti yang berjalan.
1. **Commit ke git** dengan pesan jelas (conventional commits, mis. `feat(auth): tambah login siswa`). Commit kecil dan sering. Ini tombol “save” pemilik — pastikan selalu ada titik aman untuk kembali.

Urutan emas tiap potongan pekerjaan: **kerjakan → buktikan jalan → catat di progress.md → commit.**

-----

## 4. DEFINISI “SELESAI” (Definition of Done)

Sebuah fase TIDAK selesai hanya karena “jalan di komputermu”. Fase selesai bila:

- Semua butir Definition of Done untuk fase itu di `aplikasi.md` terpenuhi DAN sudah kamu buktikan satu per satu ke pemilik.
- Tes untuk aturan bisnis (BAGIAN 10 aplikasi.md) sudah ditulis dan lulus.
- Tidak ada item QA berlabel BLOCKER yang gagal.
- `docs/progress.md` sudah diperbarui.
- Semua sudah ter-commit.

Jangan menawarkan untuk lanjut ke fase berikutnya sampai lima hal di atas beres.

-----

## 5. PANTANGAN (jangan dilakukan, walau kelihatannya membantu)

- ❌ Jangan loncat fase. Kerjakan hanya fase yang diminta, urut sesuai BAGIAN 12 aplikasi.md.
- ❌ Jangan membangun fitur yang tidak diminta / tidak ada di fase saat ini. Punya ide bagus? Catat di bagian “Ide & Utang” di progress.md, jangan dikerjakan sekarang.
- ❌ Jangan mengubah keputusan arsitektur (8 ADR di aplikasi.md) tanpa persetujuan eksplisit pemilik. Kalau kamu merasa ada cara lebih baik, sampaikan sebagai usulan dan TUNGGU keputusan — jangan langsung kerjakan.
- ❌ Jangan melanggar 12 guardrail di BAGIAN 13 aplikasi.md (perlindungan data anak, dll). Ini garis mati.
- ❌ Jangan menambal di atas yang rusak. Kalau ada yang salah, sampaikan, dan tawarkan kembali ke commit terakhir yang sehat — jangan menumpuk perbaikan di atas fondasi yang sudah goyah.
- ❌ Jangan menyimpan rahasia (password, kunci API) di dalam kode. Selalu lewat file env.

-----

## 6. KALAU RAGU — BERHENTI DAN TANYA

Untuk apa pun yang menyentuh **data anak, uang/poin, keamanan, atau guardrail BAGIAN 13**: bila ada keraguan sekecil apa pun, **berhenti dan tanya pemilik.** Jangan berasumsi.

Untuk hal kosmetik (warna, susunan kata, tata letak): ambil keputusan wajar sendiri, lalu catat di progress.md.

-----

## 7. CARA BICARA KE PEMILIK

- Bahasa Indonesia, sederhana, tanpa jargon. Kalau terpaksa pakai istilah teknis, jelaskan sekali dengan analogi.
- Jujur kalau ada yang gagal, meleset, atau kamu tidak yakin. Pemilik lebih menghargai kejujuran daripada laporan “semua lancar” yang ternyata tidak.
- Saat membuktikan sesuatu jalan, tunjukkan bukti nyata (output, layar, tes lulus) — bukan sekadar klaim.
- Identitas visual aplikasi: ink `#10243A`, magnet merah `#E4391F`, biru `#1656C9`, emas `#F2A91C`, latar `#F7F9FB`; font Plus Jakarta Sans.

-----

## 8. BAHASA KODE

- Kode, komentar teknis, dan pesan commit: bahasa Inggris.
- Semua teks yang dilihat pengguna aplikasi (tombol, pesan): bahasa Indonesia, lewat file lokalisasi — tidak ditulis langsung di kode.

-----

*Ringkasnya, tiga hal yang tidak boleh kamu lupakan seumur proyek ini: (1) baca progress.md di awal, (2) rencanakan sebelum koding, (3) setiap selesai apa pun — catat di progress.md, buktikan jalan, commit. Tiga itu yang menjaga proyek ini tidak jadi benang kusut.*