import type { ReactNode } from "react";

import { AppHeader } from "@/shared/ui/app-header";
import { AppSidebar } from "@/shared/ui/app-sidebar";
import { BottomNavigation } from "@/shared/ui/bottom-navigation";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { SidePanelProvider } from "@/shared/ui/side-panel/side-panel-context";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidePanelProvider>
      <div className="app-shell flex flex-col md:flex-row">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <PullToRefresh activePath="/home">
            <AppHeader />
            <main className="app-shell__main flex-1">{children}</main>
          </PullToRefresh>
        </div>
        <BottomNavigation />
      </div>
    </SidePanelProvider>
  );
}
