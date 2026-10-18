import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import "@/i18n";
import { RankedTable, type RankedColumn } from "./ranked-table";
import { shareOf } from "./ranked-table-util";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

interface Row {
  id: string;
  name: string;
  qty: number;
  type: string;
}

const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i}`,
  name: `Item ${String.fromCharCode(65 + i)}`,
  qty: 120 - i * 10,
  type: i % 2 ? "odd" : "even",
}));
const TOTAL = ROWS.reduce((s, r) => s + r.qty, 0);

const COLUMNS: RankedColumn<Row>[] = [
  { id: "qty", header: "Sold", sortValue: (r) => r.qty, cell: (r) => String(r.qty) },
  { id: "share", header: "Share", share: (r) => shareOf(r.qty, TOTAL) },
];

function setup(props: Partial<Parameters<typeof RankedTable<Row>>[0]> = {}) {
  return render(
    <RankedTable<Row>
      title="Items"
      rows={ROWS}
      getRowId={(r) => r.id}
      rankMetric={(r) => r.qty}
      item={{ header: "Item", name: (r) => r.name }}
      columns={COLUMNS}
      category={{ label: "Type", allLabel: "All types", of: (r) => r.type }}
      searchPlaceholder="Search items"
      loading={false}
      error={false}
      onRetry={() => {}}
      {...props}
    />,
  );
}

const bodyNames = () =>
  screen.getAllByRole("row").slice(1).map((tr) => within(tr).getByRole("rowheader").textContent);

describe("RankedTable", () => {
  it("is a table: the top ten by rank, with a way to show the rest", () => {
    setup();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(bodyNames()).toHaveLength(10);
    expect(bodyNames()[0]).toBe("Item A");
    fireEvent.click(screen.getByRole("button", { name: "Show all 12" }));
    expect(bodyNames()).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: "Show top 10" }));
    expect(bodyNames()).toHaveLength(10);
  });

  it("sorts from a header button and says so with aria-sort", () => {
    setup();
    const sold = screen.getByRole("columnheader", { name: /sold/i });
    expect(sold).not.toHaveAttribute("aria-sort");
    fireEvent.click(within(sold).getByRole("button"));
    expect(sold).toHaveAttribute("aria-sort", "descending");
    expect(bodyNames()[0]).toBe("Item A");
    fireEvent.click(within(sold).getByRole("button"));
    expect(sold).toHaveAttribute("aria-sort", "ascending");
    expect(bodyNames()[0]).toBe("Item L");
    // Rank stays with the item whatever the order.
    const firstRow = screen.getAllByRole("row")[1];
    expect(within(firstRow).getAllByRole("cell")[0]).toHaveTextContent("12");
  });

  it("keeps the header buttons keyboard reachable", () => {
    setup();
    const buttons = within(screen.getAllByRole("row")[0]).getAllByRole("button");
    expect(buttons.map((b) => b.tagName)).toEqual(["BUTTON", "BUTTON", "BUTTON", "BUTTON"]);
    buttons.forEach((b) => expect(b).not.toHaveAttribute("tabindex", "-1"));
  });

  it("filters by search, and says so when nothing matches", () => {
    setup();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search items" }), { target: { value: " item c " } });
    expect(bodyNames()).toEqual(["Item C"]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText("Nothing matches your search")).toBeInTheDocument();
  });

  it("draws the share as a bar and a percent", () => {
    const { container } = setup();
    const fill = container.querySelector<HTMLElement>("[data-share-fill]")!;
    expect(fill.style.width).toBe(`${((120 / TOTAL) * 100).toFixed(2)}%`);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent(/\d+(\.\d)?%/);
  });

  it("shows skeleton rows while loading, the report's error with Retry, and its empty state", () => {
    const { rerender, container } = setup({ loading: true });
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-slot="ranked-table"]')).toHaveAttribute("aria-busy", "true");

    const onRetry = vi.fn();
    rerender(
      <RankedTable<Row> title="Items" rows={[]} getRowId={(r) => r.id} rankMetric={(r) => r.qty} item={{ header: "Item", name: (r) => r.name }} columns={COLUMNS} searchPlaceholder="Search items" loading={false} error onRetry={onRetry} />,
    );
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button"));
    expect(onRetry).toHaveBeenCalled();

    rerender(
      <RankedTable<Row> title="Items" rows={[]} getRowId={(r) => r.id} rankMetric={(r) => r.qty} item={{ header: "Item", name: (r) => r.name }} columns={COLUMNS} searchPlaceholder="Search items" loading={false} error={false} onRetry={onRetry} />,
    );
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
