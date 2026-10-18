import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/data/stores/auth.store";
import {
  defineListSearch,
  forgetAllListSearches,
  isFiltered,
  keepScope,
  listScrollKey,
  param,
  parseListSearch,
  patchFor,
  recallListSearch,
  rememberListSearch,
  restoreFor,
  STAYS,
  withDefaults,
} from "./list-search";

const spec = {
  tab: param.enum(["items", "addons"], "items", { keepsPage: true }),
  cat: param.string(),
  till: param.string("", { branchScoped: true }),
  flagged: param.bool(),
  day: param.date(),
  sort: param.sort(),
  q: param.string(),
  page: param.page(),
};

const signInAs = (id: string, org: string) =>
  useAuthStore.setState({ user: { id, org_id: org, role: "org_admin" } as never, token: "t" });

beforeEach(() => {
  forgetAllListSearches();
  signInAs("u-1", "org-1");
});

describe("params", () => {
  it("parse valid values and reject the rest", () => {
    expect(param.enum(["a", "b"], "a").parse("b")).toBe("b");
    expect(param.enum(["a", "b"], "a").parse("zzz")).toBeUndefined();
    expect(param.page().parse("3")).toBe(3);
    expect(param.page().parse(0)).toBeUndefined();
    expect(param.page().parse("2.5")).toBeUndefined();
    expect(param.bool().parse("true")).toBe(true);
    expect(param.bool().parse("1")).toBe(true);
    expect(param.bool().parse("nope")).toBeUndefined();
    expect(param.date().parse("2026-10-11")).toBe("2026-10-11");
    expect(param.date().parse("11/10/2026")).toBeUndefined();
    expect(param.sort().parse("-name")).toBe("-name");
    expect(param.sort().parse("name;drop")).toBeUndefined();
    // The router parses `?q=12` as a number; a search box means text.
    expect(param.string().parse(12)).toBe("12");
  });
});

describe("parseListSearch / withDefaults", () => {
  it("keeps only valid, non-default keys — defaults never clutter the URL", () => {
    expect(parseListSearch(spec, { tab: "items", cat: "c-1", page: 1, q: "", junk: "x", day: "bad" })).toEqual({ cat: "c-1" });
  });
  it("fills every key for the page", () => {
    expect(withDefaults(spec, { page: "4", tab: "nope" })).toEqual({
      tab: "items", cat: "", till: "", flagged: false, day: "", sort: "", q: "", page: 4,
    });
  });
});

describe("patchFor", () => {
  const current = withDefaults(spec, { cat: "c-1", page: 3 });
  it("a changed filter resets the page", () => {
    expect(patchFor(spec, current, { cat: "c-2" })).toEqual({ cat: "c-2", page: undefined });
  });
  it("defaults become undefined (dropped from the URL)", () => {
    expect(patchFor(spec, current, { cat: "" })).toEqual({ cat: undefined, page: undefined });
  });
  it("a page change or a keepsPage key keeps the page", () => {
    expect(patchFor(spec, current, { page: 4 })).toEqual({ page: 4 });
    expect(patchFor(spec, current, { tab: "addons" })).toEqual({ tab: "addons" });
  });
  it("setting the same value again does not reset the page", () => {
    expect(patchFor(spec, current, { cat: "c-1" })).toEqual({ cat: "c-1" });
  });
  it("ignores keys outside the spec", () => {
    expect(patchFor(spec, current, { nope: 1 } as never)).toEqual({});
  });
});

describe("isFiltered", () => {
  it("is false at defaults and true off them; ignored keys don't count", () => {
    expect(isFiltered(spec, withDefaults(spec, {}))).toBe(false);
    expect(isFiltered(spec, withDefaults(spec, { tab: "addons" }), ["tab"])).toBe(false);
    expect(isFiltered(spec, withDefaults(spec, { cat: "c-1" }))).toBe(true);
    expect(isFiltered(spec, withDefaults(spec, { page: 3, sort: "-name", tab: "addons" }))).toBe(false);
    expect(isFiltered(spec, withDefaults(spec, { cat: "c-1" }), ["cat"])).toBe(false);
  });
});

