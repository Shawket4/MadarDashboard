// Guards the Arabic locale against the one failure that keeps recurring: an
// Arabic user reading English.
//
// Every `t()` in this app may carry a `defaultValue` — English prose written
// inline at the call site. That is a good habit (a missing key renders
// something readable rather than a raw key), but it hides the bug it papers
// over: if Arabic has no entry, the inline English is what an Arabic user
// sees, silently, with no missing-key warning anywhere.
//
// Plurals make it worse, because "has an Arabic entry" is not one question.
// Arabic has SIX plural categories (zero/one/two/few/many/other) against
// English's two, so a key translated as `foo_one` + `foo_other` is fully
// translated in English and broken in Arabic for 0, 2, 3–10 and 11–99 — which
// between them cover almost every real cart, list and export. That is exactly
// how the ordering page came to show "3 items" in an otherwise Arabic UI.
//
// So this asks i18next itself, at the counts where the categories differ,
// rather than comparing key sets: the resolver's fallback chain is the thing
// that decides what a person reads.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import i18next, { type i18n as I18n } from "i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

const SRC = join(process.cwd(), "src");

/** One count per Arabic plural category, plus a large "many". */
const COUNTS = [0, 1, 2, 3, 11, 100];

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // Generated clients and mock fixtures carry no UI strings.
      if (e.name === "generated" || e.name === "node_modules") continue;
      sourceFiles(p, out);
    } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Every `t("key", {...})` in a file, with its argument text.
 *
 * Scans with a balanced-delimiter walk rather than a regex: a regex stops at
 * the first `)` and happily pairs one call's key with a later call's
 * `defaultValue`, which invents failures and hides real ones.
 */
function translationCalls(src: string): { key: string; args: string }[] {
  const out: { key: string; args: string }[] = [];
  const re = /\bt\(\s*"([\w.]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = src.indexOf("(", m.index);
    let depth = 0;
    let j = i;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") {
        depth--;
        if (depth === 0) break;
      } else if (c === '"' || c === "'" || c === "`") {
        const quote = c;
        j++;
        while (j < src.length && src[j] !== quote) {
          if (src[j] === "\\") j++;
          j++;
        }
      }
    }
    out.push({ key: m[1], args: src.slice(i, j + 1) });
  }
  return out;
}

/** A sentinel no locale file contains, so a fallback is unmistakable. */
const SENTINEL = "@@UNTRANSLATED@@";

describe("arabic locale coverage", () => {
  let arabic: I18n;

  beforeAll(async () => {
    arabic = i18next.createInstance();
    await arabic.init({
      resources: { en: { translation: en }, ar: { translation: ar } },
      lng: "ar",
      fallbackLng: "en",
      returnNull: false,
      interpolation: { escapeValue: false },
    });
  });

  it("resolves every key used with an inline English default", () => {
    const calls = sourceFiles(SRC).flatMap((f) =>
      translationCalls(readFileSync(f, "utf8"))
        .filter((c) => c.args.includes("defaultValue:"))
        .map((c) => ({ ...c, file: f.slice(SRC.length + 1) })),
    );
    // If this ever hits zero the scanner has broken, and a green test would be
    // meaningless.
    expect(calls.length).toBeGreaterThan(50);

    const gaps: string[] = [];
    for (const { key, args, file } of calls) {
      const counted = args.includes("count:");
      for (const count of counted ? COUNTS : [undefined]) {
        const opts: Record<string, unknown> = { defaultValue: SENTINEL };
        if (count !== undefined) opts.count = count;
        const got = String(arabic.t(key, opts));
        if (got === SENTINEL) {
          gaps.push(`${key}${count !== undefined ? ` (count=${count})` : ""} — no ar entry · ${file}`);
        }
      }
    }
    expect(gaps, `Arabic users would read English here:\n  ${gaps.join("\n  ")}`).toEqual([]);
  });

  it("gives Arabic a distinct form for each plural category it needs", () => {
    // A key with only `_one` + `_other` resolves for every count — via the
    // English-shaped fallback — while saying "one row" about a hundred of
    // them. Wrong is worse than untranslated, and no key-set diff catches it,
    // so compare the rendered strings: 1, 3 and 100 must not read alike.
    const plurals = new Set<string>();
    for (const f of sourceFiles(SRC)) {
      for (const c of translationCalls(readFileSync(f, "utf8"))) {
        if (c.args.includes("count:")) plurals.add(c.key);
      }
    }
    const wrong: string[] = [];
    for (const key of plurals) {
      const render = (count: number) => String(arabic.t(key, { count, defaultValue: SENTINEL }));
      const one = render(1);
      if (one === SENTINEL) continue; // covered by the test above
      // Only flag keys that interpolate the count: a bare noun ("items") is
      // allowed to repeat, a sentence carrying the number is not.
      const other = render(100);
      if (!other.includes("100")) continue;
      if (render(3) === one || render(11) === one) {
        wrong.push(`${key} — reads as the singular for 3 or 11: "${one}"`);
      }
    }
    expect(wrong, `Arabic plural forms are wrong here:\n  ${wrong.join("\n  ")}`).toEqual([]);
  });
});

