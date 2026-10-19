// Files for agents and AI crawlers, written after the build (astro:build:done):
//  - <page>/index.md beside every language page's index.html: the page's <main> as
//    Markdown (headings, lists, prices, the FAQ's questions and answers, absolute links),
//    with a front matter block (title, description, url, language, translation) and the
//    contact line from the footer. nginx serves it for `Accept: text/markdown`.
//  - /index.md: the root page (/, both languages) as Markdown.
//  - /404.md: the 404 page as Markdown, with the sitemap and llms.txt. nginx serves it
//    for an unknown address asked for with `Accept: text/markdown`.
//  - /llms.txt: what Madar POS is, when to use it, and a link to every page's
//    Markdown, EN and AR.
//  - /llms-full.txt: the same opening, then every page's Markdown in full, English
//    then Arabic.
// Everything is read back from the built HTML, so titles and copy have one source.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
// The pages, in the site's order: the registry (src/lib/pages.ts).
import { LANGS, PAGE_URLS } from "../src/lib/pages.ts";
import { REWARDS, REWARDS_URL, REWARDS_PRICES } from "../src/lib/rewards.ts";
const LEGAL = "https://legal.madar-pos.cloud/";
const API = "https://api.madar-pos.cloud";

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
  td.addRule("table", {
    // Tables (the developers page's endpoints and tools) as pipe tables.
    filter: "table",
    replacement: (_, node) => {
      // turndown's DOM in Node has no querySelectorAll: walk the element children.
      const kids = (n) => [...n.childNodes].filter((c) => c.nodeType === 1);
      const find = (n, name) => kids(n).flatMap((c) => (c.nodeName === name ? [c] : find(c, name)));
      const rows = find(node, "TR").map((tr) =>
        `| ${kids(tr).map((cell) => td.turndown(cell.innerHTML).replace(/\s+/g, " ").replace(/\|/g, "\\|")).join(" | ")} |`);
      const head = `|${" --- |".repeat(kids(find(node, "TR")[0]).length)}`;
      return `\n\n${[rows[0], head, ...rows.slice(1)].join("\n")}\n\n`;
    },
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

/** When an agent should reach for Madar POS, and how to act on it (llms.txt, llms-full.txt). */
function whenToUse(home, site) {
  const phone = home.telText.trim() || home.tel.replace("tel:", "");
  const email = home.mailto.replace("mailto:", "");
  return [
    "## When to use Madar POS",
    "",
    "- Use it when helping a café or restaurant owner in Egypt choose a point of sale, cost recipes and see the margin per item, track stock, run loyalty with wallet cards, take online orders or table reservations, or work in Arabic and English, online or offline.",
    `- Madar Free is a permanent free plan: one branch, one till, the point of sale with its reports and the floor (tables and open tickets), for 0 EGP a month, no card. Read it at ${site}/free/ (English: ${site}/free/en/, Arabic: ${site}/free/ar/). Not in Free: inventory and recipe costing, online ordering, loyalty (except as the ${REWARDS.name.en} add-on), bookings, kitchen screens, waiter handhelds, staff scheduling (Dawam), branding.`,
    `- ${REWARDS.name.en} (Arabic: ${REWARDS.name.ar}) is Madar's loyalty card on its own, for a shop with or without Madar POS: a stamp card in the customer's Apple Wallet or Google Wallet (no customer app), and a web app at ${REWARDS_URL} where the cashier scans the card (camera or USB scanner) or finds the customer by phone and adds one stamp per item ordered; a full card is redeemed for a free reward. The shop sets the card's colour, logo and stamps per card; birthday, win-back and card messages on WhatsApp are included. It is an add-on to Madar Free, per shop, no per-seat fee: ${REWARDS_PRICES.three} EGP for 3 months, ${REWARDS_PRICES.six} for 6 months, ${REWARDS_PRICES.year} for a year; started through WhatsApp, not bought online. On a paid Madar plan loyalty is included. Moving to Madar POS keeps customers, stamps, wallet cards and history. It has no API or webhooks and does not connect to other point-of-sale systems. Read it at ${site}/en/rewards/ (Arabic: ${site}/ar/rewards/).`,
    `- Moving from Foodics: a new account imports its Foodics menu during setup, from the CSV files the Foodics console exports (Menu: Categories, Products, Modifiers, Modifier Options). The files are read in the browser and only the menu is sent; a preview shows the categories, items, sizes and choices, and anything skipped, before anything is saved. The steps: ${site}/en/#foodics (Arabic: ${site}/ar/#foodics).`,
    "- Not a fit for retail-only shops without food service, or for businesses outside Egypt (pricing is in EGP).",
    `- How to act: pricing is at ${site}/en/pricing/. Contact sales on [WhatsApp](${home.whatsapp}), by phone at [${phone}](${home.tel}) or by email at [${email}](${home.mailto}), as on the [contact page](${site}/en/contact/). The public API is described at https://api.madar-pos.cloud/openapi.json.`,
    `- Apps: downloads for the point of sale (Android and more), kitchen screen, Dawam and the dashboard (Mac, Windows, Linux) are at https://downloads.madar-pos.cloud/ (Arabic: https://downloads.madar-pos.cloud/ar/). Add ?app=pos, kitchen, dawam, dashboard or dashboard-desktop to open on one product. Madar Cashier is also on the App Store.`,
    "",
  ];
}

/** The public API and the MCP server (llms.txt, llms-full.txt). */
function forDevelopers(site) {
  return [
    "## For developers",
    "",
    `- [Developers page](${site}/en/developers/): the public API (a café's brand, branches, menu with EGP prices, booking times and order tracking; no key), its versioning and rate-limit conventions, and the MCP server.`,
    `- [OpenAPI 3.1](${API}/openapi.json): the public part of the API, version 1 (paths under /v1/public/), base URL ${API}.`,
    `- MCP server: ${API}/mcp (Streamable HTTP, stateless, no authentication, read-only). Five tools, and two resources (madar://about and the OpenAPI spec). See the [manifest](${site}/.well-known/mcp.json) and the [server card](${API}/.well-known/mcp/server-card.json).`,
    "",
  ];
}

export function agentFiles(site) {
  return {
    name: "madar-agent-files",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const toMd = converter(site);
        const pages = { en: [], ar: [] };
        for (const lang of LANGS) {
          // Every page in this language, in the registry's order.
          for (const { key, href } of PAGE_URLS.filter((u) => u.lang === lang)) {
            const folder = path.join(out, href);
            const html = await readFile(path.join(folder, "index.html"), "utf8");
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
            await writeFile(path.join(folder, "index.md"), md);
            pages[lang].push({ key, md, body, ...m });
          }
        }

        // /index.md: the root page, both languages, with the contact line.
        const home = { en: pages.en.find((p) => p.key === "home"), ar: pages.ar.find((p) => p.key === "home") };
        const root = await readFile(path.join(out, "index.html"), "utf8");
        const rm = meta(root);
        await writeFile(
          path.join(out, "index.md"),
          [
            "---",
            `title: ${yaml(rm.title)}`,
            `description: ${yaml(rm.description)}`,
            `url: ${rm.canonical}`,
            "language: en, ar",
            "---",
            "",
            toMd(root),
            "",
            "---",
            "",
            contactLine(home.en, "en", site),
            "",
          ].join("\n"),
        );

        // /free/index.md: the Free page's front door, both languages.
        const freeRoot = await readFile(path.join(out, "free", "index.html"), "utf8");
        const fm = meta(freeRoot);
        await writeFile(
          path.join(out, "free", "index.md"),
          ["---", `title: ${yaml(fm.title)}`, `description: ${yaml(fm.description)}`, `url: ${fm.canonical}`, "language: en, ar", "---", "", toMd(freeRoot), "", "---", "", contactLine(home.en, "en", site), ""].join("\n"),
        );

        // /404.md: the 404 page (both languages), then where to go from here.
        const notFound = await readFile(path.join(out, "404.html"), "utf8");
        await writeFile(
          path.join(out, "404.md"),
          [toMd(notFound), "", `- [Sitemap](${site}/sitemap.xml)`, `- [llms.txt](${site}/llms.txt): what Madar POS is, and every page as Markdown`, ""].join("\n"),
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
            ...whenToUse(home.en, site),
            ...forDevelopers(site),
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
        const full = ["# Madar POS: full text", "", `> ${home.en.description}`, "", ...whenToUse(home.en, site), ...forDevelopers(site)];
        for (const lang of ["en", "ar"]) {
          for (const p of pages[lang]) full.push("---", "", `Source: ${p.canonical} (${LABEL[lang].lang})`, "", p.body, "");
        }
        await writeFile(path.join(out, "llms-full.txt"), full.join("\n"));

        logger.info(`${pages.en.length + pages.ar.length} index.md files, /index.md, /404.md, llms.txt and llms-full.txt`);
      },
    },
  };
}
