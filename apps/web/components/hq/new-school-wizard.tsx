"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check } from "lucide-react";
import type { School } from "@magnoo/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSchoolAction, pairBoxAction, createAdminAccountAction } from "@/app/hq/actions";

type Step = 1 | 2 | 3 | 4;

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">{value}</code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function NewSchoolWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [school, setSchool] = useState<School | null>(null);
  const [pairing, setPairing] = useState<{ token: string; expiresInSec: number } | null>(null);
  const [admin, setAdmin] = useState<{ username: string; tempPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep(1);
    setSchool(null);
    setPairing(null);
    setAdmin(null);
    setError(null);
    setLoading(false);
  }
  function onOpenChange(o: boolean) {
    setOpen(o);
    if (!o) {
      reset();
      router.refresh();
    }
  }

  async function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await createSchoolAction({
      npsn: String(f.get("npsn") ?? ""),
      name: String(f.get("name") ?? ""),
      city: String(f.get("city") ?? ""),
      province: (f.get("province") as string) || undefined,
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setSchool(res.data);
    setStep(2);
  }

  async function submitPair(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!school) return;
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await pairBoxAction(school.id, String(f.get("boxSerial") ?? ""));
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setPairing({ token: res.data.pairingToken, expiresInSec: res.data.expiresInSec });
  }

  async function issueAdmin() {
    if (!school) return;
    setError(null);
    setLoading(true);
    const res = await createAdminAccountAction(school.id);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setAdmin({ username: res.data.username, tempPassword: res.data.tempPassword });
    setStep(4);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Sekolah Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provisioning Sekolah · Langkah {step} dari 3</DialogTitle>
          <DialogDescription>
            {step === 1 && "Data sekolah baru (status awal: onboarding)."}
            {step === 2 && "Pasangkan perangkat Box. Token hanya tampil sekali."}
            {step === 3 && "Terbitkan akun admin sekolah. Password hanya tampil sekali."}
            {step === 4 && "Selesai — simpan kredensial di tempat aman."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={submitCreate} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="npsn">NPSN (8 digit)</Label>
              <Input id="npsn" name="npsn" inputMode="numeric" placeholder="12345678" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nama Sekolah</Label>
              <Input id="name" name="name" placeholder="SMA Negeri 1" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city">Kota</Label>
                <Input id="city" name="city" placeholder="Surabaya" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="province">Provinsi</Label>
                <Input id="province" name="province" placeholder="Jawa Timur" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Membuat…" : "Buat Sekolah & Lanjut"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {!pairing ? (
              <form onSubmit={submitPair} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="boxSerial">Serial Box</Label>
                  <Input id="boxSerial" name="boxSerial" placeholder="BOX-XXXX" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses…" : "Terbitkan Token Pairing"}
                </Button>
              </form>
            ) : (
              <>
                <CopyField label="Token Pairing (sekali tampil)" value={pairing.token} />
                <p className="text-xs text-muted-foreground">
                  Berlaku {Math.round(pairing.expiresInSec / 86400)} hari. Masukkan token ini saat menyiapkan Box.
                </p>
                <Button className="w-full" onClick={() => setStep(3)}>
                  Lanjut: Akun Admin
                </Button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Akun admin pertama untuk sekolah ini. Username & password sementara hanya tampil sekali.
            </p>
            <Button className="w-full" onClick={issueAdmin} disabled={loading}>
              {loading ? "Menerbitkan…" : "Terbitkan Akun Admin"}
            </Button>
          </div>
        )}

        {step === 4 && admin && (
          <div className="space-y-3">
            <CopyField label="Username" value={admin.username} />
            <CopyField label="Password Sementara (sekali tampil)" value={admin.tempPassword} />
            <p className="text-xs text-muted-foreground">
              Admin wajib mengganti password saat login pertama. Sekolah: {school?.name}.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Selesai
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
