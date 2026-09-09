/**
 * Whose shop this page belongs to, for every public guest surface.
 *
 * `GET /public/orgs/brand` is unauthenticated and — this is the load-bearing
 * part — the branding TIER IS ALREADY APPLIED SERVER-SIDE. A shop off the tier
 * is handed Madar's own palette under its own name, so nothing on this side
 * decides who gets colours; `custom_branding` comes back only so the shell can
 * choose how loudly Madar signs the footer.
 *
 * It lives in `public-shell` because ordering, reservations and loyalty are
 * separately built, separately deployed bundles that may not import each other,
 * and all three need the same answer in the same shape.
 */
import { useMemo } from "react";

import { usePublicOrgBrand } from "@/data/api/generated/api";

import type { ShellBrand } from "./storefront-shell";

/**
 * Hostnames that are ours, not a shop's.
 *
 * The endpoint takes the first label of the hostname as a slug — `rue` for
 * `rue.madar-pos.cloud` — which is how a page that knows no org id (the manage
 * link, a landing) can still find its shop. On our own generic origins that
 * label is not a shop, and asking would be a guaranteed 404 on first paint.
 */
const GENERIC_HOSTS = new Set([
  "order",
  "orders",
  "reservations",
  "loyalty",
  "track",
  "get",
  "app",
  "dashboard",
  "www",
  "localhost",
  "127",
]);

/**
 * The shop slug this page is being served under, or null when the host is one
 * of ours (or a bare hostname with no subdomain at all).
 */
export function hostSlug(hostname: string): string | null {
  const labels = hostname.split(".");
  // "madar-pos.cloud" or "localhost": no subdomain, so no shop.
  if (labels.length < 3) return null;
  const first = labels[0]!.toLowerCase();
  if (!first || GENERIC_HOSTS.has(first)) return null;
  // An IPv4 address is not a slug.
  if (/^\d+$/.test(first)) return null;
  return first;
}

/**
 * The shop behind this page, or `null` while it is unknown.
 *
 * Pass the org id when the route already carries one. When it does not — the
 * booking manage link, say, which is keyed only by its own token — the shop is
 * looked up by the hostname's first label instead, and a page on one of our own
 * generic origins simply stays unbranded rather than firing a doomed request.
 */
export function usePublicBrand(orgId?: string | null): ShellBrand | null {
  const slug =
    orgId ? null : hostSlug(typeof window === "undefined" ? "" : window.location.hostname);
  const params = orgId ? { org_id: orgId } : slug ? { slug } : undefined;

  const q = usePublicOrgBrand(params, {
    query: {
      enabled: !!params,
      // A shop's name and colours change about as often as its signage, and a
      // guest who reloads mid-order should not pay for the round trip again.
      staleTime: 5 * 60_000,
      // Nothing on the page depends on this: a miss means Madar's chrome, which
      // is a finished page and not an error state worth retrying into.
      retry: false,
    },
  });

  const brand = q.data;
  return useMemo(
    () =>
      brand
        ? {
            orgName: brand.name,
            logoUrl: brand.logo_url?.trim() || null,
            background: brand.background_color,
            ownBranding: brand.custom_branding,
          }
        : null,
    [brand],
  );
}
