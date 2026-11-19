"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, CheckCircle2, Loader2, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  registerBrandAction,
  type RegisterBrandInput,
} from "@/features/partner/api/partner-brand-service";

const formSchema = z.object({
  brandName: z.string().trim().min(2, "Please enter a brand name (at least 2 characters)").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  contactPhone: z
    .string()
    .trim()
    .min(8, "Please enter a valid phone number")
    .max(20, "Phone number must be at most 20 characters"),
  address: z.string().trim().min(5, "Please enter an address (at least 5 characters)").max(255),
});

export interface BrandRegisterFormProps {
  isAuthenticated: boolean;
  isBrandAccount: boolean;
  userName?: string;
}

export function BrandRegisterForm({
  isAuthenticated,
  isBrandAccount,
  userName,
}: BrandRegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterBrandInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      description: "",
      contactPhone: "",
      address: "",
    },
  });

  if (isBrandAccount) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-semibold">
          <ShieldCheck className="size-4" />
          Brand Partner Account Active
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Welcome back{userName ? `, ${userName}` : ""}!
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Your account is verified as a Brand Partner. Open your dashboard to review partner status
          and upcoming commercial tools.
        </p>
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Open Partner Dashboard
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] text-xs font-semibold">
          <Building2 className="size-4" />
          Brand Partner Onboarding
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Sign in to submit your partner application
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Brand Partner applications are linked to your FITAI account so our admin team can review
          and activate your partner role directly.
        </p>
        <Link
          href="/login?redirect=/partner#register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <LogIn className="size-4" />
          Sign in to apply
        </Link>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-recovery)]/40 bg-[var(--color-surface)] p-8 space-y-4">
        <div className="flex items-center gap-2 text-[var(--color-recovery)] font-semibold">
          <CheckCircle2 className="size-5" />
          <span>Application Submitted</span>
        </div>
        <p className="text-sm text-[var(--color-text)]">{successMessage}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Our operations team will review your request in the Brand Partners console. Once approved,
          please sign in again to refresh your Brand role.
        </p>
      </div>
    );
  }

  const onSubmit = (values: RegisterBrandInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerBrandAction(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setSuccessMessage(result.message);
      reset();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 space-y-5"
    >
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[var(--color-text)] font-display">
          Apply as a Brand Partner
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Signed in as{" "}
          <span className="font-medium text-[var(--color-text)]">{userName || "FITAI Member"}</span>
          .
        </p>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="rounded-[var(--radius-input)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="brandName" className="block text-sm font-medium text-[var(--color-text)]">
            Brand Name *
          </label>
          <input
            id="brandName"
            type="text"
            placeholder="e.g., FitGear Vietnam"
            disabled={isPending}
            {...register("brandName")}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
          />
          {errors.brandName ? (
            <p className="text-xs text-[var(--color-danger)]">{errors.brandName.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="contactPhone"
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            Contact Phone *
          </label>
          <input
            id="contactPhone"
            type="tel"
            placeholder="e.g., +84 901 234 567"
            disabled={isPending}
            {...register("contactPhone")}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
          />
          {errors.contactPhone ? (
            <p className="text-xs text-[var(--color-danger)]">{errors.contactPhone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text)]">
          Business / Gym Address *
        </label>
        <input
          id="address"
          type="text"
          placeholder="e.g., 123 Nguyen Hue, District 1, Ho Chi Minh City"
          disabled={isPending}
          {...register("address")}
          className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
        />
        {errors.address ? (
          <p className="text-xs text-[var(--color-danger)]">{errors.address.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)]">
          Brand Overview & Partnership Goals *
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Describe your fitness products or services and how you want to collaborate with the FITAI community..."
          disabled={isPending}
          {...register("description")}
          className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-action)]"
        />
        {errors.description ? (
          <p className="text-xs text-[var(--color-danger)]">{errors.description.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting application...
          </>
        ) : (
          <>
            Submit Partner Application
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
