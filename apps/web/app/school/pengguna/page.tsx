import type { Class } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";
import { ImportPanel } from "@/components/school/import-panel";
import { InvitePanel } from "@/components/school/invite-panel";

export const dynamic = "force-dynamic";

async function getClasses(): Promise<Class[]> {
  const res = await apiFetch("/school/classes");
  if (!res.ok) return [];
  return (await res.json()) as Class[];
}

export default async function PenggunaPage() {
  const classes = await getClasses();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengguna</h1>
        <p className="text-muted-foreground">Impor siswa & kelola kode undangan orang tua.</p>
      </div>
      <ImportPanel />
      <InvitePanel classes={classes.map((c) => ({ id: c.id, label: c.label }))} />
    </div>
  );
}
