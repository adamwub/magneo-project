"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { retractAnnouncementAction } from "@/app/school/pengumuman/actions";

/** Tombol "Tarik" pengumuman (≤15 menit). Backend yang menolak bila jendela lewat. */
export function RetractButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setErr(null);
    const res = await retractAnnouncementAction(id);
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onClick} disabled={loading}>
        {loading ? "…" : "Tarik"}
      </Button>
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}
