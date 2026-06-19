import type { Announcement } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/school/announcement-form";
import { RetractButton } from "@/components/school/announcement-retract";

export const dynamic = "force-dynamic";

const RETRACT_WINDOW_MS = 15 * 60 * 1000;

const SCOPE_LABEL: Record<string, string> = {
  SCHOOL: "Seluruh sekolah",
  PARENTS: "Semua orang tua",
  GRADE: "Angkatan",
  CLASS: "Kelas",
};

async function getAnnouncements(): Promise<{ items: Announcement[]; error?: string }> {
  const res = await apiFetch("/announcements");
  if (!res.ok) {
    if (res.status === 403) return { items: [], error: "Halaman ini untuk Admin Sekolah / Kepala Sekolah." };
    return { items: [], error: `Gagal memuat pengumuman (${res.status}).` };
  }
  return { items: (await res.json()) as Announcement[] };
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PengumumanPage() {
  const { items, error } = await getAnnouncements();
  const nowMs = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengumuman</h1>
        <p className="text-muted-foreground">Kirim pengumuman ke sekolah, angkatan, atau orang tua. Bisa ditarik dalam 15 menit.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengumuman Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        {items.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
        )}
        {items.map((a) => {
          const retractable = !a.retractedAt && nowMs - new Date(a.publishedAt).getTime() <= RETRACT_WINDOW_MS;
          return (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-secondary/40 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {SCOPE_LABEL[a.scope] ?? a.scope}
                      {a.scope === "GRADE" && a.scopeIds.length > 0 ? ` ${a.scopeIds.join(", ")}` : ""}
                    </span>
                    <CardTitle className="mt-2 text-lg">{a.title}</CardTitle>
                  </div>
                  {a.retractedAt ? (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Ditarik</span>
                  ) : retractable ? (
                    <RetractButton id={a.id} />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="whitespace-pre-wrap text-sm text-foreground">{a.body}</p>
                <p className="text-xs text-muted-foreground">{formatWaktu(a.publishedAt)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
