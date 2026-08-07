import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminTableProps, Column } from "@/features/admin/ui/admin-table";
import { AdminTable } from "@/features/admin/ui/admin-table";

type TestItem = {
  id: string;
  name: string;
};

describe("AdminTable Component (Light Theme & English)", () => {
  const columns: Column<TestItem>[] = [
    {
      header: "ID",
      cell: (item) => item.id,
    },
    {
      header: "Name",
      cell: (item) => item.name,
    },
  ];

  it("should render table columns and data rows", () => {
    const data: TestItem[] = [
      { id: "1", name: "Item One" },
      { id: "2", name: "Item Two" },
    ];

    render(<AdminTable columns={columns} data={data} keyExtractor={(item) => item.id} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Item Two")).toBeInTheDocument();
  });

  it("should display Empty State when data is empty and not loading", () => {
    render(
      <AdminTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        isLoading={false}
        emptyTitle="No test data available"
      />,
    );

    expect(screen.getByText("No test data available")).toBeInTheDocument();
  });

  it("should display Error State when error occurs", () => {
    const handleRetry = vi.fn<NonNullable<AdminTableProps<TestItem>["onRetry"]>>();
    render(
      <AdminTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        error={new Error("Server connection timeout")}
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.getByText("Server connection timeout")).toBeInTheDocument();
  });
});
