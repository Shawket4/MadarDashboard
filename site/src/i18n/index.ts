import { en } from "./en";
import { ar } from "./ar";
import type { Lang } from "@/lib/site";
import type { PageKey } from "@/lib/pages";
import type { PageCopy, PageModule } from "@/types/page";

export const copy = { en, ar } as const;
export const t = (lang: Lang) => copy[lang];
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");
export type { Copy } from "./en";

/** The data pages' copy (src/i18n/pages/<key>.ts), both languages each. */
const pageModules = import.meta.glob<PageModule>("./pages/*.ts", { eager: true });

/** A data page's copy in a language. The build stops, saying what is missing, without it. */
export function pageCopy(lang: Lang, key: PageKey): PageCopy {
  const found = pageModules[`./pages/${key}.ts`]?.[lang];
  if (!found) throw new Error(`Page "${key}" has no ${lang === "ar" ? "Arabic" : "English"} copy: export \`${lang}\` from src/i18n/pages/${key}.ts`);
  return found;
}

/** A page's title and description: the hand-built pages' in meta, a data page's in its own copy. */
export function pageMeta(lang: Lang, key: PageKey | "notFound"): { title: string; description: string } {
  const meta = t(lang).meta as unknown as Record<string, { title: string; description: string } | undefined>;
  return meta[key] ?? pageCopy(lang, key as PageKey).meta;
}

/** A page's name in the header, the footer and the breadcrumbs. */
export function pageLabel(lang: Lang, key: PageKey): string {
  const c = t(lang);
  if (key === "home") return c.nav.homeLabel;
  if (key === "developers") return c.footer.developers;
  return (c.nav as unknown as Record<string, string | undefined>)[key] ?? pageCopy(lang, key).label;
}

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
