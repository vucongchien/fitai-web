import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { BrandMark } from "@/shared/ui/brand-mark";
import { buttonVariants } from "@/shared/ui/button";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

const HEADER_NAV_LINKS = [
  { href: "#movement-lab", label: "Movement Lab" },
  { href: "#adaptive-roadmap", label: "4-Week Route" },
  { href: "#body-evidence", label: "Body Map" },
] as const;

export function LandingHeader() {
  return (
    <header className="fl-header">
      <div className="fl-container fl-header__inner">
        <BrandMark href="/" />

        <nav aria-label="Landing sections" className="fl-header__nav">
          {HEADER_NAV_LINKS.map((item) => (
            <a className="fl-header__link min-h-12" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="fl-header__actions">
          <Link
            className={cn(
              buttonVariants({ size: "medium", variant: "quiet" }),
              "min-h-12 px-3 sm:px-4",
            )}
            href="/login"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">Sign in</span>
          </Link>
          <Link
            className={cn(
              buttonVariants({ size: "medium", variant: "primary" }),
              "min-h-12 px-3 sm:px-4",
            )}
            href="/home"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">
              <span>Start training</span>
              <ArrowRight aria-hidden="true" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
