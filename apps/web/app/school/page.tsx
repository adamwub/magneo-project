import { getSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function SchoolHomePage() {
  const session = getSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ringkasan Sekolah</h1>
        <p className="text-muted-foreground">Selamat datang di dashboard sekolah Magneo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengguna</CardTitle>
            <CardDescription>Impor siswa (XLSX) & kode undangan ortu.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Buka menu “Pengguna”.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kelas</CardTitle>
            <CardDescription>Kelola kelas & wizard kenaikan kelas.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Buka menu “Kelas”.</CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Kode sekolah: {session?.schoolId ?? "—"}</p>
    </div>
  );
}
