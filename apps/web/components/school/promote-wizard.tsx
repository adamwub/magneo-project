"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle } from "lucide-react";
import type { ClassPromoteResult } from "@magnoo/shared";
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
import { promoteAction } from "@/app/school/actions";

export function PromoteWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<ClassPromoteResult | null>(null);
  const [done, setDone] = useState<ClassPromoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setFrom(""); setTo(""); setPreview(null); setDone(null); setError(null); setLoading(false);
  }

  async function run(dryRun: boolean) {
    setError(null);
    setLoading(true);
    const res = await promoteAction({ fromAcademicYear: from, toAcademicYear: to, dryRun });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    if (dryRun) setPreview(res.data);
    else { setDone(res.data); router.refresh(); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <ArrowUpCircle className="h-4 w-4" /> Kenaikan Kelas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Wizard Kenaikan Kelas</DialogTitle>
          <DialogDescription>
            Pratinjau dulu (tanpa mengubah apa pun), lalu konfirmasi. Kelas 12 ditandai lulus &
            diarsipkan (transisi alumni = job otomatis Fase 7).
          </DialogDescription>
        </DialogHeader>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

        {done ? (
          <div className="space-y-3">
            <p className="rounded-md bg-secondary/10 px-3 py-2 text-sm text-secondary">Kenaikan kelas selesai.</p>
            <ul className="text-sm">
              <li>Kelas baru dibuat: <b>{done.classesCreated}</b></li>
              <li>Siswa naik kelas: <b>{done.studentsPromoted}</b></li>
              <li>Siswa lulus (kelas 12): <b>{done.studentsGraduating}</b></li>
            </ul>
            <DialogFooter><Button onClick={() => setOpen(false)}>Tutup</Button></DialogFooter>
          </div>
        ) : !preview ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="from">Dari Tahun Ajaran</Label>
                <Input id="from" placeholder="2026/2027" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to">Ke Tahun Ajaran</Label>
                <Input id="to" placeholder="2027/2028" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => run(true)} disabled={loading || !from || !to}>
                {loading ? "Memuat…" : "Pratinjau"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Kelas Asal</th>
                    <th className="px-3 py-2 font-medium">Tingkat</th>
                    <th className="px-3 py-2 font-medium">Siswa</th>
                    <th className="px-3 py-2 font-medium">Tujuan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.plan.map((row) => (
                    <tr key={row.fromClassId} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.fromLabel}</td>
                      <td className="px-3 py-2">{row.fromGrade}</td>
                      <td className="px-3 py-2">{row.studentCount}</td>
                      <td className="px-3 py-2">
                        {row.graduating ? (
                          <span className="text-accent-foreground">Lulus (arsip)</span>
                        ) : (
                          <span>Naik ke kelas {row.toGrade}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {preview.plan.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Tak ada kelas pada tahun ajaran itu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>Kembali</Button>
              <Button onClick={() => run(false)} disabled={loading || preview.plan.length === 0}>
                {loading ? "Memproses…" : "Konfirmasi Kenaikan"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
