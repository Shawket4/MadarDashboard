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
 * The CSS is hoisted through React's `<style>` de-duplication, as the in-app
 * demonstration's is, so the motion lives beside the markup it moves. The
 * sheen's direction follows `[dir=rtl]` by mirroring its stage, not by a
 * second set of keyframes; the stamp sits in the END corner either way.
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
import type { ReactNode } from "react";
import { Check } from "lucide-react";

import type { ResolvedBrand } from "../shared/brand";
import type { PassPhase } from "./use-pass-download";

const LOOP = "2.6s";
const PRESS_CSS = `
.ly-press { --ly-flip: 1; }
[dir="rtl"] .ly-press { --ly-flip: -1; }

.ly-press__card {
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s ease;
}
.ly-press__sheen, .ly-press__stamp { opacity: 0; }
.ly-press__rest { transition: opacity 0.5s ease; }

/* The resting picture of a card being made: lifted, stamped, the rest quiet. */
.ly-press[data-pass="making"] .ly-press__card,
.ly-press[data-pass="opening"] .ly-press__card {
  transform: translateY(-4px) scale(1.015);
  filter: drop-shadow(0 18px 24px color-mix(in oklab, var(--foreground) 22%, transparent));
}
.ly-press[data-pass="making"] .ly-press__stamp,
.ly-press[data-pass="opening"] .ly-press__stamp {
  opacity: 1;
  transform: rotate(calc(var(--ly-flip) * -12deg)) scale(1);
}
.ly-press[data-pass="making"] .ly-press__rest,
.ly-press[data-pass="opening"] .ly-press__rest { opacity: 0.32; }

/* With motion, "making" is the press at work; "opening" keeps the still. */
@media (prefers-reduced-motion: no-preference) {
  .ly-press[data-pass="making"] .ly-press__card {
    animation: ly-press-card ${LOOP} cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  }
  .ly-press[data-pass="making"] .ly-press__sheen {
    animation: ly-press-sheen ${LOOP} cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .ly-press[data-pass="making"] .ly-press__stamp {
    animation: ly-press-stamp ${LOOP} cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ly-press__card, .ly-press__rest { transition: none; }
}

/* The press rolls (0–55%), the stamp lands (58%) and the card takes it. */
@keyframes ly-press-sheen {
  0%   { opacity: 0; transform: translateX(-120%) skewX(-14deg); }
  6%   { opacity: 1; }
  50%  { opacity: 1; }
  56%, 100% { opacity: 0; transform: translateX(120%) skewX(-14deg); }
}
@keyframes ly-press-card {
  0%, 56%  { transform: translateY(-4px) scale(1.015); }
  61%      { transform: translateY(-1px) scale(0.995); }
  70%, 100% { transform: translateY(-4px) scale(1.015); }
}
@keyframes ly-press-stamp {
  0%, 52% { opacity: 0; transform: rotate(calc(var(--ly-flip) * -12deg)) scale(1.7); }
  60%     { opacity: 1; transform: rotate(calc(var(--ly-flip) * -12deg)) scale(1); }
  86%     { opacity: 1; transform: rotate(calc(var(--ly-flip) * -12deg)) scale(1); }
  96%, 100% { opacity: 0; transform: rotate(calc(var(--ly-flip) * -12deg)) scale(1.15); }
}
`;

/**
 * The stage. Wraps the whole page body; `data-pass` is the one switch every
 * rule reads, so the card, the panel and the rest agree on what is happening.
 */
export function PressStage({ phase, children }: { phase: PassPhase; children: ReactNode }) {
  return (
    <div className="ly-press contents" data-pass={phase}>
      <style href="ly-press" precedence="default">
        {PRESS_CSS}
      </style>
      {children}
    </div>
  );
}

/** The card, with the sheen and the stamp laid over it. Takes no more room than the card. */
export function PressedCard({ brand, children }: { brand: ResolvedBrand; children: ReactNode }) {
  return (
    <div
      className="ly-press__card relative rounded-[28px]"
      style={{ "--ly-ink": brand.foreground } as React.CSSProperties}
    >
      {children}
      {/* The foil: a soft diagonal band in the card's ink, clipped to the
          card's corners. Mirrored under RTL so the press rolls the way the
          page reads. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]"
        style={{ transform: "scaleX(var(--ly-flip))" }}
      >
        <div
          className="ly-press__sheen absolute inset-y-0 -inset-x-1/4 w-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--ly-ink) 26%, transparent) 50%, transparent 100%)",
          }}
        />
      </div>
      {/* The stamp: a ring and a tick in the card's ink, on the END corner. */}
      <div
        aria-hidden
        className="ly-press__stamp pointer-events-none absolute -end-2 -top-3 grid size-[68px] place-items-center rounded-full border-[3px] border-double"
        style={{
          color: "var(--ly-ink)",
          borderColor: "var(--ly-ink)",
          backgroundColor: "color-mix(in oklab, var(--ly-ink) 10%, transparent)",
        }}
      >
        <Check className="size-7" strokeWidth={3} />
      </div>
    </div>
  );
}

/** Everything the making state pushes back. Same rhythm as the page it sits in. */
export function PressRest({ children }: { children: ReactNode }) {
  return <div className="ly-press__rest flex flex-col gap-8">{children}</div>;
}
