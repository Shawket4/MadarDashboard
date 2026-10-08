/**
 * The showcase's objects, in the order it plays them (the owner's): the till,
 * Dawam, ordering, the ledger, the kitchen screen, rewards. Both hosts follow
 * this list (the engine, and the site's list beside the stage), so the order is
 * changed here and only here. Kept apart from the engine so a page can list
 * them without loading three.js.
 */
export const SHOWCASE_KEYS = ["till", "dawam", "ordering", "receipt", "kitchen", "rewards"] as const;
export type ShowcaseKey = (typeof SHOWCASE_KEYS)[number];
