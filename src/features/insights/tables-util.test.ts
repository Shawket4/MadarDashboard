import { describe, expect, it } from "vitest";
import type { WidgetOutcome } from "@/data/api/generated/models";
import { fmtDwell, sectionsOf, toHourSeries, toSummary, toTableRows } from "./tables-util";

const ok = (rows: Record<string, unknown>[]) =>
  ({
    status: "ok",
    rows,
    columns: [],
    grain: "table",
    period: {},
    row_count: rows.length,
    truncated: false,
    viz: "table",
  }) as unknown as WidgetOutcome;

describe("tables-util", () => {
  it("reads a failed widget as nothing", () => {
    expect(toSummary({ status: "error", error: "x" })).toBeNull();
    expect(toTableRows(undefined)).toEqual([]);
  });

  it("shapes table rows and sections", () => {
    const rows = toTableRows(
      ok([
        { branch: "A", section: "Patio", table: "T1", turns: 3, covers: 7, table_revenue: 9000 },
        { branch: "A", section: "Bar", table: "B1", turns: 1 },
      ]),
    );
    expect(rows[0].covers).toBe(7);
    expect(rows[1].table_revenue).toBe(0);
    expect(sectionsOf(rows)).toEqual(["Bar", "Patio"]);
  });

  it("fills hour gaps", () => {
    const s = toHourSeries(ok([{ hour: "09:00", turns: 2 }, { hour: "11:00", turns: 1, covers: 4 }]));
    expect(s.map((x) => x.hour)).toEqual(["09:00", "10:00", "11:00"]);
    expect(s[1].turns).toBe(0);
  });

  it("formats a stay", () => {
    expect(fmtDwell(0.2)).toBe("—");
    expect(fmtDwell(45)).toBe("45m");
    expect(fmtDwell(65)).toBe("1h 05m");
  });
});
