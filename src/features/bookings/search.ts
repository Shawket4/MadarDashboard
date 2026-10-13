import { defineListSearch, param } from "@/data/scope/list-search";
import { BOOKING_STATUSES } from "./util";

/**
 * Bookings page state, in the URL (see data/scope/list-search.ts): the day,
 * the view and the status filter survive leaving the page and coming back.
 * No `date` means today (the service day). `?booking=` (open that booking's
 * dialog, the link from a customer's bookings) is not list state and is never
 * remembered.
 */
export const bookingsSearch = defineListSearch("/bookings", {
  date: param.date(),
  view: param.enum(["list", "timeline"] as const, "list", { keepsPage: true }),
  filter: param.enum(["active", "all", ...BOOKING_STATUSES] as const, "active"),
});
