import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  children: ReactNode;
  uppercase?: boolean;
}

export function TabButton({
  active,
  children,
  uppercase = false,
  className,
  type = "button",
  ...props
}: TabButtonProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={cn(
        "flex-1 py-3 text-center text-[13.5px] font-bold transition-colors cursor-pointer relative",
        uppercase && "uppercase tracking-wider text-[13px]",
        active
          ? "text-sky-500"
          : "text-neutral-400 hover:text-neutral-600",
        className,
      )}
      {...props}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-sky-500 rounded-t-sm"
        />
      )}
    </button>
  );
}
