import { afterEach, describe, expect, it } from "vitest";

import { metaPixel, PIXEL_SRC, signupEventId } from "./meta-pixel";

afterEach(() => {
  const w = window as unknown as Record<string, unknown>;
  delete w.fbq;
  delete w._fbq;
  document.head.querySelectorAll("script").forEach((s) => s.remove());
});

describe("metaPixel", () => {
  it("loads Meta's file once and queues init, then the page's events, in order", () => {
    const fbq = metaPixel("123");
    fbq("track", "PageView");
    expect(metaPixel("123")).toBe(fbq);
    expect(document.head.querySelectorAll(`script[src="${PIXEL_SRC}"]`)).toHaveLength(1);
    expect(fbq.queue).toEqual([
      ["set", "autoConfig", false, "123"],
      ["init", "123"],
      ["track", "PageView"],
    ]);
    expect(fbq.disablePushState).toBe(true);
  });

  it("names a signup's event after its org, for the server to repeat", () => {
    expect(signupEventId("8f1c")).toBe("signup-8f1c");
  });
});
