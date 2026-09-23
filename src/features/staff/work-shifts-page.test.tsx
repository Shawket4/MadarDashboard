/**
 * Work shifts (SC-1, the owner's day-scoped blocks, RU-8, RU-13): a block at a
 * branch or the whole business, on a set of weekdays with its own times on
 * some of them, its own overtime rates (empty = the branch's rules, cleared
 * with null), and the server's presence-cap warning shown, never blocking.
 * The standing pattern offers a block only on its days.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkShift } from "@/data/api/generated/models";

let shifts: WorkShift[] = [];
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock, Toaster: () => null }));
const calls = {
  createWorkShift: vi.fn(async (_b: unknown) => ({ over_presence_cap: false })),
  updateWorkShift: vi.fn(async (_id: string, _b: unknown) => ({ over_presence_cap: false })),
  deleteWorkShift: vi.fn(async () => ({})),
  createAssignment: vi.fn(async () => ({})),
  deleteAssignment: vi.fn(async () => ({})),
};
const hook = (data: () => unknown) => () => ({ data: data(), isLoading: false, isFetching: false, error: null, refetch: vi.fn() });

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("./util", async () => {
  const real = await vi.importActual<typeof import("./util")>("./util");
  return { ...real, invalidateWorkShifts: vi.fn(), invalidateSchedules: vi.fn() };
});
vi.mock("@/data/api/generated/api", () => ({
  useListWorkShifts: hook(() => shifts),
  useListBranches: hook(() => [{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }]),
  useListEmployees: hook(() => [{ id: "e1", name: "Sara Ahmed" }]),
  useListAssignments: hook(() => []),
  ...calls,
}));

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ConfirmProvider } = await import("@/components/app/confirm-dialog");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { WorkShiftsPage } = await import("./work-shifts-page");
const { bodyOf, shiftSchema, valuesOf } = await import("./work-shift-dialog");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider><ConfirmProvider>{node}</ConfirmProvider></TooltipProvider>
    </QueryClientProvider>,
  );

const evening: WorkShift = {
  id: "w1", org_id: "o", branch_id: "b1", name: "Evening", start_time: "16:00:00", end_time: "00:00:00",
  crosses_midnight: true, grace_minutes: 15, break_minutes: 30, paid_break: true, half_day_threshold_minutes: null,
  overtime_threshold_minutes: 15, overtime_multiplier: 1.5, ot_day_multiplier: 1.75, ot_night_multiplier: 2,
  checkin_window_minutes: 120, is_active: true, valid_days: [6, 0, 1, 2, 3, 4, 5],
  day_times: [{ day_of_week: 4, start_time: "16:00:00", end_time: "01:00:00" }, { day_of_week: 5, start_time: "16:00:00", end_time: "01:00:00" }],
  over_presence_cap: false, created_at: "", updated_at: "",
};

beforeEach(() => {
  for (const f of Object.values(calls)) f.mockClear();
  toastMock.warning.mockClear();
  shifts = [];
});

describe("the shift body", () => {
  const tr = (_k: string, d: string) => d;
  it("sends empty rates as null, keeps day times only on valid days, and a whole-business block has no branch", () => {
    const v = valuesOf(null);
    v.name = "Brunch";
    v.valid_days = [6, 0, 1];
    v.day_times["6"] = { start: "10:00", end: "15:00" };
    v.day_times["5"] = { start: "11:00", end: "16:00" }; // Friday is not a valid day
    const parsed = shiftSchema(tr).parse(v);
    const body = bodyOf(parsed);
    expect(body.branch_id).toBeNull();
    expect(body.ot_day_multiplier).toBeNull();
    expect(body.ot_night_multiplier).toBeNull();
    expect(body.valid_days).toEqual([0, 1, 6]);
    expect(body.day_times).toEqual([{ day_of_week: 6, start_time: "10:00:00", end_time: "15:00:00" }]);
  });

  it("refuses no days, one missing day time, and an empty shift", () => {
    const v = valuesOf(evening);
    expect(shiftSchema(tr).safeParse({ ...v, valid_days: [] }).success).toBe(false);
    expect(shiftSchema(tr).safeParse({ ...v, day_times: { ...v.day_times, "1": { start: "10:00", end: "" } } }).success).toBe(false);
    expect(shiftSchema(tr).safeParse({ ...v, end_time: "16:00" }).success).toBe(false);
    expect(shiftSchema(tr).safeParse({ ...v, ot_day_multiplier: "0" }).success).toBe(false);
    // A night crossing midnight is a shift.
    expect(shiftSchema(tr).safeParse({ ...v, start_time: "18:00", end_time: "02:00" }).success).toBe(true);
  });
});

describe("WorkShiftsPage", () => {
  it("creates a branch's block on some days, with its own Thursday times and overtime rates", async () => {
    const user = userEvent.setup();
    wrap(<WorkShiftsPage />);
    await user.click(screen.getAllByRole("button", { name: "New shift" })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Evening");
    fireEvent.change(within(dialog).getByLabelText("Start"), { target: { value: "16:00" } });
    fireEvent.change(within(dialog).getByLabelText("End"), { target: { value: "00:00" } });
    expect(within(dialog).getAllByText("Ends the next day").length).toBeGreaterThan(0);
    await user.click(within(dialog).getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Zamalek" }));
    // Not a Friday shift.
    await user.click(within(dialog).getByRole("button", { name: "Fri", pressed: true }));
    expect(within(dialog).queryByLabelText("Fri start")).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Thu start"), { target: { value: "16:00" } });
    fireEvent.change(within(dialog).getByLabelText("Thu end"), { target: { value: "01:00" } });
    await user.type(within(dialog).getByLabelText("Day overtime rate"), "1.75");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls.createWorkShift).toHaveBeenCalledTimes(1));
    expect(calls.createWorkShift.mock.calls[0][0]).toMatchObject({
      branch_id: "b1", name: "Evening", start_time: "16:00:00", end_time: "00:00:00",
      valid_days: [0, 1, 2, 3, 4, 6],
      day_times: [{ day_of_week: 4, start_time: "16:00:00", end_time: "01:00:00" }],
      ot_day_multiplier: 1.75, ot_night_multiplier: null,
    });
  });

  it("blocks a save with no days or a half-set day, and says why", async () => {
    const user = userEvent.setup();
    wrap(<WorkShiftsPage />);
    await user.click(screen.getAllByRole("button", { name: "New shift" })[0]);
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Day");
    fireEvent.change(within(dialog).getByLabelText("Mon start"), { target: { value: "09:00" } });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Set both times, or neither")).toBeInTheDocument();
    for (const d of ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]) {
      await user.click(within(dialog).getByRole("button", { name: d }));
    }
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Pick at least one day")).toBeInTheDocument();
    expect(calls.createWorkShift).not.toHaveBeenCalled();
  });

  it("clears a block's night rate back to the branch's rules with null, and warns past the presence cap", async () => {
    const user = userEvent.setup();
    shifts = [{ ...evening, over_presence_cap: true }];
    calls.updateWorkShift.mockResolvedValueOnce({ over_presence_cap: true });
    wrap(<WorkShiftsPage />);
    expect(screen.getByText("Over the presence limit")).toBeInTheDocument();
    expect(screen.getByText(/own times on 2 days/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("status")).toHaveTextContent(/presence limit/);
    expect(within(dialog).getByLabelText("Thu end")).toHaveValue("01:00");
    await user.clear(within(dialog).getByLabelText("Night overtime rate"));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls.updateWorkShift).toHaveBeenCalledTimes(1));
    const [id, body] = calls.updateWorkShift.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe("w1");
    expect(body).toMatchObject({ ot_day_multiplier: 1.75, ot_night_multiplier: null, valid_days: [0, 1, 2, 3, 4, 5, 6] });
    // Saved, and warned — never refused.
    await waitFor(() => expect(toastMock.warning).toHaveBeenCalled());
  });

  it("offers a block in the standing pattern only on its days", async () => {
    const user = userEvent.setup();
    shifts = [evening, { ...evening, id: "w2", name: "Brunch", start_time: "10:00:00", end_time: "14:00:00", crosses_midnight: false, valid_days: [6, 0, 1, 2, 3, 4], day_times: [] }];
    wrap(<WorkShiftsPage />);
    const table = screen.getByRole("table");
    const row = within(table).getByText("Sara Ahmed").closest("tr")!;
    const cells = within(row).getAllByRole("button");
    // Columns: Every day, Sun … Sat; Friday is index 6.
    await user.click(cells[6]);
    const fri = await screen.findAllByRole("menuitem");
    expect(fri.map((m) => m.textContent)).toEqual(["Evening16:00–01:00", "Rest day"]);
  });

  it("reads in Arabic", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("ar");
    try {
      wrap(<WorkShiftsPage />);
      await user.click(screen.getAllByRole("button", { name: "جدول عمل جديدة" })[0]);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("group", { name: "أيام العمل بها" })).toBeInTheDocument();
      expect(within(dialog).getByLabelText("معدل الإضافي الليلي")).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
