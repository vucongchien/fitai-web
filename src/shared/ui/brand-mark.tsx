import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import { FitAiMascotSvg } from "@/shared/ui/fitai-mascot-svg";

interface BrandMarkProps {
  className?: string;
  href?: string;
}

export function BrandMark({ className, href = "/home" }: BrandMarkProps) {
  return (
    <Link aria-label="FITAI home" className={cn("brand-mark", className)} href={href}>
      <FitAiMascotSvg className="brand-mark__icon" decorative />
      <span className="brand-mark__wordmark">
        <span>FIT</span>
        <span className="brand-mark__ai">AI</span>
      </span>
    </Link>
  );
}
