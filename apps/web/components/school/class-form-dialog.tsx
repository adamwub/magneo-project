"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Class } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClassAction, updateClassAction } from "@/app/school/actions";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ClassFormDialog({ trigger, klass }: { trigger: ReactNode; klass?: Class }) {
  const router = useRouter();
  const isEdit = !!klass;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const dto = {
      academicYear: String(f.get("academicYear") ?? ""),
      grade: Number(f.get("grade")),
      label: String(f.get("label") ?? ""),
      major: (f.get("major") as string) || undefined,
    };
    const res = isEdit ? await updateClassAction(klass.id, dto) : await createClassAction(dto);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Kelas" : "Kelas Baru"}</DialogTitle>
          <DialogDescription>Data kelas untuk satu tahun ajaran.</DialogDescription>
        </DialogHeader>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="academicYear">Tahun Ajaran</Label>
            <Input id="academicYear" name="academicYear" placeholder="2026/2027" defaultValue={klass?.academicYear} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="grade">Tingkat</Label>
              <select id="grade" name="grade" className={SELECT_CLASS} defaultValue={klass?.grade ?? 10}>
                <option value={10}>10</option>
                <option value={11}>11</option>
                <option value={12}>12</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="major">Jurusan (opsional)</Label>
              <Input id="major" name="major" placeholder="IPA / TKJ" defaultValue={klass?.major ?? ""} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="label">Label Kelas</Label>
            <Input id="label" name="label" placeholder="X-IPA-1" defaultValue={klass?.label} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan…" : isEdit ? "Simpan" : "Buat Kelas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
