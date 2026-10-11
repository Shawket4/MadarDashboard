import { en } from "./en";
import { ar } from "./ar";
import type { Lang } from "@/lib/site";

export const copy = { en, ar } as const;
export const t = (lang: Lang) => copy[lang];
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");
export type { Copy } from "./en";

/** The feature areas by the part of a café's day they serve, as [anchor id, name]: the
 *  features page's jump nav and the phone menu's list. */
export function featureGroups(lang: Lang) {
  const { areas: a, features: { groups: g } } = t(lang);
  return [
    { label: g.opening, items: [["till", a.till.kicker], ["inventory", a.inventory.kicker]] },
    { label: g.rush, items: [["counter", a.counter.kicker], ["floor", a.floor.kicker], ["ordering", a.ordering.kicker], ["loyalty", a.loyalty.kicker]] },
    { label: g.close, items: [["menu", a.menu.kicker], ["basira", a.basira.kicker], ["hq", a.hq.kicker]] },
    { label: g.also, items: [["dawam", a.dawam.kicker], ["setup", a.setup.kicker]] },
  ] as const;
}
