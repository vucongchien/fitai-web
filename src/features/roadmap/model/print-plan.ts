import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";

function escapeHtml(raw: string): string {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Builds print-ready HTML for the active week's workout roadmap. */
export function buildRoadmapPrintHtml(data: RoadmapPageData): string {
  const cards = data.currentWeekSessions
    .map((s) => {
      const meta =
        s.status === "rest"
          ? "Rest & Recovery"
          : `${s.duration} min · Target RPE ${s.targetRpe}${s.muscles.length > 0 ? ` · ${s.muscles.join(", ")}` : ""}`;
      const note = s.reasoning ? `<p class="note">${escapeHtml(s.reasoning)}</p>` : "";
      return `
        <article class="card">
          <div class="card-head">
            <span class="day">${escapeHtml(s.day)} · ${escapeHtml(s.date)}</span>
            <span class="status">${escapeHtml(s.status.toUpperCase())}</span>
          </div>
          <h2>${escapeHtml(s.title)}</h2>
          <p class="meta">${escapeHtml(meta)}</p>
          ${note}
        </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FITAI — Week ${data.activeWeek} Plan</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827;
      margin: 24px;
      line-height: 1.45;
    }
    header {
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    header h1 { margin: 0 0 4px; font-size: 20px; }
    header p { margin: 0; font-size: 13px; color: #4b5563; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .card {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .card h2 { margin: 0 0 4px; font-size: 15px; }
    .meta { margin: 0; font-size: 12px; color: #374151; }
    .note { margin: 6px 0 0; font-size: 12px; color: #4b5563; font-style: italic; }
    @media print {
      body { margin: 12mm; }
    }
  </style>
</head>
<body>
  <header>
    <h1>FITAI Training Roadmap — Week ${data.activeWeek}</h1>
    <p>${escapeHtml(data.currentWeekDateRange)}</p>
  </header>
  <main class="grid">
    ${cards}
  </main>
</body>
</html>`;
}

/** Triggers browser Print / Save as PDF via a hidden iframe. */
export function printRoadmapPlan(data: RoadmapPageData): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  const cleanup = () => {
    setTimeout(() => {
      iframe.remove();
    }, 500);
  };

  iframe.addEventListener("load", () => {
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    win.focus();
    win.print();
  });

  document.body.append(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(buildRoadmapPrintHtml(data));
  doc.close();
}
