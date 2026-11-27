import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminLoginForm } from "@/features/admin/ui/admin-login-form";
import { getAuthenticatedSession, isAdmin } from "@/shared/auth/session";

export const metadata: Metadata = {
  title: "FITAI Admin Sign In",
  description: "Sign in to the FITAI administrative control panel.",
  robots: {
    index: false,
    follow: false,
  },
};

function resolveSafeRedirect(raw?: string): string {
  if (raw && raw.startsWith("/admin") && !raw.startsWith("//") && !raw.startsWith("/admin/login")) {
    return raw;
  }
  return "/admin";
}

interface AdminLoginPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

function AdminLoginFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center font-sans antialiased text-[var(--color-text-muted)] text-sm">
      <div className="flex items-center gap-3">
        <span className="size-3 rounded-full bg-[var(--color-action)] animate-ping" />
        <span>Loading admin sign in...</span>
      </div>
    </div>
  );
}

async function AdminLoginGate({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const rawRedirect = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
  const safeRedirect = resolveSafeRedirect(rawRedirect);

  const session = await getAuthenticatedSession();
  if (session.accessToken && (await isAdmin())) {
    redirect(safeRedirect);
  }

  return <AdminLoginForm redirectTo={safeRedirect} />;
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginGate searchParams={searchParams} />
    </Suspense>
  );
}
