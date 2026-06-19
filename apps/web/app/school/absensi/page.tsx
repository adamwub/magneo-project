import type { SchoolAttendanceSummary } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

/** Tanggal "hari ini" zona Asia/Jakarta (YYYY-MM-DD) sebagai default. */
function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

async function getSummary(date: string): Promise<{ summary?: SchoolAttendanceSummary; error?: string }> {
  const res = await apiFetch(`/attendance/school/summary?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    if (res.status === 403) return { error: "Halaman ini untuk Kepala Sekolah / Admin Sekolah." };
    return { error: `Gagal memuat ringkasan absensi (${res.status}).` };
  }
  return { summary: (await res.json()) as SchoolAttendanceSummary };
}

/** Meta tampilan tiap status: label Indonesia + warna aksen brand. */
const STATUS_META: { key: keyof SchoolAttendanceSummary["counts"]; label: string; color: string }[] = [
  { key: "PRESENT", label: "Hadir", color: "#1656C9" },
  { key: "LATE", label: "Terlambat", color: "#F2A91C" },
  { key: "PERMIT", label: "Izin", color: "#10243A" },
  { key: "SICK", label: "Sakit", color: "#0E7C7B" },
  { key: "ABSENT_NO_INFO", label: "Tanpa Kabar", color: "#E4391F" },
];

export default async function AbsensiPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const date = typeof searchParams?.date === "string" && searchParams.date ? searchParams.date : todayJakarta();
  const { summary, error } = await getSummary(date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Absensi</h1>
          <p className="text-muted-foreground">Ringkasan kehadiran sekolah per hari.</p>
        </div>
        {/* Pemilih tanggal — form GET native, tanpa JS klien. */}
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Tanggal</span>
            <Input type="date" name="date" defaultValue={date} className="w-auto" />
          </label>
          <Button type="submit">Lihat</Button>
        </form>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {summary && (
        <>
          <Card>
            <CardHeader>
              <CardDescription>Total siswa tercatat — {summary.date}</CardDescription>
              <CardTitle className="text-4xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STATUS_META.map((m) => {
              const value = summary.counts[m.key];
              const pct = summary.total > 0 ? Math.round((value / summary.total) * 100) : 0;
              return (
                <Card key={m.key}>
                  <CardHeader className="pb-2">
                    <CardDescription>{m.label}</CardDescription>
                    <CardTitle className="text-3xl" style={{ color: m.color }}>
                      {value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{pct}% dari total</CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Status dihitung dari check-in QR + izin/sakit yang disetujui. “Tanpa Kabar” = belum check-in dan tanpa izin.
          </p>
        </>
      )}
    </div>
  );
}
