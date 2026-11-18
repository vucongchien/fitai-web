import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Cpu,
  Search,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandRegisterForm } from "@/features/partner/ui/brand-register-form";
import { BrandMark } from "@/shared/ui/brand-mark";

export interface PartnerLandingProps {
  isAuthenticated: boolean;
  isBrandAccount: boolean;
  userName?: string;
}

const ECOSYSTEM_PILLARS = [
  {
    icon: Cpu,
    title: "Real-Time On-Device AI Coach",
    description:
      "Members train with ONNX Runtime Web pose estimation and automatic rep counting directly in the browser—low latency and privacy-first.",
    badge: "Live",
  },
  {
    icon: Users,
    title: "Social Community & Brand Discovery",
    description:
      "Verified Brand Partner accounts are indexed separately in community search, helping athletes discover and connect with trusted fitness brands.",
    badge: "Live",
  },
  {
    icon: Swords,
    title: "Gamification, FitCoins & Solo-Match",
    description:
      "Daily streaks, FitCoins ledger, global leaderboards, and 1v1 Solo-Match battles keep members engaged and returning every day.",
    badge: "Platform Ready",
  },
];

const PARTNER_ROADMAP = [
  {
    icon: Sparkles,
    title: "Sponsored Community Feed",
    description:
      "Promote fitness products, supplements, and gym memberships directly in the Community feed.",
    status: "Coming Soon",
  },
  {
    icon: Award,
    title: "FitCoins Voucher Rewards",
    description:
      "Let athletes redeem earned FitCoins for exclusive discount codes and partner perks.",
    status: "Coming Soon",
  },
  {
    icon: Activity,
    title: "Solo-Match & Challenge Sponsorships",
    description: "Sponsor weekly community challenges and head-to-head workout tournaments.",
    status: "Coming Soon",
  },
];

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Submit Brand Profile",
    detail:
      "Provide your brand name, overview, contact phone, and business address using the form below.",
  },
  {
    step: "02",
    title: "Admin Verification",
    detail:
      "The FITAI operations team reviews and approves your application in the Admin Backoffice.",
  },
  {
    step: "03",
    title: "Partner Activation",
    detail:
      "Your account is upgraded to the Brand role, unlocking the Partner Dashboard and verified discovery.",
  },
];

export function PartnerLanding({ isAuthenticated, isBrandAccount, userName }: PartnerLandingProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark href="/partner" />
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-bold">
              Partner Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isBrandAccount ? (
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Partner Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <a
                href="#register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Become a Partner
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-20">
        {/* Hero */}
        <section className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-muted)]">
            <Search className="size-3.5 text-[var(--color-action)]" />
            FITAI Partner Ecosystem
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-display leading-tight">
            Grow with the AI-Powered Fitness Community at{" "}
            <span className="text-[var(--color-action)]">FITAI</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
            Connect your gym, nutrition, or fitness gear brand with dedicated athletes training
            daily through our AI Coach, Social Community, and Gamification platform.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {isBrandAccount ? "View Partner Status" : "Apply as Brand Partner"}
              <ArrowRight className="size-4" />
            </a>
            {isBrandAccount ? (
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                Open Dashboard
              </Link>
            ) : null}
          </div>
        </section>

        {/* Ecosystem Pillars (Live) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">Inside the FITAI Ecosystem</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Core capabilities currently live in the FITAI web platform.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ECOSYSTEM_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)] flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-recovery)]/15 text-[var(--color-recovery)] text-[11px] font-semibold">
                      <CheckCircle2 className="size-3" />
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roadmap (Coming Soon) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">Brand Partner Roadmap</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Commercial tools currently in development for upcoming releases.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PARTNER_ROADMAP.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)]/50 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-semibold">
                      <Clock className="size-3" />
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3-Step Onboarding */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display">How Partner Onboarding Works</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Connected directly to the FITAI Brand Partner review workflow.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ONBOARDING_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-2"
              >
                <span className="text-xs font-bold tracking-wider text-[var(--color-action)]">
                  STEP {item.step}
                </span>
                <h3 className="text-base font-bold font-display">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Registration Section */}
        <section id="register" className="scroll-mt-24 space-y-4 max-w-2xl">
          <BrandRegisterForm
            isAuthenticated={isAuthenticated}
            isBrandAccount={isBrandAccount}
            userName={userName}
          />
        </section>
      </main>
    </div>
  );
}
