import { describe, expect, it, vi } from "vitest";

/** Boot the real i18n module against a given `navigator.languages`. */
async function bootWith(languages: string[]) {
  Object.defineProperty(window.navigator, "languages", { value: languages, configurable: true });
  Object.defineProperty(window.navigator, "language", { value: languages[0], configurable: true });
  localStorage.clear();
  vi.resetModules();
  const { default: i18n, i18nReady } = await import("./index");
  await i18nReady;
  return {
    language: i18n.language,
    resolved: i18n.resolvedLanguage,
    dir: document.documentElement.dir,
    cancel: i18n.t("common.cancel"),
  };
}

describe("what a phone gets", () => {
  /**
   * THE BUG: an English handset was served Arabic.
   *
   * i18next looks for an EXACT member of `supportedLngs` across the whole of
   * `navigator.languages` before it tries stripping regions. `en-GB` is not
   * literally `"en"`, so it was skipped, and the bare `"ar"` in SECOND place
   * matched — an ordinary English phone in Egypt with Arabic added to the
   * language list. The phone's preference order is the entire meaning of that
   * list, and the exactness of a later entry was overruling it.
   */
  it("respects the phone's order, not the exactness of a later entry", async () => {
    const got = await bootWith(["en-GB", "ar"]);
    expect(got.language).toBe("en");
    expect(got.dir).toBe("ltr");
    expect(got.cancel).toBe("Cancel");
  });

  it.each([
    [["en"], "en"],
    [["en-GB"], "en"],
    [["en-US"], "en"],
    [["en-GB", "ar"], "en"],
    [["en-US", "ar-EG"], "en"],
    [["ar"], "ar"],
    [["ar-EG"], "ar"],
    [["ar-EG", "en-US"], "ar"],
    [["ar", "en"], "ar"],
    // Nothing we speak: the fallback, not the first thing in the list.
    [["fr-FR"], "en"],
    [["de", "fr"], "en"],
  ])("%j resolves to %s", async (languages, want) => {
    expect((await bootWith(languages)).language).toBe(want);
  });

  /**
   * The active language must stay EXACTLY `en` or `ar`, never `en-GB`.
   *
   * This is why the fix normalises the navigator's list rather than setting
   * `nonExplicitSupportedLngs`, which would also have fixed the ordering: a
   * dozen places compare `i18n.language === "ar"` exactly, so an `ar-EG` phone
   * would have started rendering left-to-right.
   */
  it("never leaves a region tag on the active language", async () => {
    for (const langs of [["en-GB", "ar"], ["ar-EG"], ["en-US", "ar-EG"]]) {
      const got = await bootWith(langs);
      expect(["en", "ar"], `${JSON.stringify(langs)} -> ${got.language}`).toContain(got.language);
      expect(got.resolved).toBe(got.language);
    }
  });

  it("keeps a returning visitor's choice over the phone's", async () => {
    Object.defineProperty(window.navigator, "languages", { value: ["en-GB"], configurable: true });
    localStorage.clear();
    localStorage.setItem("madar.lang", "ar");
    vi.resetModules();
    const { default: i18n, i18nReady } = await import("./index");
    await i18nReady;
    expect(i18n.language).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });
});

describe("arriving from the marketing site", () => {
  /** The site's sign-up links carry the page's language: /signup?lang=ar. */
  async function bootAt(search: string, languages: string[], stored?: string) {
    window.history.replaceState({}, "", `/signup${search}`);
    Object.defineProperty(window.navigator, "languages", { value: languages, configurable: true });
    Object.defineProperty(window.navigator, "language", { value: languages[0], configurable: true });
    localStorage.clear();
    if (stored) localStorage.setItem("madar.lang", stored);
    vi.resetModules();
    const { default: i18n, i18nReady } = await import("./index");
    await i18nReady;
    const got = { language: i18n.language, dir: document.documentElement.dir, stored: localStorage.getItem("madar.lang") };
    window.history.replaceState({}, "", "/");
    return got;
  }

  it("opens in Arabic from an Arabic page, on an English phone, and remembers it", async () => {
    const got = await bootAt("?lang=ar", ["en-US"]);
    expect(got.language).toBe("ar");
    expect(got.dir).toBe("rtl");
    expect(got.stored).toBe("ar");
  });

  it("the page's language beats an earlier choice", async () => {
    expect((await bootAt("?lang=en", ["ar-EG"], "ar")).language).toBe("en");
  });

  it("ignores a language we don't speak", async () => {
    expect((await bootAt("?lang=fr", ["en-GB"])).language).toBe("en");
    expect((await bootAt("?lang=fr", ["ar-EG"])).language).toBe("ar");
  });
});
