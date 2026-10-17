import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import "@/i18n";
import { OverviewTab } from "./overview-tab";

const sales = vi.hoisted(() => ({ q: {} as Record<string, unknown> }));
vi.mock("@/data/api/generated/api", () => ({ useBranchSales: () => sales.q }));
vi.mock("@/components/app/exclude-items-control", () => ({
  ExcludeItemsControl: () => null,
  excludeItemsParam: () => undefined,
  useExcludedItems: () => [[], vi.fn()],
}));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const range = { from: "2026-10-01", to: "2026-10-02" } as never;
const zero = {
  total_revenue: 0, total_tax: 0, total_orders: 0, total_line_items: 0, voided_orders: 0,
  revenue_by_method: {}, by_category: [], top_items: [], by_service_mode: [],
};
const base = { isLoading: false, isError: false, data: undefined, refetch: vi.fn() };

describe("OverviewTab KPIs", () => {
  beforeEach(() => { sales.q = { ...base }; });

  it("reads em-dash on every KPI and shows the card error when the query fails", () => {
    sales.q = { ...base, isError: true };
    const { container } = render(<OverviewTab branchId="b1" range={range} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(4); // payment, category, service mode, top items
    expect(within(container).queryByText("0")).not.toBeInTheDocument();
  });

  it("reads 0 for a genuine zero on a successful load", () => {
    sales.q = { ...base, data: zero };
    render(<OverviewTab branchId="b1" range={range} />);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
