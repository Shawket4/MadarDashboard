/**
 * Settings › Combos and deals (§11.1): the org's channel switches and margin
 * floor load from the server and save as a rate string; a branch's tri-state
 * writes its override at once (PUT with the whole override, DELETE once
 * nothing is left); and without `menu.combos.edit` it is all read-only.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComboSettings } from "./types";
import { percentToRate } from "./util";

// Radix Select asks for pointer capture and scrolls its options; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
const saveComboSettings = vi.fn();
const putBranchChannels = vi.fn();
const deleteBranchChannels = vi.fn();
const refetch = vi.fn();

// One stable object: the page resets its form whenever `q.data` changes identity.
const settings: ComboSettings = {
  min_margin: "0.5500",
  channels: { pos: true, qr: true, online: false, delivery: true },
  branch_overrides: [{ branch_id: "b-1", sell: { qr: false }, effective: { pos: true, qr: false, online: false, delivery: true } }],
};
const settingsQuery = { data: settings, isLoading: false, isError: false, isFetching: false, error: null, refetch: (...a: unknown[]) => refetch(...a) };
const branches = [
  { id: "b-1", name: "Zamalek", name_translations: {} },
  { id: "b-2", name: "Maadi", name_translations: {} },
];

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
vi.mock("@/data/api/generated/api", async () => {
  const real = await vi.importActual<typeof import("@/data/api/generated/api")>("@/data/api/generated/api");
  return { ...real, useListBranches: () => ({ data: branches, isLoading: false }) };
});
vi.mock("./api", () => ({
  useComboSettings: () => settingsQuery,
  saveComboSettings: (...a: unknown[]) => saveComboSettings(...a),
  putBranchChannels: (...a: unknown[]) => putBranchChannels(...a),
  deleteBranchChannels: (...a: unknown[]) => deleteBranchChannels(...a),
}));
vi.mock("./util", async () => {
  const real = await vi.importActual<typeof import("./util")>("./util");
  return { ...real, invalidateCombos: vi.fn() };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ComboSettingsPage } = await import("./combo-settings-page");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ComboSettingsPage />
    </QueryClientProvider>,
  );

const pick = async (user: ReturnType<typeof userEvent.setup>, trigger: string, option: string) => {
  await user.click(screen.getByRole("combobox", { name: trigger }));
  await user.click(await screen.findByRole("option", { name: option }));
};

beforeEach(() => {
  held = ["org.settings.read", "menu.combos.edit"];
  for (const f of [saveComboSettings, putBranchChannels, deleteBranchChannels, refetch]) f.mockReset();
  saveComboSettings.mockResolvedValue(settings);
  putBranchChannels.mockResolvedValue(undefined);
  deleteBranchChannels.mockResolvedValue(undefined);
  refetch.mockResolvedValue(undefined);
});

describe("the combo settings page", () => {
  it("loads the margin as a percent and the org's four switches", async () => {
    mount();
    expect(await screen.findByDisplayValue("55")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum margin")).toHaveValue(55);
    expect(screen.getByRole("switch", { name: "POS" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "QR table menu" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Online ordering" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Delivery apps" })).toBeChecked();
    // The branch with an override shows it; the other follows the org.
    expect(screen.getByRole("combobox", { name: "Zamalek: QR table menu" })).toHaveTextContent("Off here");
    expect(screen.getByRole("combobox", { name: "Maadi: QR table menu" })).toHaveTextContent("Follow (on)");
    expect(screen.getByRole("combobox", { name: "Maadi: Online ordering" })).toHaveTextContent("Follow (off)");
  });

  it("saves the typed margin as a rate string with the org's channels", async () => {
    const user = userEvent.setup();
    mount();
    const margin = await screen.findByLabelText("Minimum margin");
    await user.clear(margin);
    await user.type(margin, "60");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(percentToRate("60")).toBe("0.6000");
    expect(saveComboSettings).toHaveBeenCalledTimes(1);
    expect(saveComboSettings).toHaveBeenCalledWith({
      min_margin: "0.6000",
      channels: { pos: true, qr: true, online: false, delivery: true },
    });
  });

  it("sends a flipped switch too, and a blank margin as null", async () => {
    const user = userEvent.setup();
    mount();
    await user.clear(await screen.findByLabelText("Minimum margin"));
    await user.click(screen.getByRole("switch", { name: "Online ordering" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(saveComboSettings).toHaveBeenCalledWith({
      min_margin: null,
      channels: { pos: true, qr: true, online: true, delivery: true },
    });
  });

  it("puts a branch's first override at once", async () => {
    const user = userEvent.setup();
    mount();
    await pick(user, "Maadi: POS", "Off here");
    expect(putBranchChannels).toHaveBeenCalledWith("b-2", { pos: false });
    expect(deleteBranchChannels).not.toHaveBeenCalled();
    expect(saveComboSettings).not.toHaveBeenCalled();
  });

  it("keeps a branch's other overrides when it sets one more", async () => {
    const user = userEvent.setup();
    mount();
    await pick(user, "Zamalek: Delivery apps", "On here");
    expect(putBranchChannels).toHaveBeenCalledWith("b-1", { qr: false, delivery: true });
  });

  it("deletes the override when its only channel goes back to following the org", async () => {
    const user = userEvent.setup();
    mount();
    await pick(user, "Zamalek: QR table menu", "Follow (on)");
    expect(deleteBranchChannels).toHaveBeenCalledWith("b-1");
    expect(putBranchChannels).not.toHaveBeenCalled();
  });

  it("is read-only without menu.combos.edit", async () => {
    held = ["org.settings.read"];
    mount();
    expect(await screen.findByText("You can see these settings, but only someone who can edit combos can change them.")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum margin")).toBeDisabled();
    for (const name of ["POS", "QR table menu", "Online ordering", "Delivery apps"]) {
      expect(screen.getByRole("switch", { name })).toBeDisabled();
    }
    for (const b of ["Zamalek", "Maadi"]) {
      expect(screen.getByRole("combobox", { name: `${b}: POS` })).toBeDisabled();
    }
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("shows the restricted state with neither capability", () => {
    held = ["menu.items.read"];
    mount();
    expect(screen.getByText("Your account can't open these settings. The owner can give you access.")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
