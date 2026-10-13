import { defineListSearch, param } from "@/data/scope/list-search";

export const PLAN_FILTERS = ["all", "free", "paid"] as const;
export const SOURCE_FILTERS = ["all", "self", "admin"] as const;

/**
 * Organizations list state, in the URL (see data/scope/list-search.ts): which
 * plan and how the org came to be (signed up by itself, or made by Madar).
 * Both go to `GET /orgs` as `?plan=` / `?signup_source=`.
 */
export const orgsSearch = defineListSearch("/orgs", {
  plan: param.enum(PLAN_FILTERS, "all"),
  source: param.enum(SOURCE_FILTERS, "all"),
});
