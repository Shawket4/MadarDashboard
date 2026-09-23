/**
 * Access ▸ Review bulk select: pick many flags (or all shown), resolve them in
 * one call with an optional note, and show the result honestly — including the
 * ids the server could not resolve. Hidden entirely without `approvals.review`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { ReplayFlag } from "@/data/api/generated/models";

const flag = (id: number, over: Partial<ReplayFlag> = {}): ReplayFlag => ({
  id,
  branch_id: "b-1",
  op: "CreateOrder",
  author_id: "u-1",
  author_name: `Teller ${id}`,
  capability: "orders.void",
  reason: "unauthorized_offline",
  occurred_at: "2026-09-17T10:00:00Z",
  created_at: "2026-09-17T10:00:01Z",
  reviewed_at: null,
  reviewed_by: null,
  ...over,
});

let rows: ReplayFlag[] = [];
let held: string[] = ["approvals.review"];
let bulkResult: { resolved: number[]; pending: { id: number; reason: string }[] } = { resolved: [], pending: [] };
const bulkMutate = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListFlags: () => ({ data: rows, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
  useReviewFlag: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
  useBulkReviewFlags: (opts?: { mutation?: { onSuccess?: (r: unknown) => void } }) => ({
    isPending: false,
    mutate: (v: unknown) => {
      bulkMutate(v);
      opts?.mutation?.onSuccess?.(bulkResult);
    },
  }),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () =>
    real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} });
  return {
    ...real,
    useAuthz: () => authz(),
    useCan: (cap: string) => authz().can(cap as never),
  };
});

const toasts: { kind: string; msg: string; desc?: string }[] = [];
vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toasts.push({ kind: "success", msg }),
    warning: (msg: string, o?: { description?: string }) => toasts.push({ kind: "warning", msg, desc: o?.description }),
    error: (msg: string) => toasts.push({ kind: "error", msg }),
  },
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ReviewPage } = await import("./review-page");

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReviewPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  held = ["approvals.review"];
  rows = [flag(1), flag(2), flag(3, { reviewed_at: "2026-09-17T12:00:00Z", reviewed_by: "u-9" })];
  bulkResult = { resolved: [], pending: [] };
  bulkMutate.mockClear();
  toasts.length = 0;
});

describe("ReviewPage bulk select", () => {
  it("has no checkboxes or bulk bar without approvals.review", () => {
    held = [];
    renderPage();
    expect(screen.queryByTestId("flag-select-all")).not.toBeInTheDocument();
    expect(screen.queryByTestId("flag-bulk-bar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark reviewed/ })).not.toBeInTheDocument();
  });

  it("resolves the picked flags with the note in one call", async () => {
    bulkResult = { resolved: [1, 2], pending: [] };
    renderPage();
    await userEvent.click(screen.getByTestId("flag-pick-1"));
    await userEvent.click(screen.getByTestId("flag-pick-2"));
    expect(screen.getByTestId("flag-bulk-bar")).toHaveTextContent("2 selected");
    await userEvent.type(screen.getByTestId("flag-bulk-note"), "checked with the manager");
    await userEvent.click(screen.getByTestId("flag-bulk-resolve"));
    expect(bulkMutate).toHaveBeenCalledWith({ data: { flag_ids: [1, 2], note: "checked with the manager" } });
    expect(toasts).toEqual([{ kind: "success", msg: "Resolved 2" }]);
    expect(screen.queryByTestId("flag-bulk-bar")).not.toBeInTheDocument();
  });

  it("select-all takes every open flag shown and never an already-reviewed one", async () => {
    bulkResult = { resolved: [1, 2], pending: [] };
    renderPage();
    expect(screen.queryByTestId("flag-pick-3")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("flag-select-all"));
    await userEvent.click(screen.getByTestId("flag-bulk-resolve"));
    expect(bulkMutate).toHaveBeenCalledWith({ data: { flag_ids: [1, 2], note: undefined } });
  });

  it("shows a partial result with every id the server refused and why", async () => {
    bulkResult = { resolved: [1], pending: [{ id: 2, reason: "no such open flag in this org" }] };
    renderPage();
    await userEvent.click(screen.getByTestId("flag-select-all"));
    await userEvent.click(screen.getByTestId("flag-bulk-resolve"));
    expect(toasts[0].kind).toBe("warning");
    expect(toasts[0].msg).toBe("Resolved 1, 1 could not be resolved");
    expect(toasts[0].desc).toContain("#2: no such open flag in this org");
  });

  it("speaks Arabic too", async () => {
    await i18n.changeLanguage("ar");
    renderPage();
    await userEvent.click(screen.getByTestId("flag-pick-1"));
    expect(screen.getByTestId("flag-bulk-resolve")).toHaveTextContent("تمييز 1 كمراجَع");
    await i18n.changeLanguage("en");
  });
});

describe("ReviewPage — staff drink replay flags", () => {
  const CAP = "orders.staff_drink.record";
  const DETAILS = [
    "comp_mismatch",
    "overspent",
    "device_overcounted",
    "duplicate_id",
    "pool_off",
    "no_eligible_items",
    "item_not_eligible",
    "note_required",
  ];

  it("says what happened in words, never as a raw capability:detail key", () => {
    rows = DETAILS.map((d, i) => flag(i + 1, { capability: `${CAP}:${d}` }));
    const { container } = renderPage();
    expect(screen.getByText("Staff drink: the till gave a different amount free than the server priced")).toBeInTheDocument();
    expect(screen.getByText("Staff drink: the same drink was already rung on another order")).toBeInTheDocument();
    expect(screen.getAllByText("Record a staff drink")).toHaveLength(DETAILS.length);
    // No key leaks, no untranslated i18n path, and the fixed reason — which
    // would read "without the permission" — is not what these rows say.
    expect(container.textContent).not.toContain(CAP);
    expect(container.textContent).not.toContain("access.review.details");
    expect(screen.queryByText("Done offline without the permission")).not.toBeInTheDocument();
  });

  it("leaves the plain permission flag, and any detail it has no words for, as they were", () => {
    rows = [flag(1, { capability: CAP }), flag(2, { capability: "orders.discount.preset:inactive" })];
    renderPage();
    expect(screen.getAllByText("Done offline without the permission")).toHaveLength(2);
    expect(screen.getByText(CAP)).toBeInTheDocument();
    expect(screen.getByText("orders.discount.preset:inactive")).toBeInTheDocument();
  });

  it("has Arabic for every detail", async () => {
    await i18n.changeLanguage("ar");
    try {
      rows = DETAILS.map((d, i) => flag(i + 1, { capability: `${CAP}:${d}` }));
      const { container } = renderPage();
      expect(screen.getByText("مشروب موظفين: المبلغ المجاني الذي سجّله الكاشير يختلف عمّا حسبه الخادم")).toBeInTheDocument();
      expect(screen.getAllByText("تسجيل مشروب موظفين")).toHaveLength(DETAILS.length);
      expect(container.textContent).not.toMatch(/Staff drink|access\.review|orders\.staff_drink/);
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
