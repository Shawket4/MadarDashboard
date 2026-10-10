/**
 * The inspector's Seats box (SELL-FLR-060, W3): a value that is not a whole
 * number from 0 to 99 used to be dropped without a word. It now says so under
 * the row, in EN and AR, and sends nothing.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateFloorTable = vi.fn().mockResolvedValue({});
vi.mock("@/data/api/generated/api", () => ({ updateFloorTable: (...a: unknown[]) => updateFloorTable(...a) }));
vi.mock("./util", async () => ({
  ...(await vi.importActual<typeof import("./util")>("./util")),
  invalidateFloor: vi.fn(),
}));
vi.mock("./table-history", () => ({ TableHistory: () => null }));

const i18n = (await import("@/i18n")).default;
const { InspectorPanel } = await import("./properties-panel");
const { parseSeats } = await import("./util");

const table = { id: "t1", label: "T1", seats: 4, shape: "rect", section_id: null } as never;
const geo = { id: "t1", x: 0, y: 0, w: 80, h: 80, rot: 0 };

const mount = () =>
  render(
    <InspectorPanel tables={[table]} sections={[]} editable geoOf={() => geo} onGeoChange={vi.fn()} />,
  );

beforeEach(async () => {
  updateFloorTable.mockClear();
  await i18n.changeLanguage("en");
});

describe("parseSeats", () => {
  it("takes a whole number from 0 to 99 and nothing else", () => {
    expect(parseSeats("0")).toBe(0);
    expect(parseSeats("99")).toBe(99);
    expect(parseSeats(" 6 ")).toBe(6);
    for (const bad of ["", "  ", "100", "-1", "2.5", "abc"]) expect(parseSeats(bad)).toBeNull();
  });
});

describe("Inspector seats (W3, SELL-FLR-060)", () => {
  it("shows the message for 100, sends nothing, and clears it on typing; a valid count saves", () => {
    mount();
    const box = screen.getByLabelText("Seats");
    fireEvent.change(box, { target: { value: "100" } });
    fireEvent.blur(box);
    expect(screen.getByRole("alert")).toHaveTextContent("Seats must be a whole number from 0 to 99");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAttribute("aria-describedby", "floor-seats-error");
    expect(box).toHaveValue(100);
    expect(updateFloorTable).not.toHaveBeenCalled();

    fireEvent.change(box, { target: { value: "6" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(updateFloorTable).toHaveBeenCalledWith("t1", { seats: 6 });
  });

  it("a cleared box is an error, never 0 seats", () => {
    mount();
    const box = screen.getByLabelText("Seats");
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.blur(box);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(updateFloorTable).not.toHaveBeenCalled();
  });

  it("says it in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    const box = screen.getByLabelText("المقاعد");
    fireEvent.change(box, { target: { value: "2.5" } });
    fireEvent.blur(box);
    expect(screen.getByRole("alert")).toHaveTextContent("يجب أن يكون عدد المقاعد رقمًا صحيحًا من 0 إلى 99");
  });
});
