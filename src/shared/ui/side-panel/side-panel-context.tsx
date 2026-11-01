"use client";

import { useSyncExternalStore, type ReactNode } from "react";

export type SidePanelTab = "search" | "notifications" | null;

class SidePanelStore {
  private activeTab: SidePanelTab = null;
  private listeners = new Set<() => void>();
  private listenerAttached = false;

  constructor() {
    this.ensureListener();
  }

  private ensureListener() {
    if (this.listenerAttached || typeof window === "undefined") {
      return;
    }
    this.listenerAttached = true;
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.activeTab) {
        this.close();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.toggle("search");
      }
    });
  }

  subscribe = (listener: () => void) => {
    this.ensureListener();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.activeTab;
  getServerSnapshot = () => null;

  open = (tab: "search" | "notifications") => {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.emit();
    }
  };

  close = () => {
    if (this.activeTab !== null) {
      this.activeTab = null;
      this.emit();
    }
  };

  toggle = (tab: "search" | "notifications") => {
    this.activeTab = this.activeTab === tab ? null : tab;
    this.emit();
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const sidePanelStore = new SidePanelStore();

export function SidePanelProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSidePanel() {
  const activeTab = useSyncExternalStore(
    sidePanelStore.subscribe,
    sidePanelStore.getSnapshot,
    sidePanelStore.getServerSnapshot,
  );

  return {
    activeTab,
    isOpen: activeTab !== null,
    openPanel: sidePanelStore.open,
    closePanel: sidePanelStore.close,
    togglePanel: sidePanelStore.toggle,
  };
}
