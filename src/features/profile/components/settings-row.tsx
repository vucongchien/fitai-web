import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface SettingsRowProps {
  label: string;
  value?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function SettingsRow({ label, value, icon, onClick, href, className }: SettingsRowProps) {
  const commonClasses = cn(
    "flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer group",
    className,
  );

  const content = (
    <>
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 group-hover:text-neutral-900 group-hover:bg-neutral-200/70 transition-colors">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[16px] font-bold text-neutral-800 group-hover:text-neutral-900 truncate">
            {label}
          </div>
          {value && (
            <div className="text-[13px] font-medium text-neutral-400 mt-0.5 truncate">{value}</div>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 stroke-[2.5] shrink-0" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={commonClasses}>
      {content}
    </button>
  );
}
