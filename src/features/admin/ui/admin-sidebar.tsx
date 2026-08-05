"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Dumbbell,
  FolderTree,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";

export type AdminSidebarProps = {
  pendingApprovalCount?: number;
};

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
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-[#F7F8F6] min-h-screen flex flex-col justify-between p-4 selection:bg-indigo-100">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-base font-display">
              FITAI Admin
            </h1>
            <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
              <Shield className="size-3" /> Control Panel
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Admin Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white text-indigo-600 border border-slate-200 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4.5 transition-colors ${
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`size-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? "opacity-100 text-indigo-600" : "text-slate-400"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Back to Client App */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">System Administrator</p>
            <p className="text-[11px] text-slate-500 truncate">admin@fitai.com</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Client App</span>
        </Link>
      </div>
    </aside>
  );
}
