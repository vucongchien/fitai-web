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
        <ProfileFriendsCard
          followers={[]}
          following={[]}
          followerCount={0}
          followingCount={0}
        />,
      );

      expect(screen.getByText("Bạn bè")).toBeDefined();
      expect(screen.getByText("THÊM BẠN BÈ")).toBeDefined();
      expect(screen.getByText("ĐANG THEO DÕI")).toBeDefined();
      expect(screen.getByText("NGƯỜI THEO DÕI")).toBeDefined();
      // When empty, the "Xem thêm" link is cleanly hidden
      expect(screen.queryByText("Xem tất cả")).toBeNull();
      expect(screen.queryByText(/Xem thêm/)).toBeNull();
    });
  });

  describe("ProfileBadgesView", () => {
    it("renders page header and empty status when no badges exist", () => {
      render(
        <ProfileBadgesView
          badges={[]}
          totalUnlocked={0}
          totalAvailable={0}
        />,
      );

      expect(screen.getByText("Tất cả thành tích")).toBeDefined();
      expect(screen.getByText("HOÀN TẤT")).toBeDefined();
      expect(screen.getByText("Chưa có thành tích nào")).toBeDefined();
    });
  });

  describe("ProfileFriendsView", () => {
    it("renders friends search and clean tabs", () => {
      render(
        <ProfileFriendsView
          followers={[]}
          following={[]}
          followerCount={0}
          followingCount={0}
        />,
      );

      expect(screen.getByText("Bạn bè")).toBeDefined();
      expect(screen.getByText("HOÀN TẤT")).toBeDefined();
      expect(screen.getByText("ĐANG THEO DÕI")).toBeDefined();
      expect(screen.getByText("NGƯỜI THEO DÕI")).toBeDefined();
      expect(screen.getByPlaceholderText("Tìm kiếm bạn bè theo tên...")).toBeDefined();
    });
  });
});
