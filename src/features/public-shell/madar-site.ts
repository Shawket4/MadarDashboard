import { hostSlug } from "./use-brand";

/** Where the signature leads: Madar POS's own site. */
export const MADAR_SITE_URL = "https://get.madar-pos.cloud/";

/**
 * The signature's address: the site in the page's language (straight to
 * `/en/` or `/ar/`, not the root's language picker), tagged so the site's
 * analytics can tell which shop and which product sent the visitor. The shop
 * is the host's slug; on one of our own hosts it is that host's name
 * (`order`, `loyalty`, ...), and the signed-in dashboard passes its own.
 */
export function madarSiteHref(lang: string, source: string, campaign: string): string {
  const url = new URL(lang.startsWith("ar") ? "ar/" : "en/", MADAR_SITE_URL);
  url.searchParams.set("utm_source", source || "madar");
  url.searchParams.set("utm_medium", "powered_by");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

/** The `utm_source` for a public page on `hostname`. */
export function signatureSource(hostname: string): string {
  return hostSlug(hostname) ?? hostname.split(".")[0] ?? "";
}
