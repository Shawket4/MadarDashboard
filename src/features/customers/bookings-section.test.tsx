/**
 * A customer's bookings on the 360 sheet: when, how many, where, how it ended.
 * A row opens the booking on the Bookings page only for someone who may read
 * bookings. Names and numbers here are invented.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingView } from "@/data/api/generated/models";

const booking = (over: Partial<BookingView>): BookingView =>
  ({
    id: "bk-1", branch_id: "b-1", customer_id: "c-1", guest_name: "Sara Ali", guest_phone: "201000000001",
    party_size: 4, status: "confirmed", starts_at: "2026-03-05T18:00:00Z", ends_at: "2026-03-05T20:00:00Z",
    held_from: "2026-03-05T17:45:00Z", created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
    locale: "en", needs_table: false, phone_verified: true, source: "public", table_ids: [], table_labels: [],
    ...over,
  }) as BookingView;

let held: string[] = [];
const useListCustomerBookings = vi.fn();
const navigate = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListCustomerBookings: (...a: unknown[]) => useListCustomerBookings(...a),
  useListBranches: () => ({ data: [{ id: "b-1", name: "Downtown" }, { id: "b-2", name: "Marina" }] }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { BookingsSection } = await import("./bookings-section");
const { serviceDateOf } = await import("@/features/bookings/util");

const answer = (data: BookingView[] | undefined, over: Record<string, unknown> = {}) =>
  useListCustomerBookings.mockImplementation(() => ({ data, isLoading: false, isError: false, isFetching: false, error: null, refetch: vi.fn(), ...over }));

beforeEach(() => {
  held = ["customers.view"];
  navigate.mockReset();
  useListCustomerBookings.mockReset();
});

describe("BookingsSection", () => {
  it("lists each booking with its party, branch and status, in the order the server gave", () => {
    answer([booking({}), booking({ id: "bk-2", branch_id: "b-2", party_size: 2, status: "no_show" })]);
    render(<BookingsSection customerId="c-1" />);
    expect(useListCustomerBookings.mock.calls[0][0]).toBe("c-1");
    expect(useListCustomerBookings.mock.calls[0][1]).toEqual({ limit: 10, offset: 0 });
    const rows = screen.getAllByTestId("customer-booking");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/Party of 4/)).toBeInTheDocument();
    expect(within(rows[0]).getByText("Downtown")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Confirmed")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Marina")).toBeInTheDocument();
    expect(within(rows[1]).getByText("No-show")).toBeInTheDocument();
  });

  it("nothing booked: says so", () => {
    answer([]);
    render(<BookingsSection customerId="c-1" />);
    expect(screen.getByText(/No bookings\./)).toBeInTheDocument();
  });

  it("without bookings.read a row is plain: nothing to click, nowhere to go", () => {
    answer([booking({})]);
    render(<BookingsSection customerId="c-1" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("with bookings.read the date opens that booking: its branch, its day, its id", async () => {
    held = ["customers.view", "bookings.read"];
    const b = booking({ branch_id: "b-2" });
    answer([b]);
    render(<BookingsSection customerId="c-1" />);
    await userEvent.click(within(screen.getByTestId("customer-booking")).getByRole("button"));
    expect(navigate).toHaveBeenCalledTimes(1);
    const arg = navigate.mock.calls[0][0] as { to: string; search: (p: Record<string, unknown>) => Record<string, unknown> };
    expect(arg.to).toBe("/bookings");
    expect(arg.search({ preset: "7d" })).toEqual({ preset: "7d", branchId: "b-2", date: serviceDateOf(b.starts_at), booking: "bk-1" });
  });

  it("a full page offers more, and asks for a longer window", async () => {
    answer(Array.from({ length: 10 }, (_, i) => booking({ id: `bk-${i}` })));
    render(<BookingsSection customerId="c-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(useListCustomerBookings.mock.calls.at(-1)?.[1]).toEqual({ limit: 20, offset: 0 });
  });

  it("a failed read says why and offers a retry", () => {
    answer(undefined, { isError: true, error: new Error("boom") });
    render(<BookingsSection customerId="c-1" />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
