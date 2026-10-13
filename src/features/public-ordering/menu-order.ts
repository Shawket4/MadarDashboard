import { type OrderCategory, rules } from "@/lib/rules";

/**
 * `categories` in the order the POS shows them to a reader in `lang`:
 * the dashboard's drag order (`display_order`), then the name the reader
 * sees, then the id — madar-shared's rule (madar-catalog `order`), run
 * through the wasm, never a TypeScript copy. The server already sends them
 * in this order for an English reader; an Arabic one can break a tie the
 * other way, so the page asks again in its own language.
 */
export function inMenuOrder<T extends OrderCategory>(categories: readonly T[], lang: string): T[] {
  return rules.category_order([...categories], lang).map((i) => categories[i]);
}
