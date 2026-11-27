import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchExercisesServerAction } from "@/features/exercise/server/catalog-actions";
import {
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
  ExerciseMechanic,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import { quickSearchStore } from "@/shared/ui/side-panel/quick-search-pane";
import { SideInspectorPanel } from "@/shared/ui/side-panel/side-inspector-panel";
import {
  SidePanelProvider,
  sidePanelStore,
  useSidePanel,
} from "@/shared/ui/side-panel/side-panel-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

const BENCH = {
  id: "bench-press",
  name: "Barbell Bench Press",
  slug: "Barbell_Bench_Press_-_Medium_Grip",
  primaryMuscle: MuscleGroup.CHEST,
  secondaryMuscles: [],
  equipment: Equipment.BARBELL,
  category: ExerciseCategory.STRENGTH,
  level: ExerciseLevel.INTERMEDIATE,
  force: ExerciseForce.PUSH,
  mechanic: ExerciseMechanic.COMPOUND,
  instructions: [],
  images: [],
  videoUrl: "",
  defaultRestSeconds: 90,
  hasAiSupported: true,
  motionSlug: "bench_press",
};

vi.mock("@/features/exercise/server/catalog-actions", () => ({
  searchExercisesServerAction: vi.fn(async () => [BENCH]),
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
  beforeEach(() => {
    sidePanelStore.close();
    quickSearchStore.reset();
    vi.clearAllMocks();
  });

  it("renders nothing when panel is closed", () => {
    const { container } = render(
      <SidePanelProvider>
        <SideInspectorPanel />
      </SidePanelProvider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("opens search pane and loads exercises immediately without clicking All", async () => {
    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));

    expect(screen.getByPlaceholderText(/search movements/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abdominals" })).toBeInTheDocument();
    expect(await screen.findByText("Barbell Bench Press")).toBeInTheDocument();
    expect(searchExercisesServerAction).toHaveBeenCalledTimes(1);
  });

  it("shows an error state and retries when initial search fails", async () => {
    vi.mocked(searchExercisesServerAction)
      .mockRejectedValueOnce(new Error("RPC unavailable"))
      .mockResolvedValueOnce([BENCH]);

    render(
      <SidePanelProvider>
        <PanelTestConsumer />
      </SidePanelProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Search"));

    expect(await screen.findByText(/could not load movements/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Barbell Bench Press")).toBeInTheDocument();
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
