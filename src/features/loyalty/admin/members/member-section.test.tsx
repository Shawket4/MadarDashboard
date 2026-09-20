/**
 * The ledger table: every movement readable, reversals visible, orders linked.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LedgerEntry } from "@/data/api/generated/models";

await import("@/i18n");
const { LedgerTable } = await import("./member-section");

const row = (over: Partial<LedgerEntry>): LedgerEntry => ({
  id: "r",
  kind: "earn",
  source: "sale",
  currency: "points",
  points: 10,
  branch_id: "b",
  branch_name: "Maadi",
  created_at: "2026-09-10T10:00:00Z",
  ...over,
});

describe("LedgerTable", () => {
  it("shows an empty state with no movements", () => {
    render(<LedgerTable entries={[]} onOpenOrder={() => {}} />);
    expect(screen.getByText(/No movements yet|لا توجد حركات/)).toBeInTheDocument();
  });

  it("labels each movement, keeps the reason, and links the order", async () => {
    const onOpenOrder = vi.fn();
    render(
      <LedgerTable
        onOpenOrder={onOpenOrder}
        entries={[
          row({ id: "rev", kind: "reverse_earn", source: "void", points: -10, reverses_id: "earn", order_id: "o-1" }),
          row({ id: "adj", kind: "adjust", source: "manual", points: 3, note: "Missed stamp" }),
          row({ id: "earn", order_id: "o-1" }),
        ]}
      />,
    );
    const rows = screen.getAllByTestId("ledger-row");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText(/Earn reversed \(void\)|عكس نقاط/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Missed stamp/)).toBeInTheDocument();
    // The earn a void undid is marked as reversed.
    expect(within(rows[2]).getByText(/reversed|مُلغاة/)).toBeInTheDocument();
    await userEvent.click(within(rows[2]).getByRole("button"));
    expect(onOpenOrder).toHaveBeenCalledWith("o-1");
  });
});
