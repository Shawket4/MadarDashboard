import type { TFunction } from "i18next";
import type { ExcelSheet } from "@/lib/excel";
import type { OrderExport } from "@/data/api/generated/models";
import { getTranslatedName } from "@/lib/translation";
import type { Grain } from "./types";
import {
  deductionAggColumns,
  deductionColumns,
  lineItemColumns,
  orderColumns,
  paymentColumns,
  type DeductionRow,
  type LineItemRow,
  type PaymentRow,
} from "./columns";

type AnySheet = ExcelSheet<Record<string, unknown>>;
const asSheet = <T>(s: ExcelSheet<T>): AnySheet => s as unknown as AnySheet;

interface DeductionSnapshot {
  ingredient_name: string;
  quantity: number;
  unit: string;
  source: string;
  category: string;
}

export function buildSheets(orders: OrderExport[], grains: Grain[], t: TFunction, lang: string): AnySheet[] {
  const sheets: AnySheet[] = [];

  if (grains.includes("order")) {
    sheets.push(
      asSheet({
        name: t("ordersExport.sheets.orders", "Orders"),
        title: t("ordersExport.sheets.orders", "Orders"),
        columns: orderColumns(t),
        rows: orders,
        totals: true,
      }),
    );
  }

  if (grains.includes("line_item")) {
    const rows: LineItemRow[] = orders.flatMap((o) =>
      (o.items ?? []).map((it) => ({
        order_number: o.order_number,
        created_at: o.created_at,
        payment_method: o.payment_method,
        item_name: getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang),
        size_label: it.size_label || null,
        quantity: it.quantity,
        unit_price: it.unit_price,
        line_total: it.line_total,
        line_cost: it.line_cost ?? null,
        addons: (it.addons || [])
          .map(
            (a) =>
              `+ ${getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, lang)}${a.quantity > 1 ? ` ×${a.quantity}` : ""}`,
          )
          .join(", "),
        optionals: (it.optionals || [])
          .map((opt) => getTranslatedName({ name: opt.field_name, name_translations: opt.name_translations }, lang))
          .join(", "),
        notes: it.notes || null,
      })),
    );
    sheets.push(
      asSheet({
        name: t("ordersExport.sheets.lineItems", "Line Items"),
        title: t("ordersExport.sheets.lineItems", "Line Items"),
        columns: lineItemColumns(t),
        rows,
        totals: true,
      }),
    );
  }

  if (grains.includes("payment")) {
    const rows: PaymentRow[] = orders.flatMap((o) =>
      (o.payments || []).map((p) => ({
        order_number: o.order_number,
        created_at: o.created_at,
        order_total: o.total_amount,
        split_method: p.method,
        split_amount: p.amount,
        reference: p.reference || null,
      })),
    );
    sheets.push(
      asSheet({
        name: t("ordersExport.sheets.payments", "Payments"),
        title: t("ordersExport.sheets.payments", "Payments"),
        columns: paymentColumns(t),
        rows,
        totals: true,
      }),
    );
  }

  if (grains.includes("deduction")) {
    const raw: DeductionRow[] = orders.flatMap((o) =>
      (o.items ?? []).flatMap((it) => {
        const snaps = (Array.isArray(it.deductions_snapshot) ? it.deductions_snapshot : []) as DeductionSnapshot[];
        return snaps.map((d) => ({
          order_number: o.order_number,
          created_at: o.created_at,
          item_name: getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang),
          ingredient_name: d.ingredient_name,
          quantity: d.quantity,
          unit: d.unit,
          source: d.source,
          category: d.category,
        }));
      }),
    );
    sheets.push(
      asSheet({
        name: t("ordersExport.sheets.deductionsRaw", "Ingredient Usage"),
        title: t("ordersExport.sheets.deductionsRaw", "Ingredient Usage"),
        columns: deductionColumns(t),
        rows: raw,
        totals: true,
      }),
    );

    const agg = new Map<string, { ingredient_name: string; unit: string; total_quantity: number; occurrences: number }>();
    for (const d of raw) {
      const key = `${d.ingredient_name}|${d.unit}`;
      const prev = agg.get(key);
      if (prev) {
        prev.total_quantity += d.quantity;
        prev.occurrences += 1;
      } else {
        agg.set(key, { ingredient_name: d.ingredient_name, unit: d.unit, total_quantity: d.quantity, occurrences: 1 });
      }
    }
    sheets.push(
      asSheet({
        name: t("ordersExport.sheets.deductionsAgg", "Ingredient Usage (Totals)"),
        title: t("ordersExport.sheets.deductionsAgg", "Ingredient Usage (Totals)"),
        columns: deductionAggColumns(t),
        rows: Array.from(agg.values()).sort((a, b) => b.total_quantity - a.total_quantity),
        totals: true,
      }),
    );
  }

  return sheets;
}
