"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileWarning, KeyRound } from "lucide-react";
import type { ImportJobStatusResponse } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startImportAction, importStatusAction } from "@/app/school/actions";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ImportPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportJobStatusResponse | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setJobId(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const start = await startImportAction(fd);
    if (!start.ok) {
      setError(start.error);
      setBusy(false);
      return;
    }
    setJobId(start.data.jobId);
    // Pantau progres sampai selesai/gagal.
    for (let i = 0; i < 600; i++) {
      await sleep(1500);
      const st = await importStatusAction(start.data.jobId);
      if (!st.ok) {
        setError(st.error);
        break;
      }
      setStatus(st.data);
      if (st.data.status === "COMPLETED" || st.data.status === "FAILED") break;
    }
    setBusy(false);
    router.refresh();
  }

  const pct = status && status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impor Siswa (XLSX)</CardTitle>
        <CardDescription>Unggah daftar siswa (kolom NIS, Nama, Kelas). NIS otomatis disamarkan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
          />
          <Button type="submit" disabled={busy}>
            <Upload className="h-4 w-4" /> {busy ? "Memproses…" : "Impor"}
          </Button>
        </form>

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

        {status && (
          <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${status.status === "FAILED" ? "bg-destructive" : "bg-secondary"}`}
                style={{ width: `${status.status === "COMPLETED" ? 100 : pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>Status: <b>{status.status}</b></span>
              <span>Total: {status.total}</span>
              <span className="text-secondary">Berhasil: {status.succeeded}</span>
              <span>Baru: {status.created}</span>
              <span className="text-destructive">Gagal: {status.failed}</span>
            </div>
            {status.message && <p className="text-sm text-destructive">{status.message}</p>}
            <div className="flex flex-wrap gap-2">
              {status.errorReportUrl && jobId && (
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/school/import/${jobId}/errors.csv`}>
                    <FileWarning className="h-4 w-4" /> Unduh Laporan Error
                  </a>
                </Button>
              )}
              {status.credentialsReportUrl && jobId && (
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/school/import/${jobId}/credentials.csv`}>
                    <KeyRound className="h-4 w-4" /> Unduh Kredensial (sekali)
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
