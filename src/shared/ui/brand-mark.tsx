import Link from "next/link";

import { cn } from "@/shared/lib/cn";

interface BrandMarkProps {
  className?: string;
  href?: string;
}

export function BrandMark({ className, href = "/home" }: BrandMarkProps) {
  return (
    <Link aria-label="FITAI home" className={cn("brand-mark", className)} href={href}>
      <span>FIT</span>
      <span className="brand-mark__ai">AI</span>
    </Link>
  );
}
