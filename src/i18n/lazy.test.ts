import { afterEach, describe, expect, it, vi } from "vitest";

/** Boot the real module as the browser does: no locales handed in, so they load as chunks. */
async function bootBrowserLike(stored: string) {
  const g = globalThis as { __MADAR_LOCALES__?: unknown };
  saved = g.__MADAR_LOCALES__;
  delete g.__MADAR_LOCALES__;
  localStorage.clear();
  localStorage.setItem("madar.lang", stored);
  vi.resetModules();
  const mod = await import("./index");
  await mod.i18nReady;
  return mod.default;
}
let saved: unknown;
afterEach(() => {
  (globalThis as { __MADAR_LOCALES__?: unknown }).__MADAR_LOCALES__ = saved;
});

describe("locales load lazily", () => {
  it("boots with the active language only", async () => {
    const i18n = await bootBrowserLike("ar");
    expect(i18n.language).toBe("ar");
    expect(i18n.hasResourceBundle("ar", "translation")).toBe(true);
    // An Arabic session needs no English: Arabic carries every key.
    expect(i18n.hasResourceBundle("en", "translation")).toBe(false);
    expect(i18n.t("common.cancel")).not.toBe("common.cancel");
  });

  it("a switch loads the other language before it switches: no frame of raw keys", async () => {
    const i18n = await bootBrowserLike("en");
    expect(i18n.hasResourceBundle("ar", "translation")).toBe(false);
    const seen: string[] = [];
    i18n.on("languageChanged", () => seen.push(i18n.t("common.cancel")));
    await i18n.changeLanguage("ar");
    expect(seen.length).toBeGreaterThan(0);
    for (const text of seen) expect(text).not.toBe("common.cancel");
    expect(i18n.t("common.cancel")).not.toBe("Cancel");
  });
});
