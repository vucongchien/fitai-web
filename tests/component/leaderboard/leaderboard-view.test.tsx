import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LeaderboardDataVM } from "@/features/leaderboard/model/leaderboard.types";
import { LeaderboardMyStanding } from "@/features/leaderboard/ui/leaderboard-my-standing";
import { LeaderboardPodium } from "@/features/leaderboard/ui/leaderboard-podium";
import { LeaderboardView } from "@/features/leaderboard/ui/leaderboard-view";

const mockLeaderboardData: LeaderboardDataVM = {
  topEntries: [
    {
      rank: 1,
      userId: "usr-1",
      displayName: "Minh Quang",
      avatarUrl: "https://example.com/avatar1.jpg",
      xp: 15400,
      level: 12,
      isCurrentUser: false,
    },
    {
      rank: 2,
      userId: "usr-2",
      displayName: "Hai Dang",
      avatarUrl: "https://example.com/avatar2.jpg",
      xp: 12850,
      level: 10,
      isCurrentUser: false,
    },
    {
      rank: 3,
      userId: "usr-3",
      displayName: "Thu Ha",
      avatarUrl: "https://example.com/avatar3.jpg",
      xp: 10200,
      level: 8,
      isCurrentUser: false,
    },
    {
      rank: 4,
      userId: "usr-me",
      displayName: "My Gym Self",
      avatarUrl: "https://example.com/me.jpg",
      xp: 8400,
      level: 7,
      isCurrentUser: true,
    },
    {
      rank: 5,
      userId: "usr-5",
      displayName: "Elena",
      avatarUrl: "https://example.com/avatar5.jpg",
      xp: 7500,
      level: 6,
      isCurrentUser: false,
    },
  ],
  podium: [
    {
      rank: 1,
      userId: "usr-1",
      displayName: "Minh Quang",
      avatarUrl: "https://example.com/avatar1.jpg",
      xp: 15400,
      level: 12,
      isCurrentUser: false,
    },
    {
      rank: 2,
      userId: "usr-2",
      displayName: "Hai Dang",
      avatarUrl: "https://example.com/avatar2.jpg",
      xp: 12850,
      level: 10,
      isCurrentUser: false,
    },
    {
      rank: 3,
      userId: "usr-3",
      displayName: "Thu Ha",
      avatarUrl: "https://example.com/avatar3.jpg",
      xp: 10200,
      level: 8,
      isCurrentUser: false,
    },
  ],
  rankedList: [
    {
      rank: 4,
      userId: "usr-me",
      displayName: "My Gym Self",
      avatarUrl: "https://example.com/me.jpg",
      xp: 8400,
      level: 7,
      isCurrentUser: true,
    },
    {
      rank: 5,
      userId: "usr-5",
      displayName: "Elena",
      avatarUrl: "https://example.com/avatar5.jpg",
      xp: 7500,
      level: 6,
      isCurrentUser: false,
    },
  ],
  myStanding: {
    rank: 4,
    userId: "usr-me",
    displayName: "My Gym Self",
    avatarUrl: "https://example.com/me.jpg",
    xp: 8400,
    level: 7,
    isCurrentUser: true,
  },
  totalParticipants: 5,
};

