"use client";

import {
  ArrowLeft,
  ChevronRight,
  Dumbbell,
  FolderTree,
  LayoutDashboard,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminSidebarProps {
  pendingApprovalCount?: number;
}

export function AdminSidebar({ pendingApprovalCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Exercise Catalog",
      href: "/admin/exercises",
      icon: Dumbbell,
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
    },
    {
      label: "AI Rules & Voice",
      href: "/admin/motion-specs",
      icon: Sparkles,
    },
    {
      label: "Metadata Catalog",
      href: "/admin/metadata",
      icon: FolderTree,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-screen flex flex-col justify-between p-4 selection:bg-[var(--color-action-soft)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-action)] flex items-center justify-center text-[var(--color-action-contrast)] font-bold shadow-md shadow-[var(--color-action-soft)]">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-[var(--color-text)] tracking-tight text-base font-display">
              FITAI Admin
            </h1>
            <p className="text-xs text-[var(--color-action)] font-semibold flex items-center gap-1">
              <Shield className="size-3" /> Control Panel
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Admin Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-input)] text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--color-surface-subtle)] text-[var(--color-action)] border border-[var(--color-border)] shadow-2xs font-semibold"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4.5 transition-colors ${
                      isActive ? "text-[var(--color-action)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)]">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`size-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? "opacity-100 text-[var(--color-action)]" : "text-[var(--color-text-muted)]"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Back to Client App */}
      <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
        <div className="px-3 py-2 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] flex items-center gap-3 shadow-2xs">
          <div className="size-8 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] font-bold flex items-center justify-center text-xs border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)]">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--color-text)] truncate">System Administrator</p>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">admin@fitai.com</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] transition-colors shadow-2xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Client App</span>
        </Link>
      </div>
    </aside>
  );
}
