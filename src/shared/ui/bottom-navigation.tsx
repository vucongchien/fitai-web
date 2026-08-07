"use client";

import { Dumbbell, Home, Salad, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_LATERAL } from "@/shared/ui/transition-types";

const destinations = [
  { href: "/home", label: "Today", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/roadmap", label: "Workout", icon: Dumbbell },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="bottom-navigation">
      {destinations.map(({ href, icon: Icon, label }) => {
        const active =
          pathname === href ||
          pathname.startsWith(`${href}/`) ||
          (href === "/roadmap" && (pathname === "/schedule" || pathname.startsWith("/schedule/")));

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="bottom-navigation__link"
            data-active={active || undefined}
            href={href}
            key={href}
            transitionTypes={NAV_LATERAL}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
