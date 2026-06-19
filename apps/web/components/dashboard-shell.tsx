import type { ReactNode } from "react";
import type { Session } from "@/lib/session";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="clay-panel hidden flex-col gap-6 p-4 lg:flex">
        <div className="px-2">
          <div className="text-xl font-extrabold tracking-tight text-primary">Magneo</div>
          <div className="text-xs text-muted-foreground">{area}</div>
        </div>
        <SidebarNav items={items} />
      </aside>
      <div className="flex flex-col">
        <header className="clay-panel sticky top-0 z-10 flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav items={items} area={area} />
            <div className="text-sm text-muted-foreground">
              {ROLE_LABEL[session.role] ?? session.role}
            </div>
          </div>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
