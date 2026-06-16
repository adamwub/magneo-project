import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function PenggunaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengguna</h1>
      <Card>
        <CardHeader>
          <CardTitle>Segera</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Impor siswa (XLSX) & kode undangan ortu — dibangun pada potongan 1i.4.
        </CardContent>
      </Card>
    </div>
  );
}
