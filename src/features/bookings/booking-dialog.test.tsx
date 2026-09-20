/**
 * Taking a booking by phone: the guest's name and number are validated by the
 * form (RHF + Zod, the shared phone rule), in the reader's language, and the
 * number goes out in canonical form.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingView } from "@/data/api/generated/models/bookingView";

const SLOT = "2026-09-21T17:00:00Z";
const createBooking = vi.fn();
const updateBooking = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  createBooking: (...a: unknown[]) => createBooking(...a),
  updateBooking: (...a: unknown[]) => updateBooking(...a),
  useListSections: () => ({ data: [] }),
  useBookingAvailability: () => ({
    data: { slots: [{ starts_at: SLOT, available: true, table_ids: [] }] },
    isLoading: false,
    isFetching: false,
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const i18n = (await import("@/i18n")).default;
const { BookingDialog } = await import("./booking-dialog");
const { bookingGuestSchema, guestValuesOf } = await import("./util");

const renderDialog = (booking: BookingView | null = null) =>
  render(
    <BookingDialog branchId="b1" date="2026-09-21" booking={booking} open onOpenChange={() => {}} settings={undefined} tables={[]} />,
  );

const confirm = () => screen.getByRole("button", { name: /Confirm booking|تأكيد الحجز/ });

beforeEach(async () => {
  createBooking.mockReset().mockResolvedValue({});
  updateBooking.mockReset().mockResolvedValue({});
  await i18n.changeLanguage("en");
});

describe("BookingDialog", () => {
  it("requires a name and a phone, on their fields", async () => {
    renderDialog();
    await userEvent.click(confirm());
    expect(await screen.findByText("Guest name is required")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Enter the guest's phone number")).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Guest name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Phone")).toHaveAttribute("aria-invalid", "true");
    expect(createBooking).not.toHaveBeenCalled();
  });

  it.each([
    ["en", "Enter a valid phone number"],
    ["ar", "أدخل رقم هاتف صحيح"],
  ])("refuses a number that is not a phone (%s)", async (lang, message) => {
    await i18n.changeLanguage(lang);
    renderDialog();
    await userEvent.type(screen.getByLabelText(/Guest name|اسم الضيف/), "Sara");
    await userEvent.type(screen.getByLabelText(/^Phone$|الهاتف/), "12345");
    await userEvent.click(confirm());
    expect(await screen.findByText(message)).toHaveAttribute("role", "alert");
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("still asks for a time once the guest is valid", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Guest name"), "Sara");
    await userEvent.type(screen.getByLabelText("Phone"), "01001234567");
    await userEvent.click(confirm());
    expect(await screen.findByText("Pick a time")).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("sends the phone in canonical form, however it was typed", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Guest name"), "  Sara ");
    await userEvent.type(screen.getByLabelText("Phone"), "0100 123-4567");
    await userEvent.click(screen.getByRole("button", { pressed: false }));
    await userEvent.click(confirm());
    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
    expect(createBooking.mock.calls[0][0]).toMatchObject({
      branch_id: "b1",
      starts_at: SLOT,
      guest_name: "Sara",
      guest_phone: "201001234567",
      notes: null,
    });
  });
});

describe("the guest schema", () => {
  it("shows a stored canonical phone the way a host types it", () => {
    expect(guestValuesOf({ guest_name: "Sara", guest_phone: "201001234567", notes: null }).guest_phone).toBe("01001234567");
  });
  it("accepts Arabic-Indic digits and international numbers", () => {
    const ok = (guest_phone: string) => bookingGuestSchema.safeParse({ guest_name: "x", guest_phone, notes: "" }).success;
    expect(ok("٠١٠٠١٢٣٤٥٦٧")).toBe(true);
    expect(ok("+966512345678")).toBe(true);
    expect(ok("010")).toBe(false);
  });
});
