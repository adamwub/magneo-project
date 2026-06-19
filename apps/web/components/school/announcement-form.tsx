"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AnnScope } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAnnouncementAction } from "@/app/school/pengumuman/actions";

const SCOPE_OPTS: { value: AnnScope; label: string }[] = [
  { value: "SCHOOL", label: "Seluruh sekolah" },
  { value: "PARENTS", label: "Semua orang tua" },
  { value: "GRADE", label: "Angkatan tertentu" },
];

/** Form buat pengumuman (admin/kepsek). Scope CLASS lewat menu Kelas — di sini sekolah/ortu/angkatan. */
export function AnnouncementForm() {
  const router = useRouter();
  const [scope, setScope] = useState<AnnScope>("SCHOOL");
  const [grades, setGrades] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const scopeIds = scope === "GRADE" ? grades.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const res = await createAnnouncementAction({ scope, scopeIds, title, body });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTitle("");
    setBody("");
    setGrades("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Sasaran</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as AnnScope)}
            className="clay-input h-11 w-full px-4 text-sm text-foreground"
          >
            {SCOPE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {scope === "GRADE" && (
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Angkatan (pisah koma)</span>
            <Input value={grades} onChange={(e) => setGrades(e.target.value)} placeholder="10, 11" />
          </label>
        )}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Judul</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Isi pengumuman</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          className="clay-input w-full px-4 py-3 text-sm text-foreground"
        />
      </label>
      {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !title.trim() || !body.trim()}>
        {loading ? "Mengirim…" : "Kirim Pengumuman"}
      </Button>
    </form>
  );
}
