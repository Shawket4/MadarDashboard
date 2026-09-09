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
