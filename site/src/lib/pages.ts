/**
 * The page registry: every page of the site, in the site's order. Routing (pageHref), the
 * header's and the footer's links, hreflang, the sitemap and its alternates, breadcrumbs,
 * the agent files' order, the offline archive and `npm run verify` all read this one list.
 *
 * Add a page with `npm run new:page -- <key>` (scripts/new-page.mjs): it adds the entry
 * here, the copy (src/i18n/pages/<key>.ts, both languages) and the page file. The build
 * fails, saying which, if a page here has no file or no copy in one of its languages.
 *
 * Plain TypeScript with no imports, so the build's own scripts (astro.config.mjs,
 * scripts/*.mjs) read it too.
 */
export type Lang = "en" | "ar";
export const LANGS: readonly Lang[] = ["en", "ar"];

export interface PageDef {
  key: string;
  /** The folder under the language: "pricing/" is /en/pricing/; "" is the home page. */
  path: string;
  /** The language goes last: /free/en/, not /en/free/ (the Free campaign page). */
  langLast?: boolean;
  /** Written in these languages only (default: both). */
  langs?: readonly Lang[];
  /** Among the header's links. */
  nav?: boolean;
  /** Among the footer's Product links. */
  footer?: boolean;
  /** Rendered from its copy alone (src/i18n/pages/<key>.ts) by kit/Page.astro. */
  data?: boolean;
}
/** A page's entry (typed, and its key kept as a literal). */
export const definePage = <const P extends PageDef>(page: P) => page;

export const PAGES = [
  definePage({ key: "home", path: "" }),
  definePage({ key: "features", path: "features/", nav: true, footer: true }),
  definePage({ key: "pricing", path: "pricing/", nav: true, footer: true }),
  definePage({ key: "free", path: "free/", langLast: true, nav: true, footer: true }),
  definePage({ key: "faq", path: "faq/", nav: true, footer: true }),
  definePage({ key: "about", path: "about/", nav: true, footer: true }),
  definePage({ key: "contact", path: "contact/", footer: true }),
  definePage({ key: "developers", path: "developers/", langs: ["en"], footer: true }),
  // new pages above this line (scripts/new-page.mjs)
] as const;

export type PageKey = (typeof PAGES)[number]["key"];
/** The same list, each entry seen with all its options. */
const ALL: readonly (PageDef & { key: PageKey })[] = PAGES;

/** A page's entry by key. */
export function pageOf(key: PageKey): PageDef {
  const page = ALL.find((p) => p.key === key);
  if (!page) throw new Error(`no page "${key}" in src/lib/pages.ts`);
  return page;
}

/** The languages a page is written in. */
export const langsOf = (key: PageKey): readonly Lang[] => pageOf(key).langs ?? LANGS;

/** Written in English only: its language switch leads to the Arabic home. */
export const isEnglishOnly = (key: PageKey | "notFound"): boolean => key !== "notFound" && !langsOf(key).includes("ar");

/** Site-relative URL of a page in a language, e.g. /ar/pricing/ (or /free/ar/). */
export function pageHref(lang: Lang, key: PageKey, hash = ""): string {
  const page = pageOf(key);
  const base = page.langLast ? `/${page.path}${lang}/` : `/${lang}/${page.path}`;
  return `${base}${hash ? `#${hash}` : ""}`;
}

/** Every page address the build makes, in the site's order. */
export const PAGE_URLS: { key: PageKey; lang: Lang; href: string }[] = ALL.flatMap((p) =>
  (p.langs ?? LANGS).map((lang) => ({ key: p.key, lang, href: pageHref(lang, p.key) })),
);

/** The site's top-level folders: the languages, and each language-last page's own. */
export const TOP_FOLDERS: string[] = [...LANGS, ...ALL.filter((p) => p.langLast).map((p) => p.path.replace(/\/$/, ""))];
