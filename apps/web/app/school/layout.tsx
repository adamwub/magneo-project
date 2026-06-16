import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");
  return (
    <DashboardShell
      area="Sekolah"
      session={session}
      items={[
        { href: "/school", label: "Ringkasan" },
        { href: "/school/kelas", label: "Kelas" },
        { href: "/school/pengguna", label: "Pengguna" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
