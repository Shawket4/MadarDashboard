/**
 * The schedule: a day changed for that date only (SC-5), a week published
 * only after confirming (SC-3), an open shift posted on a day (SC-9), a
 * suggestion accepted (SC-13), a holiday set up (RU-10) — and none of the
 * editing shown to someone who can only read.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
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
let shiftsList: unknown[] = [];
let openShifts: unknown[] = [];
let fairnessBranches: unknown[] = [];
let audits: unknown[] = [];
let prefsLog: unknown[] = [];
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock, Toaster: () => null }));
const calls = {
  putDay: vi.fn(async (_b: unknown) => ({ warnings: [] as unknown[] })),
  resetDay: vi.fn(async (_p: unknown) => ({ warnings: [] })),
  putTimes: vi.fn(async (_b: unknown) => ({ warnings: [] })),
  moveShift: vi.fn(async (_b: unknown) => ({ from: { warnings: [] }, to: { warnings: [] } })),
  cancelOpenShift: vi.fn(async (_id: string) => ({})),
  putEmployeePreferences: vi.fn(async (_id: string, _b: unknown) => ({})),
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
      { id: "zM", name: "Morning", branch_id: "b1", start_time: "08:00:00", end_time: "16:00:00", crosses_midnight: false, grace_minutes: 10, valid_days: [0, 1, 2, 3, 4, 5, 6], day_times: [] },
      // Evening runs to midnight, but to 01:00 on Saturdays (the week's first day).
      { id: "zE", name: "Evening", branch_id: "b1", start_time: "16:00:00", end_time: "00:00:00", crosses_midnight: true, grace_minutes: 10, valid_days: [0, 1, 2, 3, 4, 5, 6], day_times: [{ day_of_week: 6, start_time: "16:00:00", end_time: "01:00:00" }] },
      // Brunch never runs on a Saturday.
      { id: "zB", name: "Brunch", branch_id: "b1", start_time: "10:00:00", end_time: "14:00:00", crosses_midnight: false, grace_minutes: 10, valid_days: [0, 1, 2, 3, 4, 5], day_times: [] },
    ],
    staff: [
      { employee_id: "e1", name: "Sara Ahmed", cant_work_days: [], prefs_set_by: "employee" },
      { employee_id: "e2", name: "Omar Nabil", cant_work_days: [5], pref_time: "evening", prefs_set_by: "manager" },
    ],
    shifts: shiftsList,
    open_shifts: openShifts,
    holidays: [{ on_date: addDays(todayIso(), 10), name_en: "Armed Forces Day", name_ar: "عيد القوات المسلحة", decision: null }],
    warnings, limits_unconfirmed: true,
    // Sara's first day holds its own set; Omar's second is a day off by date.
    date_sets: [
      { employee_id: "e1", date: week, day_off: false },
      { employee_id: "e2", date: addDays(week, 1), day_off: true },
    ],
  })),
  useSuggestions: hook(() => suggestionsList),
  useGetCoverage: hook(() => coverage),
  useFairnessAudits: hook(() => audits),
  usePreferenceLog: hook(() => prefsLog),
  useFairness: hook(() => ({
    branches: fairnessBranches,
    month: "2026-09-01", decided_4w: 10, accepted_4w: 3, learning_frozen: true,
    rows: [
      { gender: "f", people: 3, willing: 1, shifts: 60, night_shifts: 2 },
      { gender: "m", people: 5, willing: 4, shifts: 100, night_shifts: 30 },
    ],
  })),
  ...calls,
}));

// Radix Select measures and captures the pointer; jsdom has neither.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

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
  toastMock.error.mockClear();
  toastMock.warning.mockClear();
  shiftsList = [{ employee_id: "e1", employee_name: "Sara Ahmed", date: week, branch_id: "b1", work_shift_id: "zM", shift_name: "Morning", start_at: "", end_at: "", start_time: "08:00:00", end_time: "16:00:00", crosses_midnight: false, times_edited: false, from_override: false, changed: false, on_leave: false }];
  openShifts = [];
  fairnessBranches = [];
  audits = [];
  prefsLog = [];
  suggestionsList = [
    { id: "g1", date: addDays(week, 2), employee_id: "e4", employee_name: "Youssef Adel", shift_name: "Evening", work_shift_id: "zE", reason_key: "staff.sg_gap", reason_args: { shift: "Evening", short: 1 }, confidence: 72, by_default: true },
  ];
});

describe("SchedulePage", () => {
  it("gives Sara the day off for that date only (SC-5)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Day off" }));
    await waitFor(() => expect(calls.putDay).toHaveBeenCalledWith({ employee_id: "e1", on_date: week, shifts: [] }));
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
    await user.click(await screen.findByRole("menuitem", { name: /^Evening/ }));
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
  it("builds a split day from the blocks that run that weekday, at that day's times (SC-11)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox", { name: "Add a shift" }));
    const options = await screen.findAllByRole("option");
    // Saturday: Brunch doesn't run, Evening shows its Saturday times, Morning is already on.
    expect(options.map((o) => o.textContent)).toEqual(["Evening · 16:00–01:00"]);
    await user.click(options[0]);
    await user.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(calls.putDay).toHaveBeenCalledWith({
        employee_id: "e1", on_date: week,
        shifts: [
          { work_shift_id: "zM", start_time: null, end_time: null },
          { work_shift_id: "zE", start_time: null, end_time: null },
        ],
      }),
    );
  });

  it("gives one assignment its own times across midnight, and back (owner, 2026-09-23)", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Times of Morning" }));
    fireEvent.change(within(dialog).getByLabelText("From"), { target: { value: "18:00" } });
    fireEvent.change(within(dialog).getByLabelText("To"), { target: { value: "02:00" } });
    expect(within(dialog).getByText("Ends the next day")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Save times" }));
    await waitFor(() =>
      expect(calls.putTimes).toHaveBeenCalledWith({ employee_id: "e1", on_date: week, work_shift_id: "zM", start_time: "18:00:00", end_time: "02:00:00" }),
    );
  });

  it("shows an edited assignment as edited and can put it back on the block's times; a day keeps its other shifts' own times", async () => {
    const user = userEvent.setup();
    shiftsList = [
      { employee_id: "e1", employee_name: "Sara Ahmed", date: week, branch_id: "b1", work_shift_id: "zM", shift_name: "Morning", start_at: "", end_at: "", start_time: "07:30:00", end_time: "11:30:00", crosses_midnight: false, times_edited: true, from_override: true, changed: true, on_leave: false },
      { employee_id: "e1", employee_name: "Sara Ahmed", date: week, branch_id: "b1", work_shift_id: "zE", shift_name: "Evening", start_at: "", end_at: "", start_time: "16:00:00", end_time: "01:00:00", crosses_midnight: true, times_edited: false, from_override: true, changed: true, on_leave: false },
    ];
    wrap(<SchedulePage />);
    const cell = screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0];
    expect(within(cell).getByText("Edited")).toBeInTheDocument();
    expect(within(cell).getByText(/16:00–01:00/)).toBeInTheDocument();
    await user.click(cell);
    const dialog = await screen.findByRole("dialog");
    // Taking the evening off keeps the morning's own times.
    await user.click(within(dialog).getByRole("button", { name: "Take Evening off this day" }));
    await waitFor(() =>
      expect(calls.putDay).toHaveBeenCalledWith({
        employee_id: "e1", on_date: week, shifts: [{ work_shift_id: "zM", start_time: "07:30:00", end_time: "11:30:00" }],
      }),
    );
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    const again = await screen.findByRole("dialog");
    await user.click(within(again).getByRole("button", { name: "Times of Morning" }));
    await user.click(within(again).getByRole("button", { name: "Use the shift's times" }));
    await waitFor(() =>
      expect(calls.putTimes).toHaveBeenCalledWith({ employee_id: "e1", on_date: week, work_shift_id: "zM", start_time: null, end_time: null }),
    );
  });

  it("puts a day back on the pattern and moves a shift to a colleague", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Back to pattern" }));
    await waitFor(() => expect(calls.resetDay).toHaveBeenCalledWith({ employee_id: "e1", on_date: week }));

    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Give Morning to someone else" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Give it to" }));
    await user.click(await screen.findByRole("option", { name: "Omar Nabil" }));
    await user.click(within(dialog).getByRole("button", { name: "Move" }));
    await waitFor(() =>
      expect(calls.moveShift).toHaveBeenCalledWith({ employee_id: "e1", to_employee_id: "e2", on_date: week, work_shift_id: "zM" }),
    );
  });

  it("says why the server refused, in the user's language, and passes on labour warnings", async () => {
    const user = userEvent.setup();
    const refusal = new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 409, data: { code: "SHIFTS_OVERLAP", error: "Morning and Night overlap." },
    } as AxiosResponse);
    calls.putDay.mockRejectedValueOnce(refusal);
    wrap(<SchedulePage />);
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Day off" }));
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Those shifts would overlap (a night shift runs into the next morning)."));
    // The dialog stays open on a refusal.
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    calls.putDay.mockResolvedValueOnce({ warnings: [{ employee_id: "e1", date: week, kind: "day_hours", minutes: 600, limit_minutes: 480 }] });
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Day off" }));
    await waitFor(() => expect(toastMock.warning).toHaveBeenCalledWith("Hours a day: 10h of 8h. Only a warning."));
  });

  it("takes back an open shift after confirming; its claimer is told by the server (SC-9)", async () => {
    const user = userEvent.setup();
    openShifts = [{ id: "o1", branch_id: "b1", work_shift_id: "zE", shift_name: "Evening", on_date: addDays(week, 1), status: "claimed", claimed_by: "e2", claimed_by_name: "Omar Nabil" }];
    wrap(<SchedulePage />);
    await user.click(screen.getByRole("button", { name: /Take back the open Evening/ }));
    const alert = await screen.findByRole("alertdialog");
    expect(within(alert).getByText("Omar Nabil claimed it and will be told.")).toBeInTheDocument();
    expect(calls.cancelOpenShift).not.toHaveBeenCalled();
    await user.click(within(alert).getByRole("button", { name: "Take it back" }));
    await waitFor(() => expect(calls.cancelOpenShift).toHaveBeenCalledWith("o1"));
  });

  it("offers only that weekday's blocks for an open shift", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    // Saturday: no Brunch.
    await user.click(screen.getAllByRole("button", { name: /Post an open shift on/ })[0]);
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Morning08:00–16:00", "Evening16:00–01:00"]);
  });

  it("lets a manager with staff rights override preferences, and shows who changed them (SC-12)", async () => {
    const user = userEvent.setup();
    held = [...held, "hr.staff.edit"];
    prefsLog = [
      { source: "employee", pref_time: "evening", cant_work_days: [5], changed_by_name: null, note: null, created_at: "2026-09-01T10:00:00Z" },
    ];
    wrap(<SchedulePage />);
    expect(screen.getByText(/set by a manager/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sara Ahmed's preferences" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("By the employee")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Fri" }));
    await user.type(within(dialog).getByLabelText(/Why/), "Covers the opening");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(calls.putEmployeePreferences).toHaveBeenCalledWith("e1", { pref_time: null, cant_work_days: [5], note: "Covers the opening" }),
    );
  });

  it("shows preferences read-only without staff rights", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    await user.click(screen.getByRole("button", { name: "Omar Nabil's preferences" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Last set by a manager.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Fri" })).toBeDisabled();
    expect(within(dialog).queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("shows fairness branch by branch and the monthly audits to the owner (SC-13)", () => {
    held = [...held, "hr.roster.settings"];
    fairnessBranches = [
      { branch_id: "b1", branch_name: "Zamalek", rows: [], gap_points: 34, flagged: true, by_default_decided: 2, decided: 10, accepted: 3, learning_frozen: true },
      { branch_id: "b2", branch_name: "Maadi", rows: [], gap_points: 5, flagged: false, by_default_decided: 0, decided: 4, accepted: 4, learning_frozen: false },
    ];
    audits = [{ branch_id: "b1", month: "2026-08-01", flagged: true, computed_at: "2026-09-01T00:00:00Z", report: { ...(fairnessBranches[0] as object) } }];
    wrap(<SchedulePage />);
    const table = screen.getByRole("table", { name: "Branch by branch" });
    const zamalek = within(table).getByText("Zamalek").closest("tr")!;
    expect(within(zamalek).getByText("34")).toBeInTheDocument();
    expect(within(zamalek).getByText("Over 20 points")).toBeInTheDocument();
    expect(within(zamalek).getByText("Learning paused")).toBeInTheDocument();
    const maadi = within(table).getByText("Maadi").closest("tr")!;
    expect(within(maadi).queryByText("Over 20 points")).not.toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Monthly audits" });
    expect(within(list).getByText("gap 34 points")).toBeInTheDocument();
  });

  it("offers back-to-pattern only for a date that holds its own set", async () => {
    const user = userEvent.setup();
    wrap(<SchedulePage />);
    // Omar's second day is a day off set by date: shown as such.
    const omar = screen.getAllByRole("button", { name: /^Omar Nabil, / });
    expect(within(omar[1]).getByText("Day off")).toBeInTheDocument();
    await user.click(omar[1]);
    const d1 = await screen.findByRole("dialog");
    expect(within(d1).getByRole("button", { name: "Back to pattern" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    // Sara's second day follows the pattern: nothing to go back to.
    await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed, / })[1]);
    const d2 = await screen.findByRole("dialog");
    expect(within(d2).queryByRole("button", { name: "Back to pattern" })).not.toBeInTheDocument();
    expect(within(d2).getByText("Follows the standing pattern")).toBeInTheDocument();
  });

  it("reads in Arabic", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("ar");
    try {
      wrap(<SchedulePage />);
      await user.click(screen.getAllByRole("button", { name: /^Sara Ahmed، / })[0]);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("button", { name: "العودة إلى الجدول الثابت" })).toBeInTheDocument();
      expect(within(dialog).getByRole("combobox", { name: "أضف وردية" })).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("en");
    }
  });

  it("keeps the week arrows and the range together so a wrapped toolbar never splits them (L-12)", () => {
    wrap(<SchedulePage />);
    const prev = screen.getByRole("button", { name: "Previous week" });
    const next = screen.getByRole("button", { name: "Next week" });
    const group = prev.parentElement!;
    expect(group).toBe(next.parentElement);
    expect(group).toHaveClass("flex-nowrap");
    expect(group).toHaveAttribute("role", "group");
  });

  it("gives each person's preferences button a 32 px tap target on a phone (L-13)", () => {
    wrap(<SchedulePage />);
    const btn = screen.getByRole("button", { name: "Sara Ahmed's preferences" });
    expect(btn).toHaveClass("size-8");
    expect(btn).not.toHaveClass("size-6");
  });
});

