/**
 * Rewards by Madar's mark for the top of a Rewards page: the kit's compact
 * horizontal lockup (the present on its tile, then "rewards"; in Arabic
 * مكافآت), exactly as drawn, never set in type.
 *
 * Not the endorsed lockup ("rewards by madar"): the kit's minimum for that one
 * is 40px tall, 280px wide in Latin, which leaves no room for the header's two
 * toggles on a 360px phone. The compact lockup's minimum is 28px tall (132px
 * wide in Latin, 103px in Arabic). "By Madar" stays in the link's name, and in
 * the footer's signature.
 *
 * Copied from the Rewards Design System (`export/svg/lockup-{rewards,mukafaat}-
 * {ink,paper}.svg`, content-credential metadata stripped). Ink on the light
 * theme, Paper on the dark one: the kit never tints the mark.
 */
import inkEn from "./rewards-lockup-en-ink.svg?url";
import paperEn from "./rewards-lockup-en-paper.svg?url";
import inkAr from "./rewards-lockup-ar-ink.svg?url";
import paperAr from "./rewards-lockup-ar-paper.svg?url";

/** Each lockup's width at 28px tall (its viewBox: 472.406 and 368.75 by 100). */
const LOCKUP = {
  en: { ink: inkEn, paper: paperEn, width: 132 },
  ar: { ink: inkAr, paper: paperAr, width: 103 },
} as const;

/** Decorative: whatever holds it names it ("Rewards by Madar"), once for both images. */
export function RewardsLockup({ lang }: { lang: "en" | "ar" }) {
  const { ink, paper, width } = LOCKUP[lang];
  // Sized before they arrive, so nothing moves. A storefront opens light
  // (`usePublicTheme`): the ink one loads at once, the paper one only once dark is chosen.
  return (
    <>
      <img src={ink} alt="" width={width} height={28} decoding="async" draggable={false} className="h-7 w-auto dark:hidden" />
      <img
        src={paper}
        alt=""
        width={width}
        height={28}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="hidden h-7 w-auto dark:block"
      />
    </>
  );
}
