/**
 * "Ask who's serving at checkout" (TELLER_PICK §3.2): a per-branch till
 * setting, off by default, sent on every save with the other till settings and
 * PATCHed onto a new branch right after it is created. Its hint names the POS
 * release that honours it, and mentions Dawam only to an org that has Dawam
 * (the plan's feature or an add-on) with the module switched on.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const patchBranch = vi.fn(async (_id: string, _b: unknown) => ({}));
const createBranch = vi.fn(async (_b: unknown) => ({ id: "new-branch" }));
vi.mock("@/data/api/generated/api", () => ({
  patchBranch: (id: string, b: unknown) => patchBranch(id, b),
  createBranch: (b: unknown) => createBranch(b),
}));
vi.mock("./util", () => ({ invalidateBranches: vi.fn() }));
vi.mock("@/components/app/timezone-select", () => ({ TimezoneSelect: () => null }));
let modules: string[] = ["pos", "dawam"];
vi.mock("@/hooks/use-org-modules", () => ({ useOrgModules: () => modules }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { BranchDialog } = await import("./branch-dialog");

const LABEL = "Ask who's serving at checkout";
const HINT = "Tills on POS 0.18 or newer ask who is serving before taking payment.";
const HINT_DAWAM = "People clocked in on Dawam come first.";

const BRANCH = {
  id: "b1", org_id: "o1", name: "Zamalek", kind: "branch", is_active: true, timezone: "Africa/Cairo",
  address: null, phone: null, printer_brand: null, printer_ip: null, printer_port: null,
  latitude: null, longitude: null, geo_radius_meters: 200, old_bill_hours: 3, standard_float: null,
  created_at: "2026-01-04T08:00:00Z", updated_at: "2026-01-04T08:00:00Z",
};
const branch = (over: Record<string, unknown> = {}) => ({ ...BRANCH, ...over }) as never;

beforeEach(() => {
  patchBranch.mockClear();
  createBranch.mockClear();
  useAuthStore.setState({ user: { id: "u", name: "Owner", role: "org_admin", org_id: "o1" } as never });
  useAuthStore.getState().setPlan("paid", []);
  modules = ["pos", "dawam"];
});

describe("BranchDialog: ask who's serving at checkout", () => {
  it("loads on for a branch that asks, with its hint", () => {
    render(<BranchDialog orgId="o1" branch={branch({ pick_teller_at_checkout: true })} open onOpenChange={vi.fn()} />);
    const sw = screen.getByRole("switch", { name: LABEL });
    expect(sw).toBeChecked();
    expect(sw).toHaveAccessibleDescription(new RegExp(HINT.replace(/\./g, "\\.")));
  });

  it("loads off for a branch that doesn't, and for one from before the setting", () => {
    const { unmount } = render(<BranchDialog orgId="o1" branch={branch({ pick_teller_at_checkout: false })} open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: LABEL })).not.toBeChecked();
    unmount();
    render(<BranchDialog orgId="o1" branch={branch()} open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: LABEL })).not.toBeChecked();
  });

  it("switching it on PATCHes pick_teller_at_checkout: true", async () => {
    const user = userEvent.setup();
    render(<BranchDialog orgId="o1" branch={branch({ pick_teller_at_checkout: false })} open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole("switch", { name: LABEL }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patchBranch).toHaveBeenCalledWith("b1", expect.objectContaining({ pick_teller_at_checkout: true })));
  });

  it("switching it off PATCHes pick_teller_at_checkout: false", async () => {
    const user = userEvent.setup();
    render(<BranchDialog orgId="o1" branch={branch({ pick_teller_at_checkout: true })} open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole("switch", { name: LABEL }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patchBranch).toHaveBeenCalledWith("b1", expect.objectContaining({ pick_teller_at_checkout: false })));
  });

  it("a new branch starts off; switched on, it is PATCHed with the till settings right after create", async () => {
    const user = userEvent.setup();
    render(<BranchDialog orgId="o1" branch={null} open onOpenChange={vi.fn()} />);
    const sw = screen.getByRole("switch", { name: LABEL });
    expect(sw).not.toBeChecked();
    await user.type(screen.getByRole("textbox", { name: "Branch Name" }), "Maadi");
    await user.click(sw);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(createBranch).toHaveBeenCalled());
    expect(createBranch.mock.calls[0][0]).not.toHaveProperty("pick_teller_at_checkout");
    await waitFor(() =>
      expect(patchBranch).toHaveBeenCalledWith("new-branch", expect.objectContaining({ old_bill_hours: 3, pick_teller_at_checkout: true })),
    );
  });

  it("a new branch starts on the business's own zone (the scope's), not Cairo's", async () => {
    const { useAppStore } = await import("@/data/stores/app.store");
    const { APP_TZ } = await import("@/data/config/constants");
    useAppStore.getState().setActiveTimezone("Asia/Dubai");
    try {
      const user = userEvent.setup();
      render(<BranchDialog orgId="o1" branch={null} open onOpenChange={vi.fn()} />);
      await user.type(screen.getByRole("textbox", { name: "Branch Name" }), "Jumeirah");
      await user.click(screen.getByRole("button", { name: "Create" }));
      await waitFor(() => expect(createBranch).toHaveBeenCalled());
      expect(createBranch.mock.calls[0][0]).toMatchObject({ timezone: "Asia/Dubai" });
    } finally {
      useAppStore.getState().setActiveTimezone(APP_TZ);
    }
  });

  it("a warehouse never sells: no switch", async () => {
    render(<BranchDialog orgId="o1" branch={branch({ kind: "warehouse" })} open onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("switch", { name: LABEL })).toBeNull();
  });
});

describe("BranchDialog: the switch's hint", () => {
  const open = () => render(<BranchDialog orgId="o1" branch={branch({ pick_teller_at_checkout: true })} open onOpenChange={vi.fn()} />);

  it("a Free org (no Dawam on its plan) gets the POS sentence only, even with a stale module list", () => {
    useAuthStore.getState().setPlan("free", []);
    open();
    expect(screen.getByRole("switch", { name: LABEL })).toHaveAccessibleDescription(HINT);
    expect(screen.queryByText(new RegExp(HINT_DAWAM))).toBeNull();
  });

  it("a paid org with the Dawam module off gets the POS sentence only", () => {
    modules = ["pos"];
    open();
    expect(screen.getByRole("switch", { name: LABEL })).toHaveAccessibleDescription(HINT);
    expect(screen.queryByText(new RegExp(HINT_DAWAM))).toBeNull();
  });

  it("a paid org with Dawam on gets both sentences, as the switch's description", () => {
    open();
    expect(screen.getByRole("switch", { name: LABEL })).toHaveAccessibleDescription(`${HINT} ${HINT_DAWAM}`);
  });

  it("both sentences in formal Arabic", async () => {
    await i18n.changeLanguage("ar");
    try {
      open();
      const sw = screen.getByRole("switch", { name: "السؤال عمّن يخدم العميل عند الدفع" });
      expect(sw).toHaveAccessibleDescription(/0\.18.*دوام/);
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
