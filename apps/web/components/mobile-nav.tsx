"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav, type NavItem } from "./sidebar-nav";

/**
 * Navigasi mobile (<lg): tombol hamburger di topbar membuka drawer off-canvas.
 * Drawer = layer atas → pakai `.glass-overlay` (sesuai aturan design-system: glass khusus overlay).
 * Desktop (lg+) tetap pakai sidebar tetap di DashboardShell; komponen ini `lg:hidden`.
 */
export function MobileNav({ items, area }: { items: NavItem[]; area: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Buka menu"
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-foreground hover:bg-muted"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop: tutup saat diklik di luar drawer. */}
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/25"
          />
          <div className="glass-overlay absolute left-0 top-0 flex h-full w-72 flex-col gap-6 p-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <div className="text-xl font-extrabold tracking-tight text-primary">Magneo</div>
                <div className="text-xs text-muted-foreground">{area}</div>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Klik item mana pun → tutup drawer (event bubbling). */}
            <div onClick={() => setOpen(false)}>
              <SidebarNav items={items} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
