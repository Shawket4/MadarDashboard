import { describe, expect, it } from "vitest";

import { distanceBetween, midpointOf, pinchFactor, wheelIntent } from "./gestures";

describe("wheel intent", () => {
  it("treats a two-finger scroll as a pan, not a zoom", () => {
    // The bug this whole module exists to fix: scrolling used to zoom 25% a tick.
    const intent = wheelIntent({ deltaX: 12, deltaY: -40 });
    expect(intent).toEqual({ kind: "pan", dx: 12, dy: -40 });
  });

  it("treats a trackpad pinch (ctrlKey wheel) as a zoom", () => {
    // Browsers synthesise ctrlKey for pinch; there is no pinch event.
    const intent = wheelIntent({ deltaX: 0, deltaY: -10, ctrlKey: true });
    expect(intent.kind).toBe("zoom");
    if (intent.kind === "zoom") expect(intent.factor).toBeGreaterThan(1);
  });

  it("zooms out when the pinch closes", () => {
    const intent = wheelIntent({ deltaX: 0, deltaY: 10, ctrlKey: true });
    if (intent.kind !== "zoom") throw new Error("expected zoom");
    expect(intent.factor).toBeLessThan(1);
  });

  it("is exactly reversible, so pinch in then out lands where it started", () => {
    const inward = wheelIntent({ deltaX: 0, deltaY: -25, ctrlKey: true });
    const outward = wheelIntent({ deltaX: 0, deltaY: 25, ctrlKey: true });
    if (inward.kind !== "zoom" || outward.kind !== "zoom") throw new Error("expected zooms");
    expect(inward.factor * outward.factor).toBeCloseTo(1, 10);
  });

  it("scales line and page deltas so Firefox does not crawl", () => {
    // deltaMode 1 is lines, not pixels; treating them alike makes Firefox
    // panning move a sixteenth as far per notch.
    const px = wheelIntent({ deltaX: 0, deltaY: 3, deltaMode: 0 });
    const lines = wheelIntent({ deltaX: 0, deltaY: 3, deltaMode: 1 });
    if (px.kind !== "pan" || lines.kind !== "pan") throw new Error("expected pans");
    expect(lines.dy).toBeGreaterThan(px.dy);
  });

  it("is continuous rather than stepped", () => {
    const small = wheelIntent({ deltaY: -2, deltaX: 0, ctrlKey: true });
    const large = wheelIntent({ deltaY: -40, deltaX: 0, ctrlKey: true });
    if (small.kind !== "zoom" || large.kind !== "zoom") throw new Error("expected zooms");
    expect(large.factor).toBeGreaterThan(small.factor);
    // A gentle pinch must not jump a whole notch.
    expect(small.factor).toBeLessThan(1.1);
  });
});

describe("touch pinch", () => {
  it("scales by the ratio of finger distances", () => {
    expect(pinchFactor(100, 200)).toBe(2);
    expect(pinchFactor(200, 100)).toBe(0.5);
  });

  it("no-ops on the first move, when there is no previous distance", () => {
    expect(pinchFactor(0, 120)).toBe(1);
  });

  it("measures distance and midpoint between two pointers", () => {
    const a = { clientX: 0, clientY: 0 };
    const b = { clientX: 30, clientY: 40 };
    expect(distanceBetween(a, b)).toBe(50);
    expect(midpointOf(a, b)).toEqual({ clientX: 15, clientY: 20 });
  });
});
