/**
 * Dawam's Arabic words (owner decision 42): "وردية" is a shift, "يوم راحة"
 * a day off, and "إجازة" only ever leave. The dashboard's staff and Dawam
 * copy called a shift "جدول عمل" or "فترة العمل" and a day off "إجازة".
 */
import { describe, expect, it } from "vitest";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

type Tree = { [k: string]: string | Tree };

function pairs(e: Tree, a: Tree, prefix = ""): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (const [k, v] of Object.entries(e)) {
    const key = prefix ? `${prefix}.${k}` : k;
    const av = a?.[k];
    if (typeof v === "string" && typeof av === "string") out.push([key, v, av]);
    else if (typeof v === "object" && av && typeof av === "object") out.push(...pairs(v, av as Tree, key));
  }
  return out;
}

const dawam = pairs(en as unknown as Tree, ar as unknown as Tree).filter(([k]) => /^(staff|dawam)\./.test(k));

describe("Dawam's Arabic vocabulary (owner decision 42)", () => {
  it("calls a shift a shift (وردية), never a work schedule or a work period", () => {
    const wrong = dawam
      .filter(([, e]) => /\bshifts?\b/i.test(e.replace(/\{\{shift\}\}/g, "")))
      .filter(([, , a]) => /جدول عمل|جدول العمل|جداول العمل|جداول عمل|فترة العمل/.test(a))
      .map(([k]) => k);
    expect(wrong).toEqual([]);
  });

  it("keeps إجازة for leave: a day off is يوم راحة", () => {
    const wrong = dawam
      .filter(([, e]) => /day off|days off|\boff this day\b/i.test(e) && !/leave/i.test(e))
      .filter(([, , a]) => /إجاز|أجاز/.test(a))
      .map(([k]) => k);
    expect(wrong).toEqual([]);
  });
});
