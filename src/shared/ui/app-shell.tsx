import type { ReactNode } from "react";

import { BottomNavigation } from "@/shared/ui/bottom-navigation";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandMark />
        <span className="app-header__phase">Week 2</span>
        <span aria-hidden="true" className="app-header__spacer" />
        <HeaderActions />
      </header>
      <main className="app-shell__main">{children}</main>
      <BottomNavigation />
    </div>
  );
}
