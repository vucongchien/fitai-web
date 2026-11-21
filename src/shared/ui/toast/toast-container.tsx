"use client";

import Image from "next/image";
import { useCallback, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";

import {
  ICONS,
  bindToast,
  dingToast,
  injectStyles,
  onToastKey,
  type DingLabels,
  type DingPosition,
  type DingTheme,
  type DingToastRecord,
} from "./ding-engine";
import { bindNetworkToast } from "./network-status-toast";

interface ToastItemProps {
  t: DingToastRecord;
  i: number;
  labels: DingLabels;
}

function DingToastItem({ t, i, labels }: ToastItemProps) {
  const slotRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      return bindToast(node, t.id, dingToast);
    },
    [t.id],
  );

  const sticky = t.duration === 0 && t.type !== "loading" && !t.secondary;

  return (
    <div
      className="tst-slot"
      ref={slotRef}
      style={{ "--tst-i": i } as CSSProperties}
      tabIndex={-1}
    >
      <div
        className={t.className ? `tst ${t.className}` : "tst"}
        data-phase={t.phase}
        data-type={t.type}
        style={{ "--tst-life": `${t.duration}ms` } as CSSProperties}
      >
        {(t.action || t.secondary) && t.duration > 0 ? (
          <div className="tst-timer" key={t.duration} />
        ) : null}
        {t.progress !== undefined ? (
          <div className="tst-progress" style={{ "--pg": t.progress } as CSSProperties} />
        ) : null}
        <div className="tst-icon">
          {t.image ? (
            <Image alt="" className="tst-media" height={28} src={t.image} unoptimized width={28} />
          ) : (
            <div className="tst-badge">
              <svg
                aria-hidden="true"
                className="tst-svg"
                height={22}
                viewBox="0 0 24 24"
                width={22}
              >
                {ICONS[t.type].map((d) => (
                  <path d={d} key={d} pathLength={1} />
                ))}
              </svg>
            </div>
          )}
        </div>
        <div className="tst-body">
          <div className="tst-copy">
            <div className="tst-title">
              {t.title}
              {t.count > 1 ? <span className="tst-count">×{t.count}</span> : null}
              {t.meta ? <span className="tst-meta">{t.meta}</span> : null}
            </div>
            {t.description ? <div className="tst-desc">{t.description}</div> : null}
          </div>
          {t.secondary ? (
            <button
              className="tst-action tst-secondary"
              onClick={() => dingToast.act(t.id, "secondary")}
              tabIndex={t.phase === "open" ? 0 : -1}
              type="button"
            >
              {t.secondary.label}
            </button>
          ) : null}
          {t.action ? (
            <button
              className="tst-action"
              onClick={() => dingToast.act(t.id)}
              tabIndex={t.phase === "open" ? 0 : -1}
              type="button"
            >
              {t.action.label}
            </button>
          ) : null}
          {sticky ? (
            <button
              aria-label={labels.dismiss}
              className="tst-close"
              onClick={() => dingToast.dismiss(t.id)}
              tabIndex={t.phase === "open" ? 0 : -1}
              type="button"
            >
              <svg aria-hidden="true" height={12} viewBox="0 0 24 24" width={12}>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export interface ToastContainerProps {
  position?: DingPosition;
  theme?: DingTheme;
  labels?: Partial<DingLabels>;
  nonce?: string;
}

export function ToastContainer({ position, theme, labels, nonce }: ToastContainerProps = {}) {
  const state = useSyncExternalStore(dingToast.subscribe, dingToast.getState, dingToast.getState);
  const regionLabel = labels?.region;
  const dismissLabel = labels?.dismiss;

  const viewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      injectStyles(document, { nonce });
      if (position || theme || regionLabel !== undefined || dismissLabel !== undefined) {
        dingToast.configure({
          position,
          theme,
          labels:
            regionLabel !== undefined || dismissLabel !== undefined
              ? { region: regionLabel, dismiss: dismissLabel }
              : undefined,
        });
      }
      document.addEventListener("keydown", onToastKey);
      const stopNetwork = bindNetworkToast();
      return () => {
        document.removeEventListener("keydown", onToastKey);
        stopNetwork();
      };
    },
    [nonce, position, theme, regionLabel, dismissLabel],
  );

  const n = state.toasts.length;

  return (
    <div
      aria-label={state.labels.region}
      className="tst-viewport"
      data-position={state.position}
      data-theme={state.theme}
      onBlur={() => dingToast.resume()}
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) dingToast.pause();
      }}
      onPointerEnter={() => dingToast.pause()}
      onPointerLeave={() => dingToast.resume()}
      ref={viewportRef}
      role="region"
    >
      <div className="tst-sr" role="status">
        {state.status}
      </div>
      <div className="tst-sr" role="alert">
        {state.alert}
      </div>
      {state.toasts.map((t, idx) => (
        <DingToastItem i={n - 1 - idx} key={t.id} labels={state.labels} t={t} />
      ))}
    </div>
  );
}
