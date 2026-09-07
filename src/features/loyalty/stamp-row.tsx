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
const MAX_STEPS = 12;

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

  // Half a step in from each end, as a fraction of the row.
  const inset = 50 / target;
  // The completed run reaches the centre of the last DONE step.
  const done = filled > 0 ? ((filled - 1) / target) * 100 : 0;

  const numerals = target <= NUMERALS_UP_TO;
  // Roomier steps when there are few of them; the cap only ever shrinks.
  const cap = target <= 5 ? 40 : target <= NUMERALS_UP_TO ? 34 : 26;

  return (
    <ol
      className="relative flex w-full items-center gap-1"
      role="img"
      aria-label={`${filled} of ${target} collected`}
    >
      {/* The track, behind the steps. One element, so the line never breaks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{
          left: `${inset}%`,
          right: `${inset}%`,
          backgroundColor: muted,
          opacity: 0.4,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{
          left: `${inset}%`,
          width: `${done}%`,
          backgroundColor: accent,
        }}
      />

      {Array.from({ length: target }, (_, i) => {
        const isDone = i < filled;
        const isNext = i === filled;
        return (
          <li
            key={i}
            aria-hidden
            className="relative grid aspect-square min-w-0 shrink place-items-center rounded-full text-[13px] font-semibold leading-none transition-colors duration-300 motion-reduce:transition-none"
            style={{
              // Grow to share the row, never past what a step should be.
              flex: "1 1 0",
              maxWidth: cap,
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
