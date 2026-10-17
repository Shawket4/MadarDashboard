import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";

import { getListMenuCatalogQueryKey } from "@/data/api/generated/api";
import { forgetAllListSearches, rememberListSearch, withDefaults } from "@/data/scope/list-search";
import { combosListParams } from "@/features/combos/queries";
import { combosSearch } from "@/features/combos/search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { menuItemsListParams, pricingAddonParams, pricingCatalogParams, prefetchMenuItems } from "./queries";
import { pricingSearch } from "./pricing/search";
import { menuItemsSearch } from "./search";

const items = (s: Record<string, unknown>) => withDefaults(menuItemsSearch.spec, s);
const ctx: PrefetchCtx = { orgId: "org-1", branchId: "b-1", from: null, to: null, preset: "today" };

afterEach(() => forgetAllListSearches());

describe("menuItemsListParams", () => {
  it("opens on page 1 of the whole catalog", () => {
    expect(menuItemsListParams("org-1", items({}), true)).toEqual({
      org_id: "org-1", category_id: undefined, search: undefined, has_recipe: undefined, page: 1, per_page: 24,
    });
  });

  it("sends the recipe filter only with recipes.read", () => {
    expect(menuItemsListParams("org-1", items({ recipe: "missing" }), true).has_recipe).toBe(false);
    expect(menuItemsListParams("org-1", items({ recipe: "has" }), true).has_recipe).toBe(true);
    expect(menuItemsListParams("org-1", items({ recipe: "has" }), false).has_recipe).toBeUndefined();
  });

  it("the sidebar prefetch warms the key the page opens with (remembered filters included)", () => {
    rememberListSearch("/menu/items", { cat: "c-1", page: 3 }, "b-1");
    const qc = new QueryClient();
    prefetchMenuItems(qc, ctx);
    const want = getListMenuCatalogQueryKey(menuItemsListParams("org-1", menuItemsSearch.entryValues("b-1"), true));
    expect(want[1]).toMatchObject({ category_id: "c-1", page: 3 });
    expect(qc.getQueryCache().find({ queryKey: want, exact: true })).toBeDefined();
  });
});

describe("pricing params", () => {
  it("each tab pages and searches on its own", () => {
    const f = withDefaults(pricingSearch.spec, { q: "lat", page: 2, aq: "milk", apage: 4 });
    expect(pricingCatalogParams("org-1", f)).toEqual({ org_id: "org-1", search: "lat", page: 2, per_page: 24 });
    expect(pricingAddonParams("org-1", f)).toEqual({ org_id: "org-1", search: "milk", page: 4, per_page: 24 });
  });
});

describe("combosListParams", () => {
  it("a search of spaces is no search, and status maps to is_active", () => {
    const f = withDefaults(combosSearch.spec, { q: "  ", status: "inactive", page: 2 });
    expect(combosListParams(f)).toEqual({ q: undefined, category_id: undefined, is_active: false, page: 2, per_page: 25 });
  });
});
