/**
 * Verifikasi lokasi check-in (BAGIAN 10.2 & adendum 12A.1, Fase 2).
 *
 * Aturan OR: check-in LULUS bila salah satu benar —
 *   (a) GPS klien dalam `qr_geo_radius_m` meter dari koordinat sekolah (`geo`), ATAU
 *   (b) IP klien termasuk salah satu `wifi_cidrs` (jaringan WiFi sekolah).
 *
 * File ini HANYA fungsi murni (tanpa I/O) — penegakan di endpoint check-in (potongan 2d).
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Jarak great-circle (Haversine) antara dua titik, dalam meter. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** TRUE bila `point` berada dalam `radiusM` meter dari `center`. */
export function isWithinRadius(center: GeoPoint, point: GeoPoint, radiusM: number): boolean {
  return haversineMeters(center, point) <= radiusM;
}

/**
 * Ubah IPv4 "a.b.c.d" → integer 32-bit unsigned. Mengembalikan null bila bukan IPv4 valid.
 * (IPv6 sengaja tidak didukung di Fase 2 — WiFi sekolah memakai IPv4; lihat 12A.1.)
 */
export function ipv4ToLong(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    acc = (acc << 8) | n;
  }
  return acc >>> 0;
}

/** TRUE bila IPv4 `ip` termasuk dalam blok `cidr` ("a.b.c.d/n"). */
export function ipInCidr(ip: string, cidr: string): boolean {
  const [net, bitsRaw] = cidr.trim().split("/");
  if (bitsRaw === undefined) return false;
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const ipLong = ipv4ToLong(ip);
  const netLong = ipv4ToLong(net);
  if (ipLong === null || netLong === null) return false;
  // /0 cocok dengan semua; hindari shift 32 (perilaku tak terdefinisi di JS).
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipLong & mask) === (netLong & mask);
}

/** TRUE bila `ip` termasuk salah satu CIDR pada daftar. */
export function isIpInAnyCidr(ip: string, cidrs: readonly string[]): boolean {
  return cidrs.some((c) => ipInCidr(ip, c));
}

// Catatan: IP klien untuk penegakan diambil dari `req.ip` (Express, `trust proxy = 1`),
// BUKAN dari parsing header X-Forwarded-For mentah — leftmost-XFF bisa dipalsukan klien
// dan akan membuka bypass validasi WiFi (audit security 2b). Lihat main.ts.
