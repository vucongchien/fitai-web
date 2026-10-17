import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminForbiddenView } from "@/features/admin/ui/admin-forbidden-view";
import { AdminQueryProvider } from "@/features/admin/ui/admin-query-provider";
import { AdminSidebar } from "@/features/admin/ui/admin-sidebar";
import { getAuthenticatedSession, isAdmin } from "@/shared/auth/session";

export const metadata: Metadata = {
  title: "FITAI Admin Dashboard",
  description: "Administrative control panel for FITAI exercise catalog and user management.",
};

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center font-sans antialiased text-[var(--color-text-muted)] text-sm">
      <div className="flex items-center gap-3">
        <span className="size-3 rounded-full bg-[var(--color-action)] animate-ping" />
        <span>Verifying admin session...</span>
      </div>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const session = await getAuthenticatedSession();

  // 1. If not authenticated at all -> Redirect to login
  if (!session.accessToken) {
    redirect("/login?redirect=/admin");
  }

  // 2. If authenticated but role is not ADMIN -> Show 403 Forbidden (Without deleting cookie)
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return <AdminForbiddenView userName={session.userName} role={session.role} />;
  }

  // 3. User is authorized ADMIN -> Render Admin Dashboard
  return (
    <AdminQueryProvider>
      <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] flex font-sans selection:bg-[var(--color-action-soft)] antialiased">
        {/* Sidebar */}
        <AdminSidebar pendingApprovalCount={3} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[var(--color-recovery)] animate-pulse" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">System Operational</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-[var(--color-action-soft)] border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)] text-[var(--color-action)] text-xs font-bold">
                Admin Mode Active ({session.userName || "Admin"})
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">{children}</main>
        </div>
      </div>
    </AdminQueryProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
