import type { ReactNode } from "react";
import type { Session } from "@/lib/session";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

const ROLE_LABEL: Record<string, string> = {
  HQ_ADMIN: "HQ Admin",
  HQ_OPS: "HQ Ops",
  SCHOOL_ADMIN: "Admin Sekolah",
  PRINCIPAL: "Kepala Sekolah",
};

/** Kerangka dashboard: sidebar (brand + menu) + topbar (peran + keluar) + konten. */
export function DashboardShell({
  area,
  items,
  session,
  children,
}: {
  area: string;
  items: NavItem[];
  session: Session;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-6 border-r bg-card p-4">
        <div className="px-2">
          <div className="text-xl font-extrabold tracking-tight text-primary">Magnoo</div>
          <div className="text-xs text-muted-foreground">{area}</div>
        </div>
        <SidebarNav items={items} />
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="text-sm text-muted-foreground">
            {ROLE_LABEL[session.role] ?? session.role}
          </div>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
