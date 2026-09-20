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
 * `S.browser_fallback_url` hands the link to Chrome, session and all. iOS has
 * no equivalent, which is why one platform gets a redirect and the other gets
 * a sentence.
 */
export type InAppBrowser = {
  /** The host app, for naming it in the instruction. */
  app: "Instagram" | "Facebook" | "Messenger" | "TikTok" | "in-app browser";
  /** iOS is where this is fatal: a pkpass cannot install from a webview. */
  ios: boolean;
  /** Android has a real escape hatch — see `chromeEscapeUrl`. */
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
 * The same URL, but routed out of the in-app browser into Chrome.
 *
 * Google Wallet's save link is ordinary HTTPS, so it *loads* inside Instagram's
 * webview — and then asks the customer to sign in to Google, because the
 * webview carries none of their Google session. Standing at a counter, that is
 * where the signup ends.
 *
 * `intent://` is Android's supported way out: Chrome opens the URL with the
 * customer's real session, and `S.browser_fallback_url` covers the phone that
 * has no Chrome by loading the original link instead. There is no iOS
 * equivalent — hence the written instruction there.
 */
export function chromeEscapeUrl(httpsUrl: string): string {
  const withoutScheme = httpsUrl.replace(/^https?:\/\//, "");
  const fallback = encodeURIComponent(httpsUrl);
  return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}
