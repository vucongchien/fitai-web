import type {
  PrintExerciseItem,
  RoadmapPageData,
  ScheduleWeek,
  SessionSummary,
} from "@/features/roadmap/model/roadmap-page.types";

export type PrintScope = "all" | "current" | "custom";
export type PrintLanguage = "vi" | "en";
export type PrintLayout = "compact" | "detailed";

export interface RoadmapPrintOptions {
  scope: PrintScope;
  selectedWeeks: number[];
  language: PrintLanguage;
  layout: PrintLayout;
  includeExercises: boolean;
  includeNotes: boolean;
  includeReasoning: boolean;
  includeRestDays: boolean;
  includeCheckboxes: boolean;
}

export const DEFAULT_ROADMAP_PRINT_OPTIONS: RoadmapPrintOptions = {
  scope: "all",
  selectedWeeks: [],
  language: "en",
  layout: "detailed",
  includeExercises: true,
  includeNotes: true,
  includeReasoning: true,
  includeRestDays: true,
  includeCheckboxes: true,
};

const COPY = {
  vi: {
    roadmapTitle: "Lộ trình tập luyện FITAI",
    week: "Tuần",
    weeks: "tuần",
    activeWeek: "Tuần hiện tại",
    restRecovery: "Nghỉ ngơi & Phục hồi",
    min: "phút",
    targetRpe: "Mục tiêu RPE",
    phaseWarmup: "Khởi động",
    phaseMain: "Bài chính",
    phaseCooldown: "Giãn cơ",
    colExercise: "Bài tập",
    colPrescription: "Hiệp × Lần",
    colRest: "Nghỉ",
    colNotes: "Ghi chú kỹ thuật",
    sec: "giây",
    status: {
      complete: "HOÀN THÀNH",
      next: "BUỔI TIẾP THEO",
      planned: "DỰ KIẾN",
      rest: "NGHỈ NGƠI",
      skipped: "ĐÃ BỎ QUA",
      stopped: "ĐÃ DỪNG",
    },
  },
  en: {
    roadmapTitle: "FITAI Training Roadmap",
    week: "Week",
    weeks: "Weeks",
    activeWeek: "Active",
    restRecovery: "Rest & Recovery",
    min: "min",
    targetRpe: "Target RPE",
    phaseWarmup: "Warm-Up",
    phaseMain: "Main Work",
    phaseCooldown: "Cool-Down",
    colExercise: "Exercise",
    colPrescription: "Sets × Reps",
    colRest: "Rest",
    colNotes: "Technique Notes",
    sec: "sec",
    status: {
      complete: "COMPLETE",
      next: "NEXT",
      planned: "PLANNED",
      rest: "REST",
      skipped: "SKIPPED",
      stopped: "STOPPED",
    },
  },
} as const;

