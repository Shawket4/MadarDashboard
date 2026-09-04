import { describe, expect, it } from "vitest";

import {
  alignItems, distributeItems, envelopeOf, marqueeHits, parseClipboard,
  serializeTables, uniqueLabel, type GeoItem,
} from "./util";

const item = (id: string, x: number, y: number, w = 100, h = 60, rot = 0): GeoItem =>
  ({ id, x, y, w, h, rot });

describe("marquee selection", () => {
  it("catches a table the box merely touches", () => {
    // Containment would mean a near-miss selects nothing, which on a dense
    // floor is most attempts.
    const hits = marqueeHits({ x: 0, y: 0, w: 20, h: 20 }, [item("a", 10, 10)]);
    expect(hits).toEqual(["a"]);
  });

  it("ignores a table outside the box", () => {
    expect(marqueeHits({ x: 0, y: 0, w: 20, h: 20 }, [item("a", 500, 500)])).toEqual([]);
  });

  it("works when dragged up and to the left", () => {
    // A marquee dragged backwards has negative width/height; normalising it is
    // the difference between selecting everything and selecting nothing.
    const hits = marqueeHits({ x: 200, y: 200, w: -180, h: -180 }, [item("a", 100, 100)]);
    expect(hits).toEqual(["a"]);
  });

  it("uses the rotation envelope, so a turned table is still caught", () => {
    const turned = item("a", 100, 100, 120, 20, 90);
    // Rotated 90°, this sweeps well above its unrotated box.
    expect(envelopeOf(turned).h).toBeGreaterThan(turned.h);
    expect(marqueeHits({ x: 100, y: 60, w: 40, h: 40 }, [turned])).toEqual(["a"]);
  });
});

describe("align", () => {
  it("flushes left edges and reports only what moved", () => {
    const moved = alignItems([item("a", 0, 0), item("b", 50, 100), item("c", 0, 200)], "left");
    expect(moved.map((m) => m.id)).toEqual(["b"]);
    expect(moved[0].x).toBe(0);
  });

  it("centres horizontally about the selection, not the origin", () => {
    const moved = alignItems([item("a", 0, 0, 100, 100), item("b", 200, 0, 100, 100)], "hcenter");
    // Both envelopes are 100 wide here, so both land on the same centre.
    const centres = moved.map((m) => m.x + m.w / 2);
    expect(new Set(centres).size).toBe(1);
  });

  it("does nothing with fewer than two tables", () => {
    expect(alignItems([item("a", 5, 5)], "left")).toEqual([]);
  });
});

describe("distribute", () => {
  it("equalises the gaps and leaves the outermost alone", () => {
    const items = [item("a", 0, 0, 100, 50), item("b", 120, 0, 100, 50), item("c", 600, 0, 100, 50)];
    const moved = distributeItems(items, "x");
    expect(moved.map((m) => m.id)).toEqual(["b"]);

    const byId = new Map(items.map((i) => [i.id, i]));
    for (const m of moved) byId.set(m.id, m);
    const [a, b, c] = ["a", "b", "c"].map((id) => envelopeOf(byId.get(id)!));
    const gap1 = b.x - (a.x + a.w);
    const gap2 = c.x - (b.x + b.w);
    expect(gap1).toBeCloseTo(gap2, 6);
  });

  it("needs three tables to mean anything", () => {
    expect(distributeItems([item("a", 0, 0), item("b", 100, 0)], "x")).toEqual([]);
  });
});

describe("clipboard", () => {
  const meta = [
    { label: "T1", seats: 2, shape: "rect" },
    { label: "T2", seats: 4, shape: "circle" },
  ];
  const geo = [item("a", 300, 200), item("b", 400, 260)];

  it("round-trips through text and keeps the selection's shape", () => {
    const parsed = parseClipboard(serializeTables(meta, geo))!;
    expect(parsed).toHaveLength(2);
    // Offsets are relative to the selection's top-left, so a paste anywhere
    // reproduces the arrangement rather than the absolute position.
    expect(parsed[0].dx).toBe(0);
    expect(parsed[0].dy).toBe(0);
    expect(parsed[1].dx).toBe(100);
    expect(parsed[1].dy).toBe(60);
    expect(parsed[1].seats).toBe(4);
  });

  it("ignores a paste from somewhere else instead of throwing", () => {
    // Ctrl+V is pressed with all sorts of things on the clipboard.
    expect(parseClipboard("just some text")).toBeNull();
    expect(parseClipboard("{}")).toBeNull();
    expect(parseClipboard('{"kind":"other.app","tables":[]}')).toBeNull();
    expect(parseClipboard("")).toBeNull();
  });
});

describe("unique labels", () => {
  it("leaves a free label alone", () => {
    expect(uniqueLabel("T1", new Set())).toBe("T1");
  });

  it("suffixes a taken one", () => {
    // Two tables called "12" is a real problem: staff say the label out loud.
    expect(uniqueLabel("12", new Set(["12"]))).toBe("12 (2)");
    expect(uniqueLabel("12", new Set(["12", "12 (2)"]))).toBe("12 (3)");
  });

  it("does not stack suffixes when copying a copy", () => {
    expect(uniqueLabel("12 (2)", new Set(["12", "12 (2)"]))).toBe("12 (3)");
  });
});
