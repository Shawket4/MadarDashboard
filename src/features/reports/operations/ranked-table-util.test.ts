import { afterAll, beforeAll, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
  ALL,
  RANK,
  ariaSortOf,
  avgPrice,
  barLength,
  categoriesOf,
  filterRows,
  fmtAvgPrice,
  fmtShareCell,
  humanizeType,
  nextSort,
  rankBy,
  shareOf,
  sortRows,
  type SortState,
} from "./ranked-table-util";

interface Row {
  id: string;
  name: string;
  ar?: string;
  qty: number;
  revenue: number;
  type?: string;
}

const ROWS: Row[] = [
  { id: "latte", name: "Latte", ar: "لاتيه", qty: 142, revenue: 1000, type: "coffee" },
  { id: "mocha", name: "Mocha", ar: "موكا", qty: 98, revenue: 3000, type: "coffee" },
  { id: "cake", name: "Cheesecake", ar: "تشيز كيك", qty: 98, revenue: 2000, type: "dessert" },
  { id: "éclair", name: "Éclair", qty: 10, revenue: 0, type: "dessert" },
];
const idOf = (r: Row) => r.id;

describe("rankBy", () => {
  it("ranks highest first, ties share a place (1, 2, 2, 4) in the server's order", () => {
    const ranks = rankBy(ROWS, idOf, (r) => r.qty);
    expect([...ranks]).toEqual([["latte", 1], ["mocha", 2], ["cake", 2], ["éclair", 4]]);
  });

  it("puts rows with no figure after every ranked one, one place each, in the server's order", () => {
    const rows = [{ id: "a", v: null }, { id: "b", v: 5 }, { id: "c", v: null }, { id: "d", v: 9 }];
    const ranks = rankBy(rows, (r) => r.id, (r) => r.v);
    expect([...ranks]).toEqual([["d", 1], ["b", 2], ["a", 3], ["c", 4]]);
  });

  it("returns nothing for no rows", () => {
    expect(rankBy([], idOf, (r: Row) => r.qty).size).toBe(0);
  });
});

describe("sortRows", () => {
  const ranks = rankBy(ROWS, idOf, (r) => r.qty);
  const rankOf = (r: Row) => ranks.get(r.id)!;
  const valueOf = (r: Row, id: string) =>
    id === "item" ? r.name : id === "avg" ? avgPrice(r.revenue, r.qty) : (r[id as "qty" | "revenue"] as number);
  const ids = (sort: SortState, locale = "en") => sortRows(ROWS, sort, valueOf, rankOf, locale).map((r) => r.id);

  it("sorts by rank either way", () => {
    expect(ids({ id: RANK, dir: "asc" })).toEqual(["latte", "mocha", "cake", "éclair"]);
    expect(ids({ id: RANK, dir: "desc" })[0]).toBe("éclair");
  });

  it("sorts figures numerically, ties broken by rank", () => {
    expect(ids({ id: "revenue", dir: "desc" })).toEqual(["mocha", "cake", "latte", "éclair"]);
    expect(ids({ id: "revenue", dir: "asc" })).toEqual(["éclair", "latte", "cake", "mocha"]);
    // mocha and cake both sold 98: rank order (mocha came first) holds.
    expect(ids({ id: "qty", dir: "desc" })).toEqual(["latte", "mocha", "cake", "éclair"]);
  });

  it("sorts names by collation, accents folded, not by code point", () => {
    expect(ids({ id: "item", dir: "asc" })).toEqual(["cake", "éclair", "latte", "mocha"]);
  });

  it("puts a missing figure last in both directions", () => {
    const withGap = [...ROWS, { id: "free", name: "Water", qty: 0, revenue: 0 }];
    const r2 = rankBy(withGap, idOf, (r) => r.qty);
    const sorted = (dir: "asc" | "desc") =>
      sortRows(withGap, { id: "avg", dir }, valueOf, (r) => r2.get(r.id)!, "en").map((r) => r.id);
    expect(sorted("asc").at(-1)).toBe("free");
    expect(sorted("desc").at(-1)).toBe("free");
  });

  it("does not mutate its input", () => {
    const before = ROWS.map((r) => r.id);
    ids({ id: "item", dir: "desc" });
    expect(ROWS.map((r) => r.id)).toEqual(before);
  });
});

