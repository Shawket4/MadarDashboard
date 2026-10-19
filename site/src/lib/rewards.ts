/**
 * Rewards by Madar: the loyalty product a shop can run on its own. Its name in each
 * language, its host and its add-on price live here and nowhere else: the copy
 * (src/i18n/*, src/i18n/pages/rewards.ts), the Rewards page, the home page's apps, the
 * pricing page, the share cards (scripts/og.mjs), JSON-LD (src/lib/schema.ts) and the
 * agent files (scripts/agent-files.mjs) all read it. The page's key, "rewards", is internal.
 *
 * Plain TypeScript with no imports: the build's own scripts (Node) read it too.
 *
 * Its artwork is copied (content-credential metadata stripped) from
 * `~/Desktop/Madar/Rewards Design System/export/svg/`: the app tile `tile-ink` as
 * `shared/apps/icons/rewards.svg`, the endorsed lockups `endorsed-{rewards,mukafaat}-horizontal-ink`
 * as `src/assets/brand/rewards-endorsed-{en,ar}-ink.svg` (the Rewards page), and `symbol-paper`
 * as `src/assets/brand/rewards-symbol-paper.svg` (its share cards).
 */
export const REWARDS = {
  name: { en: "Rewards by Madar", ar: "مكافآت من مدار" },
  /** Confirmed by the owner 2026-10-19 (DNS, certificate and vhost are owner-side). */
  host: "rewards.madar-pos.cloud",
} as const;

/** Where a shop's cashier opens it: the web app (PWA). */
export const REWARDS_URL = `https://${REWARDS.host}/`;

/**
 * The add-on to the Free plan, in EGP per shop (no per-seat fee), the total for each billing
 * term, keyed like the pricing page's `pricing.plans[].prices`. There is no monthly term.
 * No free first month (owner, 2026-10-19). On a paid Madar plan, loyalty is included. Changing a price is a change here only: the
 * Rewards page, the pricing and Free pages, the FAQ, the JSON-LD and llms.txt read it.
 */
export const REWARDS_PRICES = { three: 1400, six: 2700, year: 5000 } as const;
export type RewardsTerm = keyof typeof REWARDS_PRICES;
export const REWARDS_TERMS = Object.keys(REWARDS_PRICES) as RewardsTerm[];
const MONTHS: Record<RewardsTerm, number> = { three: 3, six: 6, year: 12 };
/** What a longer term saves against paying the 3-month price again and again. */
export const rewardsSaving = (term: RewardsTerm): number =>
  (REWARDS_PRICES.three * MONTHS[term]) / 3 - REWARDS_PRICES[term];
/** A price as the site writes figures: 1,400. */
export const fmtEgp = (n: number): string => new Intl.NumberFormat("en-US").format(n);
