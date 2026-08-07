

import {
  approveExercise,
  archiveExercise,
  createExercise,
  deleteExercise,
  fetchAdminExercises,
  resetExerciseStore,
  updateExercise,
} from "@/features/admin/api/admin-exercise-service";

describe("admin Exercise Service", () => {
  beforeEach(() => {
    resetExerciseStore();
  });

  it("nên trả về danh sách phân trang (cursor-based pagination)", async () => {
    const page1 = await fetchAdminExercises({ limit: 3 });
    expect(page1.items).toHaveLength(3);
    expect(page1.nextCursor).not.toBeNull();
    expect(page1.totalCount).toBeGreaterThan(3);

    const page2 = await fetchAdminExercises({
      cursor: page1.nextCursor,
      limit: 3,
    });
    expect(page2.items).toHaveLength(3);
    expect(page2.items[0].id).not.toStrictEqual(page1.items[0].id);
  });

  it("nên lọc đúng bài tập theo từ khóa tìm kiếm (q)", async () => {
    const res = await fetchAdminExercises({
      filters: { q: "push-up" },
    });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((ex) => ex.name.toLowerCase().includes("push-up"))).toBeTruthy();
  });

  it("nên lọc đúng bài tập theo trạng thái (status)", async () => {
    const res = await fetchAdminExercises({
      filters: { status: "submittedForApproval" },
    });
    expect(res.items.every((ex) => ex.status === "submittedForApproval")).toBeTruthy();
  });

  it("nên duyệt (approve) bài tập chuyển từ draft/submitted sang approved", async () => {
    const list = await fetchAdminExercises({
      filters: { status: "submittedForApproval" },
    });
    const target = list.items[0];

    const approved = await approveExercise(target.id);
    expect(approved.status).toBe("approved");

    const refreshedList = await fetchAdminExercises({
      filters: { status: "submittedForApproval" },
    });
    expect(refreshedList.items.some((ex) => ex.id === target.id)).toBeFalsy();
  });

  it("nên lưu trữ (archive) bài tập thành công", async () => {
    const list = await fetchAdminExercises({ limit: 1 });
    const target = list.items[0];

    const archived = await archiveExercise(target.id);
    expect(archived.status).toBe("archived");
  });

  it("nên tạo mới bài tập với trạng thái mặc định created", async () => {
    const created = await createExercise({
      name: "Test Cable Fly",
      bodyPartId: "bp-chest",
      equipmentId: "eq-cable",
      targetMuscleId: "ms-chest",
      secondaryMuscleIds: [],
      difficulty: "intermediate",
      defaultRestSeconds: 60,
      tagIds: [],
      hasAiSupported: false,
      status: "created",
      createdBy: "admin@fitai.com",
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("created");

    const list = await fetchAdminExercises({ filters: { q: "Cable Fly" } });
    expect(list.items.some((ex) => ex.id === created.id)).toBeTruthy();
  });

  it("nên cập nhật bài tập thành công", async () => {
    const list = await fetchAdminExercises({ limit: 1 });
    const target = list.items[0];

    const updated = await updateExercise(target.id, {
      name: "Updated Name Test",
    });
    expect(updated.name).toBe("Updated Name Test");
  });

  it("nên xóa bài tập thành công", async () => {
    const list = await fetchAdminExercises({ limit: 1 });
    const target = list.items[0];

    const deleted = await deleteExercise(target.id);
    expect(deleted).toBeTruthy();

    const refreshed = await fetchAdminExercises({ filters: { q: target.name } });
    expect(refreshed.items.some((ex) => ex.id === target.id)).toBeFalsy();
  });
});