function escapeHtml(raw: string): string {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderExercisesTable(
  exercises: PrintExerciseItem[],
  options: RoadmapPrintOptions,
  t: (typeof COPY)[PrintLanguage],
): string {
  if (!options.includeExercises || exercises.length === 0) {
    return "";
  }

  const phaseLabel = (phase: PrintExerciseItem["phase"]) => {
    if (phase === "warmup") {
      return t.phaseWarmup;
    }
    if (phase === "cooldown") {
      return t.phaseCooldown;
    }
    return t.phaseMain;
  };

  const rows = exercises
    .map((ex) => {
      const checkCell = options.includeCheckboxes ? `<td class="check-col">☐</td>` : "";
      const notesCell = options.includeNotes
        ? `<td class="notes-col">${escapeHtml(ex.notes || "—")}</td>`
        : "";
      return `
        <tr>
          ${checkCell}
          <td>
            <span class="phase-tag phase-${ex.phase}">${escapeHtml(phaseLabel(ex.phase))}</span>
            <strong>${escapeHtml(ex.name)}</strong>
          </td>
          <td class="mono">${ex.sets} × ${ex.reps}</td>
          <td class="mono">${ex.restSec} ${t.sec}</td>
          ${notesCell}
        </tr>`;
    })
    .join("\n");

  const checkHead = options.includeCheckboxes ? `<th class="check-col">✓</th>` : "";
  const notesHead = options.includeNotes ? `<th>${t.colNotes}</th>` : "";

  return `
    <table class="ex-table">
      <thead>
        <tr>
          ${checkHead}
          <th>${t.colExercise}</th>
          <th>${t.colPrescription}</th>
          <th>${t.colRest}</th>
          ${notesHead}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function renderSessionCard(
  s: SessionSummary,
  options: RoadmapPrintOptions,
  t: (typeof COPY)[PrintLanguage],
): string {
  const statusLabel = t.status[s.status] ?? s.status.toUpperCase();
  const meta =
    s.status === "rest"
      ? t.restRecovery
      : `${s.duration} ${t.min} · ${t.targetRpe} ${s.targetRpe}${s.muscles.length > 0 ? ` · ${s.muscles.join(", ")}` : ""}`;
  const note =
    options.includeReasoning && s.reasoning ? `<p class="note">${escapeHtml(s.reasoning)}</p>` : "";
  const exercisesHtml = renderExercisesTable(s.exercises || [], options, t);
  const checkPrefix = options.includeCheckboxes ? `<span class="session-check">☐</span> ` : "";

  return `
        <article class="card">
          <div class="card-head">
            <span class="day">${escapeHtml(s.day)} · ${escapeHtml(s.date)}${s.time ? ` · ${escapeHtml(s.time)}` : ""}</span>
            <span class="status">${escapeHtml(statusLabel)}</span>
          </div>
          <h3>${checkPrefix}${escapeHtml(s.title)}</h3>
          <p class="meta">${escapeHtml(meta)}</p>
          ${note}
          ${exercisesHtml}
        </article>`;
}

function resolveWeeksToPrint(data: RoadmapPageData, options: RoadmapPrintOptions): ScheduleWeek[] {
  const allWeeks: ScheduleWeek[] =
    data.allWeeks && data.allWeeks.length > 0
      ? data.allWeeks
      : [
          {
            number: data.activeWeek,
            label: data.currentWeekLabel,
            dateRange: data.currentWeekDateRange,
            state: "active",
            sessions: data.currentWeekSessions,
          },
        ];

  if (options.scope === "current") {
    return allWeeks.filter((w) => w.number === data.activeWeek);
  }
  if (options.scope === "custom" && options.selectedWeeks.length > 0) {
    const selected = new Set(options.selectedWeeks);
    return allWeeks.filter((w) => selected.has(w.number));
  }
  return allWeeks;
}

/** Builds print-ready HTML for the workout roadmap with custom print options. */
export function buildRoadmapPrintHtml(
  data: RoadmapPageData,
  partialOptions?: Partial<RoadmapPrintOptions>,
): string {
  const options: RoadmapPrintOptions = {
    ...DEFAULT_ROADMAP_PRINT_OPTIONS,
    ...partialOptions,
  };
  const t = COPY[options.language];
  const weeksToPrint = resolveWeeksToPrint(data, options);
  const isMultiWeek = weeksToPrint.length > 1;
  const isCompact = options.layout === "compact";

  const headerTitle = isMultiWeek
    ? `${t.roadmapTitle} — ${weeksToPrint.length} ${t.weeks}`
    : `${t.roadmapTitle} — ${t.week} ${weeksToPrint[0]?.number ?? data.activeWeek}`;
  const headerSub = isMultiWeek
    ? `${t.activeWeek}: ${t.week} ${data.activeWeek} · ${escapeHtml(data.currentWeekDateRange)}`
    : escapeHtml(weeksToPrint[0]?.dateRange || data.currentWeekDateRange);

  const totalSessions = weeksToPrint.reduce(
    (sum, w) =>
      sum +
      (options.includeRestDays
        ? w.sessions.length
        : w.sessions.filter((s) => s.status !== "rest").length),
    0,
  );
  const sessionsWord = options.language === "vi" ? "buổi" : "sessions";
  const footerText =
    options.language === "vi"
      ? "Xuất từ FITAI · Tập đúng kỹ thuật, duy trì đều đặn"
      : "Generated by FITAI · Train smart, stay consistent";

  const sections = weeksToPrint
    .map((week, idx) => {
      const visibleSessions = options.includeRestDays
        ? week.sessions
        : week.sessions.filter((s) => s.status !== "rest");
      const cards = visibleSessions.map((s) => renderSessionCard(s, options, t)).join("\n");
      const weekHeading = isMultiWeek
        ? `<div class="week-head">
            <div class="week-title-group">
              <span class="week-num">${t.week} ${week.number}</span>
              <h2>${escapeHtml(week.label)}</h2>
            </div>
            <span class="week-dates">${escapeHtml(week.dateRange)}</span>
          </div>`
        : "";
      const pageBreakClass = !isCompact && idx > 0 ? " week-break" : "";
      return `
      <section class="week-section${pageBreakClass}">
        ${weekHeading}
        <div class="grid">
          ${cards}
        </div>
      </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${options.language}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(headerTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: ${isCompact ? "14px" : "24px"};
      line-height: 1.45;
      font-size: ${isCompact ? "11.5px" : "12.5px"};
    }
    header {
      background: #0f172a;
      color: #ffffff;
      border-radius: 12px;
      padding: ${isCompact ? "14px 18px" : "18px 22px"};
      margin-bottom: ${isCompact ? "16px" : "22px"};
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .brand-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #38bdf8;
      margin-bottom: 4px;
    }
    header h1 { margin: 0 0 4px; font-size: ${isCompact ? "17px" : "20px"}; font-weight: 700; letter-spacing: -0.01em; }
    header p { margin: 0; font-size: 12px; color: #cbd5e1; }
    .header-meta {
      text-align: right;
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
    }
    .header-meta strong {
      display: block;
      font-size: 15px;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
    }
    .week-section { margin-bottom: ${isCompact ? "14px" : "22px"}; }
    .week-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .week-title-group { display: flex; align-items: center; gap: 8px; }
    .week-num {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .week-head h2 { margin: 0; font-size: ${isCompact ? "14px" : "15px"}; color: #0f172a; }
    .week-dates { font-size: 11.5px; color: #64748b; font-weight: 500; }
    .grid { display: grid; grid-template-columns: 1fr; gap: ${isCompact ? "8px" : "12px"}; }
    .card {
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      border-radius: 10px;
      padding: ${isCompact ? "9px 12px" : "13px 16px"};
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .status {
      font-weight: 700;
      font-size: 9.5px;
      padding: 2px 7px;
      border-radius: 999px;
      background: #f1f5f9;
      color: #334155;
    }
    .card h3 { margin: 0 0 3px; font-size: ${isCompact ? "13.5px" : "15px"}; color: #0f172a; }
    .session-check { font-weight: 400; color: #94a3b8; }
    .meta { margin: 0; font-size: 11.5px; color: #475569; }
    .note {
      margin: 6px 0 0;
      padding: 6px 9px;
      border-radius: 6px;
      background: #f8fafc;
      font-size: 11px;
      color: #475569;
      font-style: italic;
    }
    .ex-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 9px;
      font-size: ${isCompact ? "11px" : "12px"};
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .ex-table th, .ex-table td {
      border-top: 1px solid #e2e8f0;
      padding: ${isCompact ? "4px 7px" : "6px 9px"};
      text-align: left;
      vertical-align: top;
    }
    .ex-table th {
      border-top: 0;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #475569;
      background: #f8fafc;
    }
    .ex-table tbody tr:nth-child(even) { background: #fcfcfd; }
    .check-col { width: 26px; text-align: center !important; color: #64748b; }
    .mono { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; color: #0f172a; }
    .notes-col { color: #475569; }
    .phase-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 1px 6px;
      border-radius: 4px;
      margin-right: 6px;
      background: #f1f5f9;
      color: #334155;
    }
    .phase-main { background: #e0f2fe; color: #0369a1; }
    .phase-warmup { background: #fef3c7; color: #92400e; }
    .phase-cooldown { background: #dcfce7; color: #166534; }
    footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
    }
    @media print {
      body { margin: 10mm; }
      .week-break { break-before: page; page-break-before: always; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <span class="brand-pill">FITAI · TRAINING PLAN</span>
      <h1>${escapeHtml(headerTitle)}</h1>
      <p>${headerSub}</p>
    </div>
    <div class="header-meta">
      <strong>${totalSessions} ${sessionsWord}</strong>
      <span>${weeksToPrint.length} ${t.weeks}</span>
    </div>
  </header>
  <main>
    ${sections}
  </main>
  <footer>${escapeHtml(footerText)}</footer>
</body>
</html>`;
}

/** Triggers browser Print / Save as PDF via a hidden iframe. */
export function printRoadmapPlan(
  data: RoadmapPageData,
  options?: Partial<RoadmapPrintOptions>,
): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    setTimeout(() => {
      iframe.remove();
    }, 500);
  };

  iframe.addEventListener(
    "load",
    () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      win.addEventListener("afterprint", cleanup, { once: true });
      win.requestAnimationFrame(() => {
        win.focus();
        win.print();
      });
    },
    { once: true },
  );

  iframe.srcdoc = buildRoadmapPrintHtml(data, options);
  document.body.append(iframe);
}
