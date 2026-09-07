/**
 * The stepper: one step per order, joined by the track between them.
 *
 * Detached dots read as decoration. A stepper reads as a JOURNEY — you can see
 * where you are, what you have done, and how much is left, which is exactly the
 * question a customer asks of a stamp card. The connecting track is what makes
 * it one, so it is drawn behind the steps rather than between them: a gap
 * between segments would break the line at every step.
 *
 * Only for small targets. Past `MAX_STEPS` the steps stop being countable and
 * become texture, so a points programme (100, 250…) gets a bar instead. The cap
 * matches the Wallet pass's, so the card in the phone and the card on the page
 * never disagree.
 */
const MAX_STEPS = 12;

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
  // The track runs between step CENTRES, so it starts and ends half a step in.
  const progress = target > 1 ? (filled / (target - 1)) * 100 : 0;

  return (
    <div
      className="relative w-full px-[calc(1.25rem)]"
      role="img"
      aria-label={`${filled} of ${target} orders collected`}
    >
      {/* The track, behind the steps. One element, so the line never breaks. */}
      <div
        aria-hidden
        className="absolute inset-x-[calc(1.25rem)] top-1/2 h-[3px] -translate-y-1/2 rounded-full"
        style={{ backgroundColor: muted, opacity: 0.45 }}
      />
      <div
        aria-hidden
        className="absolute left-[calc(1.25rem)] top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{
          width: `calc((100% - 2.5rem) * ${Math.min(progress, 100) / 100})`,
          backgroundColor: accent,
        }}
      />

      <ol className="relative flex items-center justify-between">
        {Array.from({ length: target }, (_, i) => {
          const done = i < filled;
          const next = i === filled;
          return (
            <li
              key={i}
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-300 motion-reduce:transition-none"
              style={{
                backgroundColor: done ? accent : "transparent",
                // The next step is outlined so it reads as "you are here"
                // without colour alone carrying the state.
                boxShadow: done
                  ? "none"
                  : `inset 0 0 0 ${next ? "2px" : "1.5px"} ${next ? accent : muted}`,
                color: done ? onAccent : muted,
              }}
            >
              {done ? "✓" : i + 1}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
