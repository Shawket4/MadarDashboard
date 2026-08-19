import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HATCH_ID, TableGlyph, seatSlots } from "./table-glyph";

/**
 * The glyph is what a manager actually reads the room from, and it is
 * deliberately the same drawing the POS paints. These pin the two things most
 * likely to drift: where the chairs go, and whether a table that still owes the
 * floor a bus is distinguishable without relying on colour.
 */

const svg = (ui: React.ReactElement) =>
  render(<svg>{ui}</svg>, { container: document.body.appendChild(document.createElement("div")) });

const glyph = (props: Partial<React.ComponentProps<typeof TableGlyph>> = {}) =>
  svg(
    <TableGlyph
      x={0} y={0} w={140} h={100} rotation={0} shape="rect"
      label="T1" seats={4} seatsWord="seats" status="free"
      {...props}
    />,
  );

describe("seatSlots", () => {
  const sides = (w: number, h: number, n: number) => {
    const slots = seatSlots("rect", w, h, n);
    const acc = { top: 0, bottom: 0, left: 0, right: 0 };
    for (const s of slots) {
      if (s.y < 0) acc.top += 1;
      else if (s.y > h) acc.bottom += 1;
      else if (s.x < 0) acc.left += 1;
      else acc.right += 1;
    }
    return acc;
  };

  it("seats people in pairs, facing each other", () => {
    expect(sides(140, 100, 4)).toEqual({ top: 1, bottom: 1, left: 1, right: 1 });
    expect(sides(160, 120, 6)).toEqual({ top: 2, bottom: 2, left: 1, right: 1 });
    expect(sides(260, 120, 8)).toEqual({ top: 3, bottom: 3, left: 1, right: 1 });
  });

  it("gives an odd seat the head of the table", () => {
    expect(sides(140, 100, 5)).toEqual({ top: 1, bottom: 1, left: 1, right: 2 });
    expect(sides(100, 140, 5)).toEqual({ top: 1, bottom: 2, left: 1, right: 1 });
  });

  it("draws exactly as many chairs as the table seats", () => {
    for (const n of [1, 2, 3, 4, 6, 8, 12]) {
      expect(seatSlots("rect", 140, 100, n)).toHaveLength(n);
      expect(seatSlots("circle", 90, 90, n)).toHaveLength(n);
    }
  });

  it("stops drawing chairs on a banquet-sized table", () => {
    // Past the cap the rim is a smear; the seat COUNT carries it instead.
    expect(seatSlots("rect", 400, 120, 13)).toHaveLength(0);
    expect(seatSlots("rect", 400, 120, 0)).toHaveLength(0);
  });
});

describe("TableGlyph", () => {
  it("renders a chair per seat", () => {
    const { container } = glyph({ seats: 6, w: 160, h: 120 });
    const chairs = container.querySelectorAll("rect[transform^='rotate']");
    expect(chairs).toHaveLength(6);
  });

  it("hatches a table that still needs clearing", () => {
    const { container } = glyph({ status: "dirty" });
    const hatched = container.querySelectorAll(`[fill="url(#${HATCH_ID})"]`);
    expect(hatched.length).toBeGreaterThan(0);
  });

  it("leaves an available table unhatched", () => {
    const { container } = glyph({ status: "free" });
    expect(container.querySelectorAll(`[fill="url(#${HATCH_ID})"]`)).toHaveLength(0);
  });

  it("never hatches a table someone is sitting at", () => {
    // `dirty` + a live occupant is a contradiction the mirror can briefly hold
    // mid-sync; the occupant wins, so the table reads as taken.
    const { container } = glyph({ status: "dirty", occupant: "Sara" });
    expect(container.querySelectorAll(`[fill="url(#${HATCH_ID})"]`)).toHaveLength(0);
  });
});
