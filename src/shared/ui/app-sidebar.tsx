"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";

import { isNavDestinationActive, SIDEBAR_NAV_DESTINATIONS } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { BrandMark } from "@/shared/ui/brand-mark";
import { notificationBadgeStore } from "@/shared/ui/header-actions";
import { NAV_LATERAL } from "@/shared/ui/transition-types";

interface AppSidebarProps {
  className?: string;
}

function AppSidebarInner({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const hasUnread = useSyncExternalStore(
    notificationBadgeStore.subscribe,
    notificationBadgeStore.getSnapshot,
    () => false,
  );

  return (
    <aside aria-label="Desktop navigation" className={cn("app-sidebar", className)}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="app-sidebar__brand">
          <BrandMark href="/home" className="text-xl" />
        </div>

        <nav aria-label="Desktop primary" className="app-sidebar__nav">
          {SIDEBAR_NAV_DESTINATIONS.map(({ href, icon: Icon, label }) => {
            const active = isNavDestinationActive(pathname, href);
            const showBadge = href === "/notifications" && hasUnread;

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                data-active={active || undefined}
                transitionTypes={NAV_LATERAL}
                className="app-sidebar__link"
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.3 : 1.8} />
                  {showBadge ? (
                    <span
                      aria-label="Unread notifications"
                      className="absolute -top-1 -right-1 size-2 rounded-full bg-[var(--color-effort)] ring-2 ring-[var(--color-surface)]"
                    />
                  ) : null}
                </div>
                <span className="app-sidebar__label">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="app-sidebar__footer">
        <Link
          href="/profile/settings"
          title="Settings"
          data-active={pathname === "/profile/settings" || undefined}
          className="app-sidebar__link"
        >
          <Settings aria-hidden="true" size={18} strokeWidth={1.8} className="shrink-0" />
          <span className="app-sidebar__label">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export function AppSidebar({ className }: AppSidebarProps) {
  return (
    <Suspense
      fallback={<aside aria-label="Desktop navigation" className={cn("app-sidebar", className)} />}
    >
      <AppSidebarInner className={className} />
    </Suspense>
  );
}
