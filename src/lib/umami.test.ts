import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  document.head.querySelectorAll("script").forEach((s) => s.remove());
  delete window.umami;
});

const umamiScripts = () => document.head.querySelectorAll<HTMLScriptElement>('script[src="https://cloud.umami.is/script.js"]');

describe("umami on the signup page", () => {
  it("loads nothing without a website id", async () => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "");
    const { track } = await import("./umami");
    track();
    expect(umamiScripts()).toHaveLength(0);
  });

  it("loads the script once, manual only and production only, then sends what it was given", async () => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "site-1");
    const { track } = await import("./umami");
    track();
    track("signup-done", { template: "cafe" });
    const [s, ...more] = umamiScripts();
    expect(more).toHaveLength(0);
    expect(s.dataset).toMatchObject({ websiteId: "site-1", autoTrack: "false", domains: "madar-pos.cloud" });

    const sent = vi.fn().mockResolvedValue(undefined);
    window.umami = { track: sent };
    s.onload?.(new Event("load"));
    await vi.waitFor(() => expect(sent).toHaveBeenCalledTimes(2));
    expect(sent).toHaveBeenNthCalledWith(1, undefined, undefined);
    expect(sent).toHaveBeenNthCalledWith(2, "signup-done", { template: "cafe" });
  });
});
