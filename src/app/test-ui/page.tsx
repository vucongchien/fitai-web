"use client";

import { useState } from "react";

import { toast } from "@/shared/ui/toast";
import type { DingPosition, DingTheme } from "@/shared/ui/toast/ding-engine";

const POSITIONS: DingPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const THEMES: DingTheme[] = ["system", "light", "dark"];

export default function TestUiPage() {
  const [position, setPosition] = useState<DingPosition>("top-center");
  const [theme, setTheme] = useState<DingTheme>("system");
  const [sound, setSound] = useState(false);

  const handlePositionChange = (next: DingPosition) => {
    setPosition(next);
    toast.configure({ position: next });
  };

  const handleThemeChange = (next: DingTheme) => {
    setTheme(next);
    toast.configure({ theme: next });
  };

  const handleSoundToggle = () => {
    const next = !sound;
    setSound(next);
    toast.configure({ sound: next });
  };

  const handlePromiseDemo = () => {
    void toast.promise(
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("Sync completed"), 1800);
      }),
      {
        loading: "Syncing workout session...",
        success: (msg) => msg,
        error: "Sync failed",
      },
    );
  };

  const handleProgressDemo = () => {
    const id = toast.loading("Uploading pose clip...", { progress: 0.1 });
    setTimeout(() => toast.update(id, { progress: 0.45 }), 500);
    setTimeout(() => toast.update(id, { progress: 0.85 }), 1000);
    setTimeout(
      () =>
        toast.update(id, {
          type: "success",
          title: "Clip uploaded",
          progress: null,
        }),
      1500,
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">UI Playground — Ding Toast</h1>
        <p className="text-sm text-neutral-500">
          Test trực tiếp hiệu ứng morph pill, spring physics, icon gesture, drag-to-dismiss và âm
          thanh.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Toast Variants</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            onClick={() => toast.success("Workout saved!")}
            type="button"
          >
            Success
          </button>
          <button
            className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700"
            onClick={() => toast.error("Failed to sync set")}
            type="button"
          >
            Error (sticky)
          </button>
          <button
            className="rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-600"
            onClick={() => toast.warning("Camera angle slightly low")}
            type="button"
          >
            Warning
          </button>
          <button
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => toast.info("Offline mode enabled")}
            type="button"
          >
            Info
          </button>
          <button
            className="rounded-lg bg-neutral-800 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-900"
            onClick={() => toast.loading("Analyzing form...")}
            type="button"
          >
            Loading
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Rich &amp; Interactive</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium hover:bg-neutral-100"
            onClick={() =>
              toast.info("Meal removed", {
                description: "Chicken breast 200g was deleted from today's log.",
                action: {
                  label: "Undo",
                  onClick: () => ({
                    type: "success",
                    title: "Meal restored",
                    description: "",
                  }),
                },
              })
            }
            type="button"
          >
            Action + Undo
          </button>
          <button
            className="rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium hover:bg-neutral-100"
            onClick={handlePromiseDemo}
            type="button"
          >
            Promise (Loading → Success)
          </button>
          <button
            className="rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium hover:bg-neutral-100"
            onClick={handleProgressDemo}
            type="button"
          >
            Progress Bar
          </button>
          <button
            className="rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium hover:bg-neutral-100"
            onClick={() => toast.dismiss()}
            type="button"
          >
            Dismiss All
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700">Configuration</h2>

        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-500">Position</div>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  position === pos
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 hover:bg-neutral-100"
                }`}
                key={pos}
                onClick={() => handlePositionChange(pos)}
                type="button"
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-500">Theme</div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  theme === t
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 hover:bg-neutral-100"
                }`}
                key={t}
                onClick={() => handleThemeChange(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              sound
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-neutral-300 hover:bg-neutral-100"
            }`}
            onClick={handleSoundToggle}
            type="button"
          >
            Sound Chime: {sound ? "ON" : "OFF"}
          </button>
          <span className="text-xs text-neutral-500">
            Mẹo: bấm liên tục cùng 1 nút để xem counter bump, hoặc kéo toast để fling-dismiss.
          </span>
        </div>
      </section>
    </main>
  );
}
