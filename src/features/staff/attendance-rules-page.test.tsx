/**
 * The Rules page (RU-1, RU-2, owner decision 2026-09-23): the owner edits the
 * business's rules and each branch's overrides; a manager who holds only
 * `hr.rules.view` sees them read-only; a branch save sends only what changed,
 * plus the rules handed back to the business.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AttendanceSettings } from "@/data/api/generated/models";

// Radix Select needs these in jsdom.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let held: string[] = [];
const put = vi.fn(async (_body: unknown) => ({}));
const del = vi.fn(async (_id: string) => undefined);
const toastError = vi.fn();
const seenParams: unknown[] = [];

const BUSINESS = {
  branch_id: null, late_deduction_tiers: [{ from_minutes: 1, to_minutes: 30, kind: "minutes", value: 15 }],
  absence_deduction_days: 1, default_overtime_multiplier: 1.5, working_days_per_month: 30,
  auto_checkout_buffer_minutes: 120, require_geofence: true, excused_time_paid_default: true,
  overtime_mode: "approval", overtime_day_multiplier: 1.35, overtime_night_multiplier: 1.7, holiday_multiplier: 2,
  advance_cap_percent: 50, period_start_day: 26, half_day_leave_counts: "half_shift",
  night_start: "22:00:00", night_end: "06:00:00", gender_mode: "soft",
  limit_day_hours: 8, limit_week_hours: 48, limit_presence_hours: 10, limit_rest_hours: 12, limit_overtime_day_hours: 2,
  orders_per_staff: 12, rules_saved_at: "2026-09-01T00:00:00Z", overridden: [],
  suggested_tiers: [
    { from_minutes: 1, to_minutes: 15, kind: "minutes", value: 15 },
    { from_minutes: 16, to_minutes: null, kind: "day_fraction", value: 1 },
  ],
};
let business: Record<string, unknown> = BUSINESS;
const ARKAN = { ...BUSINESS, branch_id: "b1", overtime_mode: "automatic", absence_deduction_days: 2, overridden: ["overtime_mode", "absence_deduction_days"] };
let settingsError: unknown = null;

vi.mock("@/data/api/generated/api", () => ({
  useGetAttendanceSettings: (params: { branch_id?: string }) => {
    seenParams.push(params);
    return {
      data: settingsError ? undefined : ((params.branch_id === "b1" ? ARKAN : business) as unknown as AttendanceSettings),
      isLoading: false, isFetching: false, error: settingsError, refetch: vi.fn(),
    };
  },
  useListBranchRules: () => ({
    data: [
      { branch_id: "b1", branch_name: "Arkan", overridden: ["overtime_mode", "absence_deduction_days"] },
      { branch_id: "b2", branch_name: "Maadi", overridden: [] },
    ],
    isLoading: false, error: null,
  }),
  putAttendanceSettings: (body: unknown) => put(body),
  deleteBranchRules: (id: string) => del(id),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({
        user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [],
        capabilities: held as never, ask_manager: [], limits: {},
      }),
  };
});
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateAttendance: vi.fn() };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: (m: string) => toastError(m) } }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AttendanceRulesPage } = await import("./attendance-rules-page");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { branchBody, valuesFrom } = await import("./rules-form");

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider><ConfirmProvider><AttendanceRulesPage /></ConfirmProvider></TooltipProvider>
    </QueryClientProvider>,
  );

const pickBranch = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
  await user.click(screen.getByRole("combobox", { name: "Rules for" }));
  await user.click(await screen.findByRole("option", { name }));
};

beforeEach(() => {
  put.mockClear();
  del.mockClear();
  toastError.mockClear();
  seenParams.length = 0;
  business = BUSINESS;
  settingsError = null;
  held = ["hr.rules.edit"];
});

describe("Rules page, read-only for a manager (hr.rules.view)", () => {
  it("shows every rule with the inputs disabled, and no Save, rung or override editing", async () => {
    held = ["hr.rules.view"];
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText("You can see the rules. Only the owner changes them.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add a rung/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove rung" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Working days per month")).toBeDisabled();
    expect(screen.getByLabelText("Hours a day")).toBeDisabled();
    expect(screen.queryByRole("switch", { name: /Require location/ })).toBeNull();
    expect(screen.getByRole("radio", { name: "Paid automatically" })).toBeDisabled();

    // Their branch's overrides: visible, not editable.
    await pickBranch(user, /Arkan/);
    expect(seenParams.at(-1)).toEqual({ branch_id: "b1" });
    const own = screen.getByText("This branch's own rules").closest("[data-slot=card]") as HTMLElement;
    expect(within(own).getByText("Overtime")).toBeInTheDocument();
    expect(within(own).getByText("Days docked per absence")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Use the business's/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Follow the business/ })).not.toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("doesn't pre-fill a suggested ladder for someone who can't save it", () => {
    held = ["hr.rules.view"];
    business = { ...BUSINESS, rules_saved_at: null, late_deduction_tiers: [] };
    renderPage();
    expect(screen.getByText(/No penalties/)).toBeInTheDocument();
  });

  it("is closed to someone holding neither capability", () => {
    held = ["hr.attendance.read"];
    renderPage();
    expect(screen.getByText(/The owner sets the rules/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Working days per month")).not.toBeInTheDocument();
  });

  it("says why when the server refuses to show the rules", () => {
    held = ["hr.rules.view"];
    settingsError = Object.assign(new Error("You can't see this branch's rules"), { isAxiosError: false });
    renderPage();
    expect(screen.getByText("Couldn't load attendance rules")).toBeInTheDocument();
  });
});

describe("Rules page for the owner", () => {
  it("pre-fills the server's suggested ladder for a business that never saved (RU-1)", async () => {
    business = { ...BUSINESS, rules_saved_at: null, late_deduction_tiers: [] };
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/A suggested ladder is filled in/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][0]).toMatchObject({
      late_deduction_tiers: BUSINESS.suggested_tiers,
      absence_deduction_days: 1,
    });
  });

  it("refuses overlapping rungs and a zero working month before asking the server", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Add a rung/ }));
    const from = screen.getAllByLabelText("From (min)").at(-1)!;
    await user.clear(from);
    await user.type(from, "10");
    expect(await screen.findByText("Rungs overlap at 10 minutes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled();
    await user.click(screen.getAllByRole("button", { name: "Remove rung" }).at(-1)!);

    const days = screen.getByLabelText("Working days per month");
    await user.clear(days);
    await user.type(days, "0");
    await user.click(screen.getByRole("button", { name: /Save/ }));
    expect(await screen.findAllByText("Working days must be more than 0")).not.toHaveLength(0);
    expect(put).not.toHaveBeenCalled();
  });

  it("shows the server's refusal of a save", async () => {
    put.mockRejectedValueOnce(new Error("late_deduction_tiers overlap"));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it("saves a branch's changed rule only, as an override (RU-2)", async () => {
    const user = userEvent.setup();
    renderPage();
    await pickBranch(user, /Arkan/);
    // The business-only settings aren't a branch's.
    expect(screen.queryByLabelText("Pay period starts on day")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Advance cap (% of salary)")).not.toBeInTheDocument();
    expect(screen.queryByText("Gender in suggestions")).not.toBeInTheDocument();

    const day = screen.getByLabelText("Hours a day");
    await user.clear(day);
    await user.type(day, "7");
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][0]).toEqual({ branch_id: "b1", limit_day_hours: 7 });
  });

  it("hands a branch's rule back to the business with inherit", async () => {
    const user = userEvent.setup();
    renderPage();
    await pickBranch(user, /Arkan/);
    await user.click(screen.getByRole("button", { name: "Use the business's Overtime" }));
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put.mock.calls[0][0]).toEqual({ branch_id: "b1", inherit: ["overtime_mode"] });
  });

  it("drops every override of a branch after confirming", async () => {
    const user = userEvent.setup();
    renderPage();
    await pickBranch(user, /Arkan/);
    await user.click(screen.getByRole("button", { name: /Follow the business/ }));
    expect(del).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Follow the business/ }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("b1"));
  });

  it("sends nothing for a branch when nothing changed", async () => {
    const user = userEvent.setup();
    renderPage();
    await pickBranch(user, /Maadi/);
    await user.click(screen.getByRole("button", { name: /Save/ }));
    expect(put).not.toHaveBeenCalled();
  });
});

describe("branchBody", () => {
  const base = valuesFrom(ARKAN as unknown as AttendanceSettings);
  it("never sends a business-only setting, and lets inherit win over an edit", () => {
    const edited = { ...base, dawam: { ...base.dawam, advanceCap: "70", overtimeMode: "off" as const } };
    expect(branchBody("b1", edited, base, ["overtime_mode"])).toEqual({ branch_id: "b1", inherit: ["overtime_mode"] });
    expect(branchBody("b1", edited, base, [])).toEqual({ branch_id: "b1", overtime_mode: "off" });
    expect(branchBody("b1", base, base, [])).toBeNull();
  });
});
