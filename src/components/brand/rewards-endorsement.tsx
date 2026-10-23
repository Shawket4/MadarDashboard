/**
 * Rewards by Madar's sign-off at the foot of a Rewards page: the kit's
 * endorsed horizontal lockup (the present on its tile, "rewards", "by madar";
 * in Arabic "مكافآت من مدار"), exactly as drawn, never set in type.
 *
 * Copied from the Rewards Design System (`export/svg/endorsed-{rewards,mukafaat}-
 * horizontal-mask.svg`, content-credential metadata stripped) in the kit's Slate,
 * the colour it keeps for secondary lines like this one. Slate reads on the paper
 * page and on the dark one, so one file serves both themes and nothing switches.
 * At the kit's minimum for an endorsed lockup, 40px tall, and only in the page's
 * footer: the card is the shop's, and Madar signs the page, not the card.
 */
import { cn } from "@/lib/utils";

import en from "./rewards-endorsed-en-slate.svg?url";
import ar from "./rewards-endorsed-ar-slate.svg?url";

/** Each lockup's width at 40px tall (its viewBox: 700.104 and 543.138 by 100). */
const LOCKUP = { en: { src: en, width: 280 }, ar: { src: ar, width: 217 } } as const;

export function RewardsEndorsement({
  lang,
  label,
  className,
}: {
  lang: "en" | "ar";
  /** "Rewards by Madar" in the reader's language. */
  label: string;
  className?: string;
}) {
  const { src, width } = LOCKUP[lang];
  return (
    // Sized before it arrives (width and height), so the footer never moves.
    <img
      src={src}
      alt={label}
      width={width}
      height={40}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("h-10 w-auto", className)}
    />
  );
}
