import { describe, expect, it } from "vitest";

import { buildRoadmapPrintHtml } from "@/features/roadmap/model/print-plan";
import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";

describe("buildRoadmapPrintHtml", () => {
  it("escapes user-controlled text and includes page-break protection", () => {
    const data: RoadmapPageData = {
      activeWeek: 2,
      weeks: [],
      currentWeekLabel: "Week 2",
      currentWeekDateRange: "Nov 10 - Nov 16",
      contextItems: [],
      currentWeekSessions: [
        {
          id: "s1",
          day: "Mon",
          date: "Nov 10",
          title: "Push <script>alert(1)</script>",
          time: "07:00",
          duration: 45,
          targetRpe: 8,
          muscles: ["Chest", "Triceps"],
          status: "next",
          reasoning: "Focus on progressive overload",
        },
      ],
    };

    const html = buildRoadmapPrintHtml(data);
    expect(html).toContain("Week 2");
    expect(html).toContain("break-inside: avoid");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
