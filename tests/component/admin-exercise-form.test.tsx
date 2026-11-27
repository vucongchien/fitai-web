import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminExercise } from "@/features/admin/domain/admin-types";
import { NEW_ADMIN_EXERCISE } from "@/features/admin/domain/admin-types";
import { saveAdminExercise } from "@/features/admin/model/save-admin-exercise";
import { AdminExerciseForm } from "@/features/admin/ui/admin-exercise-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createExercise: vi.fn(),
  updateExercise: vi.fn(),
  fetchAdminExercises: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/admin/api/admin-exercise-service", () => ({
  approveExercise: vi.fn(),
  archiveExercise: vi.fn(),
  createExercise: mocks.createExercise,
  deleteExercise: vi.fn(),
  fetchAdminExercises: mocks.fetchAdminExercises,
  restoreExercise: vi.fn(),
  updateExercise: mocks.updateExercise,
}));
vi.mock("@/features/admin/ui/motion-spec-dialog", () => ({ MotionSpecDialog: () => null }));
vi.mock("@/shared/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const SAVED: AdminExercise = {
  ...NEW_ADMIN_EXERCISE,
  id: "ex-1",
  name: "Goblet Squat",
  slug: "Goblet_Squat",
  hasAiSupported: false,
  status: "created",
};

afterEach(() => {
  cleanup();
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
});

describe("saveAdminExercise", () => {
  it("creates when the exercise is not saved yet and updates afterwards", async () => {
    mocks.createExercise.mockResolvedValue({ ok: true, exercise: SAVED });
    mocks.updateExercise.mockResolvedValue({ ok: true, exercise: SAVED });

    await saveAdminExercise(null, NEW_ADMIN_EXERCISE);
    expect(mocks.createExercise).toHaveBeenCalledWith(NEW_ADMIN_EXERCISE);
    expect(mocks.updateExercise).not.toHaveBeenCalled();

    await saveAdminExercise("ex-1", NEW_ADMIN_EXERCISE);
    expect(mocks.updateExercise).toHaveBeenCalledWith("ex-1", NEW_ADMIN_EXERCISE);
  });
});

describe("AdminExerciseForm (new exercise)", () => {
  it("creates nothing until saved, then creates with the typed name", async () => {
    mocks.createExercise.mockResolvedValue({ ok: true, exercise: SAVED });
    render(<AdminExerciseForm initialExercise={null} />);

    expect(mocks.createExercise).not.toHaveBeenCalled();
    expect(screen.getByText(/generated from the title on first save/iu)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve entry/iu })).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete Exercise")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/exercise title/iu), {
      target: { value: "  Goblet Squat " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/iu }));

    await waitFor(() => expect(mocks.createExercise).toHaveBeenCalledOnce());
    expect(mocks.createExercise.mock.calls[0][0]).toMatchObject({ name: "Goblet Squat" });
    expect(mocks.updateExercise).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/admin/exercises"));
  });

  it("does not create without a title", () => {
    render(<AdminExerciseForm initialExercise={null} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/iu }));
    expect(mocks.createExercise).not.toHaveBeenCalled();
  });
});

describe("AdminExerciseForm (saved exercise)", () => {
  it("keeps the edit flow: shows the slug and updates by id", async () => {
    mocks.updateExercise.mockResolvedValue({ ok: true, exercise: SAVED });
    render(<AdminExerciseForm initialExercise={SAVED} />);

    expect(screen.getByText("Goblet_Squat")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save changes/iu }));

    await waitFor(() =>
      expect(mocks.updateExercise).toHaveBeenCalledWith(
        "ex-1",
        expect.objectContaining({ name: "Goblet Squat" }),
      ),
    );
    expect(mocks.createExercise).not.toHaveBeenCalled();
  });
});

describe("admin exercise list", () => {
  it("opens the new-exercise form instead of creating a draft", async () => {
    mocks.fetchAdminExercises.mockResolvedValue({ items: [], nextCursor: null, totalCount: 0 });
    const { default: AdminExercisesPage } = await import("@/app/(admin)/admin/exercises/page");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(<AdminExercisesPage />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /add new exercise/iu }));

    expect(mocks.push).toHaveBeenCalledWith("/admin/exercises/new");
    expect(mocks.createExercise).not.toHaveBeenCalled();
  });
});
