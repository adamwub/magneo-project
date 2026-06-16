import type { School } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { NewSchoolWizard } from "@/components/hq/new-school-wizard";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-secondary/10 text-secondary",
  ONBOARDING: "bg-accent/15 text-accent-foreground",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

async function getSchools(): Promise<{ schools: School[]; error?: string }> {
  const res = await apiFetch("/hq/schools");
  if (!res.ok) return { schools: [], error: `Gagal memuat daftar sekolah (${res.status}).` };
  return { schools: (await res.json()) as School[] };
}

export default async function HqHomePage() {
  const { schools, error } = await getSchools();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sekolah</h1>
          <p className="text-muted-foreground">Provisioning sekolah, pairing Box & akun admin.</p>
        </div>
        <NewSchoolWizard />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">NPSN</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kota</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada sekolah. Klik “Sekolah Baru” untuk mulai.
                </td>
              </tr>
            ) : (
              schools.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{s.npsn}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.city}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
