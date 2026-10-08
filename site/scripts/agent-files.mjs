// Files for agents and AI crawlers, written after the build (astro:build:done):
//  - <page>/index.md beside every language page's index.html: the page's <main> as
//    Markdown (headings, lists, prices, the FAQ's questions and answers, absolute links),
//    with a front matter block (title, description, url, language, translation) and the
//    contact line from the footer. nginx serves it for `Accept: text/markdown`.
//  - /index.md: a short bilingual summary that links to /en/ and /ar/.
//  - /llms.txt: what Madar POS is and a link to every page's Markdown, EN and AR.
//  - /llms-full.txt: every page's Markdown in full, English then Arabic.
// Everything is read back from the built HTML, so titles and copy have one source.
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";

const ORDER = ["", "features/", "pricing/", "faq/", "about/", "contact/"];
const LEGAL = "https://legal.madar-pos.cloud/";

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
const attr = (html, re) => {
  const m = html.match(re);
  return m ? decode(m[1]) : "";
};
const yaml = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function meta(html) {
  return {
    lang: attr(html, /<html[^>]*\slang="([^"]+)"/),
    title: attr(html, /<title>([^<]*)<\/title>/),
    description: attr(html, /<meta name="description" content="([^"]*)"/),
    canonical: attr(html, /<link rel="canonical" href="([^"]*)"/),
    alternates: [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] })),
    whatsapp: attr(html, /href="(https:\/\/wa\.me\/[^"]+)"/),
    tel: attr(html, /href="(tel:[^"]+)"/),
    telText: attr(html, /href="tel:[^"]+"[^>]*>([^<]+)</),
    mailto: attr(html, /href="(mailto:[^"]+)"/),
  };
}

