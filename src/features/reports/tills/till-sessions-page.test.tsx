/**
 * The till sessions report: who gets it, what each state of the load looks
 * like, and that a drawer's row says what the API said — signs, blanks and all.
 */
import { AxiosError, type AxiosResponse } from "axios";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_TILL_SESSIONS } from "@/data/api/mock/data";
import type { TillSessionRow } from "@/data/api/generated/models";

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

let held: string[] = [];
let result: { data?: TillSessionRow[]; isLoading: boolean; error: unknown; refetch: () => void };
const calls: { branch: string; params: unknown; enabled: boolean | undefined }[] = [];

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
    branchId: null,
    scopeBranchId: "00000000-0000-0000-0000-000000000000",
    from: "2026-09-01T00:00:00Z",
    to: "2026-09-30T00:00:00Z",
  }),
}));
vi.mock("@/data/api/generated/api", () => ({
  useBranchTillSessions: (branch: string, params: unknown, opts?: { query?: { enabled?: boolean } }) => {
    calls.push({ branch, params, enabled: opts?.query?.enabled });
    return result;
  },
}));

const i18n = (await import("@/i18n")).default;
const { TillSessionsPage } = await import("./till-sessions-page");

const http = (status: number, data: unknown = {}) =>
  new AxiosError("x", "ERR", undefined, undefined, { status, data } as AxiosResponse);
const loaded = (data: TillSessionRow[]) => ({ data, isLoading: false, error: null, refetch: vi.fn() });
const rowOf = (teller: string, date?: RegExp) =>
  screen.getAllByRole("row").find((r) => within(r).queryByText(teller) && (!date || within(r).queryByText(date)))!;

beforeEach(async () => {
  await i18n.changeLanguage("en");
  held = ["till.read", "till.read.branch"];
  calls.length = 0;
  result = loaded(MOCK_TILL_SESSIONS);
});

describe("Till sessions · access", () => {
  it("is not offered on till.read alone, and asks the API nothing", () => {
    // till.read is every teller's; the API would answer with their own drawer
    // only, which under this title would pass for the branch's.
    held = ["till.read"];
    render(<TillSessionsPage />);
    expect(screen.getByText(/The owner can give you access/)).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(calls.every((c) => c.enabled === false)).toBe(true);
  });

  it("opens with till.read.branch, asking for the scope's branch and range only", () => {
    render(<TillSessionsPage />);
    expect(screen.getByRole("tab", { name: "Sessions" })).toBeInTheDocument();
    expect(calls.at(-1)).toEqual({
      branch: "00000000-0000-0000-0000-000000000000",
      params: { from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z" },
      enabled: true,
    });
  });
});

describe("Till sessions · load states", () => {
  it("does not report a count of zero while it is still loading", () => {
    result = { data: undefined, isLoading: true, error: null, refetch: vi.fn() };
    render(<TillSessionsPage />);
    expect(screen.queryByText(/0 till sessions/)).not.toBeInTheDocument();
    expect(screen.queryByText("No till sessions opened in this period")).not.toBeInTheDocument();
  });

  it("says so when the period has no sessions", () => {
    result = loaded([]);
    render(<TillSessionsPage />);
    expect(screen.getByText("No till sessions opened in this period")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/ })).toBeDisabled();
  });

  it("shows a failed load as a failure, with Retry", () => {
    const refetch = vi.fn();
    result = { data: undefined, isLoading: false, error: http(500), refetch };
    render(<TillSessionsPage />);
    expect(screen.queryByText("No till sessions opened in this period")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("asks for a shorter range when the API refuses this one — and offers no Retry", () => {
    result = {
      data: undefined,
      isLoading: false,
      error: http(400, { error: "More than 5000 till sessions in this range; narrow `from`/`to`" }),
      refetch: vi.fn(),
    };
    render(<TillSessionsPage />);
    expect(screen.getByText(/Choose a shorter date range/)).toBeInTheDocument();
    expect(screen.queryByText(/narrow `from`/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});

describe("Till sessions · a drawer's row", () => {
  it("shows a short till with a true minus and the word for it", () => {
    render(<TillSessionsPage />);
    const row = rowOf("Nour Adel", /18 Sept? 2026/);
    expect(within(row).getByText("−EGP 15.00")).toBeInTheDocument();
    expect(within(row).getByText("Short")).toHaveClass("sr-only");
  });

  it("shows an over with a plus, and its signed adjustment", () => {
    render(<TillSessionsPage />);
    const row = rowOf("Omar Fathy");
    expect(within(row).getByText("+EGP 7.50")).toBeInTheDocument();
    expect(within(row).getByText("Over")).toHaveClass("sr-only");
    expect(within(row).getByText("−EGP 5.00")).toBeInTheDocument();
  });

  it("leaves a force-close nobody counted blank — never a zero variance — and names it", () => {
    render(<TillSessionsPage />);
    const row = rowOf("Sara Helmy");
    expect(within(row).getByText("Force-closed")).toBeInTheDocument();
    expect(within(row).getByText("EGP 732.00")).toBeInTheDocument(); // expected is known
    expect(within(row).getAllByText("—")).toHaveLength(2); // declared, variance
  });

  it("marks a running till Open, with no closing figures", () => {
    render(<TillSessionsPage />);
    const row = rowOf("Nour Adel", /19 Sept? 2026/);
    expect(within(row).getByText("Open")).toBeInTheDocument();
    expect(within(row).getAllByText("—")).toHaveLength(3); // declared, expected, variance
  });

  it("reads in Arabic: real labels, Western digits, LTR-isolated figures", async () => {
    await i18n.changeLanguage("ar");
    render(<TillSessionsPage />);
    expect(screen.getByRole("tab", { name: "الورديات" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /فرق النقدية/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /تسويات/ })).toBeInTheDocument();
    const row = rowOf("Omar Fathy");
    expect(within(row).getByText("⁦+7.50⁩ ج.م")).toBeInTheDocument();
    expect(within(row).getByText("زيادة")).toBeInTheDocument();
  });
});

describe("Till sessions · sales and timing tabs", () => {
  const openTab = (name: string) => {
    const tab = screen.getByRole("tab", { name });
    fireEvent.mouseDown(tab);
    fireEvent.click(tab);
  };

  it("ranks sessions by net sales and tells one teller's days apart", () => {
    render(<TillSessionsPage />);
    openTab("Sales");
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("EGP 4,862.00")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Zamalek · 18 Sept? 2026/)).toBeInTheDocument();
    expect(within(items[0]).getByRole("progressbar")).toHaveAccessibleName("100% of the best session");
  });

  it("caps a long ranking and opens it on request", () => {
    const many = Array.from({ length: 45 }, (_, i) => ({
      ...MOCK_TILL_SESSIONS[0],
      till_id: `t-${i}`,
      net_sales: 1000 * (i + 1),
    }));
    result = loaded(many);
    render(<TillSessionsPage />);
    openTab("Sales");
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    fireEvent.click(screen.getByRole("button", { name: "Show all 45 sessions" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(45);
  });

  it("never passes a failed load off as an empty period on the other tabs", () => {
    result = { data: undefined, isLoading: false, error: http(500), refetch: vi.fn() };
    render(<TillSessionsPage />);
    for (const name of ["Sales", "Open & close"]) {
      openTab(name);
      expect(screen.queryByText("No till sessions opened in this period")).not.toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    }
  });

  it("gives the hour chart a text alternative on the app's 12-hour clock", () => {
    render(<TillSessionsPage />);
    openTab("Open & close");
    expect(screen.getByRole("img")).toHaveAccessibleName(/Typical open 10:08 AM, typical close 10:16 PM/);
  });
});
