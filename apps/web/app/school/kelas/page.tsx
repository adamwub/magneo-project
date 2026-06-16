import { Plus } from "lucide-react";
import type { Class } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClassFormDialog } from "@/components/school/class-form-dialog";
import { ClassRowActions } from "@/components/school/class-row-actions";
import { PromoteWizard } from "@/components/school/promote-wizard";

export const dynamic = "force-dynamic";

async function getClasses(): Promise<{ classes: Class[]; error?: string }> {
  const res = await apiFetch("/school/classes");
  if (!res.ok) return { classes: [], error: `Gagal memuat kelas (${res.status}).` };
  return { classes: (await res.json()) as Class[] };
}

export default async function KelasPage() {
  const { classes, error } = await getClasses();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelas</h1>
          <p className="text-muted-foreground">Kelola kelas & kenaikan kelas per tahun ajaran.</p>
        </div>
        <div className="flex gap-2">
          <PromoteWizard />
          <ClassFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Kelas Baru
              </Button>
            }
          />
        </div>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Tingkat</th>
              <th className="px-4 py-3 font-medium">Jurusan</th>
              <th className="px-4 py-3 font-medium">Tahun Ajaran</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Belum ada kelas. Klik “Kelas Baru”.
                </td>
              </tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{c.label}</td>
                  <td className="px-4 py-3">{c.grade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.major ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.academicYear}</td>
                  <td className="px-4 py-3"><ClassRowActions klass={c} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
