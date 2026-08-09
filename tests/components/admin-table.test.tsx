import { describe, expect, it } from 'vitest';
import { render, screen } from "@testing-library/react";

import type { AdminTableProps, Column } from "@/features/admin/ui/admin-table";
import { AdminTable } from "@/features/admin/ui/admin-table";

interface TestItem {
  id: string;
  name: string;
}

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

const twoRows: TestItem[] = [
  { id: "1", name: "Item One" },
  { id: "2", name: "Item Two" },
];

const noRows: TestItem[] = [];

const keyExtractor = (item: TestItem) => item.id;

describe("adminTable Component (Light Theme & English)", () => {
  it("should render table columns and data rows", () => {
    render(<AdminTable columns={columns} data={twoRows} keyExtractor={keyExtractor} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Item Two")).toBeInTheDocument();
  });

  it("should display Empty State when data is empty and not loading", () => {
    render(
      <AdminTable
        columns={columns}
        data={noRows}
        keyExtractor={keyExtractor}
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
        data={noRows}
        keyExtractor={keyExtractor}
        error={new Error("Server connection timeout")}
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.getByText("Server connection timeout")).toBeInTheDocument();
  });
});