describe("nextSort and ariaSortOf", () => {
  it("starts figures biggest first, names and rank from the top, and flips on a second click", () => {
    const start: SortState = { id: RANK, dir: "asc" };
    expect(nextSort(start, "qty", "number")).toEqual({ id: "qty", dir: "desc" });
    expect(nextSort(start, "item", "text")).toEqual({ id: "item", dir: "asc" });
    expect(nextSort({ id: "qty", dir: "desc" }, "qty", "number")).toEqual({ id: "qty", dir: "asc" });
    expect(nextSort({ id: "qty", dir: "desc" }, RANK, "text")).toEqual({ id: RANK, dir: "asc" });
  });

  it("labels only the sorted column", () => {
    const sort: SortState = { id: "qty", dir: "desc" };
    expect(ariaSortOf(sort, "qty")).toBe("descending");
    expect(ariaSortOf({ id: "qty", dir: "asc" }, "qty")).toBe("ascending");
    expect(ariaSortOf(sort, "revenue")).toBeUndefined();
  });
});

describe("filterRows", () => {
  const hay = (r: Row) => [r.name, r.ar];
  const ids = (q: string, cat = ALL) => filterRows(ROWS, q, hay, cat, (r) => r.type).map((r) => r.id);

  it("matches either language, ignoring case and outer spaces", () => {
    expect(ids("  LAT ")).toEqual(["latte"]);
    expect(ids("كيك")).toEqual(["cake"]);
  });

  it("folds accents and Arabic letter forms", () => {
    expect(ids("eclair")).toEqual(["éclair"]);
    // A search typed with a bare alef finds a name spelt with hamza, and back.
    const rows = [{ id: "a", name: "أمريكانو", qty: 1, revenue: 0 }];
    expect(filterRows(rows, "امريكانو", (r) => [r.name]).length).toBe(1);
  });

  it("narrows to a category, and an empty query keeps every row in it", () => {
    expect(ids("", "dessert")).toEqual(["cake", "éclair"]);
    expect(ids("cake", "coffee")).toEqual([]);
    expect(ids("")).toHaveLength(4);
  });

  it("lists categories once, alphabetically in the reader's language, skipping blanks", () => {
    const rows = [{ t: "Food" }, { t: "cold drinks" }, { t: "" }, { t: "Food" }, { t: "Bakery" }];
    expect(categoriesOf(rows, (r) => r.t)).toEqual(["Bakery", "cold drinks", "Food"]);
    expect(categoriesOf([{ t: "مشروبات" }, { t: "أكل" }], (r) => r.t, "ar")).toEqual(["أكل", "مشروبات"]);
  });
});

describe("shares and prices", () => {
  it("is a ratio clamped to [0, 1], and 0 with no total", () => {
    expect(shareOf(25, 100)).toBe(0.25);
    expect(shareOf(5, 0)).toBe(0);
    expect(shareOf(150, 100)).toBe(1);
    expect(shareOf(Number.NaN, 100)).toBe(0);
  });

  it("draws a bar against the largest share, so the leader's is full", () => {
    expect(barLength(0.4, 0.4)).toBe(1);
    expect(barLength(0.1, 0.4)).toBe(0.25);
    expect(barLength(0.1, 0)).toBe(0);
  });

  it("averages revenue over units, never dividing by zero", () => {
    expect(avgPrice(368_000, 184)).toBe(2000);
    expect(avgPrice(100, 3)).toBe(33);
    expect(avgPrice(500, 0)).toBeNull();
  });

  it("humanizes a raw add-on type", () => {
    expect(humanizeType("milk_type")).toBe("Milk");
    expect(humanizeType("extra_shot")).toBe("Extra Shot");
  });
});

describe("formatting, in both languages", () => {
  let lang: string;
  beforeAll(() => {
    lang = i18n.language;
  });
  afterAll(async () => {
    await i18n.changeLanguage(lang);
  });

  it("prints shares and prices in English", async () => {
    await i18n.changeLanguage("en");
    expect(fmtShareCell(0.2534)).toBe("25.3%");
    // Always one decimal, so a column of shares lines up.
    expect(fmtShareCell(0.08)).toBe("8.0%");
    expect(fmtShareCell(0)).toBe("0.0%");
    expect(fmtAvgPrice(368_000, 184)).toBe("EGP 20.00");
    expect(fmtAvgPrice(100, 0)).toBe("—");
  });

  it("prints Western digits in Arabic, the money figure isolated left to right", async () => {
    await i18n.changeLanguage("ar");
    const share = fmtShareCell(0.2534);
    expect(share).toMatch(/25[.,٫]3/);
    expect(share).not.toMatch(/[٠-٩]/);
    const money = fmtAvgPrice(368_000, 184);
    expect(money).toContain("20.00");
    expect(money).toContain("ج.م");
    expect(money).not.toMatch(/[٠-٩]/);
  });
});
