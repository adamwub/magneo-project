# ✅ CHECKLIST AUTOPILOT MAGNOO

> Papan ringkas untuk owner. Diperbarui robot tiap selesai satu potongan.
> Detail lengkap tetap di `docs/progress.md`. Status terkini juga bisa ditanya
> ke bot Telegram dengan ketik **status**.

**Mode:** Otonom (lapor saja) · **Target:** Fase 2 → dst · **Mulai:** 2026-06-19

-----

## Sedang dikerjakan
- **Fase 2** (mode otonom). Berikutnya: **2g-2/2h** — kirim push beneran (BUTUH akun Firebase/FCM dari owner).

## Selesai (terbaru di atas)
- **2026-06-19** — Fase 2 **2g-1**: daftar HP ortu/siswa untuk notifikasi (token aman, diikat akun). Kirim push beneran nunggu akun Firebase. 142 tes api lulus. ✅
- **2026-06-19** — Fase 2 **2f**: laporan kehadiran — siswa lihat rekapnya, wali kelas lihat kelasnya, kepsek/admin lihat ringkasan sekolah (tanpa nama anak, sesuai aturan privasi). 139 tes api lulus. ✅
- **2026-06-19** — Fase 2 **2e**: status kehadiran harian otomatis (hadir/telat/izin/sakit/alpa) + koreksi oleh wali kelas/admin (≤3 hari, tercatat audit). 136 tes api lulus. ✅
- **2026-06-19** — Fase 2 **2d**: siswa absen scan QR (`POST /attendance/qr/checkin`) — cek token+lokasi(GPS/WiFi)+anti-dobel+anti-replay, status hadir/telat dari jam sekolah. 122 tes api lulus. ✅
- **2026-06-19** — Fase 2 **2c**: token QR aman — tiap sekolah punya kunci rahasia tersimpan terenkripsi, layar gerbang tampilkan token 8-digit ganti tiap 30 dtk. (Audit security: aman.) ✅
- **2026-06-19** — Fase 2 **2b**: cek lokasi absen (GPS radius sekolah ATAU WiFi sekolah). Security nahan 1 bug (IP bisa dipalsukan) → sudah kufix. ✅
- **2026-06-19** — Fase 2 **2a**: pondasi data (token HP ortu, kode error, skema izin/pengumuman). ✅
- **2026-06-19** — Rebrand **Magnoo → Magneo** (teks brand) + backup ke GitHub (via SSH). ✅
- **2026-06-19** — Tambah 3 agen mutu: `magnoo-security` (auditor keamanan/guardrail), `magnoo-tester` (test engineer), `magnoo-simplifier` (ringan & anti-spaghetti). Dijahit ke RUNBOOK. ✅
- **2026-06-19** — Tambal celah Fase 2 → `aplikasi.md` **v1.3** (BAGIAN 12A adendum): 3 BLOCKER + 2 ringan ditambal (lokasi sekolah, DeviceToken FCM, pemutus izin, token QR, state izin). Spec Fase 2 siap dibangun lurus. ✅
- **2026-06-19** — Pasang 3 agen spesialis: `magnoo-architect` (penjaga spec+riset), `magnoo-funcqa` (QA fungsi), `magnoo-visualqa` (QA tema clay×glass). Tema dikunci di `docs/refs/design-system.md`. ✅
- **2026-06-19** — Sinkron Big Blueprint v2 → `aplikasi.md` **v1.2**: tambah Visi 5-lapisan (konteks) + guardrail 13.13 tembok data anak. Fase teknis 0–8 tidak berubah. ✅

## Tertahan / butuh keputusan owner
- _(kosong)_

-----

### Peta fase (sumber: progress.md)
- [x] Fase 0 — Pondasi
- [x] Fase 1 — Akun & pintu masuk
- [ ] **Fase 2 — Absen QR, notifikasi, izin, pengumuman**  ← berikutnya
- [ ] Fase 3 — Magnoo Box & WiFi (butuh hardware)
- [ ] Fase 4 — AI Asisten Guru
- [ ] Fase 5 — Kuis berhadiah & iklan
- [ ] Fase 6 — Absensi wajah (butuh kamera)
- [ ] Fase 7 — Alumni & karier
- [ ] Fase 8 — Analitik & startup center
