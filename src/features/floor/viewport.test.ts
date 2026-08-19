import { describe, expect, it } from "vitest";

import {
  FIT_PADDING, ZOOM_MAX, ZOOM_MIN,
  boundsOf, clampZoom, fitView, viewRect, zoomAt,
} from "./util";

/**
 * The floor is an unbounded plane the user pans and zooms over. These are the
 * behaviours a screenshot cannot confirm: that zoom holds its anchor, that a
 * fit is actually centred, and that tables placed outside the section's old
 * rectangle are still reachable rather than quietly stranded off-screen.
 */

const SIZE = { w: 1000, h: 600 };
const NOWHERE = { x: 0, y: 0, w: 100, h: 100 };

describe("boundsOf", () => {
  it("covers tables placed in negative space", () => {
    // The old canvas clamped everything to x,y >= 0. On an unbounded plane a
    // table may sit left of or above the origin, and it must still be framed.
    const b = boundsOf([{ x: -300, y: -200, w: 100, h: 100 }], NOWHERE);
    expect(b.x).toBeLessThan(0);
    expect(b.y).toBeLessThan(0);
  });

  it("gives a rotated table room to sweep", () => {
    // A square rotated 45° needs its diagonal, not its side.
    const b = boundsOf([{ x: 0, y: 0, w: 100, h: 100 }], NOWHERE);
    expect(b.w).toBeCloseTo(Math.hypot(100, 100), 5);
  });

  it("falls back when there is nothing to frame", () => {
    expect(boundsOf([], NOWHERE)).toEqual(NOWHERE);
  });
});

describe("fitView", () => {
  it("centres the content in the viewport", () => {
    const bounds = { x: 0, y: 0, w: 400, h: 300 };
    const v = fitView(bounds, SIZE);
    // The centre of the content should land on the centre of the view.
    expect(v.x + SIZE.w / (2 * v.zoom)).toBeCloseTo(bounds.x + bounds.w / 2, 5);
    expect(v.y + SIZE.h / (2 * v.zoom)).toBeCloseTo(bounds.y + bounds.h / 2, 5);
  });

  it("frames content that sits far from the origin", () => {
    const bounds = { x: -5000, y: -4000, w: 400, h: 300 };
    const v = fitView(bounds, SIZE);
    const r = viewRect(v, SIZE);
    expect(bounds.x).toBeGreaterThanOrEqual(r.x);
    expect(bounds.y).toBeGreaterThanOrEqual(r.y);
    expect(bounds.x + bounds.w).toBeLessThanOrEqual(r.x + r.w);
    expect(bounds.y + bounds.h).toBeLessThanOrEqual(r.y + r.h);
  });

  it("leaves the whole room visible with padding to spare", () => {
    const bounds = { x: 0, y: 0, w: 2400, h: 1600 };
    const r = viewRect(fitView(bounds, SIZE), SIZE);
    expect(r.w).toBeGreaterThanOrEqual(bounds.w + FIT_PADDING);
    expect(r.h).toBeGreaterThanOrEqual(bounds.h + FIT_PADDING);
  });

  it("never zooms past the usable range on an enormous room", () => {
    const v = fitView({ x: 0, y: 0, w: 500_000, h: 500_000 }, SIZE);
    expect(v.zoom).toBe(ZOOM_MIN);
  });
});

describe("zoomAt", () => {
  it("keeps the anchored point under the cursor", () => {
    const view = { x: 0, y: 0, zoom: 1 };
    const anchor = { x: 300, y: 200 };
    // Screen offset of the anchor before and after must match — that is what
    // "zoom about the cursor" means, and getting it wrong makes the canvas
    // slide away under the pointer.
    const before = { x: (anchor.x - view.x) * view.zoom, y: (anchor.y - view.y) * view.zoom };
    const after = zoomAt(view, 2, anchor);
    expect((anchor.x - after.x) * after.zoom).toBeCloseTo(before.x, 5);
    expect((anchor.y - after.y) * after.zoom).toBeCloseTo(before.y, 5);
  });

  it("holds the anchor when zooming out too", () => {
    const view = { x: -120, y: 40, zoom: 1.75 };
    const anchor = { x: 55, y: 210 };
    const before = { x: (anchor.x - view.x) * view.zoom, y: (anchor.y - view.y) * view.zoom };
    const after = zoomAt(view, 1 / 2.5, anchor);
    expect((anchor.x - after.x) * after.zoom).toBeCloseTo(before.x, 5);
    expect((anchor.y - after.y) * after.zoom).toBeCloseTo(before.y, 5);
  });

  it("stops at the limits instead of drifting", () => {
    const atMax = zoomAt({ x: 0, y: 0, zoom: ZOOM_MAX }, 4, { x: 10, y: 10 });
    expect(atMax.zoom).toBe(ZOOM_MAX);
    // Refusing to zoom must not move the view either.
    expect(atMax.x).toBe(0);
    expect(atMax.y).toBe(0);

    const atMin = zoomAt({ x: 0, y: 0, zoom: ZOOM_MIN }, 0.25, { x: 10, y: 10 });
    expect(atMin.zoom).toBe(ZOOM_MIN);
  });

  it("round-trips in and back out to where it started", () => {
    const view = { x: 12, y: -34, zoom: 1 };
    const anchor = { x: 200, y: 150 };
    const back = zoomAt(zoomAt(view, 2, anchor), 0.5, anchor);
    expect(back.zoom).toBeCloseTo(view.zoom, 5);
    expect(back.x).toBeCloseTo(view.x, 5);
    expect(back.y).toBeCloseTo(view.y, 5);
  });
});

describe("clampZoom", () => {
  it("holds the range at both ends", () => {
    expect(clampZoom(99)).toBe(ZOOM_MAX);
    expect(clampZoom(0.0001)).toBe(ZOOM_MIN);
    expect(clampZoom(1)).toBe(1);
  });
});
