import { ArrowLeft, Award, Building2, Clock, ShieldAlert, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAuthenticatedSession, isBrand } from "@/shared/auth/session";
import { BrandMark } from "@/shared/ui/brand-mark";

export const metadata: Metadata = {
  title: "FITAI Partner Dashboard",
  description: "Brand Partner workspace on the FITAI platform.",
  robots: {
    index: false,
    follow: false,
  },
};

function PartnerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
      Verifying Brand Partner session...
    </div>
  );
}

async function PartnerDashboardGate() {
  const [session, isBrandAccount] = await Promise.all([getAuthenticatedSession(), isBrand()]);

  if (!session.accessToken) {
    redirect("/login?redirect=/partner/dashboard");
  }

  if (!isBrandAccount) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-4 text-center">
          <div className="mx-auto size-12 rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)] flex items-center justify-center">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-xl font-bold font-display">Brand Partner Access Required</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your current account ({session.userName || "Member"}, role:{" "}
            <span className="font-semibold text-[var(--color-text)]">{session.role || "USER"}</span>
            ) does not have Brand Partner permissions yet.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/partner#register"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Apply as Brand Partner
            </Link>
            <Link
              href="/partner"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-input)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="size-4" />
              Back to Partner Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const upcomingModules = [
    {
      icon: Sparkles,
      title: "Sponsored Feed Campaigns",
      description: "Create and manage promotional posts in the FITAI Community feed.",
    },
    {
      icon: Award,
      title: "FitCoins Voucher Rewards",
      description: "Issue discount codes and rewards redeemable with member FitCoins.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] font-sans antialiased">
      <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark href="/partner" />
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold">
            Brand Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            {session.userName || "Brand Partner"}
          </span>
          <Link
            href="/partner"
            className="text-xs font-medium text-[var(--color-action)] hover:underline"
          >
            Partner Overview
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)] flex items-center justify-center">
              <Building2 className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">
                Welcome, {session.userName || "Brand Partner"}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                Account status:{" "}
                <span className="text-[var(--color-recovery)] font-semibold">
                  Verified Brand Partner
                </span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-recovery)]/15 text-[var(--color-recovery)] text-xs font-semibold w-fit">
            Role: BRAND
          </span>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display">Campaign Management Modules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)]/50 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-semibold">
                      <Clock className="size-3" />
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display">{mod.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <Suspense fallback={<PartnerDashboardSkeleton />}>
      <PartnerDashboardGate />
    </Suspense>
  );
}
