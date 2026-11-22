export type DingToastType = "success" | "error" | "warning" | "info" | "loading";
export type DingToastPhase = "enter" | "open" | "closing" | "exit";
export type DingPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type DingTheme = "system" | "light" | "dark";

export interface DingSpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface DingSpringsConfig {
  enter?: DingSpringConfig;
  morph?: DingSpringConfig;
  stack?: DingSpringConfig;
}

export interface DingAction {
  label: string;
  onClick: () => DingUpdatePatch | void;
}

export interface DingLabels {
  region: string;
  dismiss: string;
}

export interface DingShowOptions {
  id?: string;
  description?: string;
  duration?: number;
  action?: DingAction;
  secondary?: DingAction;
  onClick?: () => void;
  meta?: string;
  image?: string;
  progress?: number;
  className?: string;
}

export interface DingUpdatePatch {
  type?: DingToastType;
  title?: string;
  description?: string;
  duration?: number;
  action?: DingAction | null;
  secondary?: DingAction | null;
  onClick?: (() => void) | null;
  meta?: string | null;
  image?: string | null;
  progress?: number | null;
  className?: string | null;
}

export interface DingToastRecord {
  id: string;
  type: DingToastType;
  title: string;
  description?: string;
  phase: DingToastPhase;
  duration: number;
  action?: DingAction;
  secondary?: DingAction;
  onClick?: () => void;
  meta?: string;
  image?: string;
  progress?: number;
  count: number;
  className?: string;
}

export interface DingState {
  toasts: DingToastRecord[];
  position: DingPosition;
  theme: DingTheme;
  labels: DingLabels;
  status: string;
  alert: string;
}

export interface DingConfigureOptions {
  position?: DingPosition;
  theme?: DingTheme;
  labels?: Partial<DingLabels>;
  springs?: DingSpringsConfig;
  icons?: Partial<Record<DingToastType, string[]>>;
  sound?: boolean | ((type: DingToastType) => void);
  volume?: number;
}

let audioCtx: AudioContext | undefined;

const CUES: Partial<Record<DingToastType, [number, number, number][]>> = {
  success: [
    [392, 0, 1],
    [523.3, 0.1, 1],
  ],
  error: [
    [233.1, 0, 1],
    [185, 0.13, 1],
  ],
  warning: [
    [349.2, 0, 0.8],
    [349.2, 0.16, 0.6],
  ],
  info: [[466.2, 0, 0.9]],
};

function tone(c: AudioContext, out: AudioNode, freq: number, at: number, level: number) {
  const t = c.currentTime + at;
  const f = freq * (1 + (Math.random() - 0.5) * 8e-3);
  const partials: [number, number, number][] = [
    [1, 0.6, 0.5],
    [2, 0.06, 0.15],
  ];
  for (const [mult, gain, decay] of partials) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.value = f * mult;
    g.gain.setValueAtTime(1e-4, t);
    g.gain.linearRampToValueAtTime(gain * level, t + 0.015);
    g.gain.exponentialRampToValueAtTime(1e-4, t + decay);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }
}

export function chime(type: DingToastType, volume = 0.5) {
  const cue = CUES[type];
  if (!cue || typeof AudioContext === "undefined") return;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    if (audioCtx.state === "closed") return;
    const master = audioCtx.createGain();
    master.gain.value = Math.min(1, Math.max(0, volume)) * 0.45;
    const soften = audioCtx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 1300;
    const echo = audioCtx.createDelay();
    echo.delayTime.value = 0.11;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.1;
    master.connect(soften);
    soften.connect(audioCtx.destination);
    soften.connect(echo).connect(wet).connect(audioCtx.destination);
    for (const [f, at, level] of cue) tone(audioCtx, master, f, at, level);
  } catch {
    // Audio playback may be blocked by browser autoplay policy
  }
}

const RING = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18";

export const ICONS: Record<DingToastType, string[]> = {
  success: [RING, "M7.9 12.4l3 3 5.3-6"],
  error: [RING, "M9.3 9.3l5.4 5.4", "M14.7 9.3l-5.4 5.4"],
  warning: [RING, "M12 7.6v5.2", "M12 16.3h.01"],
  info: [RING, "M12 11v5.2", "M12 7.8h.01"],
  loading: [RING],
};

function setIcons(icons: Partial<Record<DingToastType, string[]>>) {
  for (const type of Object.keys(icons) as DingToastType[]) {
    const paths = icons[type];
    if (paths?.length) ICONS[type] = [...paths];
  }
}

function position(t: number, k: number, c: number, m: number) {
  const w0 = Math.sqrt(k / m);
  const z = c / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = w0 * Math.sqrt(z * z - 1);
  const r1 = -z * w0 + s;
  const r2 = -z * w0 - s;
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

export function springEasing(config: DingSpringConfig = {}) {
  const { stiffness = 170, damping = 18, mass = 1 } = config;
  const f = (t: number) => position(t, stiffness, damping, mass);
  const dt = 1 / 120;
  const maxT = 5;
  let settle = 0;
  for (let t = 0; t <= maxT; t += dt) if (Math.abs(1 - f(t)) > 1e-3) settle = t;
  settle = Math.max(settle + dt, 0.05);
  const steps = Math.max(2, Math.ceil(settle * 60));
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) pts.push(String(+f((i / steps) * settle).toFixed(4)));
  pts[steps] = "1";
  return { easing: `linear(${pts.join(",")})`, duration: Math.round(settle * 1e3) };
}

const configs = {
  enter: { stiffness: 320, damping: 26 },
  morph: { stiffness: 340, damping: 27 },
  stack: { stiffness: 400, damping: 36 },
};

