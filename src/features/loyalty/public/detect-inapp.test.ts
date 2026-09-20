import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  browserEscapeUrl,
  chromeEscapeUrl,
  detectInAppBrowser,
  escapeToBrowserOnce,
} from "./detect-inapp";

const IG_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 Instagram 330.0.0.40.92 Android";
const IG_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92";
const URL_WITH_QUERY =
  "https://loyalty.madar-pos.cloud/join/org/abc?utm_source=ig&utm_medium=bio&fbclid=XyZ123";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectInAppBrowser", () => {
  it("tells Instagram on Android apart from Instagram on iOS", () => {
    vi.stubGlobal("navigator", { userAgent: IG_ANDROID, maxTouchPoints: 5 });
    expect(detectInAppBrowser()).toEqual({ app: "Instagram", ios: false, android: true });
    vi.stubGlobal("navigator", { userAgent: IG_IOS, maxTouchPoints: 5 });
    expect(detectInAppBrowser()).toEqual({ app: "Instagram", ios: true, android: false });
  });
});

describe("escape URLs", () => {
  it("keeps the query string on both the intent and its fallback", () => {
    const url = browserEscapeUrl(URL_WITH_QUERY);
    expect(url.startsWith("intent://loyalty.madar-pos.cloud/join/org/abc?utm_source=ig")).toBe(true);
    expect(url).toContain(`S.browser_fallback_url=${encodeURIComponent(URL_WITH_QUERY)}`);
    expect(url.endsWith(";end")).toBe(true);
  });

  it("names no package for the page-level escape, and Chrome for the wallet one", () => {
    expect(browserEscapeUrl(URL_WITH_QUERY)).not.toContain("package=");
    expect(chromeEscapeUrl(URL_WITH_QUERY)).toContain("package=com.android.chrome;");
  });
});

describe("escapeToBrowserOnce", () => {
  const replace = vi.fn();
  const store = new Map<string, string>();

  beforeEach(() => {
    replace.mockReset();
    store.clear();
    vi.stubGlobal("window", {
      location: { href: URL_WITH_QUERY, replace },
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    });
  });

  it("redirects the first time, with the full URL, and never again in the same tab", () => {
    expect(escapeToBrowserOnce()).toBe(true);
    expect(replace).toHaveBeenCalledWith(browserEscapeUrl(URL_WITH_QUERY));
    // The bounced-back reload: same tab, same storage.
    expect(escapeToBrowserOnce()).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("does not redirect at all when storage is unavailable", () => {
    vi.stubGlobal("window", {
      location: { href: URL_WITH_QUERY, replace },
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(escapeToBrowserOnce()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
