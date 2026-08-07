import { render, screen } from "@testing-library/react";

import type { TodayTimelineItem } from "@/features/home/model/home-page.types";
import { TodayTimeline } from "@/features/home/ui/today-timeline";

const mockTodayItems: TodayTimelineItem[] = [
  {
    id: "breakfast",
    time: "07:30",
    title: "Breakfast",
    subtitle: "Lean beef pho & Green tea",
    category: "meal",
    status: "complete",
    href: "/nutrition/breakfast",
  },
  {
    id: "snack-morning",
    time: "10:00",
    title: "Morning snack",
    subtitle: "Apple & Almonds",
    category: "snack",
    status: "complete",
    href: "/nutrition/snack-morning",
  },
  {
    id: "lunch",
    time: "12:30",
    title: "Lunch",
    subtitle: "Chicken breast & Vegetable soup",
    category: "meal",
    status: "next",
    href: "/nutrition/lunch",
  },
  {
    id: "upper-workout",
    time: "17:30",
    title: "Upper-body workout",
    subtitle: "42 min · Target RPE 7",
    category: "workout",
    status: "planned",
    href: "/roadmap/upper-control",
  },
  {
    id: "dinner",
    time: "19:30",
    title: "Dinner",
    subtitle: "Salmon soup & Cucumber salad",
    category: "meal",
    status: "planned",
    href: "/nutrition/dinner",
  },
];

describe("todayTimeline Component", () => {
  it("renders all 5 items including 4 meals and 1 workout session", () => {
    const { container } = render(<TodayTimeline items={mockTodayItems} />);

    const items = container.querySelectorAll("li.week-route__item");
    expect(items).toHaveLength(5);

    expect(screen.getAllByText("Breakfast").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Morning snack").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lunch").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Upper-body workout").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dinner").length).toBeGreaterThan(0);
  });

  it("displays correct event times in Mono font format", () => {
    render(<TodayTimeline items={mockTodayItems} />);

    expect(screen.getAllByText("07:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("17:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("19:30").length).toBeGreaterThan(0);
  });

  it("does NOT render status text labels like 'Completed' or 'Planned' in sub-labels", () => {
    render(<TodayTimeline items={mockTodayItems} />);

    expect(screen.queryByText(/^Completed$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Planned$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Lean beef pho & Green tea").length).toBeGreaterThan(0);
    expect(screen.getAllByText("42 min · Target RPE 7").length).toBeGreaterThan(0);
  });

  it("renders accessible navigation links for items with href", () => {
    const { container } = render(<TodayTimeline items={mockTodayItems} />);

    const links = container.querySelectorAll("a.week-route__row");
    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute("href", "/nutrition/breakfast");
    expect(links[3]).toHaveAttribute("href", "/roadmap/upper-control");
  });
});