let springsCache:
  | {
      enter: { easing: string; duration: number };
      morph: { easing: string; duration: number };
      stack: { easing: string; duration: number };
    }
  | undefined;

export function getSprings() {
  return (springsCache ??= {
    enter: springEasing(configs.enter),
    morph: springEasing(configs.morph),
    stack: springEasing(configs.stack),
  });
}

export function setSprings(p: DingSpringsConfig) {
  if (p.enter) Object.assign(configs.enter, p.enter);
  if (p.morph) Object.assign(configs.morph, p.morph);
  if (p.stack) Object.assign(configs.stack, p.stack);
  springsCache = undefined;
  if (typeof document !== "undefined") {
    const el = document.querySelector("style[data-toast]");
    if (el) el.textContent = buildCss();
  }
}

export function buildCss() {
  const { stack, enter } = getSprings();
  return `
.tst-viewport{color-scheme:light dark;--tst-stack:${stack.easing};--tst-stack-dur:${stack.duration}ms;--tst-pop:${enter.easing};--tst-pop-dur:${enter.duration}ms;
--tst-bg:light-dark(#fff,#0c0c0d);--tst-fg:light-dark(#0f0f13,#fafafa);--tst-ring:light-dark(oklch(0 0 0/.08),oklch(1 0 0/.1));
--tst-shadow:0 0 0 1px var(--tst-ring),0 4px 12px -4px light-dark(oklch(0 0 0/.14),oklch(0 0 0/.45));
--tst-success:light-dark(#12a36b,#4ade80);--tst-error:light-dark(#e5484d,#f87171);--tst-warning:light-dark(#c77d00,#fbbf24);--tst-info:light-dark(#2f7de1,#60a5fa);
--tst-size:44px;--tst-radius:22px;--tst-gap:8px;--tst-pad:16px;--tst-stack-offset:10px;--tst-stack-scale:.05;
position:fixed;inset:0;z-index:2147483647;pointer-events:none;font:500 14px/1.3 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.tst-viewport[data-theme=light]{color-scheme:light}
.tst-viewport[data-theme=dark]{color-scheme:dark}
.tst-viewport:dir(rtl){--tst-flip:-1}
.tst-viewport:dir(rtl) .tst-progress::after{transform-origin:right}
.tst-viewport[data-position^=top]{--tst-dir:-1}
.tst-viewport[data-position^=bottom]{--tst-dir:1}
.tst-viewport{--tst-y0:calc(var(--tst-dir,-1)*(var(--tst-size) + var(--tst-pad) + 24px))}
.tst-viewport[data-position$=center]{--tst-ox:50%;--tx:-50%}
.tst-viewport[data-position$=left]{--tst-ox:0%;--tx:0px}
.tst-viewport[data-position$=right]{--tst-ox:100%;--tx:0px}
.tst-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.tst-slot{position:absolute;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:grab;--tst-i:0;
--y:calc(var(--tst-dir)*-1*var(--tst-i)*var(--tst-stack-offset));--s:calc(1 - var(--tst-i)*var(--tst-stack-scale));
transform:translate(calc(var(--tx) + var(--dx,0px)),calc(var(--y) + var(--dy,0px))) scale(var(--s));
transform-origin:var(--tst-ox) var(--tst-oy);z-index:calc(100 - var(--tst-i));
transition-property:transform,opacity;transition-duration:var(--tst-stack-dur),.25s;transition-timing-function:var(--tst-stack),ease-out}
.tst-slot::after{content:'';position:absolute;z-index:-1;left:0;right:0;top:calc(var(--tst-gap)/-2);bottom:calc(var(--tst-gap)/-2)}
.tst-slot[data-clickable="true"]{cursor:pointer}
.tst-slot[data-dragging]{transition:none;cursor:grabbing}
.tst-slot[data-flung]{transition:transform .38s cubic-bezier(.2,.8,.3,1),opacity .25s ease-out;opacity:0;pointer-events:none}
.tst-viewport[data-position^=top] .tst-slot{top:calc(var(--tst-pad) + env(safe-area-inset-top,0px));--tst-oy:0%}
.tst-viewport[data-position^=bottom] .tst-slot{bottom:calc(var(--tst-pad) + env(safe-area-inset-bottom,0px));--tst-oy:100%}
.tst-viewport[data-position$=center] .tst-slot{left:50%}
.tst-viewport[data-position$=left] .tst-slot{left:var(--tst-pad)}
.tst-viewport[data-position$=right] .tst-slot{right:var(--tst-pad)}
.tst{--c:var(--tst-fg);--fill:var(--tst-bg);--on:var(--tst-fg);--tp:0;--ap:0;position:relative;box-sizing:border-box;width:var(--tst-size);height:var(--tst-size);border:1px solid transparent;
border-radius:var(--r,min(var(--tst-radius),calc(var(--tst-size)/2)));overflow:hidden;color:var(--on);background:var(--fill);box-shadow:var(--tst-shadow);
translate:0 var(--tst-y0);scale:var(--tst-enter-scale,.5);opacity:0;will-change:translate,scale}
.tst[data-settled]{will-change:auto}
.tst[data-settled] .tst-body{filter:none;transform:none}
.tst[data-phase=exit]{animation:tst-out .15s ease-out both}
.tst[data-type=success]{--c:var(--tst-success)}
.tst[data-type=error]{--c:var(--tst-error)}
.tst[data-type=warning]{--c:var(--tst-warning)}
.tst[data-type=info]{--c:var(--tst-info)}

.tst-icon{position:absolute;inset-inline-start:-1px;top:-1px;width:var(--tst-size);height:var(--tst-size);display:grid;place-items:center}
.tst-media{width:28px;height:28px;border-radius:50%;object-fit:cover;outline:1px solid light-dark(oklch(0 0 0/.1),oklch(1 0 0/.1));outline-offset:-1px;animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both}
.tst-badge{position:relative;width:24px;height:24px;display:grid;place-items:center}
.tst-svg{width:22px;height:22px;fill:none;stroke:var(--c);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:stroke .3s cubic-bezier(.2,0,0,1);animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both}
.tst-svg path{stroke-dasharray:1;stroke-dashoffset:1;animation:tst-draw .5s cubic-bezier(.4,0,.2,1) .15s forwards}
.tst-svg path:first-child{stroke-dasharray:1 1;transition:stroke-dasharray .65s cubic-bezier(.4,0,.2,1)}
.tst[data-type=loading] .tst-svg path:first-child{stroke-dasharray:.28 .72}
.tst{--md:.55s}
.tst[data-ready]{--md:.05s}
.tst-svg path{transform-box:fill-box;transform-origin:center}
.tst-svg path:nth-child(n+2){animation-duration:.32s;animation-delay:var(--md)}
.tst-svg path:nth-child(3){animation-delay:calc(var(--md) + .08s)}
.tst[data-type=success] .tst-svg{animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both,tst-pulse .45s var(--tst-pop) calc(var(--md) + .25s)}
.tst[data-type=success] .tst-badge::after{content:'';position:absolute;inset:1px;border-radius:50%;border:1.5px solid var(--c);opacity:0;animation:tst-ripple .7s cubic-bezier(.2,0,0,1) calc(var(--md) + .25s)}
.tst[data-type=error] .tst-svg{animation:tst-swap var(--tst-stack-dur) var(--tst-stack) .1s both,tst-shake .42s cubic-bezier(.3,0,.3,1) calc(var(--md) + .3s)}
.tst[data-type=warning] .tst-svg path:nth-child(2){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-drop .5s var(--tst-pop) var(--md) both}
.tst[data-type=warning] .tst-svg path:nth-child(3){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-dot .38s var(--tst-pop) calc(var(--md) + .16s) both}
.tst[data-type=info] .tst-svg path:nth-child(3){stroke-dasharray:none;stroke-dashoffset:0;animation:tst-dot .4s var(--tst-pop) var(--md) both}
.tst[data-type=info] .tst-svg path:nth-child(2){animation-delay:calc(var(--md) + .16s)}

.tst-body{position:absolute;inset-inline-start:calc(var(--tst-size) - 1px);top:-1px;display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;width:max-content;max-width:calc(100vw - 2*var(--tst-pad) - var(--tst-size) + 1px);min-height:var(--tst-size);padding-inline-end:8px;
opacity:calc(var(--tp)*1.5 - .25);filter:blur(calc((1 - var(--tp))*10px));transform:translateX(calc((1 - var(--tp))*-12px*var(--tst-flip,1)))}
.tst-body:has(.tst-action,.tst-close){padding-inline-end:8px;padding-bottom:0}
.tst-body[data-wrapped]{padding-bottom:10px}
.tst-body[data-wrapped] .tst-copy{flex-basis:100%;max-width:none}
.tst-body[data-wrapped] .tst-copy + *{margin-inline-start:auto}
.tst-copy{width:max-content;max-width:min(340px,calc(100vw - 176px));padding-block:12px;padding-inline:0 6px;line-height:1.4;text-wrap:pretty;overflow-wrap:anywhere}
.tst-title{font-weight:550;font-variant-numeric:tabular-nums}
.tst-count,.tst-meta{margin-inline-start:6px;opacity:.7}
.tst-meta{font-weight:450;font-size:12px}
.tst-timer{position:absolute;inset:auto 0 0 0;height:2px;background:var(--c);opacity:.45;transform-origin:left;animation:tst-timer var(--tst-life) linear forwards;pointer-events:none}
.tst-viewport:hover .tst-timer,.tst-viewport:has(:focus-visible) .tst-timer{animation-play-state:paused}
.tst-viewport:dir(rtl) .tst-timer{transform-origin:right}
.tst-ghost{position:absolute;inset-inline-start:0;top:0;pointer-events:none}
.tst-progress{position:absolute;inset:auto 0 0 0;height:3px;background:color-mix(in srgb,var(--on) 14%,transparent);opacity:var(--tp);pointer-events:none}
.tst-progress::after{content:'';position:absolute;inset:0;background:var(--c);transform-origin:left;transform:scaleX(var(--pg,0));transition:transform .3s cubic-bezier(.2,0,0,1)}
.tst-desc{margin-top:3px;font-size:13px;font-weight:450;opacity:.65}
.tst[data-phase=open] .tst-desc{animation:tst-in-up var(--tst-pop-dur) var(--tst-pop) .1s both}
.tst[data-phase=open] .tst-action,.tst[data-phase=open] .tst-close{animation:tst-in-btn var(--tst-pop-dur) var(--tst-pop) .16s backwards}
.tst[data-phase=open] .tst-secondary{animation-delay:.1s}
.tst-action,.tst-close{position:relative;flex:none;margin:0;border:0;color:inherit;font:inherit;cursor:pointer;background:transparent;
opacity:calc(var(--ap)*1.3 - .15);transform:scale(calc(.85 + var(--ap)*.15));
transition-property:background-color,scale;transition-duration:.15s;transition-timing-function:ease-out}
.tst-action{height:30px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:600;background:var(--on);color:var(--fill)}
.tst-secondary{background:transparent;color:color-mix(in srgb,var(--on) 65%,transparent);padding:0 10px}
.tst-close{width:30px;height:30px;padding:0;border-radius:50%;display:grid;place-items:center}
.tst-action::before,.tst-close::before{content:'';position:absolute;inset:-7px -3px}
.tst-slot:focus-visible{outline:none}
.tst-slot:focus-visible .tst{outline:2px solid var(--on);outline-offset:-5px}
.tst-close svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
@media (hover:hover){.tst-action:hover{background:color-mix(in srgb,var(--on) 82%,var(--fill))}.tst-secondary:hover,.tst-close:hover{background:color-mix(in srgb,var(--on) 10%,transparent);color:var(--on)}}
.tst-action:not(:disabled):active,.tst-close:not(:disabled):active{scale:.96}
.tst-action:focus-visible,.tst-close:focus-visible{outline:2px solid var(--on);outline-offset:2px}

@keyframes tst-out{to{transform:translateY(calc(var(--tst-dir)*12px)) scale(.92);opacity:0;filter:blur(4px)}}
@keyframes tst-swap{from{opacity:0;scale:.25;filter:blur(4px)}}
@keyframes tst-timer{to{transform:scaleX(0)}}
@keyframes tst-in-btn{from{opacity:0;translate:0 8px;filter:blur(4px)}}
@keyframes tst-in-up{from{opacity:0;transform:translateY(12px);filter:blur(4px)}}
@keyframes tst-draw{to{stroke-dashoffset:0}}
@keyframes tst-pulse{40%{transform:scale(1.14)}}
@keyframes tst-ripple{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
@keyframes tst-shake{20%{translate:-2.5px 0}45%{translate:2.5px 0}70%{translate:-1.5px 0}to{translate:0}}
@keyframes tst-drop{from{opacity:0;translate:0 -5px}}
@keyframes tst-dot{from{opacity:0;scale:0}}
@keyframes tst-fade{from{opacity:0}}
@keyframes tst-fade-out{to{opacity:0}}
@media (prefers-reduced-motion:reduce){
.tst{translate:none!important;scale:none!important;animation:tst-fade .2s ease-out both}
.tst[data-phase=exit],.tst-body{filter:none!important;transform:none!important}
.tst-svg,.tst-desc,.tst-media,.tst-action,.tst-close,.tst-badge::after{animation:none!important}
.tst-timer{display:none}
.tst-svg path{animation:none!important;stroke-dashoffset:0!important}
.tst-slot{transition-property:opacity}
}
`;
}

