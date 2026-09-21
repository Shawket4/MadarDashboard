/**
 * Is this page inside an app's own browser, and does that break the wallet?
 *
 * A `.pkpass` is a FILE the operating system has to claim. Safari hands it to
 * Wallet; an in-app webview — Instagram, Facebook, Messenger, TikTok — cannot,
 * so the customer taps "Add to Apple Wallet" and nothing happens at all. No
 * error, no download, nothing. It is the worst kind of failure: silent, and it
 * looks like the shop's card is broken.
 *
 * There is no way to escape an in-app browser programmatically on iOS. No URL
 * scheme, no redirect, nothing — the only route out is the customer using the
 * host app's own "Open in browser" menu item. So the fix cannot be technical;
 * it has to be an instruction, and the instruction has to be specific enough to
 * follow while standing at a counter.
 *
 * Android is different, but not exempt. Google Wallet's save link is ordinary
 * HTTPS so it LOADS in the webview — and then asks for a Google sign-in,
 * because the webview carries none of the customer's Google session. At a
 * counter that is where the signup ends, so it fails too, just later and more
 * politely.
 *
 * Android does have a real escape though: `intent://` with
 * `S.browser_fallback_url` hands the link to a real browser — the customer's
 * default for the page as a whole, Chrome specifically for the wallet save
 * (that one needs the Google session). iOS has no equivalent, which is why one
 * platform gets a redirect and the other gets a sentence — and Android gets
 * the sentence too, as a fallback, when the redirect does not take.
 */
export type InAppBrowser = {
  /** The host app, for naming it in the instruction. */
  app: "Instagram" | "Facebook" | "Messenger" | "TikTok" | "in-app browser";
  /** iOS is where this is fatal: a pkpass cannot install from a webview. */
  ios: boolean;
  /** Android has a real escape hatch — see `browserEscapeUrl` / `chromeEscapeUrl`. */
  android: boolean;
};

/**
 * The host app's browser, or `null` in a real browser.
 *
 * Sniffing user agents is usually a mistake, but these apps identify themselves
 * deliberately and there is no feature to test for — "can you install a pass"
 * is not detectable until after the tap has already silently failed.
 */
export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;

  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
  const android = /android/i.test(ua);

  // Instagram appends "Instagram" plus its version; Facebook and Messenger use
  // FBAN/FBAV; TikTok uses several, of which these two are the stable ones.
  if (/Instagram/i.test(ua)) return { app: "Instagram", ios, android };
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) {
    return { app: /Messenger/i.test(ua) ? "Messenger" : "Facebook", ios, android };
  }
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) {
    return { app: "TikTok", ios, android };
  }
  return null;
}

/**
 * The `intent://` form of an HTTPS URL: Android's supported way out of an
 * in-app webview.
 *
 * The scheme is kept as `https` and `S.browser_fallback_url` carries the
 * ORIGINAL link, so a phone with nothing to hand the intent to just loads the
 * page it was already on. With `pkg` the intent is addressed to one app; without
 * it the system resolves whatever the customer set as their default browser.
 *
 * The URL is used whole, query string and all — the owner's links carry
 * `utm_*` and `fbclid`, and an escape that dropped them would strip the
 * attribution off every visit that needed escaping.
 */
function intentUrl(httpsUrl: string, pkg?: string): string {
  const withoutScheme = httpsUrl.replace(/^https?:\/\//, "");
  const fallback = encodeURIComponent(httpsUrl);
  const target = pkg ? `package=${pkg};` : "";
  return `intent://${withoutScheme}#Intent;scheme=https;${target}S.browser_fallback_url=${fallback};end`;
}

/**
 * The same URL, but routed out of the in-app browser into Chrome.
 *
 * Google Wallet's save link is ordinary HTTPS, so it *loads* inside Instagram's
 * webview — and then asks the customer to sign in to Google, because the
 * webview carries none of their Google session. Standing at a counter, that is
 * where the signup ends.
 *
 * Chrome specifically, not "a browser": it is the one that carries the
 * customer's Google session, and that session is the whole point. Without
 * Chrome the fallback loads the plain link. There is no iOS equivalent — hence
 * the written instruction there.
 */
export function chromeEscapeUrl(httpsUrl: string): string {
  return intentUrl(httpsUrl, "com.android.chrome");
}

/**
 * The same URL, routed to whatever browser the customer has as their DEFAULT.
 *
 * For the page-level escape the browser's identity does not matter — any real
 * browser can run the sign-up — and forcing Chrome on a Samsung Internet or
 * Firefox user would either bounce or land them somewhere they did not choose.
 * So no `package`: the system resolves it.
 */
export function browserEscapeUrl(httpsUrl: string): string {
  return intentUrl(httpsUrl);
}

/**
 * The per-tab marker that says "this page has already tried to leave".
 *
 * `sessionStorage` rather than a query param: it is scoped to this webview
 * tab, it survives the reload that a bounced intent causes, and it keeps the
 * URL clean — the fallback page displays the URL and offers to copy it, and
 * a `?escaped=1` in there would follow the customer into the real browser and
 * onto whatever they paste. If storage is blocked the redirect is skipped
 * rather than risked: one attempt that can loop is worse than none.
 */
const ESCAPE_ATTEMPTED = "madar.loyalty.escape-attempted";

/**
 * Try, ONCE per tab, to hand the current page to the default browser.
 *
 * Returns `true` when the attempt was made. If the intent is refused the
 * webview either stays put (nothing happens and the caller's fallback page is
 * already showing) or reloads the same URL — on which the marker is set and
 * this returns `false`, so it never redirects twice.
 */
export function escapeToBrowserOnce(): boolean {
  if (typeof window === "undefined") return false;
  let storage: Storage;
  try {
    storage = window.sessionStorage;
    if (storage.getItem(ESCAPE_ATTEMPTED)) return false;
    storage.setItem(ESCAPE_ATTEMPTED, "1");
  } catch {
    return false;
  }
  window.location.replace(browserEscapeUrl(window.location.href));
  return true;
}
