import type { FocusEvent, PointerEvent } from "react";

/**
 * Intent: the one gesture model every prefetch in the dashboard uses (links,
 * tabs, cards, rows, the sidebar). It decides WHEN to warm; what to warm is
 * the caller's (a route's registry entry, a row's detail query).
 *
 * - A mouse or pen hover warms after `HOVER_DELAY_MS`, so a pointer passing
 *   over a list on its way somewhere warms nothing. There is one pending hover
 *   at a time (one pointer), so moving on cancels the last one.
 * - Keyboard focus waits the same, so tabbing through a list warms only where
 *   it stops.
 * - `pointerdown` warms at once: on a phone it is the first signal there is
 *   (no hover), and on a desktop it buys the ~100 ms until the click.
 * - The same target is not warmed twice within `DEDUPE_MS`, hovers and focus
 *   warm at most `HOVER_BUDGET_PER_S` targets a second (a press always warms),
 *   and nothing is warmed on a save-data or 2G connection.
 *
 * Warming is reading: callers prefetch queries only (`prefetchQuery`), which
 * TanStack skips while the cached data is still fresh (the client's 30 s
 * `staleTime`) and joins when it is already in flight. Never a mutation or an
 * export download.
 */

export const HOVER_DELAY_MS = 65;
export const DEDUPE_MS = 2_000;
/** Hover and focus warm at most this many targets a second; a press always warms. */
export const HOVER_BUDGET_PER_S = 6;

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/** False on a connection that asked for less data (Save-Data) or is too slow to spend it on a guess. */
export function connectionAllowsPrefetch(): boolean {
  if (typeof navigator === "undefined") return true;
  const c = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!c) return true;
  return !c.saveData && !/(^|-)2g$/.test(c.effectiveType ?? "");
}

const lastRun = new Map<string, number>();

/** Run `fire` for `key` unless it ran in the last `DEDUPE_MS` or the connection says not to. */
export function warmOnce(key: string, fire: () => void): void {
  if (!connectionAllowsPrefetch()) return;
  const now = Date.now();
  const at = lastRun.get(key);
  if (at !== undefined && now - at < DEDUPE_MS) return;
  lastRun.set(key, now);
  if (lastRun.size > 500) for (const [k, t] of lastRun) if (now - t >= DEDUPE_MS) lastRun.delete(k);
  try {
    fire();
  } catch {
    // A guess that failed costs nothing: the page fetches on mount as it always did.
  }
}

/** Tests: forget what was warmed. */
export function resetIntent(): void {
  lastRun.clear();
  hoverWarms.length = 0;
  cancelPending();
}

let pending: ReturnType<typeof setTimeout> | null = null;

/** One pointer, one pending hover: leaving, or entering something else, drops it. */
function cancelPending() {
  if (pending === null) return;
  clearTimeout(pending);
  pending = null;
}

/** `fire` through the dedupe when it has a key; a keyless `fire` dedupes itself (a route's resolved href). */
function run(key: string | null, fire: () => void) {
  if (key === null) {
    if (connectionAllowsPrefetch()) fire();
  } else warmOnce(key, fire);
}

const hoverWarms: number[] = [];

/** The throttle on guesses: true while this second's hover budget lasts. */
function hoverBudget(): boolean {
  const now = Date.now();
  while (hoverWarms.length && now - hoverWarms[0] >= 1_000) hoverWarms.shift();
  if (hoverWarms.length >= HOVER_BUDGET_PER_S) return false;
  hoverWarms.push(now);
  return true;
}

function schedule(key: string | null, fire: () => void) {
  cancelPending();
  pending = setTimeout(() => {
    pending = null;
    if (hoverBudget()) run(key, fire);
  }, HOVER_DELAY_MS);
}

export interface IntentHandlers {
  onPointerEnter: (e: PointerEvent<Element>) => void;
  onPointerLeave: (e: PointerEvent<Element>) => void;
  onPointerDown: (e: PointerEvent<Element>) => void;
  onFocus: (e: FocusEvent<Element>) => void;
  onBlur: (e: FocusEvent<Element>) => void;
}

/**
 * The handlers that warm on intent. With a `key`, `fire` runs at most once per
 * `DEDUPE_MS` for it; `null` leaves the dedupe to `fire` (route prefetches
 * dedupe on the resolved destination). Spread them on the element that
 * navigates or opens (`{...intent(`order:${id}`, () => warm(id))}`);
 * `withIntent` merges them with handlers the element already has.
 */
export function intent(key: string | null, fire: () => void): IntentHandlers {
  return {
    onPointerEnter: (e) => {
      // Touch has no hover: its pointerenter comes with the press, handled below.
      if (e.pointerType !== "touch") schedule(key, fire);
    },
    onPointerLeave: cancelPending,
    onPointerDown: () => {
      cancelPending();
      run(key, fire);
    },
    onFocus: () => schedule(key, fire),
    onBlur: cancelPending,
  };
}

type Handler<E> = ((e: E) => void) | undefined;

/** `props` with `handlers` chained after the element's own (theirs run first, and may still preventDefault). */
export function withIntent<P extends Partial<Record<keyof IntentHandlers, unknown>>>(props: P, handlers: IntentHandlers | null): P {
  if (!handlers) return props;
  const out = { ...props } as Record<string, unknown>;
  for (const name of Object.keys(handlers) as (keyof IntentHandlers)[]) {
    const own = props[name] as Handler<never>;
    const ours = handlers[name] as Handler<never>;
    out[name] = own ? (e: never) => { own(e); ours?.(e); } : ours;
  }
  return out as P;
}
