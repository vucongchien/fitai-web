import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileBadgesView } from "@/features/gamification/ui/profile-badges-view";
import { ProfileFriendsCard } from "@/features/gamification/ui/profile-friends-card";
import { ProfileFriendsView } from "@/features/gamification/ui/profile-friends-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("Gamification Views", () => {
  describe("ProfileFriendsCard", () => {
    it("renders friends title, add button, and tabs without count in title", () => {
      render(
        <ProfileFriendsCard followers={[]} following={[]} followerCount={0} followingCount={0} />,
      );

      expect(screen.getByText("Friends")).toBeDefined();
      expect(screen.getByText("ADD FRIENDS")).toBeDefined();
      expect(screen.getByText("FOLLOWING")).toBeDefined();
      expect(screen.getByText("FOLLOWERS")).toBeDefined();
      // When empty, the "View more" link is cleanly hidden
      expect(screen.queryByText("View all")).toBeNull();
      expect(screen.queryByText(/View \d+ more/)).toBeNull();
    });
  });

  describe("ProfileBadgesView", () => {
    it("renders page header and empty status without unnecessary done button", () => {
      render(<ProfileBadgesView badges={[]} totalUnlocked={0} totalAvailable={0} />);

      expect(screen.getByText("All Achievements")).toBeDefined();
      expect(screen.queryByText("DONE")).toBeNull();
      expect(screen.getByText("No achievements yet")).toBeDefined();
    });
  });

  describe("ProfileFriendsView", () => {
    it("renders friends search and clean tabs without unnecessary done button", () => {
      render(
        <ProfileFriendsView followers={[]} following={[]} followerCount={0} followingCount={0} />,
      );

      expect(screen.getByText("Friends")).toBeDefined();
      expect(screen.queryByText("DONE")).toBeNull();
      expect(screen.getByText("FOLLOWING")).toBeDefined();
      expect(screen.getByText("FOLLOWERS")).toBeDefined();
      expect(screen.getByPlaceholderText("Search friends by name...")).toBeDefined();
    });
  });
});
