import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default function HqLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");
  return (
    <DashboardShell area="Pusat (HQ)" session={session} items={[{ href: "/hq", label: "Sekolah" }]}>
      {children}
    </DashboardShell>
  );
}