// ── AT-13: a key used in code must exist in BOTH locales ──────────────────
//
// The test above only asks about calls that carry `{ defaultValue }`. A
// `t("key", "English")` whose key is in neither file renders the English
// fallback in Arabic and passes everything (the Attendance export headers
// did exactly that). Here every literal key used in the Dawam pages and the
// shell they sit in must be in en.json AND ar.json; the rest of the app is
// held to a ratchet so the count of gaps can only fall.

function flatKeys(tree: Record<string, unknown>, prefix = "", out = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(tree)) {
    if (v && typeof v === "object") flatKeys(v as Record<string, unknown>, `${prefix}${k}.`, out);
    else out.add(`${prefix}${k}`);
  }
  return out;
}

const EN_KEYS = flatKeys(en as Record<string, unknown>);
const AR_KEYS = flatKeys(ar as Record<string, unknown>);
const inLocale = (keys: Set<string>, key: string) =>
  keys.has(key) || ["one", "other", "zero"].some((s) => keys.has(`${key}_${s}`));

/** Dawam's pages and the shell every page sits in: no gaps allowed. */
const STRICT = [
  "features/dawam/",
  "features/staff/",
  "features/settings/",
  "features/reports/legal/",
  "components/app/",
  "components/layout/",
  // The footer under every page (E2E: "Terms of Service" in the Arabic dashboard).
  "components/legal-links.tsx",
  "config/",
  "hooks/",
  "routes/_app/staff",
];

/** Gaps elsewhere in the app when this gate landed (POS pages, landing). */
const RATCHET = 111;

function literalKeys(src: string): string[] {
  const keys: string[] = [];
  const re = /\bt\(\s*["']([\w.-]+)["']|\b(?:labelKey|descKey|i18nKey)[=:]\s*["']([\w.-]+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const key = m[1] ?? m[2];
    if (key.includes(".")) keys.push(key);
  }
  return keys;
}

describe("every key used in code is in English and Arabic (AT-13)", () => {
  const files = sourceFiles(SRC).map((f) => ({ file: f.slice(SRC.length + 1), src: readFileSync(f, "utf8") }));
  const strict = (file: string) => STRICT.some((p) => file.startsWith(p));

  const gaps = (only: (file: string) => boolean) =>
    files.filter(({ file }) => only(file)).flatMap(({ file, src }) =>
      literalKeys(src).flatMap((key) => [
        ...(inLocale(EN_KEYS, key) ? [] : [`${key} — no en · ${file}`]),
        ...(inLocale(AR_KEYS, key) ? [] : [`${key} — no ar · ${file}`]),
      ]),
    );

  it("the scanner reads the Dawam pages", () => {
    const dawam = files.filter(({ file }) => file.startsWith("features/dawam/"));
    expect(dawam.length).toBeGreaterThan(10);
    expect(dawam.flatMap(({ src }) => literalKeys(src)).length).toBeGreaterThan(300);
  });

  it("the Dawam pages and the shell have no missing key", () => {
    const missing = [...new Set(gaps(strict))];
    expect(missing, `add these to en.json and ar.json:\n  ${missing.join("\n  ")}`).toEqual([]);
  });

  it("the rest of the app has no more gaps than before (ratchet)", () => {
    const missing = gaps((f) => !strict(f));
    expect(missing.length, `new gaps:\n  ${missing.join("\n  ")}`).toBeLessThanOrEqual(RATCHET);
  });

  it("a key built at run time (`dawam.pay_${m}`) has its family in both files", () => {
    const missing: string[] = [];
    for (const { file, src } of files.filter(({ file }) => strict(file))) {
      for (const m of src.matchAll(/\bt\(\s*`([\w.-]+)\$\{/g)) {
        const prefix = m[1];
        const has = (keys: Set<string>) => [...keys].some((k) => k.startsWith(prefix));
        if (!has(EN_KEYS) || !has(AR_KEYS)) missing.push(`${prefix}… · ${file}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("one Dawam key means one sentence (no key reused with two different defaults)", () => {
    const defaults = new Map<string, Set<string>>();
    for (const { file, src } of files.filter(({ file }) => strict(file))) {
      for (const m of src.matchAll(/\bt\(\s*"((?:dawam|staff)\.[\w.-]+)"\s*,\s*"((?:[^"\\]|\\.)*)"/g)) {
        (defaults.get(m[1]) ?? defaults.set(m[1], new Set()).get(m[1])!).add(m[2]);
        void file;
      }
    }
    const reused = [...defaults].filter(([, d]) => d.size > 1).map(([k, d]) => `${k}: ${[...d].join(" | ")}`);
    expect(reused, reused.join("\n")).toEqual([]);
  });
});
