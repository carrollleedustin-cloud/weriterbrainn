"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dimensionRegistry } from "@/lib/dimension-registry";

export function DimensionNav() {
  const pathname = usePathname();
  const dimensions = dimensionRegistry.getDimensionNavItems();

  return (
    <nav className="dimension-nav" aria-label="Dimension navigation">
      {dimensions.map((d) => {
        const active = pathname === d.href || pathname?.startsWith(d.href + "/");
        return (
          <Link
            key={d.id}
            href={d.href}
            className={`dimension-nav-item ${active ? "dimension-nav-item-active" : ""}`}
            aria-current={active ? "page" : undefined}
            title={d.description}
          >
            {d.glyph && <span className="mr-1 opacity-60">{d.glyph}</span>}
            {d.label}
          </Link>
        );
      })}
    </nav>
  );
}
