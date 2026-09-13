import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DeductionLogRow } from "./api";

await import("@/i18n");
const { DeductionList, summarizeDeductions } = await import("./till-deductions");

const row = (over: Partial<DeductionLogRow>): DeductionLogRow => ({
  id: Math.random().toString(36),
  created_at: "2026-09-13T10:00:00Z",
  inventory_item_id: "milk",
  item_name: "Milk",
  quantity_deducted: 200,
  source: "sale",
  unit: "ml",
  ...over,
});

describe("till deductions", () => {
  it("nets sales against restocks per item", () => {
    const totals = summarizeDeductions([
      row({}),
      row({ quantity_deducted: 300 }),
      row({ quantity_deducted: -200, source: "void_restock" }),
      row({ inventory_item_id: "beans", item_name: "Beans", quantity_deducted: 18, unit: "g" }),
    ]);
    expect(totals).toEqual([
      { key: "milk:ml", name: "Milk", unit: "ml", used: 300, returned: 200 },
      { key: "beans:g", name: "Beans", unit: "g", used: 18, returned: 0 },
    ]);
  });

  it("lists each item with what was put back", () => {
    render(<DeductionList totals={[{ key: "milk:ml", name: "Milk", unit: "ml", used: 300, returned: 200 }]} />);
    expect(screen.getByTestId("till-deductions")).toHaveTextContent(/Milk/);
    expect(screen.getByText(/300/)).toBeInTheDocument();
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });
});
