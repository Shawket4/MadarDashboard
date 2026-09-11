/**
 * A shop's own web addresses, on the branding tier.
 *
 * Once `custom_branding` is on, a shop stops being a path on one of our hosts
 * and becomes a hostname: `drops.madar-pos.cloud`. Nothing in the dashboard
 * said so, which meant the person who owns the shop had no way to learn their
 * own address short of being told it in a chat — and no way to put it on a
 * menu, a receipt footer, or an Instagram bio.
 *
 * The three surfaces are ONE host with three mounts, decided at build time by
 * `MADAR_MOUNT` (see `vite.order.config.ts` / `vite.reservations.config.ts`):
 * the root is the loyalty card, `/order` is the menu, `/book` is bookings.
 * Keep this in step with those, or the dashboard will hand people a 404.
 */

/** Where a shop's `/order` and `/book` bundles are mounted on its own host. */
export const ORDER_MOUNT = "/order";
export const BOOK_MOUNT = "/book";

/**
 * The domain shops are given subdomains of.
 *
 * Taken from the API's origin rather than hard-coded, because staging and
 * production differ and a hard-coded host would quietly print the wrong
 * address in one of them. `api.madar-pos.cloud` → `madar-pos.cloud`. Falls
 * back to the dashboard's own hostname the same way, so a preview deploy
 * describes itself correctly too.
 */
export function publicRootDomain(apiUrl?: string, fallbackHost?: string): string | null {
  const host = (() => {
    try {
      if (apiUrl) return new URL(apiUrl).hostname;
    } catch {
      /* a malformed VITE_API_URL should not take the page down */
    }
    return fallbackHost ?? "";
  })();

  const labels = host.split(".").filter(Boolean);
  // Local development has no subdomain to give anyone.
  if (labels.length < 3) return null;
  if (labels.every((l) => /^\d+$/.test(l))) return null;
  return labels.slice(1).join(".");
}

export type ShopAddress = { key: "card" | "order" | "book"; url: string };

/**
 * The addresses to show a shop, or `[]` when there is no subdomain to show —
 * which is every shop off the branding tier, and every local dev session.
 *
 * Always `https`: these are meant to be copied onto printed things, and a
 * scheme-less or `http` address copied onto a menu outlives the person who
 * printed it.
 *
 * And always a TRAILING SLASH on the two mounts. `/order` and `/order/` are
 * different URLs to nginx: the mount is `location /order/`, deliberately, so
 * that `/orderfoo` cannot match it — which means `/order` falls through to the
 * loyalty app at the root and the shop is shown a page that is not its menu.
 * This card is the address a shop copies onto a menu or a window, so it has to
 * be the one that resolves, and it matches what the QR codes already encode.
 */
export function shopAddresses(slug?: string | null, root?: string | null): ShopAddress[] {
  if (!slug || !root) return [];
  const origin = `https://${slug}.${root}`;
  return [
    { key: "card", url: `${origin}/` },
    { key: "order", url: `${origin}${ORDER_MOUNT}/` },
    { key: "book", url: `${origin}${BOOK_MOUNT}/` },
  ];
}
