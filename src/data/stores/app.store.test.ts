/**
 * The dashboard's language survives a sign-in and a reload.
 *
 * E2E bug (2026-09-23): the app store started at a hard-coded "en" and
 * persisted it on the first write after sign-in (choosing the org). On the
 * next load its rehydration switched i18next to that "en", overruling the
 * language the browser asked for (or the one stored in `madar.lang`): an
 * Arabic browser got an English dashboard after one reload.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("app store language", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("starts from the detected language and persists it, not a hard-coded English", async () => {
    localStorage.setItem("madar.lang", "ar");
    const { useAppStore } = await import("./app.store");
    expect(useAppStore.getState().language).toBe("ar");
    useAppStore.getState().setSelectedOrg("org-1");
    expect(JSON.parse(localStorage.getItem("madar.app")!).state.language).toBe("ar");
  });

  it("follows a language changed straight through i18next", async () => {
    const { useAppStore } = await import("./app.store");
    const i18n = (await import("@/i18n")).default;
    await i18n.changeLanguage("ar");
    expect(useAppStore.getState().language).toBe("ar");
    await i18n.changeLanguage("en");
    expect(useAppStore.getState().language).toBe("en");
  });
});
