"use client";

import { BarChart3, CalendarDays, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/roadmap", label: "Roadmap", icon: CalendarDays },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="bottom-navigation">
      {destinations.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="bottom-navigation__link"
            data-active={active || undefined}
            href={href}
            key={href}
            transitionTypes={["nav-lateral"]}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
