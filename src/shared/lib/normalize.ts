/**
 * String normalization for search/filter matching.
 *
 * Handles English + Arabic variations so users can type naturally:
 *   - Case-folding
 *   - Latin diacritic removal (é → e, ñ → n)
 *   - Arabic character unification:
 *       ا/أ/إ/آ/ٱ → ا   (different alefs)
 *       ة → ه           (taa marbuta → haa)
 *       ى → ي           (alef maqsura → ya)
 *       ؤ → و, ئ → ي    (different hamzas)
 *   - Arabic tashkeel (diacritics) removal: fatha, damma, kasra, sukun, shadda, tanween…
 *   - Tatweel (ـ) and kashida removal
 *   - Whitespace collapse
 *
 * NB: We deliberately don't translate Arabic→Latin or vice versa — users
 * searching "قهوة" in an English-only catalog should get no hits, not noise.
 */

// Arabic tashkeel / tatweel range (U+064B..U+0652 + U+0670 + U+0640)
const AR_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;

export function normalize(input: string | null | undefined): string {
  if (input == null) return "";
  let s = String(input);

  // Unicode NFD lets us strip combining diacritics (é → e + ́, then drop ́)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Arabic-specific
  s = s.replace(AR_DIACRITICS, "");
  s = s
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ → ا
    .replace(/\u0629/g, "\u0647")                     // ة → ه
    .replace(/\u0649/g, "\u064A")                     // ى → ي
    .replace(/\u0624/g, "\u0648")                     // ؤ → و
    .replace(/\u0626/g, "\u064A");                    // ئ → ي

  // Lowercase + collapse whitespace
  s = s.toLowerCase().replace(/\s+/g, " ").trim();
  return s;
}

/** Does `haystack` contain `needle` under normalization? */
export function normalizedIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const n = normalize(needle);
  if (!n) return true;
  return normalize(haystack).includes(n);
}

/**
 * Filter an array of objects by a query string across specified keys.
 * If no keys are given, searches every string/number field on each row.
 */
export function filterByQuery<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  keys?: (keyof T)[],
): T[] {
  const q = normalize(query);
  if (!q) return rows;

  const matches = (row: T): boolean => {
    const fields = keys
      ? keys.map((k) => row[k])
      : Object.values(row);
    for (const v of fields) {
      if (v == null) continue;
      if (typeof v !== "string" && typeof v !== "number") continue;
      if (normalize(String(v)).includes(q)) return true;
    }
    return false;
  };

  return rows.filter(matches);
}
