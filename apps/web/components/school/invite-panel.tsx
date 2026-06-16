"use client";

import { useState } from "react";
import { Ticket, FileDown } from "lucide-react";
import type { Class, InviteCodeBatchResponse } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateInvitesAction } from "@/app/school/actions";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function InvitePanel({ classes }: { classes: Pick<Class, "id" | "label">[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [result, setResult] = useState<InviteCodeBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!classId) return;
    setError(null);
    setLoading(true);
    const res = await generateInvitesAction({ classId });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setResult(res.data);
  }

  const batchId = result?.batchPdfUrl?.split("/").pop();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kode Undangan Ortu</CardTitle>
        <CardDescription>Buat kode per kelas + PDF kartu (berisi QR) untuk dibagikan ke orang tua.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kelas. Buat kelas dulu di menu “Kelas”.</p>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="inviteClass">Kelas</Label>
              <select
                id="inviteClass"
                className={SELECT_CLASS}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={generate} disabled={loading}>
              <Ticket className="h-4 w-4" /> {loading ? "Membuat…" : "Generate Kode"}
            </Button>
          </div>
        )}

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

        {result && batchId && (
          <div className="flex items-center justify-between rounded-md bg-secondary/10 px-3 py-2 text-sm">
            <span><b>{result.codes.length}</b> kode dibuat.</span>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/school/invite/${batchId}`}>
                <FileDown className="h-4 w-4" /> Unduh PDF
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
