/**
 * Turning raw input into viewport intent.
 *
 * Kept pure and separate because the old editor got this wrong in a way that is
 * invisible in code review and obvious in the hand: it treated EVERY wheel
 * event as a zoom, one fixed 1.25x notch per tick. On a trackpad that means
 * two-finger scrolling — the universal gesture for "move the paper" — instead
 * jumped the zoom 25% per tick, and pinching did the same thing in coarse
 * steps. There was no touch handling at all.
 *
 * The rules a browser actually gives us:
 *
 *   • A trackpad PINCH arrives as a wheel event with `ctrlKey` synthesised true
 *     (every major engine does this; there is no separate pinch event).
 *   • Two-finger SCROLL arrives as a wheel event with deltaX/deltaY and no
 *     ctrlKey. That is a pan.
 *   • A real Ctrl+scroll is indistinguishable from a pinch, and should zoom —
 *     which is what people expect anyway.
 *   • Touch pinch is two pointers; the browser gives no gesture, so the
 *     distance ratio between them is the scale.
 */

/** How far one wheel notch moves, by `deltaMode`. Firefox reports lines. */
const DELTA_SCALE = [1, 16, 400] as const;

export type WheelIntent =
  | { kind: "zoom"; factor: number }
  | { kind: "pan"; dx: number; dy: number };

export interface WheelLike {
  deltaX: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/**
 * Continuous, not stepped. A pinch is an analogue gesture and quantising it to
 * 1.25x notches is what made the old canvas feel like it was lurching.
 *
 * The 0.01 exponent constant is the usual mapping for pixel deltas: a firm
 * pinch moves roughly 100 units and scales about e (~2.7x), a gentle one barely
 * moves. Exponential rather than linear so zooming out is the exact inverse of
 * zooming in — pinch out then back and you land where you started.
 */
export const wheelIntent = (e: WheelLike): WheelIntent => {
  const scale = DELTA_SCALE[e.deltaMode ?? 0] ?? 1;
  const dx = e.deltaX * scale;
  const dy = e.deltaY * scale;
  if (e.ctrlKey || e.metaKey) {
    return { kind: "zoom", factor: Math.exp(-dy * 0.01) };
  }
  return { kind: "pan", dx, dy };
};

/** Scale factor between two pinch distances. Guards the degenerate first move. */
export const pinchFactor = (prev: number, next: number): number =>
  prev > 0 && next > 0 ? next / prev : 1;

export const distanceBetween = (
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
): number => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

export const midpointOf = (
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
): { clientX: number; clientY: number } => ({
  clientX: (a.clientX + b.clientX) / 2,
  clientY: (a.clientY + b.clientY) / 2,
});
