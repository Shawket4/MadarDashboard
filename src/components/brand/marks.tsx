import { DAWAM_STROKES } from "@shared/showcase/marks";

/**
 * The family's marks, drawn inline so they follow the text colour.
 *
 * Madar: the app icon's ring, centre and satellite (the satellite is the brand
 * teal). Dawam: "the heavy d" from the Dawam brand kit (v2), one round-capped
 * stroke, monochrome by rule (never tinted). Both are decorative unless a title
 * is given.
 */

type MarkProps = { className?: string; title?: string };
/** `optical`: the brand kit's small size (16–32 px, app/masters/favicon.svg): heavier ring, larger dot and satellite. */
type MadarMarkProps = MarkProps & { optical?: boolean };

function labelled(title?: string) {
  return title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
}

export function MadarMark({ className, title, optical }: MadarMarkProps) {
  if (optical) {
    return (
      <svg viewBox="0 0 81 81" className={className} {...labelled(title)}>
        <circle cx="40.5" cy="40.5" r="34" fill="none" stroke="currentColor" strokeWidth="11" />
        <circle cx="40.5" cy="40.5" r="15" fill="currentColor" />
        <circle cx="64.54" cy="16.46" r="11" className="fill-brand" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className={className} {...labelled(title)}>
      <circle cx="40" cy="40" r="22.5" fill="none" stroke="currentColor" strokeWidth="4.3" />
      <circle cx="40" cy="40" r="7.9" fill="currentColor" />
      <circle cx="55.8" cy="24.1" r="5.3" className="fill-brand" />
    </svg>
  );
}

export function DawamMark({ className, title }: MarkProps) {
  return (
    <svg viewBox="15 8 70 84" className={className} {...labelled(title)}>
      <g stroke="currentColor" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {DAWAM_STROKES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
