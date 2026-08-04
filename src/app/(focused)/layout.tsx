import type { ReactNode } from "react";

export default function FocusedLayout({ children }: { children: ReactNode }) {
  return <div className="focused-shell">{children}</div>;
}
