/**
 * Konstanta bersama. Sumber: BAGIAN 8.1 (konvensi API) & 10.1 (default settings sekolah).
 * Nilai default sekolah BISA di-override per sekolah (disimpan di School.settings).
 */

/** Pagination cursor — BAGIAN 8.1 */
export const PAGINATION = {
  defaultLimit: 25,
  maxLimit: 100,
} as const;

/** Default setelan sekolah — BAGIAN 10.1 (semua configurable per sekolah). */
export const SCHOOL_SETTING_DEFAULTS = {
  jam_masuk: "07:00",
  late_cutoff: "07:15",
  absent_cutoff: "09:00",
  jam_pulang: "15:30",
  wifi_hours: "06:00-17:00",
  // BAGIAN 12A.1 (adendum mengikat v1.3) memperketat default radius 300→150 m anti-curang;
  // menang atas 10.1 (=300). Tetap bisa di-override per sekolah.
  qr_geo_radius_m: 150,
  student_wifi_mbps: 5,
  tutor_daily_quota: 30,
  teacher_gen_daily_quota: 20,
} as const;

/** Prefix versi API — BAGIAN 8.1 */
export const API_PREFIX = "/api/v1";
