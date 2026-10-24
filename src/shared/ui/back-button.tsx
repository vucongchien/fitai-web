"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { triggerHaptic } from "@/shared/lib/haptic-feedback";

export interface BackButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  fallbackHref?: string;
  className?: string;
  ariaLabel?: string;
  iconSize?: number;
  children?: ReactNode;
}

export function canGoBackSafely(): boolean {
  if (typeof window === "undefined" || window.history.length <= 1) {
    return false;
  }

  if (document.referrer) {
    try {
      const referrerOrigin = new URL(document.referrer).origin;
      if (referrerOrigin !== window.location.origin && window.history.length <= 2) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function BackButton({
  fallbackHref = "/community",
  className,
  ariaLabel = "Back",
  iconSize = 20,
  children,
  onClick,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    triggerHaptic(25);
    onClick?.({} as React.MouseEvent<HTMLButtonElement>);

    if (canGoBackSafely()) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const defaultClasses =
    "flex h-9 w-9 items-center justify-center rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400";

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel}
      className={cn(defaultClasses, className)}
      {...props}
    >
      {children ?? <ArrowLeft aria-hidden="true" size={iconSize} />}
    </button>
  );
}