export function injectStyles(doc: Document = document, opts: { nonce?: string } = {}) {
  if (doc.querySelector("style[data-toast]")) return;
  const el = doc.createElement("style");
  el.setAttribute("data-toast", "");
  if (opts.nonce) el.nonce = opts.nonce;
  el.textContent = buildCss();
  doc.head.prepend(el);
}

export const TIMING = {
  openDelay: 450,
  closing: 340,
  exit: 220,
  duration: 5000,
};

const autoDuration = (type: DingToastType, hasAction: boolean) =>
  type === "loading" || type === "error" || hasAction ? 0 : TIMING.duration;

const DEFAULT_LABELS: DingLabels = {
  region: "Notifications",
  dismiss: "Dismiss notification",
};

function definedOnly<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

interface ToastEntry {
  startedAt: number;
  remaining: number;
  base: number;
  paused: boolean;
  phaseTimer?: ReturnType<typeof setTimeout>;
  lifeTimer?: ReturnType<typeof setTimeout>;
}

export function createToaster() {
  let state: DingState = {
    toasts: [],
    position: "top-center",
    theme: "system",
    labels: DEFAULT_LABELS,
    status: "",
    alert: "",
  };
  let flip = false;
  const subs = new Set<() => void>();
  const entries = new Map<string, ToastEntry>();
  let counter = 0;
  let sound: boolean | ((type: DingToastType) => void) = false;
  let volume = 0.5;
  const live = new Map<string, string>();
  const owner = new Map<string, string>();

  const emit = () => {
    for (const fn of subs) fn();
  };

  const setToasts = (toasts: DingToastRecord[]) => {
    state = { ...state, toasts };
    emit();
  };

  const announce = (type: DingToastType, title: string, description?: string) => {
    if (typeof sound === "function") sound(type);
    else if (sound) chime(type, volume);
    flip = !flip;
    const text = (description ? `${title}. ${description}` : title) + (flip ? "\u00A0" : "");
    state = { ...state, [type === "error" ? "alert" : "status"]: text };
    emit();
  };

  const find = (id: string) => state.toasts.find((t) => t.id === id);

  const patch = (id: string, p: Partial<DingToastRecord>) =>
    setToasts(state.toasts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  function startLife(id: string) {
    const e = entries.get(id);
    if (!e) return;
    if (e.lifeTimer !== undefined) clearTimeout(e.lifeTimer);
    e.lifeTimer = undefined;
    if (find(id)?.phase !== "open" || e.paused || e.remaining <= 0) return;
    e.startedAt = Date.now();
    e.lifeTimer = setTimeout(() => dismiss(id), e.remaining);
  }

  function apply(id: string, p: DingUpdatePatch) {
    const t = find(id);
    const e = entries.get(id);
    if (!t || !e) return;
    patch(id, {
      ...(p.title !== undefined && { title: p.title }),
      ...(p.description !== undefined && { description: p.description }),
      ...(p.progress !== undefined && { progress: p.progress ?? undefined }),
      ...(p.action !== undefined && { action: p.action ?? undefined }),
      ...(p.secondary !== undefined && { secondary: p.secondary ?? undefined }),
      ...(p.onClick !== undefined && { onClick: p.onClick ?? undefined }),
      ...(p.meta !== undefined && { meta: p.meta ?? undefined }),
      ...(p.image !== undefined && { image: p.image ?? undefined }),
      ...(p.className !== undefined && { className: p.className ?? undefined }),
      ...(p.type !== undefined && { type: p.type }),
    });
    if (p.duration !== undefined) {
      e.remaining = p.duration;
    } else if (p.type !== undefined || p.action !== undefined || p.secondary !== undefined) {
      const n = find(id);
      if (n) e.remaining = autoDuration(n.type, !!(n.action || n.secondary));
    }
    if (
      p.duration !== undefined ||
      p.type !== undefined ||
      p.action !== undefined ||
      p.secondary !== undefined
    ) {
      e.base = e.remaining;
      patch(id, { duration: e.remaining });
    }
    startLife(id);
    const quiet = p.progress !== undefined && p.type === undefined;
    if (!quiet && (p.title !== undefined || p.description !== undefined || p.type !== undefined)) {
      announce(p.type ?? t.type, p.title ?? t.title, p.description ?? t.description);
    }
  }

  function bump(id: string) {
    const e = entries.get(id);
    const t = find(id);
    if (!e || !t) return;
    patch(id, { count: t.count + 1 });
    e.remaining = e.base;
    startLife(id);
  }

  function show(type: DingToastType, title: string, opts: DingShowOptions = {}): string {
    if (
      opts.id === undefined &&
      !opts.action &&
      !opts.secondary &&
      !opts.onClick &&
      !opts.image &&
      !opts.meta &&
      !opts.className
    ) {
      const dup = state.toasts.at(-1);
      if (
        dup &&
        dup.type === type &&
        dup.title === title &&
        dup.description === opts.description &&
        (dup.phase === "enter" || dup.phase === "open")
      ) {
        bump(dup.id);
        return dup.id;
      }
    }
    const id = opts.id ?? `toast-${++counter}`;
    const cur = state.toasts.filter((t) => t.phase === "enter" || t.phase === "open").at(-1);
    if (cur) {
      live.set(id, cur.id);
      owner.set(cur.id, id);
      patch(cur.id, { count: 1 });
      apply(cur.id, {
        type,
        title,
        description: opts.description ?? "",
        action: opts.action ?? null,
        secondary: opts.secondary ?? null,
        onClick: opts.onClick ?? null,
        meta: opts.meta ?? null,
        image: opts.image ?? null,
        className: opts.className ?? null,
        progress: opts.progress ?? null,
        ...(opts.duration !== undefined && { duration: opts.duration }),
      });
      return id;
    }
    owner.set(id, id);
    const first = opts.duration ?? autoDuration(type, !!(opts.action || opts.secondary));
    const e: ToastEntry = { startedAt: 0, remaining: first, base: first, paused: false };
    entries.set(id, e);
    setToasts([
      ...state.toasts,
      {
        id,
        type,
        title,
        description: opts.description,
        phase: "enter",
        duration: e.remaining,
        action: opts.action,
        secondary: opts.secondary,
        onClick: opts.onClick,
        meta: opts.meta,
        image: opts.image,
        progress: opts.progress,
        count: 1,
        className: opts.className,
      },
    ]);
    announce(type, title, opts.description);
    e.phaseTimer = setTimeout(() => {
      if (find(id)?.phase !== "enter") return;
      patch(id, { phase: "open" });
      startLife(id);
    }, TIMING.openDelay);
    return id;
  }

  function update(callerId: string, p: DingUpdatePatch) {
    const id = live.get(callerId) ?? callerId;
    if (owner.get(id) === callerId) apply(id, p);
  }

  function act(id: string, which: "action" | "secondary" = "action") {
    const result = find(id)?.[which]?.onClick();
    if (result && typeof result === "object") {
      apply(id, { action: null, secondary: null, ...result });
    } else {
      dismiss(id);
    }
  }

  function click(id: string) {
    const t = find(id);
    if (!t || !t.onClick || t.phase === "closing" || t.phase === "exit") return;
    t.onClick();
    dismiss(id);
  }

  function dismiss(id?: string, opts: { immediate?: boolean } = {}) {
    if (id === undefined) {
      for (const t of state.toasts) dismiss(t.id, opts);
      return;
    }
    const resolvedId = live.get(id) ?? id;
    const t = find(resolvedId);
    const e = entries.get(resolvedId);
    if (!t || !e || t.phase === "exit" || (t.phase === "closing" && !opts.immediate)) return;
    if (e.phaseTimer !== undefined) clearTimeout(e.phaseTimer);
    if (e.lifeTimer !== undefined) clearTimeout(e.lifeTimer);
    const leave = () => {
      patch(resolvedId, { phase: "exit" });
      e.phaseTimer = setTimeout(() => {
        entries.delete(resolvedId);
        owner.delete(resolvedId);
        live.forEach((v, k) => {
          if (v === resolvedId) live.delete(k);
        });
        setToasts(state.toasts.filter((x) => x.id !== resolvedId));
      }, TIMING.exit);
    };
    if (opts.immediate) {
      leave();
      return;
    }
    patch(resolvedId, { phase: "closing" });
    e.phaseTimer = setTimeout(leave, TIMING.closing);
  }

  function pause(id?: string) {
    if (id === undefined) {
      for (const key of entries.keys()) pause(key);
      return;
    }
    const e = entries.get(id);
    if (!e || e.paused) return;
    e.paused = true;
    if (e.lifeTimer !== undefined) {
      clearTimeout(e.lifeTimer);
      e.lifeTimer = undefined;
      e.remaining = Math.max(0, e.remaining - (Date.now() - e.startedAt));
    }
  }

  function resume(id?: string) {
    if (id === undefined) {
      for (const key of entries.keys()) resume(key);
      return;
    }
    const e = entries.get(id);
    if (!e) return;
    e.paused = false;
    startLife(id);
  }

  function promise<T>(
    p: Promise<T> | (() => Promise<T>),
    m: {
      loading: string;
      success: string | ((v: T) => string);
      error: string | ((err: unknown) => string);
    },
  ): Promise<T> {
    const id = show("loading", m.loading);
    const pr = typeof p === "function" ? p() : p;
    pr.then(
      (v) =>
        update(id, {
          type: "success",
          title: typeof m.success === "function" ? m.success(v) : m.success,
        }),
      (err: unknown) =>
        update(id, {
          type: "error",
          title: typeof m.error === "function" ? m.error(err) : m.error,
        }),
    );
    return pr;
  }

  return {
    show,
    success: (title: string, o?: DingShowOptions) => show("success", title, o),
    error: (title: string, o?: DingShowOptions) => show("error", title, o),
    warning: (title: string, o?: DingShowOptions) => show("warning", title, o),
    info: (title: string, o?: DingShowOptions) => show("info", title, o),
    loading: (title: string, o?: DingShowOptions) => show("loading", title, o),
    promise,
    update,
    act,
    click,
    dismiss,
    pause,
    resume,
    configure(c: DingConfigureOptions) {
      if (c.springs) setSprings(c.springs);
      if (c.icons) setIcons(c.icons);
      if (c.sound !== undefined) sound = c.sound;
      if (c.volume !== undefined) volume = c.volume;
      state = {
        ...state,
        ...(c.position && { position: c.position }),
        ...(c.theme && { theme: c.theme }),
        ...(c.labels && { labels: { ...state.labels, ...definedOnly(c.labels) } }),
      };
      emit();
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    getState: () => state,
  };
}

export type DingToaster = ReturnType<typeof createToaster>;
export const dingToast = createToaster();

class Spring {
  x: number;
  v = 0;
  to: number;
  cfg: { stiffness: number; damping: number; mass: number };

  constructor(x: number, cfg?: DingSpringConfig) {
    this.x = x;
    this.to = x;
    this.cfg = { stiffness: 170, damping: 18, mass: 1, ...cfg };
  }

  tune(c: DingSpringConfig) {
    Object.assign(this.cfg, c);
  }

  step(dt: number) {
    const { stiffness: k, damping: c, mass: m } = this.cfg;
    const h = 1 / 240;
    for (let t = 0; t < dt; t += h) {
      this.v += ((-k * (this.x - this.to) - c * this.v) / m) * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.v) < 0.05 && Math.abs(this.x - this.to) < 0.05) {
      this.x = this.to;
      this.v = 0;
      return false;
    }
    return true;
  }
}

const tasks = new Set<(dt: number) => boolean>();
let raf = 0;
let last = 0;

function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1e3);
  last = now;
  for (const t of tasks) if (!t(dt)) tasks.delete(t);
  raf = tasks.size ? requestAnimationFrame(tick) : 0;
}

