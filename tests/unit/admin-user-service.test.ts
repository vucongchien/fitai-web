import {
  fetchAdminUsers,
  resetUserStore,
  toggleUserStatus,
} from "@/features/admin/api/admin-user-service";

describe("admin User Service (Proto Schema Aligned)", () => {
  beforeEach(() => {
    resetUserStore();
  });

  it("should return paginated users using cursor pagination", async () => {
    const page1 = await fetchAdminUsers({ limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();
    expect(page1.totalCount).toBeGreaterThan(2);
  });

  it("should search users by name, email, or userId", async () => {
    const res = await fetchAdminUsers({
      filters: { q: "alex" },
    });
    expect(res.items.length).toBeGreaterThan(0);
    expect(
      res.items.every(
        (u) =>
          u.displayName.toLowerCase().includes("alex") ||
          u.email.toLowerCase().includes("alex") ||
          u.userId.toLowerCase().includes("alex"),
      ),
    ).toBe(true);
  });

  it("should filter users by role and status", async () => {
    const res = await fetchAdminUsers({
      filters: { role: "coach", status: "active" },
    });
    expect(res.items.every((u) => u.role === "coach" && u.status === "active")).toBe(true);
  });

  it("should toggle user ban status between active and banned", async () => {
    const list = await fetchAdminUsers({ limit: 1 });
    const target = list.items[0];
    const initialStatus = target.status;

    const toggled = await toggleUserStatus(target.userId);
    expect(toggled.status).not.toStrictEqual(initialStatus);

    const reverted = await toggleUserStatus(target.userId);
    expect(reverted.status).toStrictEqual(initialStatus);
  });
});
