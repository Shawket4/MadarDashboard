/**
 * Reports › Bundles: who gets it, what a combo's line says (money in pounds,
 * margin as a percent, a lower-bound cost when some cost is unknown), that the
 * Combos/Deals switch asks the API for deals, what the export carries, and that
 * a combo row opens its mix.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BundlesReport, ComboMix } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

let held: string[] = [];
let report: BundlesReport | undefined;
let mix: ComboMix | undefined;
const reportCalls: { params: Record<string, unknown>; enabled: boolean | undefined }[] = [];
const mixCalls: { comboId: string; params: unknown }[] = [];
const exportToExcel = vi.fn();
const toastError = vi.fn();

// The KPI figures count up from 0 on first reveal; under reduced motion they
// show the final figure at once, which is what a test can read.
vi.mock("motion/react", async () => {
  const real = await vi.importActual<typeof import("motion/react")>("motion/react");
  return { ...real, useReducedMotion: () => true };
});
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/hooks/use-export-logo", () => ({ useExportLogo: () => undefined }));
vi.mock("@/data/scope/use-scope", () => ({
  useScope: () => ({
    branchId: "b-1",
    scopeBranchId: "b-1",
    // Cairo is UTC+3 in September: these are the 1st and the 30th, local.
    from: "2026-08-31T21:00:00Z",
    to: "2026-09-30T20:59:59Z",
  }),
}));
vi.mock("@/lib/excel", async () => {
  const real = await vi.importActual<typeof import("@/lib/excel")>("@/lib/excel");
  return { ...real, exportToExcel: (...a: unknown[]) => exportToExcel(...a) };
});
vi.mock("@/features/combos/api", () => ({
  useBundlesReport: (params: Record<string, unknown>, opts?: { enabled?: boolean }) => {
    reportCalls.push({ params, enabled: opts?.enabled });
    return { data: opts?.enabled === false ? undefined : report, isLoading: false, error: null, refetch: vi.fn() };
  },
  useComboMix: (comboId: string, params: unknown) => {
    mixCalls.push({ comboId, params });
    return { data: mix, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

const i18n = (await import("@/i18n")).default;
const { BundlesReportPage } = await import("./bundles-report-page");

const fixture = (): BundlesReport => ({
  from: "2026-09-01",
  to: "2026-09-30",
  rows: [
    {
      id: "c-1",
      kind: "combo",
      name: "Lunch deal",
      name_translations: {},
      sold: 12,
      orders: 10,
      revenue: 180000,
      list_value: 216000,
      saving: 36000,
      cost: 67540,
      cost_missing: false,
      margin: "0.6248",
    },
    {
      id: "c-2",
      kind: "combo",
      name: "Family box",
      name_translations: {},
      sold: 3,
      orders: 2,
      revenue: 90000,
      list_value: 105000,
      saving: 15000,
      cost: 20000,
      cost_missing: true,
      margin: "0.7778",
    },
  ],
  totals: { sold: 15, revenue: 270000, list_value: 321000, saving: 51000, cost: 87540 },
});

const mixFixture = (): ComboMix => ({
  combo_id: "c-1",
  from: "2026-09-01",
  to: "2026-09-30",
  slots: [
    {
      slot_id: "s-main",
      name: "Main",
      picks: [
        { menu_item_id: "burger", name: "Burger", name_translations: {}, size_label: null, count: 9, surcharge_total: 0 },
        { menu_item_id: "chicken", name: "Chicken wrap", name_translations: {}, size_label: null, count: 3, surcharge_total: 4500 },
      ],
    },
    {
      slot_id: "s-drink",
      name: "Drink",
      picks: [{ menu_item_id: "cola", name: "Cola", name_translations: {}, size_label: null, count: 12, surcharge_total: 0 }],
    },
  ],
});

const rowOf = (name: string) => screen.getAllByRole("row").find((r) => within(r).queryByText(name))!;

beforeEach(async () => {
  await i18n.changeLanguage("en");
  held = ["reports.bundles"];
  report = fixture();
  mix = mixFixture();
  reportCalls.length = 0;
  mixCalls.length = 0;
  exportToExcel.mockReset().mockResolvedValue(undefined);
  toastError.mockReset();
});

describe("Bundles report · access", () => {
  it("without reports.bundles shows the restricted state and asks the API nothing", () => {
    held = [];
    render(<BundlesReportPage />);
    expect(screen.getByText(/The owner can give you access/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(reportCalls.length).toBeGreaterThan(0);
    expect(reportCalls.every((c) => c.enabled === false)).toBe(true);
  });

  it("with reports.bundles queries the period and branch as local dates and renders the report", () => {
    render(<BundlesReportPage />);
    expect(reportCalls.at(-1)).toEqual({
      params: { from: "2026-09-01", to: "2026-09-30", branch_id: "b-1", kind: "combo" },
      enabled: true,
    });
    expect(screen.queryByText(/The owner can give you access/)).not.toBeInTheDocument();
    expect(screen.getByText("Lunch deal")).toBeInTheDocument();
  });
});

describe("Bundles report · the table", () => {
  it("shows each combo's counts, money in pounds and margin as a percent", () => {
    render(<BundlesReportPage />);
    const row = rowOf("Lunch deal");
    const cells = within(row).getAllByRole("cell").map((c) => c.textContent);
    expect(cells).toEqual([
      "Lunch deal",
      fmtNumber(12),
      fmtNumber(10),
      fmtMoney(180000),
      fmtMoney(216000),
      fmtMoney(36000),
      fmtMoney(67540),
      fmtPercent(0.6248),
    ]);
    // Piastres became pounds: 180000 → EGP 1,800.00, and the margin 62.5%.
    expect(fmtMoney(180000)).toMatch(/1,800\.00/);
    expect(fmtPercent(0.6248)).toBe("62.5%");
  });

  it("marks a combo whose cost is partly unknown: the cost is a floor and the margin is blank", () => {
    render(<BundlesReportPage />);
    const row = rowOf("Family box");
    const cells = within(row).getAllByRole("cell").map((c) => c.textContent);
    expect(cells[6]).toBe(`≥ ${fmtMoney(20000)}`);
    expect(cells[7]).toBe("—");
    // Not the server's margin, which rests on a cost it doesn't fully know.
    expect(within(row).queryByText(fmtPercent(0.7778))).not.toBeInTheDocument();
  });

  it("shows the period totals in the KPI strip", () => {
    render(<BundlesReportPage />);
    expect(screen.getByText(fmtNumber(15))).toBeInTheDocument();
    expect(screen.getAllByText(fmtMoney(270000)).length).toBeGreaterThan(0);
    expect(screen.getByText(fmtMoney(51000))).toBeInTheDocument();
    // "Family box" has an unknown cost, so the total cost is only a floor: no margin.
    expect(screen.queryByText("67.6%")).not.toBeInTheDocument();
  });

  it("shows the period margin once every row's cost is known", () => {
    const f = fixture();
    report = { ...f, rows: f.rows.map((r) => ({ ...r, cost_missing: false })) };
    render(<BundlesReportPage />);
    // (270000 − 87540) / 270000 = 0.6758 → 67.6%
    expect(screen.getByText("67.6%")).toBeInTheDocument();
  });
});

describe("Bundles report · Combos / Deals", () => {
  it("switching to Deals queries with kind deal and relabels the columns", () => {
    render(<BundlesReportPage />);
    report = { ...fixture(), rows: [], totals: { sold: 0, revenue: 0, list_value: 0, saving: 0, cost: 0 } };
    fireEvent.click(screen.getByRole("radio", { name: "Deals" }));
    expect(screen.getByRole("radio", { name: "Deals" })).toHaveAttribute("aria-checked", "true");
    expect(reportCalls.at(-1)?.params).toEqual({ from: "2026-09-01", to: "2026-09-30", branch_id: "b-1", kind: "deal" });
    expect(screen.getByText("No deals applied in this period")).toBeInTheDocument();
  });
});

describe("Bundles report · export", () => {
  it("hands the rows and columns to the Excel export with headers and units", async () => {
    render(<BundlesReportPage />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));

    const arg = exportToExcel.mock.calls[0][0] as {
      filename: string;
      sheets: { name: string; rows: Record<string, unknown>[]; columns: { header: string; accessor: (r: unknown) => unknown; type: string }[]; totals: boolean }[];
    };
    expect(arg.filename).toBe("Madar-Bundles-Combos-2026-09-01_2026-09-30");
    const [sheet] = arg.sheets;
    expect(sheet.name).toBe("Combos");
    expect(sheet.totals).toBe(true);
    expect(sheet.columns.map((c) => c.header)).toEqual(["Combo", "Sold", "Orders", "Revenue", "Separately", "Saving given", "Cost", "Margin"]);
    expect(sheet.rows).toHaveLength(2);

    // Money leaves as piastres typed "money" (the exporter divides by 100);
    // the margin leaves as a fraction typed "percent", blank when cost is unknown.
    const values = (r: unknown) => sheet.columns.map((c) => c.accessor(r));
    expect(values(sheet.rows[0])).toEqual(["Lunch deal", 12, 10, 180000, 216000, 36000, 67540, 0.6248]);
    expect(values(sheet.rows[1])[7]).toBeNull();
    expect(sheet.columns.map((c) => c.type)).toEqual(["text", "integer", "integer", "money", "money", "money", "money", "percent"]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("says why when the export fails", async () => {
    exportToExcel.mockRejectedValueOnce(new Error("disk full"));
    render(<BundlesReportPage />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
  });
});

describe("Bundles report · the mix", () => {
  it("clicking a combo row opens its mix: slots and picks, most-picked first", async () => {
    render(<BundlesReportPage />);
    fireEvent.click(rowOf("Lunch deal"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("What went into Lunch deal")).toBeInTheDocument();
    expect(mixCalls.at(-1)).toEqual({ comboId: "c-1", params: { from: "2026-09-01", to: "2026-09-30", branch_id: "b-1" } });

    const main = within(dialog).getByRole("region", { name: "Main" });
    const mainRows = within(main).getAllByRole("row").slice(1);
    expect(mainRows.map((r) => within(r).getAllByRole("cell").map((c) => c.textContent))).toEqual([
      ["Burger", fmtNumber(9), "75%", "—"],
      ["Chicken wrap", fmtNumber(3), "25%", fmtMoney(4500)],
    ]);
    const drink = within(dialog).getByRole("region", { name: "Drink" });
    expect(within(drink).getByText("Cola")).toBeInTheDocument();
    expect(within(drink).getByText("100%")).toBeInTheDocument();
  });
});