function run(task: (dt: number) => boolean) {
  tasks.add(task);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function watchMotion(slot: HTMLElement, id: string, t: DingToaster) {
  const pill = slot.firstElementChild;
  if (!(pill instanceof HTMLElement)) return () => {};
  const body = pill.querySelector<HTMLElement>(".tst-body");
  const cs = getComputedStyle(pill);
  const SIZE = parseFloat(cs.getPropertyValue("--tst-size")) || 44;
  const dir = Number(cs.getPropertyValue("--tst-dir")) || -1;
  const Y0 = dir * (SIZE + (parseFloat(cs.getPropertyValue("--tst-pad")) || 16) + 24);
  const readR = () => {
    const v = parseFloat(cs.getPropertyValue("--tst-radius"));
    return Number.isNaN(v) ? 24 : v;
  };
  readR();
  const num = (name: string, d: number) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isNaN(v) ? d : v;
  };
  const s0 = num("--tst-enter-scale", 0.5);
  const stretchOn = num("--tst-stretch", 1);
  const w = new Spring(SIZE, configs.morph);
  const h = new Spring(SIZE, configs.morph);
  const y = new Spring(Y0, configs.enter);
  y.to = 0;
  const x = new Spring(0, { stiffness: 520, damping: 13 });
  let phase: DingToastPhase = t.getState().toasts.find((x2) => x2.id === id)?.phase ?? "enter";
  let copyEnd = SIZE;
  let actionW = 0;
  let fullW = SIZE;
  let fullH = SIZE;

  const applyStyles = () => {
    const tp = clamp((w.x - SIZE) / Math.max(1, copyEnd - SIZE));
    const ap = actionW > 2 ? clamp((w.x - copyEnd) / actionW) : clamp((tp - 0.45) / 0.55);
    const e = (y.x - Y0) / -Y0;
    const stretch = clamp(Math.abs(y.v) / 6e3, 0, 0.18) * stretchOn;
    const squash = clamp(Math.abs(w.v) / 2e4, 0, 0.05);
    const k = s0 + (1 - s0) * e;
    pill.style.width = `${w.x}px`;
    pill.style.height = `${h.x}px`;
    pill.style.setProperty("--r", `${Math.min(h.x / 2, readR())}px`);
    pill.style.translate = `${x.x}px ${y.x}px`;
    pill.style.scale = `${k * (1 - stretch * 0.7) * (1 + squash * 0.5)} ${k * (1 + stretch) * (1 - squash)}`;
    pill.style.opacity = String(clamp(e * 2));
    pill.style.setProperty("--tp", tp.toFixed(3));
    pill.style.setProperty("--ap", ap.toFixed(3));
    pill.toggleAttribute("data-settled", tp >= 1);
  };

  const task = (dt: number) => {
    const moving = [w.step(dt), h.step(dt), y.step(dt), x.step(dt)].some(Boolean);
    applyStyles();
    if (!moving && phase !== "exit") {
      pill.style.translate = "none";
      pill.style.scale = "none";
    }
    return moving;
  };

  const kick = () => {
    if (reduced()) {
      for (const s of [w, h, y, x]) {
        s.x = s.to;
        s.v = 0;
      }
      applyStyles();
    } else {
      run(task);
    }
  };

  const aim = () => {
    const open = phase === "open";
    w.to = open ? fullW : SIZE;
    h.to = open ? fullH : SIZE;
  };

  const measure = () => {
    if (!body) return;
    const copyEl = body.querySelector<HTMLElement>(".tst-copy");
    const actionEl = body.querySelector<HTMLElement>(".tst-action, .tst-close");
    const buttons = [...body.querySelectorAll<HTMLElement>(".tst-action, .tst-close")];
    const wrapped =
      !!copyEl && buttons.some((b) => b.offsetTop >= copyEl.offsetTop + copyEl.offsetHeight);
    body.toggleAttribute("data-wrapped", wrapped);
    fullW = Math.ceil((SIZE + body.offsetWidth) / 2) * 2;
    fullH = Math.max(SIZE, body.offsetHeight);
    const stacked =
      !!actionEl && !!copyEl && actionEl.offsetTop >= copyEl.offsetTop + copyEl.offsetHeight;
    copyEnd = actionEl && copyEl && !stacked ? SIZE + copyEl.offsetWidth + 6 : fullW;
    actionW = fullW - copyEnd;
    if (phase === "open") {
      aim();
      kick();
    }
  };

  const ro = new ResizeObserver(measure);
  if (body) ro.observe(body);
  measure();
  if (phase === "open") {
    w.x = fullW;
    h.x = fullH;
  }
  kick();

  const react = (type: DingToastType) => {
    if (reduced()) return;
    if (type === "error") x.v = 380;
    else if (type === "warning") y.v = -dir * 200;
    else return;
    kick();
  };

  let lastType = t.getState().toasts.find((e) => e.id === id)?.type;
  let count = t.getState().toasts.find((x2) => x2.id === id)?.count ?? 1;

  const unsub = t.subscribe(() => {
    const it = t.getState().toasts.find((x2) => x2.id === id);
    if (!it) return;
    if (it.count > count && phase === "open") {
      y.v = -dir * 240;
      kick();
    }
    count = it.count;
    if (it.type !== lastType) {
      lastType = it.type;
      if (phase === "open") react(it.type);
    }
    if (it.phase === phase) return;
    phase = it.phase;
    if (phase === "closing") {
      w.tune({ stiffness: 380, damping: 36 });
      h.tune({ stiffness: 380, damping: 36 });
      w.v = 320;
    } else {
      w.tune(configs.morph);
      h.tune(configs.morph);
      if (phase === "open") {
        w.v = -260;
        setTimeout(() => {
          if (lastType) react(lastType);
        }, 200);
      }
    }
    if (phase !== "exit") {
      aim();
      kick();
    }
  });

  const copy = body?.querySelector<HTMLElement>(".tst-copy");
  const titleOf = () => copy?.querySelector(".tst-title")?.innerHTML;
  const kind = () => `${pill.dataset.type}|${!!pill.querySelector(".tst-progress")}`;
  let snap = copy
    ? { html: copy.innerHTML, w: copy.offsetWidth, title: titleOf(), kind: kind() }
    : undefined;
  let ghost: HTMLDivElement | undefined;
  let lastRoll = 0;

  const mo = new MutationObserver(() => {
    if (!copy || !body) return;
    const prev = snap;
    snap = { html: copy.innerHTML, w: copy.offsetWidth, title: titleOf(), kind: kind() };
    if (
      !prev ||
      prev.html === snap.html ||
      prev.title === snap.title ||
      (prev.kind === snap.kind && snap.kind.endsWith("true")) ||
      phase !== "open" ||
      reduced()
    ) {
      return;
    }
    if (performance.now() - lastRoll < 450) return;
    lastRoll = performance.now();
    ghost?.remove();
    ghost = document.createElement("div");
    ghost.className = "tst-copy tst-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.width = `${prev.w}px`;
    ghost.innerHTML = prev.html;
    body.append(ghost);
    const g = ghost;
    const easing = "cubic-bezier(.2,.8,.2,1)";
    g.animate(
      [
        { opacity: 1, transform: "none", filter: "blur(0)" },
        { opacity: 0, transform: "translateY(-12px)", filter: "blur(4px)" },
      ],
      { duration: 280, easing, fill: "forwards" },
    ).onfinish = () => g.remove();
    copy.animate(
      [
        { opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ],
      { duration: 380, easing },
    );
  });
  if (copy) mo.observe(copy, { childList: true, characterData: true, subtree: true });

  const getSvg = () => pill.querySelector<SVGSVGElement>(".tst-svg");
  let spin: Animation | undefined;
  let spinOn: SVGSVGElement | null = null;
  const startSpin = () => {
    spin?.cancel();
    spin = undefined;
    spinOn = getSvg();
    if (spinOn && !reduced()) {
      spin = spinOn.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
        duration: 800,
        iterations: Infinity,
      });
    }
  };
  let curType = pill.dataset.type;
  if (curType === "loading") startSpin();
  const ready = setTimeout(() => pill.setAttribute("data-ready", ""), 900);

  const tmo = new MutationObserver(() => {
    const next = pill.dataset.type;
    if (next === curType) return;
    const was = curType;
    curType = next;
    if (next === "loading") {
      startSpin();
      return;
    }
    const now = getSvg();
    if (now && was !== "loading" && !reduced()) {
      const { easing, duration } = getSprings().stack;
      now.animate(
        [
          { scale: 0.6, opacity: 0.3 },
          { scale: 1, opacity: 1 },
        ],
        { duration, easing },
      );
    }
    const svg2 = spinOn;
    if (was === "loading" && spin && svg2?.isConnected) {
      const deg = ((Number(spin.currentTime) % 800) / 800) * 360;
      spin.cancel();
      spin = undefined;
      svg2.animate([{ rotate: `${deg}deg` }, { rotate: "360deg" }], {
        duration: 650,
        easing: "cubic-bezier(.2,.7,.2,1)",
      });
    }
  });

  const imo = new MutationObserver(() => {
    if (curType === "loading" && (!spinOn?.isConnected || spinOn !== getSvg())) startSpin();
  });
  imo.observe(pill, { childList: true, subtree: true });
  tmo.observe(pill, { attributes: true, attributeFilter: ["data-type"] });

  return () => {
    clearTimeout(ready);
    imo.disconnect();
    tmo.disconnect();
    spin?.cancel();
    ro.disconnect();
    mo.disconnect();
    unsub();
    ghost?.remove();
  };
}

