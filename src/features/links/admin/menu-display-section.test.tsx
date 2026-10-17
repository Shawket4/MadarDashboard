/**
 * Settings › Links page: the "Menu (no prices)" section, and how the pane
 * reads on each plan — a Free shop gets that section usable and the links
 * page's own sections locked (nothing behind them fetched); a paid shop gets
 * the editor exactly as before, plus the section.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MenuDisplaySettings } from "@/data/api/generated/models";

const getMenuDisplay = vi.fn();
const putMenuDisplay = vi.fn();
const orgLinksQr = vi.fn();
const getLinksPage = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useGetMenuDisplay: (id: string, opts?: unknown) => getMenuDisplay(id, opts),
  usePutMenuDisplay: () => ({ mutateAsync: putMenuDisplay, isPending: false }),
  getGetMenuDisplayQueryKey: (id: string) => ["menu-display", id],
  orgLinksQr: (...args: unknown[]) => orgLinksQr(...args),
  useGetLinksPage: (id: string, opts?: unknown) => getLinksPage(id, opts),
  usePutLinksPage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getGetLinksPageQueryKey: (id: string) => ["links-page", id],
  getPublicOrgLinksQueryKey: () => ["public-links"],
  usePublicOrgLinks: () => ({ data: undefined, isPending: true, isError: false }),
  usePublicOrgBrand: () => ({ data: undefined, isPending: false }),
}));

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o-1" }));

let plan: string | null = "paid";
vi.mock("@/hooks/use-plan", async () => {
  const { hasFeature } = await import("@/generated/plans");
  return {
    usePlan: () => plan,
    useIsFree: () => plan === "free",
    useHasFeature: (f: never) => hasFeature(plan, f),
  };
});

await import("@/i18n");
const { MenuDisplaySection } = await import("./menu-display-section");
const { LinksPane } = await import("./links-pane");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const SETTINGS: MenuDisplaySettings = {
  enabled: true,
  title_en: "Our menu",
  title_ar: null,
  branch_id: null,
  effective_branch_id: "b-1",
  branches: [
    { id: "b-1", name: "Zamalek" },
    { id: "b-2", name: "Maadi" },
  ],
  public_url: "https://drops.madar-pos.cloud/menu",
};

beforeEach(() => {
  plan = "paid";
  getMenuDisplay.mockReturnValue({ data: SETTINGS, isPending: false });
  putMenuDisplay.mockReset();
  putMenuDisplay.mockImplementation(async ({ data }: { data: Partial<MenuDisplaySettings> }) => ({
    ...SETTINGS,
    ...data,
  }));
  orgLinksQr.mockReset();
  orgLinksQr.mockResolvedValue({
    kind: "org_menu_display",
    long_url: SETTINGS.public_url,
    short_url: "https://mdr.to/m1",
    short_code: "m1",
    qr_data_url: "data:image/png;base64,AAAA",
  });
  getLinksPage.mockReset();
  getLinksPage.mockReturnValue({ data: undefined, isPending: true });
});

describe("MenuDisplaySection", () => {
  it("shows the page's address, and the default branch by name", () => {
    wrap(<MenuDisplaySection orgId="o-1" />);
    expect(screen.getByText("Menu (no prices)")).toBeInTheDocument();
    expect(screen.getByTestId("menu-display-url")).toHaveTextContent("https://drops.madar-pos.cloud/menu");
    expect(screen.getAllByText("Your first branch (Zamalek)").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Our menu")).toBeInTheDocument();
    // No switch to put it on the links page: it is never one of its buttons.
    expect(screen.queryByText(/links page/i)).toBeNull();
  });

  it("gets its code from the links page's QR endpoint, for this page", async () => {
    wrap(<MenuDisplaySection orgId="o-1" />);
    fireEvent.click(screen.getByRole("button", { name: "QR code" }));
    await waitFor(() => expect(orgLinksQr).toHaveBeenCalledWith("o-1", { target: "menu_display" }, {}));
    expect(await screen.findByText("Menu (no prices) code")).toBeInTheDocument();
  });

  it("saves the switch, trimmed titles and the default branch as none", async () => {
    wrap(<MenuDisplaySection orgId="o-1" />);
    fireEvent.change(screen.getByDisplayValue("Our menu"), { target: { value: "  Menu  " } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(putMenuDisplay).toHaveBeenCalledWith({
        id: "o-1",
        data: { enabled: false, title_en: "Menu", title_ar: null, branch_id: null },
      }),
    );
  });

  it("refuses a title longer than the server takes", async () => {
    wrap(<MenuDisplaySection orgId="o-1" />);
    fireEvent.change(screen.getByDisplayValue("Our menu"), { target: { value: "x".repeat(61) } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await new Promise((r) => setTimeout(r, 50));
    expect(putMenuDisplay).not.toHaveBeenCalled();
  });
});

describe("LinksPane by plan", () => {
  it("Free: the menu section is usable, the links page's sections are locked and never fetched", () => {
    plan = "free";
    wrap(<LinksPane />);
    expect(screen.getByTestId("menu-display-section")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    const lock = document.querySelector('[data-paid-lock="branding"]');
    expect(lock).not.toBeNull();
    expect(lock).toHaveTextContent("Paid plan");
    expect(screen.getByTestId("links-locked-sections")).toBeInTheDocument();
    // The paid editor's reads never run on Free (they would be refused).
    expect(getLinksPage).not.toHaveBeenCalled();
    // And nothing of it is editable: no tagline field, no buttons list.
    expect(screen.queryByText("Line under your name (English)")).toBeNull();
  });

  it("Paid: the links page editor as before, and the menu section under it", () => {
    plan = "paid";
    wrap(<LinksPane />);
    expect(getLinksPage).toHaveBeenCalledWith("o-1", expect.anything());
    expect(screen.getByTestId("menu-display-section")).toBeInTheDocument();
    expect(document.querySelector("[data-paid-lock]")).toBeNull();
  });
});
