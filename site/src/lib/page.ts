/**
 * What a page file needs from the registry (lib/pages.ts). A page's file is then two lines:
 *   export const getStaticPaths = staticPaths("<key>");
 *   <Page page="<key>" lang={Astro.params.lang} />          (kit/Page.astro, a data page)
 */
import { type PageKey, type Lang, langsOf } from "./pages";

/** getStaticPaths for a page under src/pages/[lang]/: one per language it is written in. */
export const staticPaths = (key: PageKey) => () => langsOf(key).map((lang: Lang) => ({ params: { lang } }));
