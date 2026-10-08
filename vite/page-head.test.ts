import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { DASHBOARD_HEAD, DEMO_HEAD, fillPageHead } from "./page-head";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://get.madar-pos.cloud/#organization",
  name: "Madar POS",
  alternateName: ["Madar", "مدار"],
  url: "https://get.madar-pos.cloud/",
};

describe("fillPageHead", () => {
  const html = "<title>%VITE_PAGE_TITLE%</title><link href=\"%VITE_PAGE_URL%\">%VITE_PAGE_DESCRIPTION%";

  it("names the dashboard by default", () => {
    expect(fillPageHead(html, {})).toBe(
      `<title>${DASHBOARD_HEAD.VITE_PAGE_TITLE}</title><link href="https://madar-pos.cloud/">${DASHBOARD_HEAD.VITE_PAGE_DESCRIPTION}`,
    );
  });

  it("names the demo when the build says it is the demo", () => {
    for (const flag of ["1", "true"]) {
      expect(fillPageHead(html, { VITE_DEMO: flag })).toBe(
        `<title>Madar POS — Live demo</title><link href="https://demo.madar-pos.cloud/">${DEMO_HEAD.VITE_PAGE_DESCRIPTION}`,
      );
    }
  });

  it("lets the environment override a value, escaped", () => {
    expect(fillPageHead("<title>%VITE_PAGE_TITLE%</title>", { VITE_PAGE_TITLE: 'A "B" & <C>' })).toBe(
      "<title>A &quot;B&quot; &amp; &lt;C&gt;</title>",
    );
  });

  it("leaves a placeholder it does not know for Vite to report", () => {
    expect(fillPageHead("%VITE_PAGE_NOPE%", {})).toBe("%VITE_PAGE_NOPE%");
  });
});

/**
 * Every HTML entry, as a crawler or a link preview reads it before any script
 * runs. index.html is checked once per build it serves.
 */
const ENTRIES = [
  { name: "dashboard", html: fillPageHead(read("index.html"), {}), url: "https://madar-pos.cloud/", title: "Madar POS — Sign in", shell: false },
  { name: "demo", html: fillPageHead(read("index.html"), { VITE_DEMO: "1" }), url: "https://demo.madar-pos.cloud/", title: "Madar POS — Live demo", shell: false },
  { name: "loyalty", html: read("loyalty.html"), url: "https://loyalty.madar-pos.cloud/", title: "Madar POS — Rewards", shell: true },
  { name: "order", html: read("order.html"), url: "https://order.madar-pos.cloud/", title: "Madar POS — Order", shell: true },
  { name: "reservations", html: read("reservations.html"), url: "https://reservations.madar-pos.cloud/", title: "Madar POS — Reservations", shell: true },
];

describe.each(ENTRIES)("the $name head", ({ html, url, title, shell }) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = (sel: string) => doc.querySelector(sel)?.getAttribute("content");

  it("keeps the document language and direction the app switches at runtime", () => {
    expect(html).toContain('<html lang="en" dir="ltr">');
  });

  it("has no placeholder left", () => {
    expect(html).not.toMatch(/%VITE_/);
  });

  it("says what the page is, and where it lives", () => {
    expect(doc.title).toBe(title);
    expect(meta('meta[property="og:title"]')).toBe(title);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(url);
    expect(meta('meta[property="og:url"]')).toBe(url);
    expect(meta('meta[property="og:type"]')).toBe("website");
    expect(meta('meta[property="og:image"]')).toBe("https://get.madar-pos.cloud/og/en-home.jpg");
    expect(meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  });

  it("describes it in 120 to 155 characters, the same everywhere", () => {
    const description = meta('meta[name="description"]') ?? "";
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(meta('meta[property="og:description"]')).toBe(description);
  });

  it("names Madar POS as one organisation", () => {
    const ld = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? "";
    expect(JSON.parse(ld)).toEqual(ORGANIZATION);
  });

  it("explains itself, with a link, to a reader without JavaScript", () => {
    const noscript = doc.body.querySelector("noscript");
    expect(noscript).not.toBeNull();
    expect(noscript?.innerHTML).toContain('href="https://get.madar-pos.cloud/"');
    // Before the app's root, so it is the first thing in the body.
    const body = html.slice(html.indexOf("<body"));
    expect(body.indexOf("<noscript>")).toBeLessThan(body.indexOf('<div id="root">'));
  });

  // The tenant shell (backend) swaps these blocks per shop: the markers are a
  // contract, and everything a shop overrides has to sit inside them.
  it.runIf(shell)("marks what the tenant shell replaces", () => {
    const block = (name: string) => {
      const m = html.match(new RegExp(`<!-- madar:${name} -->([\\s\\S]*?)<!-- /madar:${name} -->`));
      return m?.[1] ?? null;
    };
    const head = block("head");
    expect(head).not.toBeNull();
    expect(html.match(/<!-- madar:head -->/g)).toHaveLength(1);
    expect(html.indexOf("<!-- /madar:head -->")).toBeLessThan(html.indexOf("</head>"));
    for (const tag of ["<title>", 'name="description"', 'rel="canonical"', 'property="og:', 'name="twitter:', "application/ld+json"]) {
      expect(head, tag).toContain(tag);
    }
    // ...and nothing that names the page sits outside them.
    const outside = html.replace(/<!-- madar:head -->[\s\S]*?<!-- \/madar:head -->/, "");
    expect(outside).not.toMatch(/<title>|name="description"|rel="canonical"|property="og:|name="twitter:|ld\+json/);

    const noscript = block("noscript");
    expect(noscript?.trim()).toMatch(/^<noscript>[\s\S]*<\/noscript>$/);
    expect(html.indexOf("<!-- /madar:noscript -->")).toBeLessThan(html.indexOf('<div id="root">'));
    expect(html.indexOf("<!-- madar:noscript -->")).toBeGreaterThan(html.indexOf("<body"));
  });
});
