/**
 * In-mall's location step asks for the DEVICE's location: proof the customer
 * is at the branch now. A saved address (the coordinates of an earlier order)
 * fills shop, floor and unit, and never confirms the location. Outside keeps
 * its saved pin, which is where the order goes. The addresses are invented.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";

vi.mock("@/data/api/generated/api", () => ({
  useDeliveryQuote: (_b: string, _p: unknown, opts?: { query?: { enabled?: boolean } }) => ({
    data: opts?.query?.enabled ? { status: "ok", fee: 1500, distance_meters: 0 } : undefined,
    isFetching: false,
  }),
}));
vi.mock("./delivery-map", () => ({ DeliveryMap: () => <div data-testid="map" /> }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { LocationStep } = await import("./location-step");

const saved = (over: Partial<GuestSavedLocation> = {}): GuestSavedLocation =>
  ({
    branch_id: "b-1",
    channel: "in_mall",
    place_name: "Test Shop",
    floor: "2",
    unit_number: "14",
    landmark: null,
    address_line: null,
    customer_lat: 30.0444,
    customer_lng: 31.2357,
    last_used_at: "2026-10-01T10:00:00Z",
    ...over,
  }) as GuestSavedLocation;

/** The device refuses to share its location. */
const denyGeolocation = () => {
  const getCurrentPosition = vi.fn((_ok: PositionCallback, fail?: PositionErrorCallback | null) =>
    fail?.({ code: 1, message: "denied" } as GeolocationPositionError),
  );
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  return getCurrentPosition;
};

const mount = (channel: "in_mall" | "outside", locations: GuestSavedLocation[]) => {
  const onPointChange = vi.fn();
  const onApplySavedAddress = vi.fn();
  const onContinue = vi.fn();
  render(
    <LocationStep
      branchId="b-1"
      channel={channel}
      point={null}
      required
      savedLocations={locations}
      onPointChange={onPointChange}
      onApplySavedAddress={onApplySavedAddress}
      onQuoteChange={vi.fn()}
      onContinue={onContinue}
    />,
  );
  return { onPointChange, onApplySavedAddress, onContinue };
};

beforeEach(() => {
  denyGeolocation();
});

describe("the in-mall location step, where the branch requires GPS", () => {
  it("a returning customer's saved address fills the fields and does not confirm the location", () => {
    const { onPointChange, onApplySavedAddress } = mount("in_mall", [saved()]);
    expect(onApplySavedAddress).toHaveBeenCalledWith(expect.objectContaining({ place_name: "Test Shop" }));
    expect(onPointChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Continue to menu/ })).toBeDisabled();
  });

  it("tapping a saved address does not confirm it either", async () => {
    const { onPointChange, onApplySavedAddress } = mount("in_mall", [saved({ branch_id: "b-2" })]);
    await userEvent.click(screen.getByRole("button", { name: /Use a saved address/ }));
    await userEvent.click(screen.getByRole("button", { name: /Test Shop/ }));
    expect(onApplySavedAddress).toHaveBeenCalledTimes(1);
    expect(onPointChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Continue to menu/ })).toBeDisabled();
  });
});

describe("the outside location step", () => {
  it("a saved delivery pin is still the point", () => {
    const { onPointChange } = mount("outside", [saved({ channel: "outside", address_line: "Test Street" })]);
    expect(onPointChange).toHaveBeenCalledWith({ lat: 30.0444, lng: 31.2357 });
  });
});
