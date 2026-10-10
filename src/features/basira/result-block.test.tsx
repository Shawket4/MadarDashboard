/**
 * REP-BAS-032 (W7): the heatmap is a plot like the charts, so it stays left
 * to right in Arabic: row labels on the left, hours running 0 → 23.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ResultBlock } from "./types";

const i18n = (await import("@/i18n")).default;
const { ResultView } = await import("./result-block");

const block: ResultBlock = {
  spec: { dataset: "orders" },
  columns: [
    { key: "weekday", label: "Weekday", kind: "label" },
    { key: "hour", label: "Hour", kind: "label" },
    { key: "orders", label: "Orders", kind: "count" },
  ],
  rows: [
    { weekday: "Mon", hour: "08", orders: 4 },
    { weekday: "Mon", hour: "09", orders: 9 },
  ],
  row_count: 2,
  truncated: false,
  grain: "table",
  viz: "heatmap",
  scope: { all_branches: true, branches: [], label: "" },
};

describe("Basira heatmap (W7, REP-BAS-032)", () => {
  it("stays left to right in Arabic", async () => {
    await i18n.changeLanguage("ar");
    document.documentElement.dir = "rtl";
    render(<div dir="rtl"><ResultView block={block} /></div>);
    const table = screen.getByRole("table");
    expect(table.closest("[dir]")).toHaveAttribute("dir", "ltr");
    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["", "08", "09"]);
    document.documentElement.dir = "ltr";
  });
});
