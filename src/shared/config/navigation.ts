import type { LucideIcon } from "lucide-react";
import { Dumbbell, Home, Salad, Swords, UserRound, Users } from "lucide-react";

export interface NavDestination {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { href: "/home", label: "Today", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/roadmap", label: "Workout", icon: Dumbbell },
  { href: "/challenge", label: "Arena", icon: Swords },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export const SIDEBAR_NAV_DESTINATIONS: readonly NavDestination[] = NAV_DESTINATIONS;

export function isNavDestinationActive(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) {
    return true;
  }
  if (href === "/roadmap" && (pathname === "/schedule" || pathname.startsWith("/schedule/"))) {
    return true;
  }
  return false;
}
