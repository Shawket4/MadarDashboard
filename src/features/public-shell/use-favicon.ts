/**
 * A shop's own logo in the browser tab.
 *
 * On a per-shop subdomain the page belongs to the shop, not to Madar, and the
 * one place that still said otherwise was the favicon: `rue.madar-pos.cloud`
 * showed Madar's mark in the tab, in the bookmark, and on the home screen of
 * anyone who saved it.
 *
 * The image is rendered SERVER-SIDE rather than by pointing the tag at the raw
 * upload. A favicon is a square drawn on a background the browser chooses, and
 * the uploads are neither square nor opaque: a wide wordmark scaled into 32px
 * by the browser becomes a smear, a mark on transparency disappears against a
 * dark tab strip, and a cropped square eats the ends off the shop's name. The
 * endpoint fits the artwork whole onto the shop's own ground — the same
 * treatment the wallet pass icon gets, for the same reason.
 *
 * A shop with no logo 404s, and the page simply keeps the icon it shipped
 * with. That is the honest fallback: there is no logo to show.
 */
import { useEffect } from "react";

import { env } from "@/data/config/env";

/** The tags a browser actually reads, and the size each wants. */
const ICONS: { rel: string; size: number }[] = [
  { rel: "icon", size: 180 },
  { rel: "apple-touch-icon", size: 180 },
];

/**
 * Point this page's icon at [params]'s shop.
 *
 * Pass the org id when the page knows it, or the hostname slug when it does
 * not — the same two ways of naming a shop the brand endpoint takes. Given
 * neither, the icon is left alone, which is what every page on one of our own
 * generic hosts should get.
 *
 * Deliberately NOT reverted on unmount. These bundles are one page for the
 * life of a visit, and restoring Madar's mark as a customer navigates within
 * a shop's own site would be the bug, not the cleanup.
 */
export function useShopFavicon(params: { orgId?: string | null; slug?: string | null }): void {
  const orgId = params.orgId ?? null;
  const slug = orgId ? null : (params.slug ?? null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!orgId && !slug) return;

    let base: URL;
    try {
      base = new URL(`${env.VITE_API_URL}/public/orgs/favicon`);
    } catch {
      // A malformed API URL should not take the page down over an icon.
      return;
    }
    if (orgId) base.searchParams.set("org_id", orgId);
    else if (slug) base.searchParams.set("slug", slug);

    for (const { rel, size } of ICONS) {
      const url = new URL(base);
      url.searchParams.set("size", String(size));
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.type = "image/png";
      link.href = url.toString();
    }
  }, [orgId, slug]);
}
