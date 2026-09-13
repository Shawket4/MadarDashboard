import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TillReconciliationLine } from "./api";

await import("@/i18n");
const { ReconciliationTable } = await import("./reconciliation-table");

const line = (over: Partial<TillReconciliationLine>): TillReconciliationLine => ({
  method: "cash",
  is_cash: true,
  system_total: 10_000,
  current_system_total: 10_000,
  order_count: 3,
  status: "checked",
  reconciled_at: "2026-09-13T15:00:00Z",
  changed_after_close: false,
  ...over,
});

describe("ReconciliationTable", () => {
  it("renders nothing for pre-rework tills", () => {
    const { container } = render(<ReconciliationTable lines={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each method with status, declared amount, note and late changes", () => {
    render(
      <ReconciliationTable
        lines={[
          line({}),
          line({ method: "CIB counter", is_cash: false, status: "disagreed", declared_amount: 9_000, note: "slip missing", current_system_total: 12_000, changed_after_close: true }),
          line({ method: "Wallet", is_cash: false, status: "unreviewed" }),
        ]}
      />,
    );
    const rows = screen.getAllByTestId("reconciliation-line");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("slip missing")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Doesn't match|غير مطابق/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Changed after close|تغيّر بعد الإغلاق/)).toBeInTheDocument();
    expect(within(rows[2]).getByText(/Not reviewed|لم تتم المراجعة/)).toBeInTheDocument();
  });
});
