import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminForbiddenView } from "@/features/admin/ui/admin-forbidden-view";
import { AdminQueryProvider } from "@/features/admin/ui/admin-query-provider";
import { AdminSidebar } from "@/features/admin/ui/admin-sidebar";
import { getAuthenticatedSession, isAdmin } from "@/shared/auth/session";

export const metadata: Metadata = {
  title: "FITAI Admin Dashboard",
  description: "Administrative control panel for FITAI exercise catalog and user management.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <div className="min-h-screen bg-[#F7F8F6] text-slate-900 flex font-sans selection:bg-indigo-100 antialiased">
        {/* Sidebar */}
        <AdminSidebar pendingApprovalCount={3} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600">System Operational</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
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
