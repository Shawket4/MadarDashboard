import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import type { Order } from "@/data/api/generated/models";

/**
 * Who sold an order, the "Teller" every order surface shows: the person picked
 * at checkout on a branch that asks (`sold_by`), else whoever was signed in on
 * the till (`teller_id`). With nobody picked it reads exactly as before.
 */
export const sellerName = (o: Pick<Order, "teller_name" | "sold_by_name">): string => o.sold_by_name ?? o.teller_name;

/**
 * The signed-in person, named apart only when someone else was picked as
 * serving. `teller_id` stays the person accountable for the drawer and the
 * money permissions, so it is worth showing when it differs; null otherwise.
 */
export const signedInOther = (o: Pick<Order, "teller_id" | "teller_name" | "sold_by">): string | null =>
  o.sold_by && o.sold_by !== o.teller_id ? o.teller_name : null;

/** The orders list's Teller column: who sold (same id as before, `teller_name`). */
export const tellerColumn = (t: TFunction): ColumnDef<Order> => ({
  id: "teller_name",
  accessorFn: sellerName,
  header: t("tills.teller", "Teller"),
  meta: { label: t("tills.teller", "Teller") },
});
