/**
 * SET-LOY-083 (W4): a value left invalid in a field the form now hides (the
 * cap after switching it off, a gift after switching birthdays off) used to
 * block Save, showing only "Fix the highlighted fields". Only what the form
 * shows is checked now; a hidden field is not sent (toWire sends null).
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoyaltySettings } from "@/data/api/generated/models";

const mutateAsync = vi.fn().mockResolvedValue({});
const settings: LoyaltySettings = {
  org_id: "org-1",
  branch_id: null,
  enabled: true,
  program_name: "Bean Club",
  program_name_ar: null,
  mode: "visits",
  earn_piastres_per_point: 1000,
  earn_on_discounted: true,
  earn_include_tax: false,
  stamp_per_line_item: false,
  default_reward_cost: 5,
  require_otp: true,
  reward_any_item: false,
  balance_cap_enabled: true,
  balance_cap: 40,
  birthday_enabled: true,
  birthday_reward_amount: 2,
  winback_enabled: false,
  terms: null,
};

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: ["loyalty.read", "loyalty.use"] as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/data/api/generated/api", () => ({
  usePutLoyaltySettings: () => ({ mutateAsync, isPending: false }),
  deleteLoyaltySettings: vi.fn(),
  previewLoyaltyBirthdayMessage: () => new Promise(() => {}),
}));
vi.mock("../use-program", () => ({
  useProgram: () => ({ query: { isLoading: false, isError: false, refetch: vi.fn() }, settings, inherited: false }),
}));
vi.mock("./passes-card", () => ({ PassesCard: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ProgramPane } = await import("./program-pane");

const mount = () => render(<ProgramPane scope={{ orgId: "org-1", branchId: null }} />);
/** The switch beside a ToggleRow's label. */
const switchOf = (label: string) => within(screen.getByText(label).parentElement!.parentElement!).getByRole("switch");
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));

beforeEach(() => mutateAsync.mockClear());

describe("ProgramPane validates what it shows (W4, SET-LOY-083)", () => {
  it("a visible invalid cap blocks Save; switched off, it no longer does and is not sent", async () => {
    mount();
    fireEvent.change(screen.getByLabelText(/Most a customer can hold/), { target: { value: "0" } });
    save();
    expect(await screen.findByText("Fix the highlighted fields before saving.")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    fireEvent.click(switchOf("Stop collecting at a maximum"));
    expect(screen.queryByLabelText(/Most a customer can hold/)).not.toBeInTheDocument();
    // The summary no longer points at a field that is not on screen.
    await waitFor(() => expect(screen.queryByText("Fix the highlighted fields before saving.")).not.toBeInTheDocument());

    save();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync.mock.calls[0][0].data).toMatchObject({ balance_cap_enabled: false, balance_cap: null });
  });

  it("a gift of 0 left behind by switching birthdays off does not block Save", async () => {
    mount();
    fireEvent.change(screen.getByLabelText("Birthday gift"), { target: { value: "0" } });
    fireEvent.click(switchOf("Birthdays"));
    save();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync.mock.calls[0][0].data).toMatchObject({ birthday_enabled: false, birthday_reward_amount: null });
  });
});
