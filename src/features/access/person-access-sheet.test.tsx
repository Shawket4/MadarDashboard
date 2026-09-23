/**
 * Per-person Access tab: a reason is never required to save a permission.
 *
 * The owner's bug (2026-09-18): toggling a money capability — and above all
 * saving its limits, whose popover has no reason box at all — came back 400
 * "Say why: a reason is required for money and admin permissions". The sheet
 * must send whatever the (optional) reason box holds, `null` when it is empty,
 * and never invent one.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserAccess, UserPublic } from "@/data/api/generated/models";

const setOverrideMock = vi.fn(() => Promise.resolve({} as UserAccess));

/** refunds.create: money risk, `max_amount` limit — the control that broke. */
const access: UserAccess = {
  user_id: "u-2",
  name: "Sara",
  is_owner: false,
  branch_id: null,
  can_edit: true,
  locked_reason: null,
  assignments: [],
  capabilities: [
    {
      capability: "refunds.create",
      effective: true,
      source: "role",
      from_roles: ["Cashier"],
      overrides: [],
      limits: null,
      editable: true,
    },
    {
      // A branch manager's deduction limit: 1,000 EGP from the role (AD-5).
      capability: "hr.deductions.create",
      effective: true,
      source: "role",
      from_roles: ["Branch manager"],
      overrides: [],
      limits: { max_amount: 100000, max_percent: null, max_value: null, max_age_minutes: null, own: null },
      editable: true,
    },
  ],
};

vi.mock("@/data/api/generated/api", () => ({
  explain: vi.fn(() => Promise.resolve({ capability: "refunds.create", label_en: "Refund money", label_ar: "", effective: true, ask_manager: false, steps: [] })),
  getUserAccessQueryKey: () => ["user-access"],
  setAssignments: vi.fn(() => Promise.resolve({})),
  setOverride: (...args: unknown[]) => setOverrideMock(...(args as [])),
  useListBranches: () => ({ data: [{ id: "b-1", name: "Zamalek" }] }),
  useListRoles: () => ({ data: [] }),
  useUserAccess: () => ({ data: access, isLoading: false }),
}));
vi.mock("@/data/api/query", () => ({ queryClient: { invalidateQueries: vi.fn() } }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  const authz = () =>
    real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: true, platform: false, role_kinds: [], capabilities: [], ask_manager: [], limits: {} });
  return { ...real, useAuthz: () => authz(), useCan: () => true };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { PersonAccessSheet } = await import("./person-access-sheet");

const user: UserPublic = { id: "u-2", name: "Sara", org_id: "o-1" } as UserPublic;

/** The row of one capability, by its label. */
const rowOf = async (label: string) => within((await screen.findByText(label, { exact: true })).closest("li")!);

const renderSheet = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PersonAccessSheet user={user} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );

describe("PersonAccessSheet — the reason is optional", () => {
  beforeEach(() => setOverrideMock.mockClear());

  it("labels the reason box as optional and never marks it required", async () => {
    renderSheet();
    const box = await screen.findByTestId("access-reason");
    expect(box).not.toBeRequired();
    expect(screen.getByLabelText(/reason \(optional\)/i)).toBe(box);
  });

  it("allows a money capability with no reason typed, sending null", async () => {
    const u = userEvent.setup();
    renderSheet();
    await u.click((await rowOf("Refund money")).getByRole("radio", { name: "Allow" }));
    await waitFor(() => expect(setOverrideMock).toHaveBeenCalled());
    expect(setOverrideMock).toHaveBeenCalledWith("u-2", expect.objectContaining({
      capability: "refunds.create",
      effect: "allow",
      reason: null,
    }));
  });

  it("saves limits on a money capability with no reason — the control that used to 400", async () => {
    const u = userEvent.setup();
    renderSheet();
    await u.click((await rowOf("Refund money")).getByRole("button", { name: /^Limit$/ }));
    await u.type(await screen.findByLabelText(/Most per action \(EGP\)/i), "50");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(setOverrideMock).toHaveBeenCalled());
    expect(setOverrideMock).toHaveBeenCalledWith("u-2", expect.objectContaining({
      capability: "refunds.create",
      effect: "allow",
      reason: null,
      limits: { max_amount: 5000 },
    }));
  });

  it("still sends the reason when one is typed", async () => {
    const u = userEvent.setup();
    renderSheet();
    await u.type(await screen.findByTestId("access-reason"), "covering the late shift");
    await u.click((await rowOf("Refund money")).getByRole("radio", { name: "Deny" }));
    await waitFor(() => expect(setOverrideMock).toHaveBeenCalled());
    expect(setOverrideMock).toHaveBeenCalledWith("u-2", expect.objectContaining({
      effect: "deny",
      reason: "covering the late shift",
    }));
  });

  it("closes the limits popover once saved (E2E: Save left it open, no sign it worked)", async () => {
    const u = userEvent.setup();
    renderSheet();
    await u.click((await rowOf("Refund money")).getByRole("button", { name: /^Limit$/ }));
    await u.type(await screen.findByLabelText(/Most per action \(EGP\)/i), "50");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(setOverrideMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText(/Most per action \(EGP\)/i)).not.toBeInTheDocument());
  });

  it("a manager's deduction limit shows the role's 1,000 EGP and says what happens above it (no till)", async () => {
    const u = userEvent.setup();
    renderSheet();
    await u.click((await rowOf("Add deductions")).getByRole("button", { name: /^Limited$/ }));
    expect(await screen.findByLabelText(/Most per action \(EGP\)/i)).toHaveValue("1000");
    expect(screen.queryByText(/the till asks a manager/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Over the limit, it waits for someone with a higher limit/)).toBeInTheDocument();
    await u.clear(screen.getByLabelText(/Most per action \(EGP\)/i));
    await u.type(screen.getByLabelText(/Most per action \(EGP\)/i), "300");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(setOverrideMock).toHaveBeenCalledWith("u-2", expect.objectContaining({
      capability: "hr.deductions.create",
      effect: "allow",
      limits: expect.objectContaining({ max_amount: 30000 }),
    })));
  });
});
