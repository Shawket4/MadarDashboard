/**
 * The schedule: a day changed for that date only (SC-5), a week published
 * only after confirming (SC-3), an open shift posted on a day (SC-9), a
 * suggestion accepted (SC-13), a holiday set up (RU-10) — and none of the
 * editing shown to someone who can only read.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { todayIso } from "@/features/staff/util";
import { addDays, weekStartOf } from "./week";

let held: string[] = [];
const week = weekStartOf(todayIso());
let publishedWeeks: string[] = [];
let warnings: unknown[] = [];
let suggestionsList: unknown[] = [];
let coverage: unknown = null;
const calls = {
  putOverride: vi.fn(async () => ({})),
  publish: vi.fn(async () => ({})),
  postOpenShift: vi.fn(async () => ({})),
  decideSuggestion: vi.fn(async () => ({})),
  decideHoliday: vi.fn(async () => ({})),
  putCoverage: vi.fn(async () => ({})),
};

const hook = (data: () => unknown) => () => ({ data: data(), isLoading: false, isFetching: false, error: null, refetch: vi.fn() });

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
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b1" }) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/features/staff/util", async () => {
  const real = await vi.importActual<typeof import("@/features/staff/util")>("@/features/staff/util");
  return { ...real, invalidateStaff: vi.fn() };
});
vi.mock("./rules-banner", () => ({ RulesFirstBanner: () => null }));
vi.mock("@/data/api/generated/api", () => ({
  useListBranches: hook(() => [{ id: "b1", name: "Zamalek" }]),
  useRoster: hook(() => ({
    branch_id: "b1", from: week, to: addDays(week, 6), published_weeks: publishedWeeks,
    work_shifts: [
      { id: "zM", name: "Morning", branch_id: "b1", start_time: "08:00:00", end_time: "16:00:00", crosses_midnight: false, grace_minutes: 10 },
      { id: "zE", name: "Evening", branch_id: "b1", start_time: "15:00:00", end_time: "23:00:00", crosses_midnight: false, grace_minutes: 10 },
    ],
    staff: [{ employee_id: "e1", name: "Sara Ahmed", cant_work_days: [] }],
    shifts: [{ employee_id: "e1", employee_name: "Sara Ahmed", date: week, branch_id: "b1", work_shift_id: "zM", shift_name: "Morning", start_at: "", end_at: "", changed: false, on_leave: false }],
    open_shifts: [],
    holidays: [{ on_date: addDays(todayIso(), 10), name_en: "Armed Forces Day", name_ar: "عيد القوات المسلحة", decision: null }],
    warnings, limits_unconfirmed: true,
  })),
  useSuggestions: hook(() => suggestionsList),
  useGetCoverage: hook(() => coverage),
  useFairness: hook(() => ({
    month: "2026-09-01", decided_4w: 10, accepted_4w: 3, learning_frozen: true,
    rows: [
      { gender: "f", people: 3, willing: 1, shifts: 60, night_shifts: 2 },
      { gender: "m", people: 5, willing: 4, shifts: 100, night_shifts: 30 },
    ],
  })),
  ...calls,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { SchedulePage } = await import("./schedule-page");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfirmProvider>{node}</ConfirmProvider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  for (const f of Object.values(calls)) f.mockClear();
  held = ["hr.schedule.read", "hr.schedule.edit", "hr.schedule.publish"];
  publishedWeeks = [];
  warnings = [];
  coverage = null;
  suggestionsList = [
    { id: "g1", date: addDays(week, 2), employee_id: "e4", employee_name: "Youssef Adel", shift_name: "Evening", work_shift_id: "zE", reason_key: "staff.sg_gap", reason_args: { shift: "Evening", short: 1 }, confidence: 72, by_default: true },
  ];
});

describe("SchedulePage", () => {
  it("gives Sara the day off for that date only (SC-5)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Day off" }));
    await waitFor(() => expect(calls.putOverride).toHaveBeenCalledWith({ employee_id: "e1", on_date: week, work_shift_id: null }));
  });

  it("publishes only after confirming, and then shows it published (SC-3)", async () => {
    const user = userEvent.setup();
    const { unmount } = wrap(<SchedulePage />);
    await user.click(screen.getByRole("button", { name: /Publish/ }));
    expect(calls.publish).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(calls.publish).toHaveBeenCalledWith({ branch_id: "b1", week_start: week }));
    unmount();
    publishedWeeks = [week];
    wrap(<SchedulePage />);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Publish$/ })).not.toBeInTheDocument();
  });

  it("posts an open shift on a day (SC-9)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /Post an open shift on/ })[3]);
    await user.click(await screen.findByRole("menuitem", { name: "Evening" }));
    await waitFor(() => expect(calls.postOpenShift).toHaveBeenCalledWith({ branch_id: "b1", on_date: addDays(week, 3), work_shift_id: "zE" }));
  });

  it("accepts a suggestion and sets up a holiday (SC-13, RU-10)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    expect(screen.getByText(/Evening is 1 short/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls.decideSuggestion).toHaveBeenCalledWith({ branch_id: "b1", id: "g1", accept: true }));
    await user.click(screen.getByRole("button", { name: "Make it a holiday" }));
    await waitFor(() => expect(calls.decideHoliday).toHaveBeenCalledWith(addDays(todayIso(), 10), { decision: "holiday" }));
  });

  it("is read-only for someone who can only read", () => {
    held = ["hr.schedule.read"];
    wrap(<SchedulePage />);
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sara Ahmed, / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Publish/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Suggestions")).not.toBeInTheDocument();
  });

  it("puts the server's labour warnings on the person and day, and blocks nothing (RU-13)", () => {
    warnings = [
      { employee_id: "e1", date: week, kind: "day_hours", minutes: 600, limit_minutes: 480 },
      { employee_id: "e1", date: addDays(week, 1), kind: "rest", minutes: 540, limit_minutes: 720 },
    ];
    wrap(<SchedulePage />);
    expect(screen.getByText(/the limits are unconfirmed until a lawyer confirms them/)).toBeInTheDocument();
    const cells = screen.getAllByRole("button", { name: /^Sara Ahmed, / });
    expect(within(cells[0]).getByText("Hours a day")).toBeInTheDocument();
    expect(within(cells[1]).getByText("Rest between shifts")).toBeInTheDocument();
    expect(within(cells[2]).queryByText("Hours a day")).not.toBeInTheDocument();
    // Still editable: a warning never takes the day away from the manager.
    expect(screen.getByRole("button", { name: /Publish/ })).toBeEnabled();
  });

  it("says why a coverage or pattern suggestion was made, and confirms before changing the standing pattern", async () => {
    const user = userEvent.setup();
    suggestionsList = [
      { id: "add|x|zE|e4", date: addDays(week, 2), employee_id: "e4", employee_name: "Youssef Adel", shift_name: "Evening", work_shift_id: "zE", reason_key: "staff.sg_coverage", reason_args: { shift: "Evening", hour: "19:00", short: 2 }, confidence: 70, by_default: false },
      { id: `pattern|${week}|zM|e1`, date: week, employee_id: "e1", employee_name: "Sara Ahmed", shift_name: "Morning", work_shift_id: "zM", reason_key: "staff.sg_pattern", reason_args: { name: "Sara Ahmed", shift: "Morning", weeks: 4 }, confidence: 80, by_default: false },
    ];
    wrap(<SchedulePage />);
    expect(screen.getByText(/Evening is 2 short at 19:00/)).toBeInTheDocument();
    expect(screen.getByText(/Sara Ahmed has worked Morning on this day for 4 weeks/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Accept" })[1]);
    expect(calls.decideSuggestion).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls.decideSuggestion).toHaveBeenCalledWith({ branch_id: "b1", id: `pattern|${week}|zM|e1`, accept: true }));
  });

  it("saves the typed coverage grid as the whole list, keeping department needs", async () => {
    const user = userEvent.setup();
    coverage = {
      source: "pos", orders_per_staff: 12,
      needs: [{ day_of_week: 3, band_start: "09:00:00", band_end: "10:00:00", staff: 1, department_id: "kitchen" }],
      derived: [{ day_of_week: 6, band_start: "08:00:00", band_end: "09:00:00", staff: 2, department_id: null }],
    };
    wrap(<SchedulePage />);
    await user.click(screen.getByRole("button", { name: /Coverage needs/ }));
    const sat8 = screen.getByLabelText("Sat 08:00");
    // What sales suggest shows greyed in the empty cell.
    expect(sat8).toHaveAttribute("placeholder", "2");
    await user.type(sat8, "3");
    await user.type(screen.getByLabelText("Sat 09:00"), "3");
    await user.type(screen.getByLabelText("Sun 20:00"), "1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.putCoverage).toHaveBeenCalledWith({
        branch_id: "b1",
        needs: [
          { day_of_week: 3, band_start: "09:00:00", band_end: "10:00:00", staff: 1, department_id: "kitchen" },
          { day_of_week: 0, band_start: "20:00:00", band_end: "21:00:00", staff: 1, department_id: null },
          { day_of_week: 6, band_start: "08:00:00", band_end: "10:00:00", staff: 3, department_id: null },
        ],
      }),
    );
  });

  it("shows the fairness audit only to the owner's capability (SC-12)", () => {
    const { unmount } = wrap(<SchedulePage />);
    expect(screen.queryByText("Night shifts, fairly")).not.toBeInTheDocument();
    unmount();
    held = [...held, "hr.roster.settings"];
    wrap(<SchedulePage />);
    expect(screen.getByText("Night shifts, fairly")).toBeInTheDocument();
    expect(screen.getByText(/accepted 3 of 10 suggestions/)).toBeInTheDocument();
    expect(screen.getByText(/stopped learning/)).toBeInTheDocument();
  });
});
