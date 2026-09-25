/**
 * How a deal reads in a list and in a report: "Any 2 for EGP 90.00",
 * "Buy 2, get 1 free", "Buy 2, get 1 at 50% off".
 */
import type { TFunction } from "i18next";

import type { DealPoolEntry, DealRule } from "@/features/combos/contract";
import type { MenuOptions } from "@/features/combos/use-menu-options";
import { fmtMoney } from "@/lib/format";

export function dealRuleText(t: TFunction, d: Pick<DealRule, "kind" | "qty" | "price" | "get_qty" | "get_percent">): string {
  if (d.kind === "n_for_price") {
    return t("deals.rule.nForPrice", { defaultValue: "Any {{count}} for {{price}}", count: d.qty, price: fmtMoney(d.price ?? 0) });
  }
  if ((d.get_percent ?? 100) >= 100) {
    return t("deals.rule.buyGetFree", { defaultValue: "Buy {{buy}}, get {{get}} free", buy: d.qty, get: d.get_qty ?? 1 });
  }
  return t("deals.rule.buyGetOff", {
    defaultValue: "Buy {{buy}}, get {{get}} at {{percent}}% off",
    buy: d.qty,
    get: d.get_qty ?? 1,
    percent: d.get_percent,
  });
}

export function poolText(t: TFunction, pool: DealPoolEntry[], menu: Pick<MenuOptions, "itemName" | "categoryName">): string {
  if (!pool.length) return "—";
  return pool
    .map((e) => {
      const name = e.category_id
        ? t("deals.pool.categoryNamed", { defaultValue: "All {{name}}", name: menu.categoryName(e.category_id) ?? "—" })
        : (menu.itemName(e.menu_item_id) ?? "—");
      return e.size_label ? `${name} (${e.size_label})` : name;
    })
    .join(t("combos.listSeparator", ", "));
}
