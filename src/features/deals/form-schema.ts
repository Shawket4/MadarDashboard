/**
 * The deal dialog's form (§1.1 `deal_rules`, §2.3 `DealWrite`), with the
 * database's own shape rule applied on the fields:
 *   - N for price: N ≥ 2 and a price; no "get".
 *   - Buy X get Y: X ≥ 1, Y ≥ 1 and a percent off from 1 to 100 (100 = free).
 * Deals cover the item price at its size only; add-ons always pay (§5).
 */
import { z } from "zod";

import { arOf } from "@/features/combos/types";
import type { DealPoolEntry, DealRule, DealWrite } from "@/features/combos/types";
import { E, newKey, windowFromWire, windowSchema, windowToWire } from "@/features/combos/form-schema";
import { ALL_WEEKDAYS, hhmm, moneyIn, moneyOut } from "@/features/combos/util";

export const DE = {
  required: "deals.errors.required",
  qtyN: "deals.errors.qtyN",
  qtyBuy: "deals.errors.qtyBuy",
  getQty: "deals.errors.getQty",
  percent: "deals.errors.percent",
  price: "deals.errors.price",
  maxPerOrder: "deals.errors.maxPerOrder",
  poolEmpty: "deals.errors.poolEmpty",
  poolTarget: "deals.errors.poolTarget",
  rewardEmpty: "deals.errors.rewardEmpty",
} as const;

const entrySchema = z.object({
  key: z.string(),
  target: z.enum(["item", "category"]),
  menu_item_id: z.string(),
  category_id: z.string(),
  /** "" = any size */
  size_label: z.string(),
});

const int = (v: string | number) => {
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return String(v).trim() !== "" && Number.isInteger(n) ? n : null;
};

export const branchStateSchema = z.enum(["inherit", "on", "off"]);

export const dealSchema = z
  .object({
    name: z.string().trim().min(1, DE.required),
    name_ar: z.string(),
    kind: z.enum(["n_for_price", "buy_get"]),
    qty: z.union([z.string(), z.number()]),
    price: z.string(),
    get_qty: z.union([z.string(), z.number()]),
    get_percent: z.union([z.string(), z.number()]),
    max_per_order: z.union([z.string(), z.number()]),
    is_active: z.boolean(),
    pool: z.array(entrySchema),
    use_reward_pool: z.boolean(),
    reward_pool: z.array(entrySchema),
    windows: z.array(windowSchema),
    /** branch id → follow the deal / on here / off here */
    branches: z.record(z.string(), branchStateSchema),
  })
  .superRefine((v, ctx) => {
    const qty = int(v.qty);
    if (v.kind === "n_for_price") {
      if (qty === null || qty < 2 || qty > 20) ctx.addIssue({ code: "custom", path: ["qty"], message: DE.qtyN });
      const p = moneyIn(v.price);
      if (p === null || !Number.isFinite(p) || p < 0) ctx.addIssue({ code: "custom", path: ["price"], message: DE.price });
    } else {
      if (qty === null || qty < 1 || qty > 20) ctx.addIssue({ code: "custom", path: ["qty"], message: DE.qtyBuy });
      const g = int(v.get_qty);
      if (g === null || g < 1 || g > 20) ctx.addIssue({ code: "custom", path: ["get_qty"], message: DE.getQty });
      const pct = int(v.get_percent);
      if (pct === null || pct < 1 || pct > 100) ctx.addIssue({ code: "custom", path: ["get_percent"], message: DE.percent });
    }
    if (String(v.max_per_order).trim() !== "") {
      const m = int(v.max_per_order);
      if (m === null || m < 1) ctx.addIssue({ code: "custom", path: ["max_per_order"], message: DE.maxPerOrder });
    }
    if (v.pool.length === 0) ctx.addIssue({ code: "custom", path: ["pool"], message: DE.poolEmpty });
    const checkTargets = (list: typeof v.pool, path: "pool" | "reward_pool") =>
      list.forEach((e, i) => {
        if (!(e.target === "item" ? e.menu_item_id : e.category_id)) {
          ctx.addIssue({ code: "custom", path: [path, i, "target"], message: DE.poolTarget });
        }
      });
    checkTargets(v.pool, "pool");
    if (v.kind === "buy_get" && v.use_reward_pool) {
      if (v.reward_pool.length === 0) ctx.addIssue({ code: "custom", path: ["reward_pool"], message: DE.rewardEmpty });
      checkTargets(v.reward_pool, "reward_pool");
    }
    // The combo editor's window rules (the WindowsEditor shows them on the field).
    v.windows.forEach((w, i) => {
      if ((w.weekdays & ALL_WEEKDAYS) === 0) ctx.addIssue({ code: "custom", path: ["windows", i, "weekdays"], message: E.noDays });
      const s = hhmm(w.starts_at);
      const e = hhmm(w.ends_at);
      if (!!s !== !!e) ctx.addIssue({ code: "custom", path: ["windows", i, "ends_at"], message: E.hoursPair });
      else if (s && e && s === e) ctx.addIssue({ code: "custom", path: ["windows", i, "ends_at"], message: E.hoursSame });
      if (w.valid_from && w.valid_to && w.valid_from > w.valid_to) {
        ctx.addIssue({ code: "custom", path: ["windows", i, "valid_to"], message: E.datesOrder });
      }
    });
  });

