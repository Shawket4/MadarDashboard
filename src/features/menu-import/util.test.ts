import { describe, expect, it } from "vitest";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { menuRules } from "@/lib/rules/menu";
import type {
  BulkRefusal,
  BulkThing,
  FoodicsFile,
  FoodicsIssue,
} from "@/lib/rules/menu";
import vectors from "@/lib/menu_import_vectors.json";

import { byCategory, modeFor } from "./util";

// Loaded from disk by src/test/setup.ts, as the dialog loads it on demand.
const menu = await menuRules();

/** madar-shared's own cases, through the wasm the dialog calls. */
describe("menu_import_vectors through the rules wasm", () => {
  it.each(vectors.foodics.map((c) => [c.name, c] as const))(
    "foodics_parse %s",
    (_, c) => {
      expect(menu.foodics_parse(c.files)).toEqual(c.expected);
    },
  );
  it.each(vectors.validate.map((c) => [c.name, c] as const))(
    "bulk_validate %s",
    (_, c) => {
      expect(
        menu.bulk_validate(c.menu as Parameters<typeof menu.bulk_validate>[0]),
      ).toEqual(c.expected);
    },
  );
  it("replace_sentence and confirms_replace", () => {
    for (const c of vectors.sentences)
      expect(menu.replace_sentence(c.org_name, c.lang)).toBe(c.expected);
    for (const c of vectors.confirm)
      expect(menu.confirms_replace(c.org_name, c.typed), c.name).toBe(
        c.expected,
      );
  });
});

// Every kind the reader and the checks can name has a sentence in both
// languages. The lists are checked against the wasm's types: a new kind there
// fails to compile here until it is worded.
const ISSUES = [
  "missing_file",
  "blank_name",
  "duplicate",
  "duplicate_sku",
  "uncategorized",
  "not_a_number",
  "not_yes_no",
  "unknown_sku",
  "unknown_group",
  "duplicate_link",
  "empty_group",
  "min_lowered",
  "sizes_by_name",
  "looks_like_sizes",
  "second_sizes",
  "duplicate_group",
  "not_a_swap",
] as const satisfies readonly FoodicsIssue["issue"][];
const REFUSALS = [
  "unsupported_version",
  "empty",
  "too_many",
  "blank",
  "too_long",
  "bad_text",
  "duplicate",
  "unknown_category",
  "unknown_group",
  "bad_limits",
  "bad_price",
  "swap_not_single",
  "no_active_size",
  "reserved_label",
] as const satisfies readonly BulkRefusal["refusal"][];
const THINGS = [
  "category",
  "item",
  "group",
  "option",
  "size",
  "link",
  "optional",
] as const satisfies readonly BulkThing[];
const FILES = [
  "categories",
  "products",
  "product_modifiers",
  "modifier_groups",
  "modifier_options",
  "product_optionals",
] as const satisfies readonly FoodicsFile[];
type Every<All, Listed> = [Exclude<All, Listed>] extends [never] ? true : false;
const complete: [
  Every<FoodicsIssue["issue"], (typeof ISSUES)[number]>,
  Every<BulkRefusal["refusal"], (typeof REFUSALS)[number]>,
  Every<BulkThing, (typeof THINGS)[number]>,
  Every<FoodicsFile, (typeof FILES)[number]>,
] = [true, true, true, true];

describe.each([
  ["en", en],
  ["ar", ar],
] as const)("%s words every kind", (_, locale) => {
  // Indexing the typed JSON: a kind with no sentence does not compile.
  const m = locale.menuImport;
  it("issues, refusals, things and files", () => {
    expect(complete).toEqual([true, true, true, true]);
    for (const k of ISSUES) expect(m.issues[k], k).toBeTruthy();
    for (const k of REFUSALS) expect(m.refusals[k], k).toBeTruthy();
    for (const k of THINGS) expect(m.things[k], k).toBeTruthy();
    for (const k of FILES) expect(m.files[k], k).toBeTruthy();
  });
});

describe("helpers", () => {
  it("adds into an empty menu and replaces any other", () => {
    expect(modeFor({ categories: 0, items: 0 })).toBe("add");
    expect(modeFor({ categories: 1, items: 0 })).toBe("replace");
  });
  it("lists items under their category, in the file's order, and leaves empty categories out", () => {
    const by = vectors.foodics.find((c) => c.name === "by_name")!;
    const parsed = menu.foodics_parse(by.files);
    if ("error" in parsed) throw new Error("by_name reads");
    expect(
      byCategory(parsed.menu).map((c) => [c.name, c.items.map((i) => i.name)]),
    ).toEqual([
      ["Coffee", ["Espresso", "Latte"]],
      ["Cold", ["Iced Latte"]],
    ]);
  });
});
