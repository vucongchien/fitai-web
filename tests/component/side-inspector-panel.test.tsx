import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SideInspectorPanel } from "@/shared/ui/side-panel/side-inspector-panel";
import { SidePanelProvider, useSidePanel } from "@/shared/ui/side-panel/side-panel-context";

vi.mock("@/features/exercise/server/catalog-actions", () => ({
  searchExercisesServerAction: vi.fn().mockResolvedValue([
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      bodyPartId: "CHEST",
      difficulty: "INTERMEDIATE",
    },
  ]),
}));

vi.mock("@/features/notification/server/notification-actions", () => ({
  listNotificationsAction: vi.fn().mockResolvedValue({
    notifications: [
      {
        id: "notif-1",
        title: "Kỷ lục mới (PR)",
        body: "Bạn đã vượt kỷ lục Bench Press!",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ],
    totalCount: 1,
  }),
  markNotificationAsReadAction: vi.fn().mockResolvedValue(true),
}));

vi.mock<typeof import("next/link")>(import("next/link"), () => ({
  default: ({ children, href, ...props }: React.ComponentPropsWithRef<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

function PanelTestConsumer() {
  const { openPanel } = useSidePanel();
  return (
    <div>
      <button onClick={() => openPanel("search")}>Trigger Search</button>
      <button onClick={() => openPanel("notifications")}>Trigger Notif</button>
      <SideInspectorPanel />
    </div>
  );
}

describe("SideInspectorPanel", () => {
  it("renders collapsed quick actions dock when panel is closed", () => {
    render(
      <SidePanelProvider>
        <SideInspectorPanel />
      </SidePanelProvider>,
    );

    expect(screen.getByRole("button", { name: "Mở tìm kiếm nhanh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mở thông báo nhanh" })).toBeInTheDocument();
  });

  it("opens search pane when clicking search dock button", async () => {
    render(
      <SidePanelProvider>
        <SideInspectorPanel />
      </SidePanelProvider>,
    );

    const searchDockBtn = screen.getByRole("button", { name: "Mở tìm kiếm nhanh" });
    fireEvent.click(searchDockBtn);

    expect(screen.getAllByPlaceholderText(/tìm kiếm bài tập/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /cơ bụng/i })[0]).toBeInTheDocument();
  });

  it("switches to notifications when clicking notifications tab", async () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getAllByPlaceholderText(/tìm kiếm bài tập/i)[0]).toBeInTheDocument();

    const notifTabs = screen.getAllByRole("button", { name: /tab thông báo/i });
    fireEvent.click(notifTabs[0]);

    expect(await screen.findAllByText("Kỷ lục mới (PR)")).toHaveLength(2);
  });

  it("closes when close button is clicked", () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getAllByPlaceholderText(/tìm kiếm bài tập/i)[0]).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: /đóng bảng/i });
    fireEvent.click(closeButtons[0]);

    expect(screen.queryByPlaceholderText(/tìm kiếm bài tập/i)).not.toBeInTheDocument();
  });

  it("closes when pressing Escape", () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getAllByPlaceholderText(/tìm kiếm bài tập/i)[0]).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText(/tìm kiếm bài tập/i)).not.toBeInTheDocument();
  });
});