export type DealFormInput = z.input<typeof dealSchema>;
export type DealFormValues = z.output<typeof dealSchema>;
export type PoolEntryForm = DealFormValues["pool"][number];
export type BranchState = z.infer<typeof branchStateSchema>;

export const emptyEntry = (target: "item" | "category" = "item"): PoolEntryForm => ({
  key: newKey("p"),
  target,
  menu_item_id: "",
  category_id: "",
  size_label: "",
});

export const EMPTY_DEAL: DealFormValues = {
  name: "",
  name_ar: "",
  kind: "n_for_price",
  qty: "2",
  price: "",
  get_qty: "1",
  get_percent: "100",
  max_per_order: "",
  is_active: true,
  pool: [emptyEntry()],
  use_reward_pool: false,
  reward_pool: [],
  windows: [],
  branches: {},
};

const entryFromWire = (e: DealPoolEntry): PoolEntryForm => ({
  key: newKey("p"),
  target: e.category_id ? "category" : "item",
  menu_item_id: e.menu_item_id ?? "",
  category_id: e.category_id ?? "",
  size_label: e.size_label ?? "",
});

const entryToWire = (e: PoolEntryForm): DealPoolEntry => ({
  menu_item_id: e.target === "item" ? e.menu_item_id : null,
  category_id: e.target === "category" ? e.category_id : null,
  size_label: e.size_label || null,
});

export function dealFromWire(d: DealRule): DealFormValues {
  return {
    name: d.name,
    name_ar: arOf(d.name_translations),
    kind: d.kind === "buy_get" ? "buy_get" : "n_for_price",
    qty: String(d.qty),
    price: d.kind === "n_for_price" ? moneyOut(d.price) : "",
    get_qty: String(d.get_qty ?? 1),
    get_percent: String(d.get_percent ?? 100),
    max_per_order: d.max_per_order ? String(d.max_per_order) : "",
    is_active: d.is_active,
    pool: d.pool.map(entryFromWire),
    use_reward_pool: d.kind === "buy_get" && d.reward_pool.length > 0,
    reward_pool: d.reward_pool.map(entryFromWire),
    windows: d.windows.map(windowFromWire),
    branches: Object.fromEntries(d.branch_overrides.map((o) => [o.branch_id, o.is_active ? "on" : "off"])),
  };
}

export function dealToWire(v: DealFormValues, sort = 0): DealWrite {
  const nFor = v.kind === "n_for_price";
  const maxPer = String(v.max_per_order).trim();
  return {
    name: v.name.trim(),
    name_translations: v.name_ar.trim() ? { ar: v.name_ar.trim() } : {},
    kind: v.kind,
    qty: Number(v.qty),
    price: nFor ? (moneyIn(v.price) ?? 0) : null,
    get_qty: nFor ? null : Number(v.get_qty),
    get_percent: nFor ? null : Number(v.get_percent),
    max_per_order: maxPer ? Number(maxPer) : null,
    sort,
    is_active: v.is_active,
    pool: v.pool.map(entryToWire),
    // [] = the reward comes from the same pool (§2.3).
    reward_pool: !nFor && v.use_reward_pool ? v.reward_pool.map(entryToWire) : [],
    windows: v.windows.map(windowToWire),
  };
}

/**
 * What the branch toggles need to send after the deal itself is saved:
 * a PUT for every branch set on or off here, a DELETE for every branch that
 * had an exception and now follows the deal again.
 */
export function branchChanges(
  before: Record<string, BranchState>,
  after: Record<string, BranchState>,
): { put: { branch_id: string; is_active: boolean }[]; clear: string[] } {
  const put: { branch_id: string; is_active: boolean }[] = [];
  const clear: string[] = [];
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const id of ids) {
    const b = before[id] ?? "inherit";
    const a = after[id] ?? "inherit";
    if (a === b) continue;
    if (a === "inherit") clear.push(id);
    else put.push({ branch_id: id, is_active: a === "on" });
  }
  return { put, clear };
}
