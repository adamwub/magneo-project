"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        // Aktif = cocok persis, atau prefix TERPANJANG yang cocok — agar item root
        // ("/school") tidak ikut menyala di setiap subhalaman ("/school/absensi").
        const matches = pathname === item.href || pathname.startsWith(item.href + "/");
        const moreSpecific = items.some(
          (o) =>
            o.href.length > item.href.length &&
            (pathname === o.href || pathname.startsWith(o.href + "/")),
        );
        const active = matches && !moreSpecific;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
              active
                ? "clay-raised bg-primary text-primary-foreground"
                : "text-foreground hover:bg-white/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
