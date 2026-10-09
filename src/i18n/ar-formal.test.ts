/**
 * The dashboard's Arabic is formal (owner default #42): Egyptian colloquial
 * stays in the staff app and on the customer pages (the public menu and the
 * reservation page), never on a dashboard screen. The guard looks for the
 * colloquial markers a formal sentence never has.
 */
import { describe, expect, it } from "vitest";

import ar from "./locales/ar.json";

type Tree = { [k: string]: string | Tree };

/** Customer-facing surfaces and the marketing pages keep their own voice. */
const NOT_DASHBOARD = new Set(["menu", "reservations", "order"]);

const A = "؀-ۿ";
const NB = `(?<![${A}])`;
const NA = `(?![${A}])`;
const WORDS = [
  "عايز", "عايزة", "عاوز", "مش", "ده", "دي", "دا", "إزاي", "ازاي", "كده", "كدا", "مفيش", "مافيش", "مينفعش",
  "لسه", "دلوقتي", "بتاع", "بتاعت", "بتاعك", "بتاعه", "بتاعنا", "بتوع", "بتوعه", "خلاص", "اللي", "تاني", "تانية",
  "عشان", "علشان", "إنت", "انت", "برضه", "بقى", "إيه", "ايه", "فين", "إمتى", "امتى", "زي", "بس", "مستني", "ملوش",
  "مالوش", "محدش", "كام", "لمين", "قصاد", "النهارده", "أنهي", "بالظبط", "استنى", "سيب", "وريها", "حابب",
  "يقدر", "تقدر", "نقدر", "محتاج", "محتاجة", "كتير", "ابعت", "خلّي", "خلي", "يديك", "يديهالك", "ببلاش", "غلط",
  "اختار", "فاضل", "ماشي", "القايمة", "تلات",
].join("|");
/** اتـ passives (اتضاف، اتحفظ) but not formal words that start the same way. */
const PASSIVE = `${NB}ات(?!جاه|صال|صل|فاق|خاذ|خذ|باع|ساق|ساع|حاد|ضح|جه|صف|سع|سم|هام|كال|زان|فق|رك|بع|حد)[${A}]{2,}`;
/** هـ futures (هيدخل، هيتضاف) but not هيئة / هنا / هناك. */
const FUTURE = `${NB}ه(?!يئ|ناك|ندس|نا${NA})(?:ي|ت|ن)[${A}]{3,}`;
/** مـ…ش negations (مينفعش، متحفظتش). */
const NEGATION = `${NB}م(?!شو|نع|فت|ده|رع|عا)[${A}]{2,}ش${NA}`;
const PHRASES = `${NB}(?:قبل ما|بعد ما|أول ما|لحد ما)${NA}`;
const MARKERS = new RegExp(`${NB}(?:${WORDS})${NA}|${PHRASES}|${PASSIVE}|${FUTURE}|${NEGATION}`);
/** Diacritics (a shadda in اتّباع) don't change the word. */
const COLLOQUIAL = { test: (s: string) => MARKERS.test(s.replace(/[\u064B-\u0652]/g, "")) };

function strings(t: Tree, prefix = ""): [string, string][] {
  return Object.entries(t).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") return [[key, v] as [string, string]];
    return v && typeof v === "object" ? strings(v, key) : [];
  });
}

describe("the dashboard's Arabic is formal (owner default #42)", () => {
  it("has no Egyptian colloquial markers outside the customer pages", () => {
    const colloquial = strings(ar as unknown as Tree)
      .filter(([k]) => !NOT_DASHBOARD.has(k.split(".")[0]))
      .filter(([, v]) => COLLOQUIAL.test(v))
      .map(([k, v]) => `${k}: ${v}`);
    expect(colloquial).toEqual([]);
  });

  it("the guard catches the colloquial and passes the formal", () => {
    for (const s of ["اتضاف الموظف. هيدخل بكود على الواتساب.", "الشخص ده مش نشط", "مينفعش توافق", "اختار التواريخ اللي عايز تشوفها"])
      expect(COLLOQUIAL.test(s), s).toBe(true);
    for (const s of ["تمت إضافة الموظف. سيسجّل الدخول برمز على واتساب.", "هذا الشخص غير نشط", "هندسة القائمة", "هناك طلب معلّق هنا", "اتركهما فارغين", "بناءً على الخيار"])
      expect(COLLOQUIAL.test(s), s).toBe(false);
  });
});
