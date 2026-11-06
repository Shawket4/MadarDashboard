/**
 * Settings › Links & QR codes: one page for the links page, the menu without
 * prices and every QR code — what each plan sees, the Unbranded switch and its
 * logo sub-switch driving every code live, and the old addresses landing here.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LinksPageSettings, MenuDisplaySettings, QrResponse } from "@/data/api/generated/models";

const api = {
  getMenuDisplay: vi.fn(),
  getLinksPage: vi.fn(),
  orgLinksQr: vi.fn(),
  orgQr: vi.fn(),
  orgBookingQr: vi.fn(),
  branchQr: vi.fn(),
  branchBookingQr: vi.fn(),
  tableQr: vi.fn(),
  listTables: vi.fn(),
};

vi.mock("@/data/api/generated/api", () => ({
  useGetMenuDisplay: (id: string, opts?: unknown) => api.getMenuDisplay(id, opts),
  usePutMenuDisplay: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getGetMenuDisplayQueryKey: (id: string) => ["menu-display", id],
  useGetLinksPage: (id: string, opts?: unknown) => api.getLinksPage(id, opts),
  usePutLinksPage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getGetLinksPageQueryKey: (id: string) => ["links-page", id],
  getPublicOrgLinksQueryKey: () => ["public-links"],
  usePublicOrgLinks: () => ({ data: undefined, isPending: true, isError: false }),
  usePublicOrgBrand: () => ({ data: undefined, isPending: false }),
  orgLinksQr: (...a: unknown[]) => api.orgLinksQr(...a),
  orgQr: (...a: unknown[]) => api.orgQr(...a),
  orgBookingQr: (...a: unknown[]) => api.orgBookingQr(...a),
  branchQr: (...a: unknown[]) => api.branchQr(...a),
  branchBookingQr: (...a: unknown[]) => api.branchBookingQr(...a),
  tableQr: (...a: unknown[]) => api.tableQr(...a),
  useListTables: (id: string, opts?: unknown) => api.listTables(id, opts),
}));

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o-1" }));
let scope = { branchId: null as string | null, isAllBranches: true };
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => scope }));
vi.mock("@/components/app/link", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

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
const { LinksQrPage } = await import("./links-qr-page");
const { qrOutputKey, resetQrOutputMemory } = await import("@/features/qr/output");
const { safeStorage } = await import("@/lib/safe-storage");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const MENU: MenuDisplaySettings = {
  enabled: true,
  title_en: "Our menu",
  title_ar: null,
  branch_id: null,
  effective_branch_id: "b-1",
  branches: [{ id: "b-1", name: "Zamalek" }],
  public_url: "https://drops.madar-pos.cloud/menu",
};

/** A paid shop with its own address (custom branding and a slug). */
const LINKS: LinksPageSettings = {
  branches: [],
  custom_branding: true,
  items: [],
  modules: [],
  public_url: "https://drops.madar-pos.cloud/",
  show_branches: false,
  show_cover: false,
  social_links: {},
  tagline_ar: null,
  tagline_en: null,
};

/** A code whose image says what was asked for, so a test can read it back. */
const code =
  (kind: string, opts: { logo?: boolean } = {}) =>
  async (...args: unknown[]): Promise<QrResponse> => {
    const params = (args.find((a) => a && typeof a === "object" && ("dpi" in a || "card" in a || "unbranded" in a)) ??
      {}) as Record<string, unknown>;
    const plain = params.unbranded === true;
    return {
      kind,
      long_url: `https://drops.madar-pos.cloud/${kind}`,
      short_url: `https://mdr.to/${kind}`,
      short_code: kind,
      qr_data_url: `data:image/png;base64,${plain ? "PLAIN" : "CARD"}-${kind}-${params.centre_logo ?? "x"}-${params.dpi}`,
      centre_logo: plain ? params.centre_logo === true && opts.logo !== false : true,
    };
  };

beforeEach(() => {
  plan = "paid";
  scope = { branchId: null, isAllBranches: true };
  safeStorage.removeItem(qrOutputKey("o-1"));
  resetQrOutputMemory();
  for (const f of Object.values(api)) f.mockReset();
  api.getMenuDisplay.mockReturnValue({ data: MENU, isPending: false });
  api.getLinksPage.mockReturnValue({ data: LINKS, isPending: false });
  api.listTables.mockReturnValue({ data: [], isPending: false });
  api.orgLinksQr.mockImplementation(code("org_links"));
  api.orgQr.mockImplementation(code("org_order"));
  api.orgBookingQr.mockImplementation(code("org_booking"));
  api.branchQr.mockImplementation(code("branch_order"));
  api.branchBookingQr.mockImplementation(code("branch_booking"));
  Element.prototype.scrollIntoView = vi.fn();
});

