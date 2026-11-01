"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavDestinationActive, NAV_DESTINATIONS } from "@/shared/config/navigation";
import { NAV_LATERAL } from "@/shared/ui/transition-types";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="bottom-navigation md:hidden">
      {NAV_DESTINATIONS.map(({ href, icon: Icon, label }) => {
        const active = isNavDestinationActive(pathname, href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className="bottom-navigation__link"
            data-active={active || undefined}
            href={href}
            key={href}
            title={label}
            transitionTypes={NAV_LATERAL}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.3 : 1.8} />
            <span className="bottom-navigation__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
