import type { HTMLAttributes, ReactNode } from "react";

interface SocialContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hasDividers?: boolean;
}

export function SocialContainer({
  children,
  hasDividers = true,
  className = "",
  ...props
}: SocialContainerProps) {
  return (
    <div
      {...props}
      className={[
        "w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none",
        "rounded-none border-0",
        "sm:rounded-[24px] sm:border sm:border-neutral-300",
        hasDividers ? "divide-y divide-neutral-100" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
