/**
 * The stepper: one step per order, joined by the track between them.
 *
 * Detached dots read as decoration. A stepper reads as a JOURNEY — you can see
 * where you are, what you have done, and how much is left, which is exactly the
 * question a customer asks of a stamp card. The connecting track is what makes
 * it one, so it is drawn behind the steps rather than between them: a gap
 * between segments would break the line at every step.
 *
 * ## It must fit, at any target, on any phone
 * Steps are `flex: 1 1 0`, capped rather than fixed. Fixed 40px steps overflowed
 * the card the moment a shop set a target above six: twelve of them need 480px
 * and a card on a 360px phone offers about 250, and `shrink-0` items do not
 * shrink — they spill out of the rounded corner.
 *
 * The track is positioned in PERCENTAGES of the row for the same reason. It
 * runs between the first and last step's CENTRES, and a step's centre is
 * `(i + ½)/target` of the row whatever it happens to measure — so the geometry
 * holds at 12 steps on a phone and at 3 on a desktop, with no pixel anywhere.
 *
 * Only for small targets. Past `MAX_STEPS` the steps stop being countable and
 * become texture, so a points programme (100, 250…) gets a bar instead. The cap
 * matches the Wallet pass's (`wallet::google::MAX_STEPS`), so the card in the
 * phone and the card on the page never disagree.
 */
import type { CSSProperties } from "react";

const MAX_STEPS = 12;

/** Breathing room between steps, and the width the sizing has to account for. */
const GAP = "0.25rem";

/** Past this many, a step is too small to hold a legible numeral. */
const NUMERALS_UP_TO = 9;

export const stampable = (target: number): boolean =>
  target > 0 && target <= MAX_STEPS;

export function StampRow({
  earned,
  target,
  accent,
  onAccent,
  muted,
}: {
  earned: number;
  target: number;
  /** Filled steps and the completed track. */
  accent: string;
  /** Ink ON a filled step — the card's ground, so the tick reads. */
  onAccent: string;
  muted: string;
}) {
  // Clamped, not trusted: redemption leaves a remainder and an adjustment can
  // exceed the target; neither should render a broken row.
  const filled = Math.max(0, Math.min(earned, target));

  // The steps run END TO END: first against the left edge, last against the
  // right. `justify-content: space-between` does that, and it means a step's
  // centre is half a step in from each end — a distance we therefore have to
  // know, so the size is computed rather than left to the flex algorithm.
  //
  // `min()` gives both halves of what a step needs: never larger than it should
  // be, and never wider than its share of the row. Twelve fixed 40px steps want
  // 480px and a card on a 360px phone offers about 250, which is how the row
  // came to spill out of the rounded corner.
  const cap = target <= 5 ? "2.5rem" : target <= NUMERALS_UP_TO ? "2.125rem" : "1.625rem";
  // Named once, on the row, and referenced everywhere else. The step size shows
  // up in four places — the step itself, both ends of the track, and the length
  // of the completed run — and repeating a nested `min(calc(...))` in each was
  // both unreadable and, spelled out four times, easy to get subtly wrong.
  const size = `min(${cap}, calc((100% - ${target - 1} * ${GAP}) / ${target}))`;
  const half = "calc(var(--step) / 2)";

  // From the first step's centre to the last completed one's. Both ends are
  // inset by half a step, so the run between the centres measures the row less
  // one whole step — no pixel anywhere, so it holds at any width.
  //
  // Anchored to the INLINE start, not the left. Flex lays the steps out in
  // reading order, so in Arabic step 1 is on the right — and a completed run
  // pinned to the left edge grew from the LAST step towards the first, which
  // told an Arabic reader with two stamps that they had the final two.
  const done =
    filled > 1 && target > 1
      ? `calc((100% - var(--step)) * ${(filled - 1) / (target - 1)})`
      : "0px";

  const numerals = target <= NUMERALS_UP_TO;

  return (
    <ol
      className="relative flex w-full items-center justify-between"
      style={{ gap: GAP, "--step": size } as CSSProperties}
      role="img"
      aria-label={`${filled} of ${target} collected`}
    >
      {/* The track, behind the steps. One element, so the line never breaks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          insetInlineStart: half,
          insetInlineEnd: half,
          backgroundColor: muted,
          opacity: 0.4,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{ insetInlineStart: half, width: done, backgroundColor: accent }}
      />

      {Array.from({ length: target }, (_, i) => {
        const isDone = i < filled;
        const isNext = i === filled;
        return (
          <li
            key={i}
            aria-hidden
            className="relative grid shrink-0 place-items-center rounded-full text-[13px] font-semibold leading-none transition-colors duration-300 motion-reduce:transition-none"
            style={{
              width: "var(--step)",
              // NOT `height: size`. A percentage in `height` resolves against
              // the parent's HEIGHT, and this row has none of its own — so the
              // same expression that sized the width correctly gave a height
              // unrelated to it, and every step came out a squashed oval.
              // The ratio takes its height from the width it actually got.
              aspectRatio: "1",
              // Opaque, so the track passes BEHIND a step rather than through
              // it — an empty circle with a grey line across it reads as
              // crossed out.
              backgroundColor: isDone ? accent : onAccent,
              // The next step is ringed so it reads as "you are here" without
              // colour alone carrying the state.
              boxShadow: isDone
                ? "none"
                : `inset 0 0 0 ${isNext ? "2px" : "1.5px"} ${isNext ? accent : muted}`,
              color: isDone ? onAccent : muted,
            }}
          >
            {numerals ? (isDone ? "✓" : i + 1) : null}
          </li>
        );
      })}
    </ol>
  );
}
