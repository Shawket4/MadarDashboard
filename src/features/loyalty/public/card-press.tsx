/**
 * The card being made, drawn on the card.
 *
 * While the Apple pass is built the customer is waiting for one thing — their
 * card — and it is already on the page, so it is the card that comes alive
 * rather than a spinner beside a button. The page composes itself around it:
 *
 *  - the CARD lifts off the page and a foil sheen rolls across it, the way a
 *    press rolls over a blank; at the end of each pass a rubber stamp lands on
 *    its corner and the card takes the blow — a small press-down — then the
 *    stamp lifts and the press rolls again;
 *  - everything BELOW the wallet panel recedes to a third, so the card and the
 *    line under it ("Making your card…") are all the page is saying;
 *  - when the pass has arrived the press stops mid-story: the stamp stays
 *    down, the card stays lifted, and the line says "Opening Wallet…".
 *
 * All of it is `transform` and `opacity` on three elements, so a mid-range
 * phone composites it without repainting the card, and none of it takes
 * space: the sheen and the stamp are absolutely positioned inside a wrapper
 * the card already fills, the lift is a transform, the receding is opacity.
 * Nothing moves that the customer could be reading.
 *
 * The resting pictures are plain classes switched by the phase; the press
 * itself is one GSAP timeline (2.6 s, looping, paused off screen) that runs
 * only while the pass is being made. The sheen's container mirrors under RTL
 * so the press rolls the way the page reads; the stamp sits in the END corner
 * and tilts with the reading direction.
 *
 * Under `prefers-reduced-motion` the loop is off and the resting state of a
 * `making` card IS the "opening" picture — lifted, stamped, the rest receded —
 * which still says that something is being done to this card. Not a blank,
 * and not a frame of an animation that never plays.
 *
 * Ink: the stamp and the sheen are drawn in the card's own foreground, which
 * `brand.ts` has already made legible on this ground — a highlight on a dark
 * card, an ink press on a light one, and never a raw colour chosen here.
 */
import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import { Check } from "lucide-react";

import { EASE_NAME, useTimeline } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { ResolvedBrand } from "../shared/brand";
import type { PassPhase } from "./use-pass-download";

/** One pass of the press, in seconds. */
const LOOP = 2.6;

const Phase = createContext<PassPhase>("idle");
/** "making" and "opening" share the resting picture: lifted, stamped, the rest receded. */
const pressed = (p: PassPhase) => p === "making" || p === "opening";

/**
 * The stage. Wraps the whole page body; the phase is the one switch every
 * piece reads, so the card, the panel and the rest agree on what is happening.
 */
export function PressStage({ phase, children }: { phase: PassPhase; children: ReactNode }) {
  return (
    <div className="ly-press contents" data-pass={phase}>
      <Phase.Provider value={phase}>{children}</Phase.Provider>
    </div>
  );
}

/**
 * The press at work: the foil rolls (0–56%), the stamp lands (52–60%) and the
 * card takes the blow (56–70%), then the stamp lifts (86–96%). Mounted only
 * while the pass is made; unmounting reverts to the resting picture.
 */
function PressLoop({ card, press, sheen, stamp }: Record<"card" | "press" | "sheen" | "stamp", RefObject<HTMLDivElement | null>>) {
  useTimeline(
    card,
    (tl) => {
      const L = LOOP;
      tl.set(sheen.current, { xPercent: -120, skewX: -14, opacity: 0 }, 0)
        .to(sheen.current, { xPercent: 120, duration: 0.56 * L, ease: EASE_NAME.inOut }, 0)
        .to(sheen.current, { opacity: 1, duration: 0.06 * L, ease: "none" }, 0)
        .to(sheen.current, { opacity: 0, duration: 0.06 * L, ease: "none" }, 0.5 * L)
        .set(stamp.current, { opacity: 0, scale: 1.7 }, 0)
        .to(stamp.current, { opacity: 1, scale: 1, duration: 0.08 * L, ease: EASE_NAME.out }, 0.52 * L)
        .to(stamp.current, { opacity: 0, scale: 1.15, duration: 0.1 * L, ease: EASE_NAME.out }, 0.86 * L)
        .to(press.current, { y: 3, scale: 0.98, duration: 0.05 * L, ease: EASE_NAME.out }, 0.56 * L)
        .to(press.current, { y: 0, scale: 1, duration: 0.09 * L, ease: EASE_NAME.out }, 0.61 * L)
        .set(stamp.current, { opacity: 0 }, L);
    },
    [],
    { repeat: -1, pauseOffscreen: true, late: true },
  );
  return null;
}

/** The card, with the sheen and the stamp laid over it. Takes no more room than the card. */
export function PressedCard({ brand, children }: { brand: ResolvedBrand; children: ReactNode }) {
  const phase = useContext(Phase);
  const card = useRef<HTMLDivElement>(null);
  const press = useRef<HTMLDivElement>(null);
  const sheen = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  // The loop mounts AFTER the card, so the card's refs are attached when it starts.
  return (
    <>
    <div
      ref={card}
      className={cn(
        "ly-press__card rounded-[28px] transition-[translate,scale,filter] duration-brand ease-expo",
        pressed(phase) &&
          "-translate-y-1 scale-[1.015] drop-shadow-[0_18px_24px_color-mix(in_oklab,var(--foreground)_22%,transparent)]",
      )}
      style={{ "--ly-ink": brand.foreground } as React.CSSProperties}
    >
      <div ref={press} className="relative rounded-[28px]">
        {children}
        {/* The foil: a soft diagonal band in the card's ink, clipped to the
            card's corners. Mirrored under RTL so the press rolls the way the
            page reads. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] rtl:-scale-x-100">
          <div
            ref={sheen}
            className="ly-press__sheen absolute inset-y-0 -inset-x-1/4 w-1/2 opacity-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--ly-ink) 26%, transparent) 50%, transparent 100%)",
            }}
          />
        </div>
        {/* The stamp: a ring and a tick in the card's ink, on the END corner. */}
        <div
          ref={stamp}
          aria-hidden
          className={cn(
            "ly-press__stamp pointer-events-none absolute -end-2 -top-3 grid size-[68px] -rotate-12 place-items-center rounded-full border-[3px] border-double rtl:rotate-12",
            pressed(phase) ? "opacity-100" : "opacity-0",
          )}
          style={{
            color: "var(--ly-ink)",
            borderColor: "var(--ly-ink)",
            backgroundColor: "color-mix(in oklab, var(--ly-ink) 10%, transparent)",
          }}
        >
          <Check className="size-7" strokeWidth={3} />
        </div>
      </div>
    </div>
    {phase === "making" && <PressLoop card={card} press={press} sheen={sheen} stamp={stamp} />}
    </>
  );
}

/** Everything the making state pushes back. Same rhythm as the page it sits in. */
export function PressRest({ children }: { children: ReactNode }) {
  const phase = useContext(Phase);
  return (
    <div className={cn("ly-press__rest flex flex-col gap-8 transition-opacity duration-brand ease-out", pressed(phase) && "opacity-[0.32]")}>
      {children}
    </div>
  );
}
