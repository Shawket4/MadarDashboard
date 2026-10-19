/**
 * The Meta Pixel, loaded from Meta's own file instead of the inline snippet (the CSP
 * forbids inline scripts). The landing (site/src/scripts/meta-pixel.ts) and the
 * dashboard's /signup (src/lib/meta-pixel.ts) call it; each decides first whether
 * it runs at all. Automatic event setup is off (it reads buttons and page text) and
 * so is the history hook (a SPA's later routes must not count as page views).
 */
export type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

type PixelWindow = { fbq?: Fbq; _fbq?: Fbq };

export const PIXEL_SRC = "https://connect.facebook.net/en_US/fbevents.js";

/** The page's `fbq`, made, loaded and initialised with `id` on the first call. */
export function metaPixel(id: string): Fbq {
  const w = window as unknown as PixelWindow;
  if (w.fbq) return w.fbq;
  // Meta's stub: calls queue until fbevents.js arrives and takes them over.
  const q = ((...args: unknown[]) => {
    if (q.callMethod) q.callMethod(...args);
    else q.queue.push(args);
  }) as Fbq;
  Object.assign(q, { queue: [], loaded: true, version: "2.0", disablePushState: true });
  q.push = q;
  w.fbq = w._fbq = q;
  const s = document.createElement("script");
  s.async = true;
  s.src = PIXEL_SRC;
  document.head.appendChild(s);
  q("set", "autoConfig", false, id);
  q("init", id);
  return q;
}

/**
 * The CompleteRegistration event's id, the same on both sides: the server knows
 * the org it made, so a later Conversions API event for the signup can send this
 * id and Meta counts the two as one.
 */
export const signupEventId = (orgId: string): string => `signup-${orgId}`;