function converter(site) {
  const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "_" });
  // Rules added later are checked first (turndown keeps them in a stack).
  td.addRule("summary", {
    filter: "summary",
    replacement: (content) => `\n\n### ${content.replace(/\s+/g, " ").trim()}\n\n`,
  });
  td.addRule("on-page-links", {
    // # links jump within the HTML page; in Markdown they're just their text.
    filter: (node) => node.nodeName === "A" && (node.getAttribute("href") ?? "").startsWith("#"),
    replacement: (content) => content,
  });
  td.addRule("not-content", {
    // Decoration, motion duplicates and controls: aria-hidden copies, icons, canvases,
    // pictures (their captions stay), the pricing term switch, dialogs, buttons.
    filter: (node) =>
      node.getAttribute?.("aria-hidden") === "true" ||
      node.hasAttribute?.("data-md-skip") ||
      ["SCRIPT", "STYLE", "TEMPLATE", "SVG", "CANVAS", "BUTTON", "FORM", "FIELDSET", "DIALOG", "PICTURE", "IMG", "NOSCRIPT", "IFRAME", "VIDEO"].includes(node.nodeName.toUpperCase()),
    replacement: () => "",
  });
  return (html) => {
    const start = html.indexOf(">", html.indexOf("<main")) + 1;
    const end = html.lastIndexOf("</main>");
    const main = html.slice(start, end).replace(/href="\/(?!\/)/g, `href="${site}/`);
    return td
      .turndown(main)
      .replace(/^(\s*)([-*]|\d+\.) {2,}/gm, "$1$2 ") // "-   item" → "- item"
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };
}

const LABEL = {
  en: { lang: "English", translation: "Arabic", contact: "Contact page", city: "Cairo, Egypt", whatsapp: "WhatsApp", brand: "Madar POS" },
  ar: { lang: "العربية", translation: "English", contact: "صفحة التواصل", city: "القاهرة، مصر", whatsapp: "واتساب", brand: "مدار" },
};

function contactLine(m, lang, site) {
  const l = LABEL[lang];
  const phone = m.telText.trim() || m.tel.replace("tel:", "");
  const email = m.mailto.replace("mailto:", "");
  return [
    `**${l.brand}** · ${l.city}`,
    m.whatsapp && `[${l.whatsapp}](${m.whatsapp})`,
    m.tel && `[${phone}](${m.tel})`,
    m.mailto && `[${email}](${m.mailto})`,
    `[${l.contact}](${site}/${lang}/contact/)`,
  ].filter(Boolean).join(" · ");
}

export function agentFiles(site) {
  return {
    name: "madar-agent-files",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const toMd = converter(site);
        const pages = { en: [], ar: [] };
        for (const lang of ["en", "ar"]) {
          // Every language page, in the site's order (any new page goes last).
          const found = new Set();
          async function walk(rel) {
            for (const e of await readdir(path.join(out, lang, rel), { withFileTypes: true })) {
              if (e.isDirectory()) await walk(`${rel}${e.name}/`);
              else if (e.name === "index.html") found.add(rel);
            }
          }
          await walk("");
          const rels = [...ORDER.filter((r) => found.has(r)), ...[...found].filter((r) => !ORDER.includes(r)).sort()];
          for (const rel of rels) {
            const html = await readFile(path.join(out, lang, rel, "index.html"), "utf8");
            const m = meta(html);
            const other = m.alternates.find((a) => a.lang !== lang && a.lang !== "x-default");
            const body = toMd(html);
            const md = [
              "---",
              `title: ${yaml(m.title)}`,
              `description: ${yaml(m.description)}`,
              `url: ${m.canonical}`,
              `language: ${lang}`,
              other ? `translation: ${other.href}` : null,
              "---",
              "",
              body,
              "",
              "---",
              "",
              contactLine(m, lang, site),
              "",
            ].filter((x) => x !== null).join("\n");
            await writeFile(path.join(out, lang, rel, "index.md"), md);
            pages[lang].push({ rel, md, body, ...m });
          }
        }

        // /index.md: the root's bilingual summary.
        const home = { en: pages.en.find((p) => p.rel === ""), ar: pages.ar.find((p) => p.rel === "") };
        await writeFile(
          path.join(out, "index.md"),
          [
            "---",
            `title: ${yaml("Madar POS · مدار")}`,
            `url: ${site}/`,
            "---",
            "",
            "# Madar POS · مدار",
            "",
            home.en.description,
            "",
            `- English: [${site}/en/](${site}/en/) (Markdown: [${site}/en/index.md](${site}/en/index.md))`,
            "",
            home.ar.description,
            "",
            `- العربية: [${site}/ar/](${site}/ar/) (Markdown: [${site}/ar/index.md](${site}/ar/index.md))`,
            "",
          ].join("\n"),
        );

        // /llms.txt (llmstxt.org): name, summary, then the pages by language.
        const list = (lang) => pages[lang].map((p) => `- [${p.title}](${p.canonical}index.md): ${p.description}`).join("\n");
        await writeFile(
          path.join(out, "llms.txt"),
          [
            "# Madar POS",
            "",
            `> ${home.en.description}`,
            "",
            "Madar POS (مدار) is described here in English and Arabic. Every page is also available as Markdown: send `Accept: text/markdown`, or add `index.md` to the page's address.",
            "",
            "## English",
            "",
            list("en"),
            "",
            "## العربية",
            "",
            list("ar"),
            "",
            "## Legal",
            "",
            `- [Legal documents](${LEGAL}): privacy policy, terms of service, data processing agreement, sub-processors, security and data retention for Madar POS.`,
            "",
            "## Optional",
            "",
            `- [Full text](${site}/llms-full.txt): every page above in full, English then Arabic.`,
            "",
          ].join("\n"),
        );

        // /llms-full.txt: every page's Markdown, English then Arabic.
        const full = ["# Madar POS: full text", "", `> ${home.en.description}`, ""];
        for (const lang of ["en", "ar"]) {
          for (const p of pages[lang]) full.push("---", "", `Source: ${p.canonical} (${LABEL[lang].lang})`, "", p.body, "");
        }
        await writeFile(path.join(out, "llms-full.txt"), full.join("\n"));

        logger.info(`${pages.en.length + pages.ar.length} index.md files, /index.md, llms.txt and llms-full.txt`);
      },
    },
  };
}
