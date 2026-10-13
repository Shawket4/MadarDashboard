import { defineListSearch, param } from "@/data/scope/list-search";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/data/config/constants";

/**
 * Orders list state, in the URL (see data/scope/list-search.ts). Filters and
 * page survive opening an order, a customer, or another page and coming back.
 * `?order=` (the open sheet) is deliberately NOT part of it: it is a deep link,
 * not list state, so it is never remembered or restored.
 */
export const ordersSearch = defineListSearch("/orders", {
  status: param.enum(["all", ...ORDER_STATUSES] as const, "all"),
  pay: param.enum(["all", ...PAYMENT_METHODS] as const, "all"),
  type: param.enum(["all", "dine_in", "delivery"] as const, "all"),
  channel: param.enum(["all", "in_mall", "outside"] as const, "all"),
  teller: param.string(),
  waiter: param.string(),
  /** One till — a till belongs to one branch. */
  till: param.string("", { branchScoped: true }),
  page: param.page(),
});
