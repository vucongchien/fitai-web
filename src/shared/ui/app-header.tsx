"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { NAV_BACK } from "@/shared/ui/transition-types";

export function AppHeader() {
  const pathname = usePathname();

  let backDestination: { href: string; label: string } | null = null;

  if (pathname?.startsWith("/nutrition/") && pathname !== "/nutrition") {
    backDestination = { href: "/nutrition", label: "Nutrition" };
  } else if (
    (pathname?.startsWith("/roadmap/") && pathname !== "/roadmap") ||
    pathname === "/schedule" ||
    pathname?.startsWith("/schedule/")
  ) {
    backDestination = { href: "/roadmap", label: "Roadmap" };
  }

  return (
    <header className="app-header">
      {backDestination ? (
        <Link
          aria-label={`Back to ${backDestination.label}`}
          className="app-header__back"
          href={backDestination.href}
          transitionTypes={NAV_BACK}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          <span>{backDestination.label}</span>
        </Link>
      ) : (
        <>
          <BrandMark />
          <span className="app-header__phase">Week 2</span>
        </>
      )}
      <span aria-hidden="true" className="app-header__spacer" />
      <HeaderActions />
    </header>
  );
}
