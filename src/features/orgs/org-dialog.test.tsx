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

const updateOrg = vi.fn(async (_id: string, _b: unknown) => ({}));
const createOrg = vi.fn(async (_b: unknown) => ({ id: "new-org" }));
vi.mock("@/data/api/generated/api", () => ({
  updateOrg: (id: string, b: unknown) => updateOrg(id, b),
  createOrg: (b: unknown) => createOrg(b),
  uploadOrgLogo: vi.fn(),
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
