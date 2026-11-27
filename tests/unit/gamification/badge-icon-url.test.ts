import { describe, expect, it } from "vitest";

import { hostedIconUrl } from "@/features/gamification/model/gamification.mapper";

describe("hostedIconUrl", () => {
  it("keeps a hosted icon and drops a path this app does not ship", () => {
    expect(hostedIconUrl("https://cdn.example.com/b.svg")).toBe("https://cdn.example.com/b.svg");
    expect(hostedIconUrl("/assets/badges/streak_7.svg")).toBe("");
    expect(hostedIconUrl(undefined)).toBe("");
  });
});