function watchDrag(slot: HTMLElement, id: string, t: DingToaster) {
  let sx = 0;
  let sy = 0;
  let t0 = 0;
  let active = false;
  let moved = false;

  const edge = () =>
    slot.closest<HTMLElement>(".tst-viewport")?.dataset.position?.startsWith("top") ? -1 : 1;

  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target instanceof Element && e.target.closest("button"))) return;
    sx = e.clientX;
    sy = e.clientY;
    t0 = e.timeStamp;
    active = true;
    moved = false;
    slot.dataset.pointerState = "down";
    slot.setPointerCapture?.(e.pointerId);
    slot.setAttribute("data-dragging", "");
  };

  const move = (e: PointerEvent) => {
    if (!active) return;
    const dx = e.clientX - sx;
    const rawDy = e.clientY - sy;
    if (Math.hypot(dx, rawDy) >= 8) {
      moved = true;
      slot.dataset.pointerState = "dragged";
    }
    let dy = rawDy;
    if (dy * edge() < 0) dy *= 0.2;
    slot.style.setProperty("--dx", `${dx}px`);
    slot.style.setProperty("--dy", `${dy}px`);
  };

  const up = (e: PointerEvent) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - sx;
    const rawDy = e.clientY - sy;
    const dy = rawDy * edge();
    const speed = Math.hypot(dx, dy) / Math.max(1, e.timeStamp - t0);
    const away = dy > 40 || Math.abs(dx) > 80 || (speed > 0.5 && (dy > 15 || Math.abs(dx) > 15));
    slot.removeAttribute("data-dragging");
    if (away) {
      slot.dataset.pointerState = "dragged";
      const len = Math.hypot(dx, rawDy) || 1;
      const reach = Math.max(160, speed * 320);
      slot.setAttribute("data-flung", "");
      slot.style.setProperty("--dx", `${(dx / len) * reach}px`);
      slot.style.setProperty("--dy", `${(rawDy / len) * reach}px`);
      t.dismiss(id, { immediate: true });
    } else {
      slot.style.removeProperty("--dx");
      slot.style.removeProperty("--dy");
      if (e.type === "pointerup" && !moved && Math.hypot(dx, rawDy) < 10) {
        slot.dataset.pointerState = "tapped";
        t.click(id);
      } else {
        slot.dataset.pointerState = "dragged";
      }
    }
    setTimeout(() => {
      delete slot.dataset.pointerState;
    }, 0);
  };

  slot.addEventListener("pointerdown", down);
  slot.addEventListener("pointermove", move);
  slot.addEventListener("pointerup", up);
  slot.addEventListener("pointercancel", up);

  return () => {
    slot.removeEventListener("pointerdown", down);
    slot.removeEventListener("pointermove", move);
    slot.removeEventListener("pointerup", up);
    slot.removeEventListener("pointercancel", up);
  };
}

export function bindToast(slot: HTMLElement, id: string, t: DingToaster = dingToast) {
  const stopDrag = watchDrag(slot, id, t);
  const stopMotion = watchMotion(slot, id, t);
  return () => {
    stopDrag();
    stopMotion();
  };
}

const BUSY =
  "dialog,[role=dialog],[aria-modal=true],[role=menu],[role=listbox],input,textarea,select,[contenteditable]";

export function onToastKey(e: KeyboardEvent) {
  if (e.defaultPrevented || !dingToast.getState().toasts.length) return;
  if (e.key === "Escape") {
    if (!document.activeElement?.closest(BUSY)) dingToast.dismiss();
  } else if (e.altKey && e.code === "KeyT") {
    const slots = document.querySelectorAll<HTMLElement>(".tst-viewport .tst-slot");
    const target =
      document.querySelector<HTMLElement>('.tst-viewport button:not([tabindex="-1"])') ??
      slots[slots.length - 1];
    target?.focus();
  }
}
