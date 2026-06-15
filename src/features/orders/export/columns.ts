import type { TFunction } from "i18next";
import type { ExcelColumn } from "@/lib/excel";
import type { OrderExport } from "@/data/api/generated/models";

export const orderColumns = (t: TFunction): ExcelColumn<OrderExport>[] => [
  { key: "order_ref", header: t("orders.orderRef", "Ref"), accessor: (o) => o.order_ref ?? `#${o.order_number}`, type: "text", width: 16 },
  { key: "created_at", header: t("orders.date", "Date"), accessor: (o) => new Date(o.created_at), type: "dateTime", width: 20 },
  { key: "teller", header: t("shifts.teller", "Teller"), accessor: (o) => o.teller_name, type: "text", width: 18 },
  { key: "customer", header: t("orders.customer", "Customer"), accessor: (o) => o.customer_name || "—", type: "text", width: 18 },
  {
    key: "payment_method",
    header: t("orders.paymentMethod", "Payment Method"),
    accessor: (o) => t(`payments.${o.payment_method}`, o.payment_method),
    type: "text",
    width: 18,
  },
  { key: "subtotal", header: t("common.subtotal", "Subtotal"), accessor: (o) => o.subtotal, type: "money", width: 15, total: true },
  { key: "discount", header: t("orders.discount", "Discount"), accessor: (o) => o.discount_amount, type: "money", width: 15, total: true },
  { key: "tax", header: t("orders.tax", "Tax"), accessor: (o) => o.tax_amount, type: "money", width: 15, total: true },
  { key: "tip", header: t("orders.tip", "Tip"), accessor: (o) => o.tip_amount || 0, type: "money", width: 15, total: true },
  { key: "total", header: t("common.total", "Total"), accessor: (o) => o.total_amount, type: "money", width: 15, total: true },
  { key: "status", header: t("common.status", "Status"), accessor: (o) => t(`orderStatus.${o.status}`, o.status), type: "text", width: 15 },
  {
    key: "void_reason",
    header: t("orders.voidReason", "Void Reason"),
    accessor: (o) => (o.void_reason ? t(`orders.voidReasons.${o.void_reason}`, o.void_reason) : "—"),
    type: "text",
    width: 20,
  },
];

export interface LineItemRow {
  order_ref: string;
  created_at: string;
  payment_method: string;
  item_name: string;
  size_label: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  line_cost: number | null;
  addons: string;
  optionals: string;
  notes: string | null;
}

export const lineItemColumns = (t: TFunction): ExcelColumn<LineItemRow>[] => [
  { key: "order_ref", header: t("orders.orderRef", "Ref"), accessor: (r) => r.order_ref, type: "text", width: 16 },
  { key: "created_at", header: t("orders.date", "Date"), accessor: (r) => new Date(r.created_at), type: "dateTime", width: 20 },
  {
    key: "payment_method",
    header: t("orders.paymentMethod", "Payment Method"),
    accessor: (r) => t(`payments.${r.payment_method}`, r.payment_method),
    type: "text",
    width: 18,
  },
  { key: "item_name", header: t("menu.item", "Item"), accessor: (r) => r.item_name, type: "text", width: 22 },
  { key: "size_label", header: t("menu.size", "Size"), accessor: (r) => r.size_label || "—", type: "text", width: 12 },
  { key: "quantity", header: t("common.qty", "Qty"), accessor: (r) => r.quantity, type: "number", width: 10, total: true },
  { key: "unit_price", header: t("common.price", "Unit Price"), accessor: (r) => r.unit_price, type: "money", width: 15 },
  { key: "line_total", header: t("common.total", "Line Total"), accessor: (r) => r.line_total, type: "money", width: 15, total: true },
  { key: "line_cost", header: t("orders.cogs", "COGS"), accessor: (r) => r.line_cost, type: "money", width: 15, total: true },
  { key: "addons", header: t("menu.addons", "Addons"), accessor: (r) => r.addons || "—", type: "text", width: 25 },
  { key: "optionals", header: t("menu.optionals", "Optionals"), accessor: (r) => r.optionals || "—", type: "text", width: 25 },
  { key: "notes", header: t("common.notes", "Notes"), accessor: (r) => r.notes || "—", type: "text", width: 20 },
];

export interface PaymentRow {
  order_ref: string;
  created_at: string;
  order_total: number;
  split_method: string;
  split_amount: number;
  reference: string | null;
}

export const paymentColumns = (t: TFunction): ExcelColumn<PaymentRow>[] => [
  { key: "order_ref", header: t("orders.orderRef", "Ref"), accessor: (r) => r.order_ref, type: "text", width: 16 },
  { key: "created_at", header: t("orders.date", "Date"), accessor: (r) => new Date(r.created_at), type: "dateTime", width: 20 },
  { key: "order_total", header: t("common.total", "Order Total"), accessor: (r) => r.order_total, type: "money", width: 15, total: true },
  {
    key: "split_method",
    header: t("orders.paymentMethod", "Payment Method"),
    accessor: (r) => t(`payments.${r.split_method}`, r.split_method),
    type: "text",
    width: 18,
  },
  { key: "split_amount", header: t("common.amount", "Split Amount"), accessor: (r) => r.split_amount, type: "money", width: 15, total: true },
  { key: "reference", header: t("orders.reference", "Reference"), accessor: (r) => r.reference || "—", type: "text", width: 18 },
];

export interface DeductionRow {
  order_ref: string;
  created_at: string;
  item_name: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  source: string;
  category: string;
}

export const deductionColumns = (t: TFunction): ExcelColumn<DeductionRow>[] => [
  { key: "order_ref", header: t("orders.orderRef", "Ref"), accessor: (r) => r.order_ref, type: "text", width: 16 },
  { key: "created_at", header: t("orders.date", "Date"), accessor: (r) => new Date(r.created_at), type: "dateTime", width: 20 },
  { key: "item_name", header: t("menu.item", "Item"), accessor: (r) => r.item_name, type: "text", width: 22 },
  { key: "ingredient_name", header: t("inventory.ingredient", "Ingredient"), accessor: (r) => r.ingredient_name, type: "text", width: 22 },
  { key: "quantity", header: t("common.qty", "Qty"), accessor: (r) => r.quantity, type: "number", width: 12, total: true },
  { key: "unit", header: t("inventory.unit", "Unit"), accessor: (r) => t(`inventoryUnits.${r.unit}`, r.unit), type: "text", width: 10 },
  { key: "source", header: t("common.source", "Source"), accessor: (r) => r.source, type: "text", width: 15 },
  { key: "category", header: t("common.category", "Category"), accessor: (r) => r.category, type: "text", width: 15 },
];

export interface DeductionAggRow {
  ingredient_name: string;
  unit: string;
  total_quantity: number;
  occurrences: number;
}

export const deductionAggColumns = (t: TFunction): ExcelColumn<DeductionAggRow>[] => [
  { key: "ingredient_name", header: t("inventory.ingredient", "Ingredient"), accessor: (r) => r.ingredient_name, type: "text", width: 25 },
  { key: "total_quantity", header: t("orders.totalUsage", "Total Quantity"), accessor: (r) => r.total_quantity, type: "number", width: 15, total: true },
  { key: "unit", header: t("inventory.unit", "Unit"), accessor: (r) => t(`inventoryUnits.${r.unit}`, r.unit), type: "text", width: 12 },
  { key: "occurrences", header: t("orders.occurrences", "Occurrences"), accessor: (r) => r.occurrences, type: "integer", width: 12, total: true },
];
