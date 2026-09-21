/**
 * The quadrant on Menu profitability: it draws the whole ledger whatever the
 * table is filtered to, says so to a screen reader, and never passes off a
 * load or a failure as "no sales".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarginLedgerRow } from "@/data/api/generated/models";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

let n = 0;
const row = (p: Partial<MarginLedgerRow>): MarginLedgerRow => ({
  menu_item_id: `item-${++n}`,
  size_label: "one_size",
  item_name: `Item ${n}`,
  on_menu: true,
  quantity_sold: 10,
  revenue: 10000,
  cost: 4000,
  margin: 6000,
  prev_quantity: 0,
  flags: [],
  class: "star",
  popularity_pct: 50,
  ...p,
});
const flag = { kind: "below_target", params: {}, link: "pricing" };
const ROWS = [
  row({ item_name: "Latte", class: "star", quantity_sold: 60, margin: 42000 }),
  row({ item_name: "Tea", class: "workhorse", quantity_sold: 30, margin: 3000, flags: [flag] }),
  row({ item_name: "Affogato", class: "challenge", quantity_sold: 6, margin: 5400 }),
  row({ item_name: "Decaf", class: "dog", quantity_sold: 4, margin: 200 }),
  row({ item_name: "Uncosted", class: null, cost: null, margin: null, popularity_pct: null }),
];

let ledger: { data?: unknown; isLoading: boolean; error: unknown; refetch: () => void };
const seen: MarginLedgerRow[][] = [];

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({ branchId: null, scopeBranchId: "all", from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z" }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useMenuMarginLedger: () => ledger,
  useCreateDecision: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}));
vi.mock("./target-editor", () => ({ TargetEditor: () => null }));
vi.mock("./repricing-tab", () => ({ RepricingTab: () => null }));
vi.mock("./decisions-tab", () => ({ DecisionsTab: () => null }));

const i18n = (await import("@/i18n")).default;
const { QuadrantView } = await import("./quadrant-view");

describe("QuadrantView", () => {
  beforeEach(() => i18n.changeLanguage("en"));

  it("gives the chart a text alternative with the verdict per class", () => {
    render(<QuadrantView rows={ROWS} />);
    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName(/4 items.*1 stars, 1 workhorses, 1 challenges, 1 dogs/);
  });

  it("states where the two lines sit, through the app's own formatters", () => {
    render(<QuadrantView rows={ROWS} />);
    // 70% / 4 classified = 17.5% of units; Σmargin/Σunits = 50600/100 = EGP 5.06.
    expect(screen.getByText(/17\.5%.*EGP 5\.06/)).toBeInTheDocument();
  });

  it("reads in Arabic, with the plot and its corner captions pinned LTR", async () => {
    await i18n.changeLanguage("ar");
    render(<QuadrantView rows={ROWS} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/نجوم/);
    const caption = screen.getByText("نجوم / أحصنة عمل");
    expect(caption.parentElement).toHaveAttribute("dir", "ltr");
  });
});

describe("Menu profitability · quadrant view", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    seen.length = 0;
  });

  const open = async () => {
    vi.doMock("./quadrant-view", () => ({
      QuadrantView: ({ rows }: { rows: MarginLedgerRow[] }) => {
        seen.push(rows);
        return <div data-testid="quadrant" />;
      },
    }));
    vi.resetModules();
    const { ProfitabilityPage } = await import("./profitability-page");
    const { TooltipProvider } = await import("@/components/ui/tooltip");
    render(<TooltipProvider><ProfitabilityPage /></TooltipProvider>);
  };
  const report = (rows: MarginLedgerRow[]) => ({
    rows,
    rows_cost_unknown: 0,
    totals: { revenue: 0, cost_known: 0, margin_known: 0, margin_pct: null, revenue_cost_unknown: 0, prev_revenue: 0, prev_margin_known: 0, below_target_gap: 0 },
  });

  it("plots the whole ledger even when the table is filtered to flagged rows", async () => {
    ledger = { data: report(ROWS), isLoading: false, error: null, refetch: vi.fn() };
    await open();
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("radio", { name: "Quadrant" }));
    expect(screen.getByTestId("quadrant")).toBeInTheDocument();
    expect(seen.at(-1)).toHaveLength(ROWS.length);
  });

  it("shows a skeleton while loading, not 'no sales'", async () => {
    ledger = { data: undefined, isLoading: true, error: null, refetch: vi.fn() };
    await open();
    fireEvent.click(screen.getByRole("radio", { name: "Quadrant" }));
    expect(screen.queryByText("No sales in this period")).not.toBeInTheDocument();
    expect(screen.queryByTestId("quadrant")).not.toBeInTheDocument();
  });

  it("shows the failure with a retry, not 'no sales'", async () => {
    const refetch = vi.fn();
    ledger = { data: undefined, isLoading: false, error: new Error("boom"), refetch };
    await open();
    fireEvent.click(screen.getByRole("radio", { name: "Quadrant" }));
    expect(screen.queryByText("No sales in this period")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("says why there is nothing to plot when nothing that sold has a cost", async () => {
    ledger = { data: report([ROWS[4]]), isLoading: false, error: null, refetch: vi.fn() };
    await open();
    fireEvent.click(screen.getByRole("radio", { name: "Quadrant" }));
    expect(screen.getByText(/no item that sold has a known cost/)).toBeInTheDocument();
  });
});
