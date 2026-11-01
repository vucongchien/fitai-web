import type { ReactNode } from "react";

import { AppSidebar } from "@/shared/ui/app-sidebar";

export default function FocusedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex flex-col md:flex-row min-h-screen bg-[var(--color-canvas)]">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="focused-shell flex-1">{children}</div>
      </div>
    </div>
  );
}
