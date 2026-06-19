/**
 * Konversi waktu server (UTC) → waktu lokal sekolah (BAGIAN 10.2 / 12A.1 baris 1034).
 * `date` & status PRESENT/LATE dihitung dari `occurredAt` dikonversi ke `School.timezone`.
 * Memakai Intl (ICU) — tanpa dependency tambahan.
 */

export interface SchoolLocalTime {
  /** Tanggal sekolah "YYYY-MM-DD". */
  date: string;
  /** Jam lokal "HH:MM" (24 jam, zero-padded) — untuk bandingkan dengan cutoff. */
  hhmm: string;
}

/** Pecah `at` menjadi tanggal + jam lokal pada timezone IANA `tz` (mis. "Asia/Jakarta"). */
export function schoolLocalTime(at: Date, tz: string): SchoolLocalTime {
  // en-CA → komponen tanggal numerik (YYYY-MM-DD); hour12:false → "00".."23".
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  // Intl bisa mengembalikan "24" untuk tengah malam pada sebagian runtime → normalkan ke "00".
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hhmm: `${hour}:${get("minute")}`,
  };
}

/**
 * Status kehadiran berdasarkan jam check-in lokal vs `lateCutoff` ("HH:MM").
 * Tepat di/atau sebelum cutoff = PRESENT; setelahnya = LATE (BAGIAN 10.2).
 * Perbandingan string aman karena HH:MM zero-padded.
 */
export function presentOrLate(localHHMM: string, lateCutoff: string): "PRESENT" | "LATE" {
  return localHHMM <= lateCutoff ? "PRESENT" : "LATE";
}

/**
 * Selisih hari antara dua tanggal sekolah "YYYY-MM-DD" (b - a), bilangan bulat.
 * Dipakai cek jendela koreksi ≤ H+3 (BAGIAN 10.4). Tanggal diperlakukan sebagai UTC
 * tengah malam → bebas DST/timezone (kedua sisi sama-sama tanggal sekolah).
 */
export function daysBetweenSchoolDates(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  return Math.round((tb - ta) / 86_400_000);
}
