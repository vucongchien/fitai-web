import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SideInspectorPanel } from "@/shared/ui/side-panel/side-inspector-panel";
import { SidePanelProvider, useSidePanel } from "@/shared/ui/side-panel/side-panel-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/features/exercise/server/catalog-actions", () => ({
  getCatalogMetadataServerAction: vi.fn().mockResolvedValue({
    success: true,
    equipments: [],
    muscles: [],
    bodyParts: [],
  }),
  searchExercisesServerAction: vi.fn().mockResolvedValue([
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      bodyPartId: "chest",
      difficulty: "INTERMEDIATE",
    },
  ]),
}));

vi.mock("@/features/notification/server/notification-actions", () => ({
  listNotificationsAction: vi.fn().mockResolvedValue({
    notifications: [
      {
        id: "notif-1",
        title: "New PR Record",
        body: "You beat your Bench Press record!",
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
  it("renders nothing when panel is closed", () => {
    const { container } = render(
      <SidePanelProvider>
        <SideInspectorPanel />
      </SidePanelProvider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("opens search pane when openPanel is triggered", async () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));

    expect(screen.getByPlaceholderText(/search movements/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Core" })).toBeInTheDocument();
  });

  it("switches to notifications when clicking notifications tab", async () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getByPlaceholderText(/search movements/i)).toBeInTheDocument();

    const notifTab = screen.getByRole("tab", { name: /notifications/i });
    fireEvent.click(notifTab);

    expect(await screen.findByText("New PR Record")).toBeInTheDocument();
  });

  it("closes when close button is clicked", () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getByPlaceholderText(/search movements/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close panel" });
    fireEvent.click(closeBtn);

    expect(screen.queryByPlaceholderText(/search movements/i)).not.toBeInTheDocument();
  });

  it("closes when pressing Escape", () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));
    expect(screen.getByPlaceholderText(/search movements/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText(/search movements/i)).not.toBeInTheDocument();
  });
});
