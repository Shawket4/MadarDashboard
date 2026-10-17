import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";

import "@/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartBody, ChartGrid, ReportStack, TableCard, type ChartState } from "./report-kit";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const state = (s: Partial<ChartState> = {}): ChartState => ({ loading: false, error: false, empty: false, onRetry: () => {}, ...s });

describe("ChartBody", () => {
  it("shows the plot-height skeleton while loading, even when the data is also empty or failed", () => {
    const { container } = render(<ChartBody state={state({ loading: true, error: true, empty: true })}><p>chart</p></ChartBody>);
    const skel = container.querySelector('[data-slot="skeleton"]');
    expect(skel).toHaveClass("h-72");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("chart")).not.toBeInTheDocument();
  });

  it("takes a custom skeleton for a list card", () => {
    render(<ChartBody state={state({ loading: true })} size="auto" skeleton={<p>rows loading</p>}><p>chart</p></ChartBody>);
    expect(screen.getByText("rows loading")).toBeInTheDocument();
  });

  it("shows a failure with Retry, never the empty state, at plot height", () => {
    const onRetry = vi.fn();
    render(<ChartBody state={state({ error: true, empty: true, onRetry })}><p>chart</p></ChartBody>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("h-72", "border-0", "bg-transparent");
    expect(screen.queryByText("No data for this period")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("says the period is empty, with the tab's own words when given", () => {
    const { rerender, container } = render(<ChartBody state={state({ empty: true })}><p>chart</p></ChartBody>);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="empty-state"]')).toHaveClass("h-72");
    rerender(<ChartBody state={state({ empty: true })} emptyTitle="No table sales"><p>chart</p></ChartBody>);
    expect(screen.getByText("No table sales")).toBeInTheDocument();
  });

  it("auto-sized states take their own height", () => {
    const { container } = render(<ChartBody state={state({ empty: true })} size="auto"><p>chart</p></ChartBody>);
    expect(container.querySelector('[data-slot="empty-state"]')).not.toHaveClass("h-72");
  });

  it("renders the content once loaded", () => {
    render(<ChartBody state={state()}><p>chart</p></ChartBody>);
    expect(screen.getByText("chart")).toBeInTheDocument();
  });
});

describe("layout", () => {
  it("ChartGrid puts each card in its own cell of a two-up grid", () => {
    const { container } = render(<ChartGrid><p>a</p><p>b</p>{null}</ChartGrid>);
    const grid = container.firstElementChild!;
    expect(grid).toHaveClass("grid", "gap-4", "lg:grid-cols-2");
    expect(grid.children).toHaveLength(2);
    expect([...grid.children].map((c) => c.tagName)).toEqual(["DIV", "DIV"]);
  });

  it("ReportStack spaces sections 16px apart", () => {
    const { container } = render(<ReportStack><p>a</p></ReportStack>);
    expect(container.firstElementChild).toHaveClass("space-y-4");
  });
});

type Row = { id: string; name: string };
const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "name", header: "Name", meta: { phone: "title" } }];

describe("TableCard", () => {
  it("titles the table and runs it unframed, without the column menu", () => {
    render(<TableCard title="Teller Details" columns={columns} data={[{ id: "a", name: "Mona" }]} getRowId={(r) => r.id} onRetry={() => {}} />);
    expect(screen.getByText("Teller Details")).toBeInTheDocument();
    expect(screen.getByText("Mona")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /columns/i })).not.toBeInTheDocument();
  });

  it("fails like a chart card: Retry in place of the table", () => {
    const onRetry = vi.fn();
    const { container } = render(<TableCard title="T" columns={columns} data={[]} error onRetry={onRetry} />);
    expect(container.querySelector('[data-slot="data-table"]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("still shows its skeleton when a refetch after a failure is loading", () => {
    const { container } = render(<TableCard title="T" columns={columns} data={[]} error loading onRetry={() => {}} />);
    expect(container.querySelector('[data-slot="data-table"]')).toBeInTheDocument();
  });

  it("empties with the card's empty words and keeps the footnote", () => {
    render(<TableCard title="T" columns={columns} data={[]} emptyTitle="No waiters yet" footnote="3 of 9 orders" onRetry={() => {}} />);
    expect(screen.getByText("No waiters yet")).toBeInTheDocument();
    expect(screen.getByText("3 of 9 orders")).toBeInTheDocument();
  });

  it("insets phone cards inside the card and pads the toolbar on wider screens", () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const { container } = render(
      <TableCard title="T" columns={columns} data={[{ id: "a", name: "Mona" }]} getRowId={(r) => r.id} searchPlaceholder="Search" onRetry={() => {}} />,
    );
    const content = container.querySelector('[data-slot="card-content"]');
    expect(content).toHaveClass("px-3", "sm:px-0");
    expect(screen.getByPlaceholderText("Search").closest(".flex")).toHaveClass("sm:px-5");
    vi.mocked(useIsMobile).mockReturnValue(false);
  });
});
