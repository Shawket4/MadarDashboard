import { afterEach, describe, expect, it, vi } from "vitest";

import { detectWallet } from "./detect-wallet";

/** Point `navigator` at a given UA + touch profile for one assertion. */
function as(userAgent: string, maxTouchPoints = 0) {
  vi.stubGlobal("navigator", { userAgent, maxTouchPoints });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectWallet", () => {
  it("sends iPhones and iPads to Apple", () => {
    as(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    );
    expect(detectWallet()).toBe("apple");
  });

  it("sees through iPadOS pretending to be a Mac", () => {
    // Since iPadOS 13, Safari reports Macintosh. Touch points are the only
    // give-away — without this check every iPad is misread as a desktop.
    as(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      5,
    );
    expect(detectWallet()).toBe("apple");
  });

  it("still treats a real Mac as Apple", () => {
    // A Mac adds the pass and iCloud carries it to the customer's iPhone, so
    // this is a real target rather than a fallback.
    as(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      0,
    );
    expect(detectWallet()).toBe("apple");
  });

  it("sends Android to Google", () => {
    as(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
      5,
    );
    expect(detectWallet()).toBe("google");
  });

  it("is not fooled by an Android UA that mentions Mac OS X", () => {
    // Some Android webviews carry "like Mac OS X" in the token soup. Checking
    // Android FIRST is what keeps this right.
    as(
      "Mozilla/5.0 (Linux; U; Android 12; like Mac OS X) AppleWebKit/537.36 Mobile Safari/537.36",
      5,
    );
    expect(detectWallet()).toBe("google");
  });

  it("guesses nothing on Windows or Linux desktops", () => {
    // Neither has a wallet, so the caller shows both — a desktop visitor is
    // usually about to send the link to their phone.
    as("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36");
    expect(detectWallet()).toBeNull();
    as("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36");
    expect(detectWallet()).toBeNull();
  });

  it("does not throw where there is no navigator at all", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => detectWallet()).not.toThrow();
  });
});
