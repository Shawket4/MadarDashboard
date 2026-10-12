import { defineListSearch, param } from "@/data/scope/list-search";
import { SOURCES } from "./util";

/**
 * Customers list state, in the URL (see data/scope/list-search.ts): the
 * search, where they came from and "members only" survive leaving the page
 * (an order, a booking) and coming back.
 */
export const customersSearch = defineListSearch("/customers", {
  q: param.string(),
  from: param.enum(["all", ...SOURCES] as const, "all"),
  members: param.bool(),
});
