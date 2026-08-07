import type { ReactNode } from "react";

import { AppHeader } from "@/shared/ui/app-header";
import { BottomNavigation } from "@/shared/ui/bottom-navigation";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <PullToRefresh activePath="/home">
        <AppHeader />
        <main className="app-shell__main">{children}</main>
      </PullToRefresh>
      <BottomNavigation />
    </div>
  );
}
