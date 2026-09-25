/**
 * Legal ▸ Deduction overrides reads the history (owner decision 8, AD-9,
 * AT-10): every waive, undo and override with who, when, why and the
 * amounts, so a waiver that was later undone doesn't vanish.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
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

const i18n = (await import("@/i18n")).default;
const { AuditTab } = await import("./audit-tab");

const history = [
  {
    deduction_id: "d1", employee_id: "e4", employee_name: "Youssef Adel", action: "unwaive", actor_id: "u1", actor_name: "Tasbeeh",
    at: "2026-09-22T10:00:00Z", reason: "Waived by mistake", amount_before_piastres: 0, amount_after_piastres: 5_000,
    effective_date: "2026-09-18", source: "late_penalty", reason_code: "late",
  },
  {
    deduction_id: "d1", employee_id: "e4", employee_name: "Youssef Adel", action: "waive", actor_id: "u2", actor_name: "Karim",
    at: "2026-09-20T09:00:00Z", reason: "Traffic accident on the ring road", amount_before_piastres: 5_000, amount_after_piastres: 0,
    effective_date: "2026-09-18", source: "late_penalty", reason_code: "late",
  },
  {
    deduction_id: "d2", employee_id: "e1", employee_name: "Sara Ahmed", action: "override", actor_id: "u2", actor_name: "Karim",
    at: "2026-09-21T09:00:00Z", reason: "Half of it", amount_before_piastres: 20_000, amount_after_piastres: 10_000,
    effective_date: "2026-09-19", source: "absence", reason_code: "absent_no_punch",
  },
];

const query = (data: unknown) => ({ data: data as never, isLoading: false, isError: false, refetch: vi.fn() });

describe("Deduction overrides history", () => {
  it("lists each event with who, when, why and the amounts, even when nothing stands overridden today", async () => {
    await i18n.changeLanguage("en");
    render(<AuditTab query={query({ total_count: 0, total_amount_minor: 0, by_reason: [], by_issuer: [], history })} reasonLabel="By type" exportTitle="Deduction overrides" />);
    const card = screen.getByText("History").closest("[data-slot=card]") as HTMLElement;
    const items = within(card).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText(/Youssef Adel/)).toBeInTheDocument();
    expect(within(items[0]).getByText("Waiver undone")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Tasbeeh/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/Waived by mistake/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/EGP 0\.00 → EGP 50\.00/)).toBeInTheDocument();
    expect(within(items[1]).getByText("Waived")).toBeInTheDocument();
    expect(within(items[2]).getByText("Overridden")).toBeInTheDocument();
    expect(screen.queryByText("Nothing recorded in this period")).not.toBeInTheDocument();
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<AuditTab query={query({ total_count: 0, total_amount_minor: 0, by_reason: [], by_issuer: [], history })} reasonLabel="x" exportTitle="x" />);
    expect(screen.queryByText("History")).not.toBeInTheDocument();
    expect(screen.queryByText("Waiver undone")).not.toBeInTheDocument();
    await i18n.changeLanguage("en");
  });

  it("is absent on reports without a history", () => {
    render(<AuditTab query={query({ total_count: 0, total_amount_minor: 0, by_reason: [], by_issuer: [] })} reasonLabel="x" exportTitle="x" />);
    expect(screen.getByText("Nothing recorded in this period")).toBeInTheDocument();
  });
});
