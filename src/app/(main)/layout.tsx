import type { ReactNode } from "react";

import { AppShell } from "@/shared/ui/app-shell";
import { SideInspectorPanel } from "@/shared/ui/side-panel/side-inspector-panel";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-0 sm:pt-4 pb-8 flex items-start justify-center gap-4 xl:gap-6">
        <div className="w-full max-w-[640px] min-w-0 xl:shrink-0 bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300">
          {children}
        </div>
        <SideInspectorPanel />
      </div>
    </AppShell>
  );
}
