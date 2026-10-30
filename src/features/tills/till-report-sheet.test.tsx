import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TillReconciliationLine, TillReport } from "./api";
import { till } from "./fixtures.test-util";

let report: Partial<TillReport> | undefined;
vi.mock("./api", () => ({
  useTillReport: () => ({ data: report, isLoading: false, isError: false, refetch: vi.fn() }),
  useTillSummary: () => ({ data: undefined }),
}));
vi.mock("./till-spot-views", () => ({ TillSpotViews: () => null }));
vi.mock("./till-deductions", () => ({ TillDeductions: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ReconciliationTable } = await import("./reconciliation-table");
const { TillReportSheet } = await import("./till-report-sheet");

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

describe("TillReportSheet — By person (TELLER_PICK)", () => {
  const figures = {
    till: till(),
    payment_summary: [{ payment_method: "cash", is_cash: true, order_count: 3, total: 30_000 }],
    reconciliation: [],
    cash_movements: [],
    cash_movements_in: 0,
    cash_movements_out: 0,
    net_payments: 30_000,
    total_payments: 30_000,
    total_tips: 0,
    voided_amount: 0,
  } as unknown as TillReport;

  it("shows the section when the report carries by_person", () => {
    report = {
      ...figures,
      by_person: [
        { person_id: "u-karim", name: "Karim Saleh", order_count: 2, total: 20_000, tips: 0 },
        { person_id: "u1", name: "Mona Adel", order_count: 1, total: 10_000, tips: 0 },
      ],
    };
    render(<TillReportSheet tillId="t1" open onOpenChange={() => {}} />);
    expect(screen.getByRole("heading", { name: "By person" })).toBeInTheDocument();
    expect(screen.getAllByTestId("till-person-line")).toHaveLength(2);
  });

  it("has no section, and no empty header, when the key is absent (nobody was picked)", () => {
    report = { ...figures };
    render(<TillReportSheet tillId="t1" open onOpenChange={() => {}} />);
    expect(screen.getByText("Payment summary")).toBeInTheDocument();
    expect(screen.queryByText("By person")).not.toBeInTheDocument();
    expect(screen.queryByTestId("till-person-line")).not.toBeInTheDocument();
  });
});
