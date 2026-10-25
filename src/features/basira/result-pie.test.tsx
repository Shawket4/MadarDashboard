/**
 * A pie answers when it is pressed: a slice (or its legend entry) shows its
 * label, its figure in the column's format and its share of the total, and
 * pressing it again, elsewhere, or Escape lets it go. Arabic included.
 */
import { cloneElement, type ReactElement } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ResultBlock } from "./types";

// jsdom has no layout, so ResponsiveContainer would measure 0×0 and draw no
// slices. Give the chart a fixed size so the sectors exist to be pressed.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 400, height: 240 }),
  };
});

// Draw the sectors at once: the entrance animation never ticks in jsdom.
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  useChartMotion: () => ({ isAnimationActive: false }),
}));

const i18n = (await import("@/i18n")).default;
const { ResultView } = await import("./result-block");
const { pieSlices } = await import("./result-pie");

const money: ResultBlock = {
  spec: { dataset: "sales" },
  columns: [
    { key: "category", label: "Category", kind: "label" },
    { key: "revenue", label: "Revenue", kind: "money" },
  ],
  rows: [
    { category: "Coffee", revenue: 750_000 },
    { category: "Pastry", revenue: 250_000 },
  ],
  row_count: 2,
  truncated: false,
  grain: "categorical",
  viz: "pie",
  scope: { all_branches: true, branches: [], label: "" },
};

const counts: ResultBlock = {
  ...money,
  viz: "donut",
  columns: [
    { key: "channel", label: "Channel", kind: "label" },
    { key: "orders", label: "Orders", kind: "count" },
  ],
  rows: [
    { channel: "Dine-in", orders: 1200 },
    { channel: "Takeaway", orders: 600 },
    { channel: "Delivery", orders: 200 },
    { channel: "Unknown", orders: null },
  ],
  row_count: 4,
};

/** Strip the bidi isolates and marks the formatters put around Arabic figures. */
const plain = (s: string | null | undefined) => (s ?? "").replace(/[\u200e\u200f\u2066-\u2069]/g, "");

const detail = () => screen.getByTestId("pie-detail");

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
  document.documentElement.dir = "ltr";
});

describe("pieSlices", () => {
  it("formats money in the merchant's currency and shares of the total", async () => {
    await act(() => i18n.changeLanguage("en"));
    const s = pieSlices(money, money.columns[1], "category");
    expect(s.map((x) => x.value)).toEqual(["EGP 7,500.00", "EGP 2,500.00"]);
    expect(s.map((x) => x.share)).toEqual(["75%", "25%"]);
    expect(s.map((x) => x.plot)).toEqual([7500, 2500]);
  });

  it("formats counts as integers and an unknown figure as a dash, not zero", async () => {
    await act(() => i18n.changeLanguage("en"));
    const s = pieSlices(counts, counts.columns[1], "channel");
    expect(s.map((x) => x.value)).toEqual(["1,200", "600", "200", "—"]);
    expect(s.map((x) => x.share)).toEqual(["60%", "30%", "10%", "0%"]);
  });
});

describe("Basira pie: pressing a slice", () => {
  it("shows the slice's reading when a slice is pressed, and lets go on a second press", async () => {
    await act(() => i18n.changeLanguage("en"));
    const { container } = render(<ResultView block={money} />);
    expect(detail()).toHaveTextContent("Tap a slice to see its figures");

    const slice = container.querySelector('[data-slice="0"]');
    expect(slice).not.toBeNull();
    fireEvent.click(slice!);
    expect(detail()).toHaveTextContent("Coffee");
    expect(detail()).toHaveTextContent("EGP 7,500.00");
    expect(detail()).toHaveTextContent("75% of the total");
    expect(container.querySelector('[data-slice="0"]')).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("button", { name: /Coffee/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(container.querySelector('[data-slice="0"]')!);
    expect(detail()).toHaveTextContent("Tap a slice to see its figures");
    expect(container.querySelector('[data-selected="true"]')).toBeNull();
  });

  it("previews a slice on hover without pinning it", async () => {
    await act(() => i18n.changeLanguage("en"));
    const { container } = render(<ResultView block={money} />);
    fireEvent.mouseEnter(container.querySelector('[data-slice="1"]')!);
    expect(detail()).toHaveTextContent("Pastry");
    expect(detail()).toHaveTextContent("25% of the total");
    fireEvent.mouseLeave(container.querySelector('[data-slice="1"]')!);
    expect(detail()).toHaveTextContent("Tap a slice to see its figures");
  });

  it("selects the same slice from its legend entry, and clears on a press elsewhere or Escape", async () => {
    await act(() => i18n.changeLanguage("en"));
    const { container } = render(
      <div>
        <button type="button">outside</button>
        <ResultView block={counts} />
      </div>,
    );
    const legend = screen.getByRole("list", { name: "Slices of Orders" });
    const takeaway = within(legend).getByRole("button", { name: "Takeaway: 600, 30% of the total" });
    takeaway.focus();
    fireEvent.click(takeaway);
    expect(takeaway).toHaveAttribute("aria-pressed", "true");
    expect(detail()).toHaveTextContent("Takeaway");
    expect(detail()).toHaveTextContent("600");
    expect(container.querySelector('[data-slice="1"]')).toHaveAttribute("data-selected", "true");

    fireEvent.pointerDown(screen.getByRole("button", { name: "outside" }));
    expect(takeaway).toHaveAttribute("aria-pressed", "false");
    expect(detail()).toHaveTextContent("Tap a slice to see its figures");

    fireEvent.click(takeaway);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(takeaway).toHaveAttribute("aria-pressed", "false");
  });

  it("reads in Arabic, with the currency and the page's direction", async () => {
    await act(() => i18n.changeLanguage("ar"));
    document.documentElement.dir = "rtl";
    const { container } = render(
      <div dir="rtl">
        <ResultView block={money} />
      </div>,
    );
    expect(detail()).toHaveTextContent("اضغط على شريحة لترى أرقامها");
    fireEvent.click(container.querySelector('[data-slice="0"]')!);
    expect(plain(detail().textContent)).toContain("7,500.00 ج.م");
    expect(plain(detail().textContent)).toContain("من الإجمالي");
    const btn = screen.getByRole("button", { pressed: true });
    expect(plain(btn.getAttribute("aria-label"))).toBe("Coffee: 7,500.00 ج.م، 75% من الإجمالي");
    // The plot stays left to right; the legend and the reading follow the page.
    expect(container.querySelector('[data-slice="0"]')!.closest("[dir]")).toHaveAttribute("dir", "ltr");
    expect(detail().closest("[dir]")).toHaveAttribute("dir", "rtl");
  });
});
