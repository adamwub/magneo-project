# Design System Magneo — Soft Pastel Claymorphism × Glassmorphism

> **Sumber kebenaran tampilan.** Owner menetapkan palet & aturan ini sebagai tema FINAL
> (19 Jun 2026). Semua UI (web `apps/web`, mobile `apps/mobile`, portal) WAJIB mengikuti.
> **Agen `magnoo-architect` & `magnoo-visualqa` WAJIB memakai dokumen ini sebagai acuan**
> (bukan palet brand lama ink/merah/biru/emas — itu sudah diganti).
>
> Implementasi token web: `apps/web/app/globals.css` (CSS var HSL) + `tailwind.config.ts`.
>
> **REVISI 19 Jun 2026 (owner):** PRIMARY = **POWDER BLUE** (tombol & nav aktif), bukan sage.
> **SAGE GREEN = aksen kecil saja**, jangan dominan. Latar utama = **putih lembut + gradasi soft
> cream** (warm-sand penuh dikurangi). Kartu cream pakai **gradasi** (putih→cream), bukan flat.

## 1. Palet warna

### Base / background
| Token | Hex | Pakai |
|---|---|---|
| warm-sand | `#E9DECB` | background utama (`--background`) |
| soft-cream | `#F5EFE3` | background alternatif / `--muted` |

### Surface
| Token | Hex | Pakai |
|---|---|---|
| cream-surface | `#FBF7EF` | permukaan kartu clay utama (`--card`) |
| pure-white | `#FFFFFF` | highlight / elemen clay menonjol |

### Accent — SAGE GREEN (PRIMARY)
| Token | Hex |
|---|---|
| sage-light | `#C2D6B8` |
| sage-base | `#A7C4A0` |
| sage-deep | `#8AAE82` (`--primary`) |

### Accent — POWDER BLUE (secondary)
`blue-light #C4D8E6` · `blue-base #A2C2D6` (`--secondary`) · `blue-deep #7CA3BC`

### Accent — BLUSH PEACH (secondary)
`peach-light #F8DECB` · `peach-base #F0CBB4` (`--accent`) · `peach-deep #E3B295`

### Accent — SOFT LAVENDER (TERTIARY — tipis-tipis)
`lavender-light #D8CFE0` · `lavender-base #BCAFD0` (`--tertiary`) · `lavender-deep #9C8CB8`
→ HANYA badge, highlight kecil, icon aktif, gradient halus. **JANGAN area besar/background.**

### Teks
`text-primary #44433C` (warm charcoal, `--foreground`) · `text-secondary #8A8779` (`--muted-foreground`) · `text-muted #B5B0A2` (hint/placeholder)

### Semantic (muted, nyatu tema)
`success #88B07A` · `warning #E8C07D` (honey amber) · `error #D89B8C` (terracotta/rose, **bukan merah nyala**) · `info #8FB4CC`
→ Untuk teks angka di atas cream, pakai versi sedikit lebih dalam agar terbaca (mis. hadir `#6E9A63`, telat `#C99A4E`, izin `#6B97B3`, sakit `#C98E6E`, tanpa-kabar `#C77B6B`).

## 2. Clay (claymorphism)
- Sudut membulat chunky: kartu **24px**, tombol/field **20px**.
- **Shadow clay HANGAT** (coklat-krem, JANGAN abu-abu):
  - outer: `rgba(150,130,100,0.22)` offset `0 12px` blur `24px`
  - inner highlight (puff): `rgba(255,255,255,0.70)` di atas
- Kartu = cream-surface, **tanpa border keras** (kedalaman dari bayangan).
- Field input = **clay inset** (cekung), tinggi ≥ **44px**.
- Tombol = clay menonjol; saat ditekan → inset + sedikit turun.

## 3. Glass (glassmorphism)
- `glass-fill rgba(255,255,255,0.45)` + `backdrop-blur 24px`, `glass-border rgba(255,255,255,0.60)`.
- **HANYA untuk layer atas: modal / bottom-sheet / overlay.** BUKAN kartu dasar, BUKAN sidebar/topbar (itu clay cream solid `.clay-panel`).

## 4. Aturan (RULES)
1. Primary = **POWDER BLUE** (tombol & nav aktif). Blush-peach = secondary. **SAGE GREEN = aksen kecil saja (jangan dominan)**. Lavender = tertiary (terbatas).
2. Semua pastel **MUTED** — hindari saturasi tinggi.
3. Shadow clay selalu **nada hangat** (coklat-krem), jangan abu-abu.
4. Glass cuma layer atas (sheet/modal/overlay), bukan kartu dasar.
5. 1 aksi primer per layar; target sentuh ≥ 44×44px (penting: pengguna anak / HP low-end).
6. Font: **Plus Jakarta Sans**.

## 5. Utility web (globals.css)
`.clay-card` (kartu) · `.clay-raised` (tombol) · `.clay-input` (field cekung) · `.clay-panel` (sidebar/topbar solid) · `.glass-overlay` (modal/sheet saja).
