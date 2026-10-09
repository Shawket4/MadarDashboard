/**
 * Menu › Combos, gated by capability: `menu.items.read` shows the list (name,
 * Fixed badge, price, warning chip) with no way to author; adding
 * `menu.combos.edit` offers "New combo"; without `menu.items.read` the page
 * says it is not this account's to see and asks the server for nothing.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fmtMoney } from "@/lib/format";

import type { ComboSummary } from "./types";

let held: string[] = [];
let rows: ComboSummary[] = [];
const useCombos = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: (p: { children: ReactNode }) => <a>{p.children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: null }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));
vi.mock("@/data/api/generated/api", async () => {
  const real = await vi.importActual<typeof import("@/data/api/generated/api")>("@/data/api/generated/api");
  return { ...real, useListCategories: () => ({ data: [], isLoading: false }) };
});
vi.mock("./api", () => ({
  useCombos: (...a: unknown[]) => {
    useCombos(...a);
    return { data: { data: rows, total_pages: 1 }, isLoading: false, error: null, refetch: vi.fn() };
  },
  deleteCombo: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CombosPage } = await import("./combos-page");

const summary = (over: Partial<ComboSummary>): ComboSummary => ({
  id: "c",
  name: "Combo",
  name_translations: {},
  available_now: true,
  category_id: null,
  image_url: null,
  is_active: true,
  is_fixed: false,
  margin_default: "0.6000",
  price: 10000,
  slot_count: 2,
  warning_count: 0,
  window_count: 0,
  ...over,
});

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CombosPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  useCombos.mockReset();
  rows = [
    summary({ id: "c-1", name: "Lunch deal", price: 15000, warning_count: 2 }),
    summary({ id: "c-2", name: "Coffee and cake", price: 8500, is_fixed: true }),
  ];
});

describe("the combos list", () => {
  it("with menu.items.read only: shows the rows, badge, price and warnings, and offers no New combo", () => {
    held = ["menu.items.read"];
    mount();

    expect(screen.getByText("Lunch deal")).toBeInTheDocument();
    expect(screen.getByText("Coffee and cake")).toBeInTheDocument();
    // Only the fixed bundle carries the badge.
    expect(screen.getAllByText("Fixed")).toHaveLength(1);
    expect(screen.getByText("Coffee and cake").closest("p")).toHaveTextContent("Fixed");
    expect(screen.getByText(fmtMoney(15000))).toBeInTheDocument();
    expect(screen.getByText(fmtMoney(8500))).toBeInTheDocument();
    // The chip shows only on the combo with warnings.
    expect(screen.getAllByText(/warnings?$/)).toHaveLength(1);
    expect(screen.getByText("2 warnings")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /New combo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(useCombos).toHaveBeenCalledWith(expect.anything(), { enabled: true });
  });

  it("with menu.combos.edit as well: offers New combo", () => {
    held = ["menu.items.read", "menu.combos.edit"];
    mount();
    expect(screen.getByRole("button", { name: /New combo/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("without menu.items.read: shows the restricted state and fetches nothing", () => {
    held = ["menu.combos.edit"];
    mount();
    expect(screen.getByText("Not available on this account")).toBeInTheDocument();
    expect(screen.getByText("Your account can't see the menu. The owner can give you access.")).toBeInTheDocument();
    expect(screen.queryByText("Lunch deal")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New combo/ })).not.toBeInTheDocument();
    expect(useCombos).toHaveBeenCalledWith(expect.anything(), { enabled: false });
  });
});