describe("memory + restore", () => {
  it("restores the remembered state when the URL names none of the list's keys", () => {
    rememberListSearch("/x", { cat: "c-1", page: 2 }, "b-1");
    expect(restoreFor(spec, "/x", { branchId: "b-1", preset: "today" })).toEqual({ cat: "c-1", page: 2 });
  });
  it("a URL that names any list key wins", () => {
    rememberListSearch("/x", { cat: "c-1" }, null);
    expect(restoreFor(spec, "/x", { q: "latte" })).toBeNull();
  });
  it("nothing remembered, or an all-default memory, restores nothing", () => {
    expect(restoreFor(spec, "/x", {})).toBeNull();
    rememberListSearch("/x", {}, null);
    expect(recallListSearch("/x")).toBeNull();
  });
  it("drops branch-bound keys when the branch changed since", () => {
    rememberListSearch("/x", { till: "t-1", cat: "c-1" }, "b-1");
    expect(restoreFor(spec, "/x", { branchId: "b-2" })).toEqual({ cat: "c-1" });
    expect(restoreFor(spec, "/x", { branchId: "b-1" })).toEqual({ till: "t-1", cat: "c-1" });
  });
  it("drops remembered values that are no longer valid", () => {
    rememberListSearch("/x", { tab: "retired-tab", cat: "c-1" }, null);
    expect(restoreFor(spec, "/x", {})).toEqual({ cat: "c-1" });
  });
  it("is per person and per org", () => {
    rememberListSearch("/x", { cat: "c-1" }, null);
    signInAs("u-1", "org-2");
    expect(recallListSearch("/x")).toBeNull();
    signInAs("u-2", "org-1");
    expect(recallListSearch("/x")).toBeNull();
    signInAs("u-1", "org-1");
    expect(recallListSearch("/x")?.search).toEqual({ cat: "c-1" });
  });
  it("is forgotten on sign-out", () => {
    rememberListSearch("/x", { cat: "c-1" }, null);
    useAuthStore.setState({ user: null, token: null });
    signInAs("u-1", "org-1");
    expect(recallListSearch("/x")).toBeNull();
  });
});

describe("defineListSearch", () => {
  it("beforeLoad redirects to the remembered state, and stays put otherwise", () => {
    const def = defineListSearch("/demo/list", spec);
    expect(() => def.beforeLoad({ search: {} })).not.toThrow();
    rememberListSearch("/demo/list", { cat: "c-9" }, null);
    let thrown: unknown;
    try {
      def.beforeLoad({ search: { preset: "today" } });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeTruthy();
    const opts = (thrown as { options: { to: string; search: unknown; replace: boolean } }).options;
    expect(opts.to).toBe("/demo/list");
    expect(opts.search).toEqual({ preset: "today", cat: "c-9" });
    expect(opts.replace).toBe(true);
    // Preloads never redirect.
    expect(() => def.beforeLoad({ search: {}, preload: true })).not.toThrow();
  });
  it("validateSearch is the clean parser", () => {
    const def = defineListSearch("/demo/other", spec);
    expect(def.validateSearch({ cat: "c-1", page: "1", tab: "items" })).toEqual({ cat: "c-1" });
  });
  it("list paths restore scroll by URL, other pages by history entry", () => {
    defineListSearch("/demo/scroll", spec);
    expect(listScrollKey({ pathname: "/demo/scroll", href: "/demo/scroll?cat=a", state: { __TSR_key: "k1" } })).toBe("/demo/scroll?cat=a");
    expect(listScrollKey({ pathname: "/elsewhere", href: "/elsewhere", state: { __TSR_key: "k2" } })).toBe("k2");
  });
});

describe("entryValues (what a prefetch reads the destination as)", () => {
  const def = defineListSearch("/demo/entry", spec);

  it("a plain link opens on the remembered state, else the defaults", () => {
    expect(def.entryValues("b-1").tab).toBe("items");
    rememberListSearch("/demo/entry", { tab: "addons", cat: "c-2" }, "b-1");
    expect(def.entryValues("b-1", { branchId: "b-1", preset: "today" })).toMatchObject({ tab: "addons", cat: "c-2" });
  });

  it("a link naming any of the list's params opens on exactly those", () => {
    rememberListSearch("/demo/entry", { tab: "addons", cat: "c-2" }, "b-1");
    expect(def.entryValues("b-1", { q: "lat" })).toMatchObject({ tab: "items", cat: "", q: "lat" });
  });

  it("the list's own tab switch restores nothing, even back to the default tab", () => {
    rememberListSearch("/demo/entry", { tab: "addons" }, "b-1");
    expect(def.entryValues("b-1", { [STAYS]: true }).tab).toBe("items");
  });
});

describe("keepScope", () => {
  it("keeps branch + period, leaves everything else behind", () => {
    expect(keepScope({ branchId: "b", preset: "7d", tab: "sizes", cat: "c" })).toEqual({ branchId: "b", preset: "7d", from: undefined, to: undefined });
  });
});
