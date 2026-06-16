import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function HqHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pusat (HQ)</h1>
        <p className="text-muted-foreground">Provisioning sekolah & akun admin.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Provisioning Sekolah</CardTitle>
          <CardDescription>Wizard: buat sekolah → pairing Box → terbitkan akun admin.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Dibangun pada potongan berikutnya (1i.2).</CardContent>
      </Card>
    </div>
  );
}
