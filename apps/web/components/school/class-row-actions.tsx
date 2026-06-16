"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Class } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassFormDialog } from "./class-form-dialog";
import { deleteClassAction } from "@/app/school/actions";

export function ClassRowActions({ klass }: { klass: Class }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setError(null);
    setLoading(true);
    const res = await deleteClassAction(klass.id);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setConfirm(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <ClassFormDialog
        klass={klass}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Ubah kelas">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <Dialog open={confirm} onOpenChange={(o) => { setConfirm(o); if (!o) setError(null); }}>
        <Button variant="ghost" size="icon" aria-label="Hapus kelas" onClick={() => setConfirm(true)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kelas {klass.label}?</DialogTitle>
            <DialogDescription>
              Kelas diarsipkan (riwayat tetap ada). Tidak bisa dihapus bila masih ada siswa aktif.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Batal</Button>
            <Button variant="destructive" onClick={onDelete} disabled={loading}>
              {loading ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
