import { describe, expect, it, vi, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";

import "@/i18n";
import { DataTable } from "./data-table";

beforeAll(() => {
  // jsdom has no ResizeObserver
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

type Row = { id: string; name: string; total: string };
const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "total", header: "Total", meta: { numeric: true } },
];
const rows: Row[] = [
  { id: "a", name: "Latte", total: "EGP 60.00" },
  { id: "b", name: "Mocha", total: "EGP 75.00" },
];

describe("DataTable states", () => {
  it("draws skeleton rows in its own grid while loading, never the empty state", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} loading emptyState={<p>nothing yet</p>} getRowId={(r) => r.id} />,
    );
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("nothing yet")).not.toBeInTheDocument();
  });

  it("shows an error with Retry instead of an empty table", () => {
    const onRetry = vi.fn();
    render(<DataTable columns={columns} data={[]} error="Network down" onRetry={onRetry} emptyState={<p>nothing yet</p>} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    expect(screen.queryByText("nothing yet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("draws the empty state for an empty list", () => {
    render(<DataTable columns={columns} data={[]} emptyState={<p>nothing yet</p>} />);
    expect(screen.getByText("nothing yet")).toBeInTheDocument();
  });

  it("marks numeric cells tabular + end-aligned and the selected row", () => {
    const { container } = render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} selectedRowId="b" />);
    const cell = screen.getByText("EGP 60.00").closest("td")!;
    expect(cell.className).toMatch(/tabular-nums/);
    expect(cell.className).toMatch(/text-end/);
    expect(container.querySelector('tr[data-state="selected"]')).toHaveTextContent("Mocha");
  });

  it("expands a row and keeps row actions from opening the row", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        onRowClick={onRowClick}
        renderExpanded={(r) => <p>detail of {r.name}</p>}
        rowActions={(r) => <button type="button">act {r.name}</button>}
      />,
    );
    fireEvent.click(screen.getByText("act Latte"));
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /details/i })[0]);
    expect(screen.getByText("detail of Latte")).toBeInTheDocument();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("offers Load more only while there is more", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <DataTable columns={columns} data={rows} loadMore={{ hasMore: true, onLoadMore }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(<DataTable columns={columns} data={rows} loadMore={{ hasMore: false, onLoadMore }} />);
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });
});
