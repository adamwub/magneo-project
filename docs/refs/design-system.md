# MAGNOO — Design System: Claymorphism × Glassmorphism
> Rujukan TEMA resmi (keputusan pemilik 2026-06-19). Memperluas identitas visual di `CLAUDE.md §7` / `aplikasi.md`.
> Dipakai oleh: pembangun UI (mandor-bot) sebagai acuan, dan **agen visual-QA** sebagai kriteria penilaian OBJEKTIF.

## 1. Warna brand (tetap)
- Ink `#10243A` (teks utama / dasar gelap)
- Magnet merah `#E4391F` (aksi utama / brand)
- Biru `#1656C9` (sekunder / tautan)
- Emas `#F2A91C` (aksen / sorot)
- Paper `#F7F9FB` (latar terang)
- Font: **Plus Jakarta Sans** (semua bobot via file lokal).

## 2. Bahasa visual: kapan Clay, kapan Glass
**Claymorphism** = permukaan empuk, "menggembung", tactile. **Glassmorphism** = kaca buram (frosted), tembus pandang, melayang.

| Elemen | Gaya | Alasan |
|---|---|---|
| Tombol primer/sekunder | **Clay** | terasa bisa "dipencet", afford tinggi |
| Card konten, tile statistik | **Clay** | blok empuk, ramah, mudah dipindai |
| Pills / chip / badge / toggle | **Clay** (kecil) | bulat penuh, empuk |
| Top bar, bottom nav, sidebar | **Glass** | melayang di atas konten, ringan |
| Modal / dialog / sheet / dropdown | **Glass** | overlay di atas isi |
| Field input / textbox | **Clay inset** (cekung) | terlihat "tempat mengisi" |
| Latar layar | gradient lembut brand + blob | agar efek glass terlihat |

## 3. Token Clay (kriteria terukur)
- **Radius:** card/tombol/field `1.25rem–2rem` (20–32px); pill `9999px` (full).
- **Bayangan ganda (wajib):** terang dari kiri-atas + gelap dari kanan-bawah.
  - Outset contoh: `box-shadow: -6px -6px 12px rgba(255,255,255,.7), 6px 6px 16px rgba(16,36,58,.18);`
  - Inset (field/aktif): `box-shadow: inset 4px 4px 8px rgba(16,36,58,.15), inset -4px -4px 8px rgba(255,255,255,.7);`
- **Fill:** warna pastel/lembut senada brand (bukan flat tajam). Tombol primer = merah brand dengan highlight lembut, teks putih.
- **Padding chunky:** tombol min `0.75rem 1.25rem`; card `1.25rem–1.5rem`.
- **Tanpa border keras** — kedalaman dari bayangan, bukan garis.

## 4. Token Glass (kriteria terukur)
- **Background:** semi-transparan `rgba(247,249,251,.5–.65)` (atau ink rendah utk dark).
- **Blur:** `backdrop-filter: blur(12–20px)` (+`-webkit-`).
- **Border tipis:** `1px solid rgba(255,255,255,.35–.5)`.
- **Bayangan halus:** `0 8px 32px rgba(16,36,58,.15)`.
- **Wajib ada konten/gradient di belakang** agar blur terlihat (jangan glass di atas putih polos).

## 5. Proporsi & konsistensi (yang dinilai visual-QA)
- Skala spasi 4px (4/8/12/16/24/32). Ritme konsisten antar komponen.
- Radius konsisten per kelas komponen (semua card sama, semua pill full).
- Kontras teks ≥ WCAG AA (4.5:1 teks normal). Clay pastel jangan sampai teks pudar.
- Hierarki: 1 aksi primer per layar (merah clay); sekunder lebih kalem.
- Target sentuh ≥ 44×44px (HP low-end, banyak pengguna anak).
- Ikon & sudut seragam; tidak campur radius tajam & empuk dalam satu grup.

## 6. Kriteria LULUS untuk agen visual-QA
Sebuah layar LULUS bila: (1) tombol/card/pill/field memakai token Clay sesuai §3; (2) bar/modal/overlay memakai token Glass sesuai §4; (3) warna sesuai palet §1; (4) proporsi/spasi/kontras §5 terpenuhi; (5) konsisten antar elemen sejenis. Laporkan per-elemen: PASS / kurang (sebutkan token mana meleset + saran angka).
