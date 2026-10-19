/**
 * Modules (PS-2): which products an org has is Madar's call. The toggle is a
 * super admin's only; it needs at least one module and PATCHes `modules`.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let planState: unknown;
const updateOrg = vi.fn(async (_id: string, _b: unknown) => ({}));
const createOrg = vi.fn(async (_b: unknown) => ({ id: "new-org" }));
const putAddon = vi.fn();
const endAddon = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  updateOrg: (id: string, b: unknown) => updateOrg(id, b),
  createOrg: (b: unknown) => createOrg(b),
  uploadOrgLogo: vi.fn(),
  useGetOrgPlan: () => ({ data: planState }),
  getGetOrgPlanQueryKey: (id: string) => [`/orgs/${id}/plan`],
  usePutOrgAddon: () => ({ mutate: putAddon, isPending: false }),
  useEndOrgAddon: () => ({ mutate: endAddon, isPending: false }),
}));
vi.mock("./util", () => ({ invalidateOrgs: vi.fn() }));
vi.mock("@/components/app/timezone-select", () => ({ TimezoneSelect: () => null }));
vi.mock("@/components/app/image-uploader", () => ({ ImageUploader: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { OrgDialog } = await import("./org-dialog");

const ORG = {
  id: "o1", name: "Rue", slug: "rue", currency_code: "EGP", tax_rate: 0.14, timezone: "Africa/Cairo", is_active: true,
  custom_branding: false, modules: ["pos"], tax_inclusive: false, service_charge_rate: 0, service_charge_taxable: true,
  require_table_for_orders: false, social_links: null, receipt_footer: null, logo_url: null,
} as never;

const as = (role: string) => useAuthStore.setState({ user: { id: "u", name: "x", role, org_id: role === "super_admin" ? null : "o1" } as never });
const wrap = (node: ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);

beforeEach(() => {
  updateOrg.mockClear();
  putAddon.mockClear();
  endAddon.mockClear();
  planState = undefined;
  createOrg.mockClear();
});

describe("OrgDialog modules", () => {
  it("is not shown to an org owner, and nothing about modules is sent", async () => {
    as("org_admin");
    const user = userEvent.setup();
    wrap(<OrgDialog org={ORG} open onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Modules")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateOrg).toHaveBeenCalled());
    expect(updateOrg.mock.calls[0][1]).not.toHaveProperty("modules");
  });

  it("a super admin switches Dawam on: PATCH /orgs/{id} with modules", async () => {
    as("super_admin");
    const user = userEvent.setup();
    wrap(<OrgDialog org={ORG} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Modules")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Madar POS" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Dawam by Madar" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateOrg).toHaveBeenCalledWith("o1", expect.objectContaining({ modules: ["pos", "dawam"] })));
  });

  it("needs at least one module", async () => {
    as("super_admin");
    const user = userEvent.setup();
    wrap(<OrgDialog org={ORG} open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: "Madar POS" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Pick at least one module")).toBeInTheDocument();
    expect(updateOrg).not.toHaveBeenCalled();
  });

  it("a new org starts on POS alone; a Dawam pick is set right after create", async () => {
    as("super_admin");
    const user = userEvent.setup();
    wrap(<OrgDialog org={null} open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Madar POS" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Dawam by Madar" })).not.toBeChecked();
    await user.type(screen.getByLabelText(/Organization Name|Name/), "Drops");
    await user.click(screen.getByRole("checkbox", { name: "Dawam by Madar" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(createOrg).toHaveBeenCalled());
    await waitFor(() => expect(updateOrg).toHaveBeenCalledWith("new-org", { modules: ["pos", "dawam"] }));
  });
});

describe("OrgDialog keeps what was typed (ADM-ORG-058)", () => {
  it("a refetched row of the same org (after a logo upload) does not re-fill the form", async () => {
    as("super_admin");
    const user = userEvent.setup();
    const ui = (org: unknown) => (
      <QueryClientProvider client={new QueryClient()}>
        <OrgDialog org={org as never} open onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );
    const { rerender } = render(ui(ORG));
    const name = screen.getByRole("textbox", { name: "Organization Name" });
    await user.clear(name);
    await user.type(name, "Rue Café");
    // The logo upload refetches /orgs: a new row object, same org.
    rerender(ui({ ...(ORG as object), logo_url: "https://cdn/logo.png" }));
    expect(screen.getByRole("textbox", { name: "Organization Name" })).toHaveValue("Rue Café");
    // Another org is a fresh form.
    rerender(ui({ ...(ORG as object), id: "o2", name: "Nakhla" }));
    expect(screen.getByRole("textbox", { name: "Organization Name" })).toHaveValue("Nakhla");
  });
});

describe("OrgDialog plan (madar-plan)", () => {
  it("a super admin moves a paid org to Free: PATCH /orgs/{id} with plan, and the downgrade is explained", async () => {
    as("super_admin");
    const user = userEvent.setup();
    wrap(<OrgDialog org={{ ...(ORG as object), plan: "paid", signup_source: "admin" } as never} open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole("combobox", { name: "Plan" }));
    await user.click(await screen.findByRole("option", { name: "Free" }));
    expect(screen.getByText(/Moving to Free keeps every record/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateOrg).toHaveBeenCalledWith("o1", expect.objectContaining({ plan: "free" })));
  });

  it("sends no plan when it was not changed, and an org owner never sees the field", async () => {
    as("super_admin");
    const user = userEvent.setup();
    const { unmount } = wrap(<OrgDialog org={{ ...(ORG as object), plan: "free", signup_source: "self" } as never} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("This shop signed up by itself.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateOrg).toHaveBeenCalled());
    expect(updateOrg.mock.calls[0][1]).not.toHaveProperty("plan");
    unmount();
    as("org_admin");
    wrap(<OrgDialog org={{ ...(ORG as object), plan: "free" } as never} open onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("combobox", { name: "Plan" })).toBeNull();
  });

  it("a downgraded org past Free's limits says so: branches past one, tills switched off", () => {
    as("super_admin");
    planState = { plan: "free", over_branch_limit: true, live_branches: 3, branch_limit: 1, inactive_tills: 2 };
    wrap(<OrgDialog org={{ ...(ORG as object), plan: "free" } as never} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Over the Free plan's limits")).toBeInTheDocument();
    expect(screen.getByText(/3 branches; Free includes 1/)).toBeInTheDocument();
    expect(screen.getByText(/Tills switched off: 2/)).toBeInTheDocument();
  });

  it("a Free org inside its limits has no note", () => {
    as("super_admin");
    planState = { plan: "free", over_branch_limit: false, live_branches: 1, branch_limit: 1, inactive_tills: 0 };
    wrap(<OrgDialog org={{ ...(ORG as object), plan: "free" } as never} open onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Over the Free plan's limits")).toBeNull();
  });
});

describe("OrgDialog loyalty add-on (Rewards by Madar)", () => {
  const FREE = { ...(ORG as object), plan: "free" } as never;

  it("a super admin switches it on for a Free org, at once", async () => {
    as("super_admin");
    planState = { plan: "free", addons: [], over_branch_limit: false, inactive_tills: 0 };
    const user = userEvent.setup();
    wrap(<OrgDialog org={FREE} open onOpenChange={vi.fn()} />);
    const sw = screen.getByRole("switch", { name: "Loyalty add-on (Rewards by Madar)" });
    expect(sw).not.toBeChecked();
    await user.click(sw);
    expect(putAddon).toHaveBeenCalledWith({ id: "o1", feature: "loyalty", data: {} });
    expect(updateOrg).not.toHaveBeenCalled();
  });

  it("switching it off ends it", async () => {
    as("super_admin");
    planState = { plan: "free", addons: ["loyalty"], over_branch_limit: false, inactive_tills: 0 };
    const user = userEvent.setup();
    wrap(<OrgDialog org={FREE} open onOpenChange={vi.fn()} />);
    const sw = screen.getByRole("switch", { name: "Loyalty add-on (Rewards by Madar)" });
    expect(sw).toBeChecked();
    await user.click(sw);
    expect(endAddon).toHaveBeenCalledWith({ id: "o1", feature: "loyalty" });
  });

  it("is not offered on a paid org, nor to an org owner", () => {
    as("super_admin");
    const { unmount } = wrap(<OrgDialog org={{ ...(ORG as object), plan: "paid" } as never} open onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("switch", { name: "Loyalty add-on (Rewards by Madar)" })).toBeNull();
    unmount();
    as("org_admin");
    wrap(<OrgDialog org={FREE} open onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("switch", { name: "Loyalty add-on (Rewards by Madar)" })).toBeNull();
  });
});
