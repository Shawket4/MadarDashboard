import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AttendanceSettings } from "@/data/api/generated/models";
import { DEFAULT_RULES, rulesFrom, rulesRequest } from "./rules-card";

const put = vi.fn(async () => ({}));
let held: string[] = [];
const settings = {
  late_deduction_tiers: [], absence_deduction_days: 1, default_overtime_multiplier: 1.5, working_days_per_month: 30,
  auto_checkout_buffer_minutes: 120, require_geofence: true, excused_time_paid_default: true,
  overtime_mode: "approval", overtime_day_multiplier: 1.35, overtime_night_multiplier: 1.7, holiday_multiplier: 2,
  advance_cap_percent: 50, period_start_day: 26, half_day_leave_counts: "half_shift",
  night_start: "22:00:00", night_end: "06:00:00", gender_mode: "soft",
  limit_day_hours: 8, limit_week_hours: 48, limit_presence_hours: 10, limit_rest_hours: 12, limit_overtime_day_hours: 2,
  orders_per_staff: 12, rules_saved_at: "2026-09-01T00:00:00Z",
} as unknown as AttendanceSettings;

vi.mock("@/data/api/generated/api", () => ({
  useGetAttendanceSettings: () => ({ data: settings, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }),
  putAttendanceSettings: (...a: unknown[]) => put(...(a as [])),
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

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AttendanceRulesPage } = await import("@/features/staff/attendance-rules-page");

const renderPage = () => render(<QueryClientProvider client={new QueryClient()}><AttendanceRulesPage /></QueryClientProvider>);

beforeEach(() => {
  put.mockClear();
  held = ["hr.attendance.edit"];
});

describe("Dawam rules", () => {
  it("round-trip the server's settings, the night window and the labour limits", () => {
    const r = rulesFrom(settings);
    expect(r).toMatchObject({ overtimeMode: "approval", periodStartDay: "26", halfDay: "half_shift", nightStart: "22:00", genderMode: "soft" });
    expect(rulesRequest(r)).toEqual({
      ok: {
        overtime_mode: "approval", overtime_day_multiplier: 1.35, overtime_night_multiplier: 1.7, holiday_multiplier: 2,
        advance_cap_percent: 50, period_start_day: 26, half_day_leave_counts: "half_shift",
        night_start: "22:00:00", night_end: "06:00:00",
        limit_day_hours: 8, limit_week_hours: 48, limit_presence_hours: 10, limit_rest_hours: 12, limit_overtime_day_hours: 2,
        orders_per_staff: 12,
      },
    });
    // The gender mode only rides for someone who may change it (SC-12).
    expect((rulesRequest(r, true) as { ok: Record<string, unknown> }).ok.gender_mode).toBe("soft");
  });

  it("refuse a rate below 1×, a cap past 100%, a start day past the 28th, a zero limit and a fractional orders-per-person", () => {
    expect(rulesRequest({ ...DEFAULT_RULES, otNight: "0.9" })).toEqual({ error: "dawam.rulesRateLow" });
    expect(rulesRequest({ ...DEFAULT_RULES, advanceCap: "120" })).toEqual({ error: "dawam.rulesCapRange" });
    expect(rulesRequest({ ...DEFAULT_RULES, periodStartDay: "31" })).toEqual({ error: "dawam.rulesStartDay" });
    expect(rulesRequest({ ...DEFAULT_RULES, limitRest: "0" })).toEqual({ error: "dawam.rulesLimitRange" });
    expect(rulesRequest({ ...DEFAULT_RULES, ordersPerStaff: "2.5" })).toEqual({ error: "dawam.rulesOrdersPerStaff" });
  });

  it("save with the rest of the page's rules, with decimal limits and no weekend (RU-11)", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByText("Weekend")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Paid automatically" }));
    await user.click(screen.getByRole("radio", { name: "The whole day" }));
    const day = screen.getByLabelText("Hours a day");
    await user.clear(day);
    await user.type(day, "7.5");
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    const body = (put.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body).toMatchObject({
      overtime_mode: "automatic", half_day_leave_counts: "whole_day", period_start_day: 26, absence_deduction_days: 1,
      limit_day_hours: 7.5, night_start: "22:00:00", orders_per_staff: 12,
    });
    expect(body).not.toHaveProperty("weekend_days");
    expect(body).not.toHaveProperty("gender_mode");
  });

  it("offer no switch that turns the branch fence off: every app punch is fenced (CL-2)", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByText("Require location to clock in")).not.toBeInTheDocument();
    expect(screen.getByText(/always checks the phone is inside the branch's radius/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect((put.mock.calls[0] as unknown[])[0]).not.toHaveProperty("require_geofence");
  });

  it("let only the owner's capability change the gender mode (SC-12)", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole("radio", { name: "A rule" })).toBeDisabled();

    held = ["hr.attendance.edit", "hr.roster.settings"];
    renderPage();
    const rule = screen.getAllByRole("radio", { name: "A rule" }).find((b) => !(b as HTMLButtonElement).disabled)!;
    await user.click(rule);
    await user.click(screen.getAllByRole("button", { name: /Save/ }).at(-1)!);
    await waitFor(() => expect(put).toHaveBeenCalledWith(expect.objectContaining({ gender_mode: "hard" })));
  });
});
