import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      primary: "ui-button--primary",
      secondary: "ui-button--secondary",
      quiet: "ui-button--quiet",
      danger: "ui-button--danger",
    },
    size: {
      medium: "ui-button--medium",
      large: "ui-button--large",
      icon: "ui-button--icon",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "medium",
  },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size,
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      data-loading={loading || undefined}
      data-slot="button"
      disabled={disabled || loading}
      {...props}
    >
      <span className="ui-button__label">{children}</span>
      {loading ? <span aria-hidden="true" className="ui-button__loader" /> : null}
    </button>
  );
}
