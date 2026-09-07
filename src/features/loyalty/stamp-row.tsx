/**
 * The punch card: one mark per order, filled as they are earned.
 *
 * This is what a stamp programme actually is to a customer — "three of five",
 * countable at a glance, the paper card they already understand. A progress bar
 * says the same thing in a way nobody reads as *orders*.
 *
 * Only for small targets. Past `MAX_STAMPS` the marks stop being countable and
 * become texture, so a points programme (100, 250…) gets the bar instead. That
 * threshold is deliberately the same as the Wallet pass's `MAX_STAMPS`, so the
 * card in the phone and the card on the page never disagree.
 */
const MAX_STAMPS = 12;

export const stampable = (target: number): boolean =>
  target > 0 && target <= MAX_STAMPS;

export function StampRow({
  earned,
  target,
  accent,
  foreground,
  muted,
}: {
  earned: number;
  target: number;
  accent: string;
  foreground: string;
  muted: string;
}) {
  // Clamped, not trusted: a redemption leaves a remainder and an adjustment can
  // exceed the target, and neither should render a broken row.
  const filled = Math.max(0, Math.min(earned, target));

  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="img"
      aria-label={`${filled} of ${target} orders`}
    >
      {Array.from({ length: target }, (_, i) => {
        const done = i < filled;
        return (
          <span
            key={i}
            aria-hidden
            className="grid size-9 place-items-center rounded-full border-2 text-xs font-semibold transition-colors motion-reduce:transition-none"
            style={{
              borderColor: done ? accent : muted,
              backgroundColor: done ? accent : "transparent",
              // The number inside a filled mark sits on the accent, so it takes
              // the card's ground colour rather than its text colour.
              color: done ? foreground : muted,
            }}
          >
            {done ? "✓" : i + 1}
          </span>
        );
      })}
    </div>
  );
}
