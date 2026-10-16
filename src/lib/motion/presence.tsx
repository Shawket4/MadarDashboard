import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { enter, leave } from "./engine";
import { rise, type Recipe } from "./recipes";

import { useIsoLayoutEffect, useLatest } from "./latest";

/** One element in a presence group and the recipe it enters and leaves by. */
export type PresencePart = [RefObject<HTMLElement | null>, Recipe];

/**
 * Keep something mounted while it animates out, the job AnimatePresence did.
 * Returns whether to render it. `show` turning false plays every part's exit
 * together and unmounts when they finish; turning true again mid-exit
 * reverses from wherever it got to. Before GSAP has loaded it still plays
 * (engine.ts: inline pre-state, then GSAP or the Web Animations API).
 *
 * `initial: false` skips the entrance for whatever is shown on the first render.
 */
export function usePresence(show: boolean, parts: PresencePart[], { initial = true }: { initial?: boolean } = {}) {
  const [mounted, setMounted] = useState(show);
  if (show && !mounted) setMounted(true);
  const partsRef = useLatest(parts);
  // What the DOM shows right now: "in", "out", or caught between ("mid").
  const phase = useRef<"in" | "out" | "mid">(show && !initial ? "in" : "out");

  useIsoLayoutEffect(() => {
    if (!mounted) return;
    const live = partsRef.current.filter(([ref]) => ref.current).map(([ref, r]) => [ref.current!, r] as const);

    if (show) {
      if (phase.current === "in") return;
      phase.current = "in";
      // Plays before GSAP has loaded too (engine.ts); a reopen mid-exit
      // carries on from where the exit got to.
      const runs = live.map(([el, r]) => enter([el], r));
      return () => {
        if (runs.some((run) => !run.finished())) phase.current = "mid";
        runs.forEach((run) => run());
      };
    }

    if (!live.length) {
      phase.current = "out";
      setMounted(false);
      return;
    }
    for (const [el] of live) el.style.pointerEvents = "none";
    let left = live.length;
    const runs = live.map(([el, r]) =>
      leave([el], r, () => {
        if (--left > 0) return;
        phase.current = "out";
        setMounted(false);
      }),
    );
    return () => {
      if (runs.some((run) => !run.finished())) phase.current = "mid";
      runs.forEach((run) => run());
      for (const [el] of live) el.style.pointerEvents = "";
    };
  }, [show, mounted, partsRef]);

  return mounted;
}

/**
 * Show or hide one child with an enter and exit. The child must accept a ref
 * (a DOM element or a component that forwards one).
 *   <Presence show={open}><div>…</div></Presence>
 * While it leaves it keeps showing what it last showed: an alert counting
 * "3 bookings without a table" does not fade out reading "0".
 */
export function Presence({
  show,
  recipe = rise(),
  initial = true,
  children,
}: {
  show: boolean;
  recipe?: Recipe;
  initial?: boolean;
  children: ReactElement<{ ref?: Ref<HTMLElement> }>;
}) {
  const ref = useRef<HTMLElement>(null);
  const mounted = usePresence(show, [[ref, recipe]], { initial });
  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
  // The last content shown, kept from the last commit with `show` on.
  const kept = useRef(children);
  useIsoLayoutEffect(() => {
    if (show) kept.current = children;
  });
  // eslint-disable-next-line react-hooks/refs
  const shown = show ? children : kept.current;
  // The ref callback runs at commit, not during render.
  // eslint-disable-next-line react-hooks/refs
  return mounted ? cloneElement(shown, { ref: setRef }) : null;
}

/**
 * Swap content by key: the old content leaves, then the new one enters (what
 * AnimatePresence mode="wait" did). For steps in a flow, a figure that
 * changes, a tab body.
 *   <SwapPresence swapKey={step}><Step … /></SwapPresence>
 */
export function SwapPresence({
  swapKey,
  recipe = rise(),
  initial = true,
  className,
  children,
}: {
  swapKey: string | number;
  recipe?: Recipe;
  initial?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState({ key: swapKey, node: children });
  const latest = useLatest(children);
  const leaving = swapKey !== shown.key;
  // Same key: keep the rendered content live.
  if (!leaving && shown.node !== children) setShown({ key: swapKey, node: children });
  // The key whose entrance has played (or was skipped by `initial: false`).
  const entered = useRef<string | number | undefined>(initial ? undefined : swapKey);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!leaving) {
      if (entered.current === shown.key) return;
      entered.current = shown.key;
      if (!el) return;
      const run = enter([el], recipe);
      return () => {
        if (!run.finished()) entered.current = undefined;
        run();
      };
    }
    const swap = () => setShown({ key: swapKey, node: latest.current });
    if (!el) return swap();
    return leave([el], recipe, swap);
  }, [shown.key, swapKey, latest]);

  return (
    <div ref={ref} key={shown.key} className={className}>
      {shown.node}
    </div>
  );
}

/* ── Overlays ────────────────────────────────────────────────────────────── */

/** One ref callback feeding several refs (ours and the caller's). */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };
}

const OverlayOpen = createContext<boolean | null>(null);

/**
 * The open state of a Radix overlay root, held here so the content can stay
 * mounted through its exit. Works controlled (`open`) or uncontrolled
 * (`defaultOpen`), like the Radix root it wraps.
 */
export function useOverlayRoot(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange?: (open: boolean) => void) {
  const [inner, setInner] = useState(defaultOpen ?? false);
  const controlled = open !== undefined;
  const value = controlled ? open : inner;
  const onChange = useLatest(onOpenChange);
  const set = useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next);
      onChange.current?.(next);
    },
    [controlled, onChange],
  );
  return [value, set] as const;
}

export const OverlayOpenProvider = OverlayOpen.Provider;

/** Inside an overlay root: whether it is open. Null outside one. */
export function useOverlayOpen(): boolean | null {
  return useContext(OverlayOpen);
}

/** Enter-only motion for content that mounts and unmounts on its own (menus, tooltips). */
export function useEnter(ref: RefObject<HTMLElement | null>, recipe: () => Recipe) {
  const recipeRef = useLatest(recipe);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    return enter([el], recipeRef.current());
  }, [ref, recipeRef]);
}
