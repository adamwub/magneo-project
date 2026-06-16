import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function KelasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kelas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Segera</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kelola kelas & kenaikan kelas — dibangun pada potongan 1i.3.
        </CardContent>
      </Card>
    </div>
  );
}
