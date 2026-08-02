import type { ReactNode } from "react";

import { BottomNavigation } from "@/shared/ui/bottom-navigation";
import { BrandMark } from "@/shared/ui/brand-mark";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandMark />
        <p className="app-header__status">
          <span aria-hidden="true" className="app-header__status-dot" />
          Week 2 is active
        </p>
      </header>
      <main className="app-shell__main">{children}</main>
      <BottomNavigation />
    </div>
  );
}
