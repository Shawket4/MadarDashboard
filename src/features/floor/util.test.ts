import { describe, expect, it } from "vitest";

import { isTableTaken, needsClearing, toneFor } from "./util";

/**
 * The tone mapping is the dashboard's whole read of the room, and it now has to
 * carry the post-checkout bussing state. A settled sale leaves its table
 * `dirty` — the party paid and left their plates — and only a human clearing it
 * on the POS hands it back. Folding that into "available", as this mapper used
 * to, puts the manager's free-table count above what the room can seat.
 */
describe("toneFor", () => {
  const table = (status: string) => ({ status });

  it("shows a checked-out table as needing a bus, never as available", () => {
    expect(toneFor(table("dirty"))).toBe("dirty");
    expect(needsClearing(table("dirty"))).toBe(true);
    // The regression this guards: `dirty` reading as a free table.
    expect(toneFor(table("dirty"))).not.toBe("available");
  });

  it("keeps free and held tables available", () => {
    expect(toneFor(table("free"))).toBe("available");
    // `held` is a teller's short-lived hold — a POS concern, not a floor state.
    expect(toneFor(table("held"))).toBe("available");
  });

  it("marks seated tables as taken", () => {
    expect(toneFor(table("seated"))).toBe("seated");
    expect(isTableTaken(table("seated"))).toBe(true);
  });

  it("lets a live occupant take a table the status has not caught up on", () => {
    expect(toneFor(table("free"), "Sara")).toBe("seated");
    expect(isTableTaken(table("free"), "Sara")).toBe(true);
  });

  it("prefers the occupant when a table is both dirty and occupied", () => {
    // The mirror can briefly hold that contradiction mid-sync; "someone is
    // sitting here" is the safer read of the two.
    expect(toneFor(table("dirty"), "Sara")).toBe("seated");
    expect(needsClearing(table("dirty"), "Sara")).toBe(false);
  });
});