const lastParams = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[1];

describe("one page for links and codes", () => {
  it("paid: the links page, the menu, and every kind of code", () => {
    wrap(<LinksQrPage />);
    expect(screen.getByTestId("links-qr-page")).toBeInTheDocument();
    expect(screen.getByTestId("menu-display-section")).toBeInTheDocument();
    expect(api.getLinksPage).toHaveBeenCalledWith("o-1", expect.anything());
    for (const id of [
      "org_links",
      "org_menu_display",
      "org_order",
      "org_booking",
      "branch_order",
      "branch_booking",
      "branch_order_in_mall",
    ]) {
      expect(screen.getByTestId(`qr-kind-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByText("Table codes")).toBeInTheDocument();
    expect(document.querySelector("[data-paid-lock]")).toBeNull();
  });

  it("paid without its own address: no links page code (the server refuses it), the sample is the menu's", async () => {
    api.getLinksPage.mockReturnValue({ data: { ...LINKS, custom_branding: false, public_url: null }, isPending: false });
    wrap(<LinksQrPage />);
    expect(screen.queryByTestId("qr-kind-org_links")).toBeNull();
    expect(screen.getByTestId("qr-kind-org_menu_display")).toBeInTheDocument();
    expect(screen.getByTestId("qr-kind-org_order")).toBeInTheDocument();
    await screen.findByTestId("qr-sample");
    expect(api.orgLinksQr).toHaveBeenCalledWith("o-1", { card: true, dpi: 150, target: "menu_display" }, {});
    expect(api.orgLinksQr).not.toHaveBeenCalledWith("o-1", { card: true, dpi: 150 }, {});
  });

  it("Free: the menu and its code are usable; the links page and the paid codes are locked, unfetched", () => {
    plan = "free";
    wrap(<LinksQrPage />);
    expect(screen.getByTestId("menu-display-section")).toBeInTheDocument();
    expect(screen.getByTestId("qr-kind-org_menu_display")).toBeInTheDocument();
    expect(screen.queryByTestId("qr-kind-org_links")).toBeNull();
    expect(screen.queryByTestId("qr-kind-org_order")).toBeNull();
    expect(screen.queryByTestId("qr-kind-branch_order")).toBeNull();
    expect(document.querySelector('[data-paid-lock="branding"]')).not.toBeNull();
    expect(document.querySelector('[data-paid-lock="online"]')).not.toBeNull();
    // The links page's read never runs on Free (the server would refuse it):
    // whoever asks for it asks with `enabled: false`.
    for (const [, opts] of api.getLinksPage.mock.calls) {
      expect((opts as { query?: { enabled?: boolean } }).query?.enabled).toBe(false);
    }
    expect(api.listTables).not.toHaveBeenCalled();
    expect(api.orgQr).not.toHaveBeenCalled();
  });

  it("the old QR address lands on the codes, once the section above has its height", async () => {
    // Paid: the links editor is still loading, so the page waits rather than
    // scrolling to a spot the editor is about to push down.
    api.getLinksPage.mockReturnValue({ data: undefined, isPending: true });
    const { unmount } = wrap(<LinksQrPage section="codes" />);
    await new Promise((r) => setTimeout(r, 30));
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    unmount();

    plan = "free";
    wrap(<LinksQrPage section="codes" />);
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
    const target = vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0] as Element;
    expect(target.id).toBe("links-qr-codes");
  });
});

describe("the Unbranded switch", () => {
  it("the sample follows the switches live, and the logo sub-switch only works under Unbranded", async () => {
    wrap(<LinksQrPage />);
    const sample = await screen.findByTestId("qr-sample");
    expect(sample.getAttribute("src")).toContain("CARD-org_links");
    expect(lastParams(api.orgLinksQr)).toEqual({ card: true, dpi: 150 });

    const panel = screen.getByTestId("qr-output-panel");
    const centre = within(panel).getByTestId("qr-centre-logo");
    expect(centre).toBeDisabled();

    await userEvent.click(within(panel).getByTestId("qr-unbranded"));
    await waitFor(() => expect(screen.getByTestId("qr-sample").getAttribute("src")).toContain("PLAIN-org_links-true"));
    expect(lastParams(api.orgLinksQr)).toEqual({ unbranded: true, centre_logo: true, dpi: 150 });
    expect(within(panel).getByTestId("qr-centre-logo")).toBeEnabled();
    // The card switch is branded mode's; it steps aside.
    expect(within(panel).queryByTestId("qr-card")).toBeNull();

    await userEvent.click(within(panel).getByTestId("qr-centre-logo"));
    await waitFor(() => expect(screen.getByTestId("qr-sample").getAttribute("src")).toContain("PLAIN-org_links-false"));
    expect(lastParams(api.orgLinksQr)).toEqual({ unbranded: true, centre_logo: false, dpi: 150 });

    // Remembered for this shop on this device.
    expect(JSON.parse(safeStorage.getItem(qrOutputKey("o-1"))!)).toMatchObject({ unbranded: true, centreLogo: false });
  });

  it("a code already on screen re-renders when the switch flips — no second click", async () => {
    wrap(<LinksQrPage />);
    const kind = screen.getByTestId("qr-kind-org_order");
    await userEvent.click(within(kind).getByRole("button", { name: /Generate QR/ }));
    await waitFor(() => expect(within(kind).getByTestId("qr-result")).toBeInTheDocument());
    expect(api.orgQr).toHaveBeenCalledWith("o-1", { card: true, dpi: 600 });

    await userEvent.click(within(screen.getByTestId("qr-output-panel")).getByTestId("qr-unbranded"));
    await waitFor(() => expect(api.orgQr).toHaveBeenCalledWith("o-1", { unbranded: true, centre_logo: true, dpi: 600 }));
    await waitFor(() =>
      expect(within(kind).getByRole("img").getAttribute("src")).toContain("PLAIN-org_order-true-600"),
    );
  });

  it("the switches are in the code's own preview too, and flipping them there changes that code", async () => {
    wrap(<LinksQrPage />);
    const kind = screen.getByTestId("qr-kind-org_order");
    await userEvent.click(within(kind).getByRole("button", { name: /Generate QR/ }));
    await userEvent.click(await within(kind).findByRole("button", { name: "Enlarge QR code" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("qr-preview-image").getAttribute("src")).toContain("CARD-org_order");

    await userEvent.click(within(dialog).getByTestId("qr-unbranded"));
    await waitFor(() =>
      expect(within(dialog).getByTestId("qr-preview-image").getAttribute("src")).toContain("PLAIN-org_order-true"),
    );
    await userEvent.click(within(dialog).getByTestId("qr-centre-logo"));
    await waitFor(() =>
      expect(within(dialog).getByTestId("qr-preview-image").getAttribute("src")).toContain("PLAIN-org_order-false"),
    );
    // Download hands over the server's image untouched, named for what it is.
    expect(within(dialog).getByTestId("qr-download")).toBeInTheDocument();
    expect(within(dialog).getByTestId("qr-print")).toBeInTheDocument();
  });

  it("says so when there is no logo to put in the middle", async () => {
    api.orgLinksQr.mockImplementation(code("org_links", { logo: false }));
    safeStorage.setItem(qrOutputKey("o-1"), JSON.stringify({ unbranded: true, centreLogo: true, card: true, dpi: 600 }));
    wrap(<LinksQrPage />);
    expect(await screen.findByTestId("qr-no-logo")).toHaveTextContent("no logo for codes yet");
    expect(screen.getByRole("link", { name: "Add one under Brand" })).toHaveAttribute("href", "/settings/brand");
  });

  it("prints an unbranded code as the image alone", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    safeStorage.setItem(qrOutputKey("o-1"), JSON.stringify({ unbranded: true, centreLogo: false, card: true, dpi: 600 }));
    wrap(<LinksQrPage />);
    const kind = screen.getByTestId("qr-kind-org_order");
    fireEvent.click(within(kind).getByRole("button", { name: /Generate QR/ }));
    await userEvent.click(await within(kind).findByRole("button", { name: /Print/ }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    const root = document.getElementById("qr-print-root")!;
    expect(root.dataset.shape).toBe("plain");
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild!.children).toHaveLength(1);
    expect(root.querySelector("img")!.getAttribute("src")).toContain("PLAIN-org_order-false-600");
    expect(root.textContent).toBe("");
    window.dispatchEvent(new Event("afterprint"));
    print.mockRestore();
  });
});

describe("the old addresses redirect here", () => {
  type RouteModule = { Route: { options: { beforeLoad?: unknown } } };
  it.each([
    ["/settings/links", () => import("@/routes/_app/settings/links"), undefined],
    ["/settings/qr", () => import("@/routes/_app/settings/qr"), { section: "codes" }],
    ["/qr", () => import("@/routes/_app/qr"), { section: "codes" }],
  ] as [string, () => Promise<RouteModule>, unknown][])("%s → /settings/links-qr", async (_path, load, search) => {
    const { Route } = await load();
    let thrown: unknown;
    try {
      (Route.options.beforeLoad as (ctx: unknown) => void)({ search: {} });
    } catch (e) {
      thrown = e;
    }
    expect(isRedirect(thrown)).toBe(true);
    if (!isRedirect(thrown)) return;
    expect(thrown.options.to).toBe("/settings/links-qr");
    expect(thrown.options.search).toEqual(search);
  });
});