describe("Leaderboard UI", () => {
  describe("LeaderboardView", () => {
    it("renders page header, podium, and ranked list rows with links", () => {
      render(<LeaderboardView initialData={mockLeaderboardData} />);

      // Header
      expect(screen.getByText("LEADERBOARD")).toBeDefined();
      expect(screen.getByText("XP ARENA")).toBeDefined();

      // Podium Top 3
      expect(screen.getByText("Minh Quang")).toBeDefined();
      expect(screen.getByText("Hai Dang")).toBeDefined();
      expect(screen.getByText("Thu Ha")).toBeDefined();

      // Check profile link
      const athleteLink = screen.getByRole("link", { name: /Minh Quang/i });
      expect(athleteLink.getAttribute("href")).toBe("/community/users/usr-1");

      // Ranked List
      expect(screen.getByText("Elena")).toBeDefined();
      // Current user row & standing
      const myNames = screen.getAllByText("My Gym Self");
      expect(myNames.length).toBeGreaterThanOrEqual(1);

      // Current user profile link points to /profile
      const myProfileLinks = screen.getAllByRole("link", { name: /My Gym Self/i });
      expect(myProfileLinks[0].getAttribute("href")).toBe("/profile");

      // "YOU" badge rendered for current user
      const youBadges = screen.getAllByText("YOU");
      expect(youBadges.length).toBeGreaterThanOrEqual(1);

      // User's row has the dedicated observer id
      const currentUserEntry = document.getElementById("current-user-leaderboard-entry");
      expect(currentUserEntry).not.toBeNull();
    });

    it("toggles between All-time and Weekly League tabs with zero layout shift banner", () => {
      render(<LeaderboardView initialData={mockLeaderboardData} />);

      // All-time banner is present by default
      expect(screen.getByText(/GLOBAL HALL OF FAME • ALL-TIME/i)).toBeDefined();

      const weeklyTab = screen.getByRole("tab", { name: /Weekly League/i });
      expect(weeklyTab.getAttribute("aria-selected")).toBe("false");

      fireEvent.click(weeklyTab);

      expect(weeklyTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getByText(/GOLD LEAGUE • DIVISION 1/i)).toBeDefined();
      expect(screen.getByText(/Top 10 athletes advance to Diamond League/i)).toBeDefined();
    });

    it("renders empty state when there are no athletes on the leaderboard", () => {
      const emptyData: LeaderboardDataVM = {
        topEntries: [],
        podium: [],
        rankedList: [],
        myStanding: null,
        totalParticipants: 0,
      };

      render(<LeaderboardView initialData={emptyData} />);

      expect(screen.getByText("Be the First on the Board!")).toBeDefined();
      expect(screen.getByText("Start Workout")).toBeDefined();
    });
  });

  describe("LeaderboardPodium", () => {
    it("renders all 3 athletes even when ranks are tied", () => {
      const tiedPodium = [
        {
          rank: 1,
          userId: "usr-a",
          displayName: "Athlete A",
          avatarUrl: "",
          xp: 15000,
          level: 10,
          isCurrentUser: false,
        },
        {
          rank: 1,
          userId: "usr-b",
          displayName: "Athlete B",
          avatarUrl: "",
          xp: 12000,
          level: 9,
          isCurrentUser: true,
        },
        {
          rank: 3,
          userId: "usr-c",
          displayName: "Athlete C",
          avatarUrl: "",
          xp: 9000,
          level: 7,
          isCurrentUser: false,
        },
      ];

      render(<LeaderboardPodium podium={tiedPodium} />);

      // Both tied rank 1 athletes are rendered!
      expect(screen.getByText("Athlete A")).toBeDefined();
      expect(screen.getByText("Athlete B")).toBeDefined();
      expect(screen.getByText("Athlete C")).toBeDefined();

      // Current user on podium gets current-user-leaderboard-entry id
      const currentUserEntry = document.getElementById("current-user-leaderboard-entry");
      expect(currentUserEntry).not.toBeNull();
    });
  });

  describe("LeaderboardMyStanding", () => {
    it("renders unranked message when standing is null", () => {
      render(<LeaderboardMyStanding standing={null} />);

      expect(screen.getByText("Unranked yet")).toBeDefined();
      expect(screen.getByText("Train Now")).toBeDefined();
    });

    it("renders current user standing with rank and XP and desktop sidebar offsets", () => {
      const { container } = render(
        <LeaderboardMyStanding
          standing={{
            rank: 12,
            userId: "u-12",
            displayName: "Fast Runner",
            avatarUrl: "",
            xp: 5200,
            level: 5,
            isCurrentUser: true,
          }}
        />,
      );

      expect(screen.getByText("#12")).toBeDefined();
      expect(screen.getByText("Fast Runner")).toBeDefined();
      expect(screen.getByText("5,200")).toBeDefined();
      expect(screen.getByText(/Lv\.5/)).toBeDefined();

      // Check desktop sidebar offset classes for centering
      const outerWrapper = container.firstChild as HTMLElement;
      expect(outerWrapper.className).toContain("md:left-[4.5rem]");
      expect(outerWrapper.className).toContain("lg:left-[16rem]");
      expect(outerWrapper.className).toContain("opacity-100");
    });

    it("hides sticky card when hidden is true", () => {
      const { container } = render(
        <LeaderboardMyStanding
          standing={{
            rank: 12,
            userId: "u-12",
            displayName: "Fast Runner",
            avatarUrl: "",
            xp: 5200,
            level: 5,
            isCurrentUser: true,
          }}
          hidden={true}
        />,
      );

      const outerWrapper = container.firstChild as HTMLElement;
      expect(outerWrapper.className).toContain("opacity-0");
      expect(outerWrapper.className).toContain("translate-y-6");
      expect(outerWrapper.className).toContain("pointer-events-none");
    });
  });
});
