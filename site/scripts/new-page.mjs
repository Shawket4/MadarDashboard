// A new page, aligned with the rest from its first build:
//   npm run new:page -- <key>            adds it (EN and AR, at /en/<key>/ and /ar/<key>/)
//   npm run new:page -- <key> --remove   takes it out again
// It writes three things, and nothing else needs touching (site/CLAUDE.md, "Add a page"):
//  - the registry entry (src/lib/pages.ts): routing, the footer, hreflang, the sitemap, the
//    agent files, the offline archive and `npm run verify` all follow from it;
//  - the copy, both languages, shaped by src/types/page.ts (src/i18n/pages/<key>.ts): its
//    meta, its name, its hero and its sections, as placeholders marked TODO to replace;
//  - the page file (src/pages/[lang]/<key>.astro): two lines, rendered by kit/Page.astro.
// Then: write the copy, `npm run build && npm run check && npm run verify`, and add a share
// card in scripts/og.mjs if it should have its own (it shows the home card until then).
import { readFile, writeFile, rm, access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = path.join(site, "src/lib/pages.ts");
const MARK = "  // new pages above this line (scripts/new-page.mjs)";
const [key, flag] = process.argv.slice(2);
const exists = (p) => access(p).then(() => true, () => false);

if (!key || !/^[a-z][a-z0-9-]*$/.test(key)) {
  console.error("Usage: npm run new:page -- <key> [--remove]   (key: lowercase letters, digits and dashes, e.g. partners)");
  process.exit(1);
}
const copyFile = path.join(site, `src/i18n/pages/${key}.ts`);
const pageFile = path.join(site, `src/pages/[lang]/${key}.astro`);
const entry = `  definePage({ key: "${key}", path: "${key}/", footer: true, data: true }),`;
const source = await readFile(registry, "utf8");

if (flag === "--remove") {
  if (!source.includes(entry)) {
    console.error(`"${key}" is not a page this script made (no such line in src/lib/pages.ts).`);
    process.exit(1);
  }
  await writeFile(registry, source.replace(`${entry}\n`, ""));
  await rm(copyFile, { force: true });
  await rm(pageFile, { force: true });
  console.log(`Removed the page "${key}": its registry entry, src/i18n/pages/${key}.ts and src/pages/[lang]/${key}.astro.`);
  process.exit(0);
}

if (new RegExp(`key: "${key}"`).test(source) || (await exists(copyFile)) || (await exists(pageFile))) {
  console.error(`There is already a page "${key}".`);
  process.exit(1);
}
if (!source.includes(MARK)) {
  console.error(`src/lib/pages.ts has lost its marker line ("${MARK.trim()}"): put it back after the last page.`);
  process.exit(1);
}

const name = key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
await writeFile(registry, source.replace(MARK, `${entry}\n${MARK}`));
// The first data page makes the folder (git keeps no empty one).
await mkdir(path.dirname(copyFile), { recursive: true });

await writeFile(
  copyFile,
  `/**
 * ${name}: the page's copy in both languages (rendered by kit/Page.astro; the shape is
 * src/types/page.ts). TODO: write it. Claims must match the product (MadarRust
 * authz/spec/plans.toml); in Arabic prose say صفر / ولا, never a bare 0.
 */
import type { PageModule } from "@/types/page";

export const en: PageModule["en"] = {
  meta: {
    title: "TODO ${name}: what this page is about | Madar POS",
    description: "TODO One or two sentences for search results and share cards.",
  },
  label: "${name}",
  hero: {
    kicker: "${name}",
    title: "TODO The page's headline.",
    lead: "TODO One or two sentences that say what the page offers.",
    action: { label: "Talk to us on WhatsApp", href: { to: "whatsapp" } },
  },
  sections: [
    {
      kind: "grid",
      kicker: "TODO Kicker",
      title: "TODO What it gives you.",
      numbered: true,
      items: [
        { title: "TODO First point", body: "TODO A line about it." },
        { title: "TODO Second point", body: "TODO A line about it." },
      ],
    },
    {
      kind: "steps",
      kicker: "TODO Getting started",
      title: "TODO How it works.",
      items: [
        { title: "TODO First step", body: "TODO What happens." },
        { title: "TODO Second step", body: "TODO What happens." },
        { title: "TODO Third step", body: "TODO What happens." },
      ],
    },
    {
      kind: "faq",
      title: "TODO Questions",
      items: [{ q: "TODO A question people ask?", a: "TODO Its answer." }],
    },
    {
      kind: "band",
      title: "TODO One call to action.",
      body: "TODO A line under it.",
      action: { label: "Create your free account", href: { to: "signup" } },
      crew: ["joy"],
    },
  ],
};

export const ar: PageModule["ar"] = {
  meta: {
    title: "TODO عنوان الصفحة | مدار",
    description: "TODO جملة أو اتنين لنتائج البحث وكروت المشاركة.",
  },
  label: "TODO ${name}",
  hero: {
    kicker: "TODO ${name}",
    title: "TODO عنوان الصفحة.",
    lead: "TODO جملة أو اتنين بيقولوا الصفحة بتقدّم إيه.",
    action: { label: "كلّمنا على واتساب", href: { to: "whatsapp" } },
  },
  sections: [
    {
      kind: "grid",
      kicker: "TODO عنوان صغير",
      title: "TODO بيدّيك إيه.",
      numbered: true,
      items: [
        { title: "TODO أول نقطة", body: "TODO سطر عنها." },
        { title: "TODO تاني نقطة", body: "TODO سطر عنها." },
      ],
    },
    {
      kind: "steps",
      kicker: "TODO البداية",
      title: "TODO بيشتغل إزاي.",
      items: [
        { title: "TODO أول خطوة", body: "TODO بيحصل إيه." },
        { title: "TODO تاني خطوة", body: "TODO بيحصل إيه." },
        { title: "TODO تالت خطوة", body: "TODO بيحصل إيه." },
      ],
    },
    {
      kind: "faq",
      title: "TODO أسئلة",
      items: [{ q: "TODO سؤال بيتسأل كتير؟", a: "TODO إجابته." }],
    },
    {
      kind: "band",
      title: "TODO دعوة واحدة للتجربة.",
      body: "TODO سطر تحتها.",
      action: { label: "اعمل حسابك المجاني", href: { to: "signup" } },
      crew: ["joy"],
    },
  ],
};
`,
);

await writeFile(
  pageFile,
  `---
/** ${name}: rendered from its copy (src/i18n/pages/${key}.ts) by kit/Page.astro. */
import Page from "@/components/kit/Page.astro";
import { staticPaths } from "@/lib/page";
import type { Lang } from "@/lib/site";

export const getStaticPaths = staticPaths("${key}");
const { lang } = Astro.params as { lang: Lang };
---
<Page page="${key}" lang={lang} />
`,
);

console.log(`Added the page "${key}" (/en/${key}/, /ar/${key}/):
  src/lib/pages.ts            its registry entry (in the footer; set nav: true for the header)
  src/i18n/pages/${key}.ts     its copy, EN and AR: replace every TODO
  src/pages/[lang]/${key}.astro  its page file
Then: npm run build && npm run check && npm run verify   (npm run new:page -- ${key} --remove takes it out)`);
