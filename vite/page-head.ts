import type { Plugin } from "vite";

/**
 * What the dashboard's `<head>` says about the page, per build.
 *
 * `index.html` is built twice — the dashboard on madar-pos.cloud, and the same
 * app with `VITE_DEMO=1` as the public demo on demo.madar-pos.cloud — and its
 * title, description, canonical and `og:url` have to name the host each copy is
 * served from. The HTML carries `%VITE_PAGE_TITLE%`, `%VITE_PAGE_DESCRIPTION%`
 * and `%VITE_PAGE_URL%`; these are the values when the environment does not set
 * them, chosen by the `VITE_DEMO` flag the demo build already passes. An
 * explicit `VITE_PAGE_*` in the environment (or an `.env` file) still wins.
 *
 * The customer bundles (loyalty, order, reservations) have plain HTML heads.
 * Those served on more than one host leave out the page's own address: see
 * `withoutOwnAddress`.
 */
export interface PageHead {
  VITE_PAGE_TITLE: string;
  VITE_PAGE_DESCRIPTION: string;
  VITE_PAGE_URL: string;
}

export const DASHBOARD_HEAD: PageHead = {
  VITE_PAGE_TITLE: "Madar POS — sign in | مدار",
  VITE_PAGE_DESCRIPTION:
    "Sign in to the Madar POS dashboard to run your restaurant or café: menus and prices, branches, staff, inventory, orders and sales reports.",
  VITE_PAGE_URL: "https://madar-pos.cloud/",
};

export const DEMO_HEAD: PageHead = {
  VITE_PAGE_TITLE: "Madar POS — Live demo",
  VITE_PAGE_DESCRIPTION:
    "Explore the Madar POS dashboard in a live demo with sample data: menus, orders, inventory, staff and reports. No sign-up; changes reset on their own.",
  VITE_PAGE_URL: "https://demo.madar-pos.cloud/",
};

type Env = Record<string, string | undefined>;

export const isDemo = (env: Env) => env.VITE_DEMO === "1" || env.VITE_DEMO === "true";

/** Safe inside element text and inside a double-quoted attribute. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Fill the `%VITE_PAGE_*%` placeholders. An unknown placeholder is left as it
 * is, so Vite's own env replacement still reports it as undefined.
 */
export function fillPageHead(html: string, env: Env): string {
  const defaults: Record<string, string> = { ...(isDemo(env) ? DEMO_HEAD : DASHBOARD_HEAD) };
  return html.replace(/%(VITE_PAGE_[A-Z_]+)%/g, (whole, key: string) => {
    const value = env[key] ?? defaults[key];
    return value === undefined ? whole : escapeHtml(value);
  });
}

/** The tags that claim one address for the page. */
const OWN_ADDRESS = /\n?[ \t]*<link rel="canonical"[^>]*>|\n?[ \t]*<meta property="og:url"[^>]*>/g;

/**
 * The entry without `canonical` and `og:url`. An entry served from more than
 * one host must not name one of them as every page's address: the shop builds
 * (`MADAR_MOUNT`) and the loyalty bundle are also the pages of every shop's
 * own host, where the backend's tenant shell writes that shop's canonical. When
 * it cannot (nginx falls back to the file itself), no canonical is right and
 * one naming order.madar-pos.cloud would hand the shop's page to that host.
 */
export function withoutOwnAddress(html: string): string {
  return html.replace(OWN_ADDRESS, "");
}

/** For a build mounted under a shop's host (`MADAR_MOUNT` set): see `withoutOwnAddress`. */
export function shopEntry(mount: string): Plugin {
  return {
    name: "madar-shop-entry",
    transformIndexHtml: { order: "pre", handler: (html) => (mount === "/" ? html : withoutOwnAddress(html)) },
  };
}

export function pageHead(): Plugin {
  let env: Env = {};
  return {
    name: "madar-page-head",
    configResolved(config) {
      // Vite's resolved env: the `.env` files plus every `VITE_*` in the
      // process environment, which is where `VITE_DEMO=1` arrives.
      env = config.env as Env;
    },
    // "pre": before Vite's own `%VITE_*%` replacement, which would otherwise
    // leave the placeholders in place and warn that they are undefined.
    transformIndexHtml: { order: "pre", handler: (html) => fillPageHead(html, env) },
  };
}
