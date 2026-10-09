/**
 * The combo editor's form: a Zod schema over what the owner types (EGP text,
 * EN/AR pairs, "" for none), plus the two mappings to and from the wire's
 * `ComboWrite` (piastres, translations, null for none).
 *
 * The schema holds the same rules the server refuses with (§2.7):
 * `COMBO_SLOTS_REQUIRED`, `COMBO_SLOT_INVALID` (min > max, max = 0, no
 * choices, a default that isn't a choice) — so a Save that would 400 is
 * caught on the field instead. Margin and saving are NOT here: they are
 * warnings (C11) and never block Save.
 */
import { z } from "zod";

import { arOf } from "./types";
import type { Combo, ComboChoiceWrite, ComboSlotWrite, ComboWrite, SaleWindow } from "./types";
import { ALL_WEEKDAYS, hhmm, moneyIn, moneyOut } from "./util";

/** Keys, not messages: the screens translate them (`combos.errors.*`). */
export const E = {
  required: "combos.errors.required",
  money: "combos.errors.money",
  slotsRequired: "combos.errors.slotsRequired",
  minOverMax: "combos.errors.minOverMax",
  maxZero: "combos.errors.maxZero",
  pickRange: "combos.errors.pickRange",
  noChoices: "combos.errors.noChoices",
  choiceTarget: "combos.errors.choiceTarget",
  choiceDuplicate: "combos.errors.choiceDuplicate",
  defaultNotChoice: "combos.errors.defaultNotChoice",
  noDays: "combos.errors.noDays",
  hoursPair: "combos.errors.hoursPair",
  hoursSame: "combos.errors.hoursSame",
  datesOrder: "combos.errors.datesOrder",
} as const;

const money = z.string().refine((v) => {
  const p = moneyIn(v);
  return p === null || (Number.isFinite(p) && p >= 0);
}, E.money);

const sizeSurcharge = z.object({ size_label: z.string(), surcharge: money });

export const choiceSchema = z.object({
  /** Stable client key for React and field arrays. */
  key: z.string(),
  id: z.string().optional(),
  target: z.enum(["item", "category"]),
  menu_item_id: z.string(),
  category_id: z.string(),
  surcharge: money,
  /** "" = the item's cheapest active size */
  included_size_label: z.string(),
  size_surcharges: z.array(sizeSurcharge),
});

export const slotSchema = z.object({
  key: z.string(),
  id: z.string().optional(),
  name: z.string().trim().min(1, E.required),
  name_ar: z.string(),
  min: z.coerce.number<number | string>().int().min(0, E.pickRange).max(10, E.pickRange),
  max: z.coerce.number<number | string>().int().min(0, E.pickRange).max(10, E.pickRange),
  default_item_id: z.string(),
  default_size_label: z.string(),
  choices: z.array(choiceSchema),
});

export const windowSchema = z.object({
  key: z.string(),
  /** "" = every branch */
  branch_id: z.string(),
  weekdays: z.number().int(),
  starts_at: z.string(),
  ends_at: z.string(),
  valid_from: z.string(),
  valid_to: z.string(),
});

export const comboSchema = z
  .object({
    name: z.string().trim().min(1, E.required),
    name_ar: z.string(),
    description: z.string(),
    description_ar: z.string(),
    category_id: z.string(),
    is_active: z.boolean(),
    price: z.string().refine((v) => {
      const p = moneyIn(v);
      return p !== null && Number.isFinite(p) && p >= 0;
    }, E.money),
    slots: z.array(slotSchema),
    windows: z.array(windowSchema),
  })
  .superRefine((v, ctx) => {
    if (v.slots.length === 0) ctx.addIssue({ code: "custom", path: ["slots"], message: E.slotsRequired });
    v.slots.forEach((s, i) => {
      const min = Number(s.min);
      const max = Number(s.max);
      if (max === 0) ctx.addIssue({ code: "custom", path: ["slots", i, "max"], message: E.maxZero });
      else if (min > max) ctx.addIssue({ code: "custom", path: ["slots", i, "min"], message: E.minOverMax });
      if (s.choices.length === 0) ctx.addIssue({ code: "custom", path: ["slots", i, "choices"], message: E.noChoices });
      const seen = new Set<string>();
      s.choices.forEach((c, j) => {
        const id = c.target === "item" ? c.menu_item_id : c.category_id;
        if (!id) {
          ctx.addIssue({ code: "custom", path: ["slots", i, "choices", j, "target"], message: E.choiceTarget });
          return;
        }
        const k = `${c.target}:${id}`;
        if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["slots", i, "choices", j, "target"], message: E.choiceDuplicate });
        seen.add(k);
      });
      // A default must be one of the slot's own item choices. A category
      // choice admits items we can't enumerate here; the server checks those.
      if (s.default_item_id) {
        const itemChoice = s.choices.some((c) => c.target === "item" && c.menu_item_id === s.default_item_id);
        const anyCategory = s.choices.some((c) => c.target === "category" && !!c.category_id);
        if (!itemChoice && !anyCategory) {
          ctx.addIssue({ code: "custom", path: ["slots", i, "default_item_id"], message: E.defaultNotChoice });
        }
      }
    });
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

export type ComboFormInput = z.input<typeof comboSchema>;
export type ComboFormValues = z.output<typeof comboSchema>;
export type SlotFormValues = ComboFormValues["slots"][number];
export type ChoiceFormValues = SlotFormValues["choices"][number];
export type WindowFormValues = ComboFormValues["windows"][number];

let seq = 0;
/** A client key for a new row (never sent). */
export const newKey = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const emptyChoice = (): ChoiceFormValues => ({
  key: newKey("c"),
  target: "item",
  menu_item_id: "",
  category_id: "",
  surcharge: "",
  included_size_label: "",
  size_surcharges: [],
});

export const emptySlot = (): SlotFormValues => ({
  key: newKey("s"),
  name: "",
  name_ar: "",
  min: 1,
  max: 1,
  default_item_id: "",
  default_size_label: "",
  choices: [emptyChoice()],
});

export const emptyWindow = (): WindowFormValues => ({
  key: newKey("w"),
  branch_id: "",
  weekdays: ALL_WEEKDAYS,
  starts_at: "",
  ends_at: "",
  valid_from: "",
  valid_to: "",
});

export const EMPTY_COMBO: ComboFormValues = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  category_id: "",
  is_active: true,
  price: "",
  slots: [emptySlot()],
  windows: [],
};

const ar = arOf;
const trOf = (arName: string): Record<string, string> => (arName.trim() ? { ar: arName.trim() } : {});
const orNull = (s: string): string | null => (s.trim() ? s.trim() : null);

export function windowFromWire(w: SaleWindow): WindowFormValues {
  return {
    key: newKey("w"),
    branch_id: w.branch_id ?? "",
    weekdays: w.weekdays ?? ALL_WEEKDAYS,
    starts_at: hhmm(w.starts_at) ?? "",
    ends_at: hhmm(w.ends_at) ?? "",
    valid_from: w.valid_from ?? "",
    valid_to: w.valid_to ?? "",
  };
}

export function windowToWire(w: WindowFormValues): SaleWindow {
  const s = hhmm(w.starts_at);
  const e = hhmm(w.ends_at);
  const hours = s && e;
  return {
    branch_id: w.branch_id || null,
    weekdays: w.weekdays,
    starts_at: hours ? s : null,
    ends_at: hours ? e : null,
    valid_from: w.valid_from || null,
    valid_to: w.valid_to || null,
  };
}

export function fromWire(c: Combo): ComboFormValues {
  return {
    name: c.name,
    name_ar: ar(c.name_translations),
    description: c.description ?? "",
    description_ar: ar(c.description_translations),
    category_id: c.category_id ?? "",
    is_active: c.is_active,
    price: moneyOut(c.price),
    slots: [...c.slots]
      .sort((a, b) => a.sort - b.sort)
      .map((s) => ({
        key: s.id ?? newKey("s"),
        id: s.id ?? undefined,
        name: s.name,
        name_ar: ar(s.name_translations),
        min: s.min,
        max: s.max,
        default_item_id: s.default_item_id ?? "",
        default_size_label: s.default_size_label ?? "",
        choices: [...s.choices]
          .sort((a, b) => a.sort - b.sort)
          .map((ch) => ({
            key: ch.id ?? newKey("c"),
            id: ch.id ?? undefined,
            target: ch.category_id ? ("category" as const) : ("item" as const),
            menu_item_id: ch.menu_item_id ?? "",
            category_id: ch.category_id ?? "",
            surcharge: ch.surcharge ? moneyOut(ch.surcharge) : "",
            included_size_label: ch.included_size_label ?? "",
            size_surcharges: ch.size_surcharges.map((x) => ({ size_label: x.size_label, surcharge: moneyOut(x.surcharge) })),
          })),
      })),
    windows: c.windows.map(windowFromWire),
  };
}

function choiceToWire(c: ChoiceFormValues, sort: number): ComboChoiceWrite {
  const item = c.target === "item";
  return {
    ...(c.id ? { id: c.id } : {}),
    menu_item_id: item ? c.menu_item_id : null,
    category_id: item ? null : c.category_id,
    surcharge: moneyIn(c.surcharge) ?? 0,
    included_size_label: orNull(c.included_size_label),
    // A blank box means "charge the size's usual difference" (C9): no row.
    size_surcharges: c.size_surcharges
      .map((x) => ({ size_label: x.size_label, surcharge: moneyIn(x.surcharge) }))
      .filter((x): x is { size_label: string; surcharge: number } => x.surcharge !== null && Number.isFinite(x.surcharge)),
    sort,
  };
}

function slotToWire(s: SlotFormValues, sort: number): ComboSlotWrite {
  return {
    ...(s.id ? { id: s.id } : {}),
    name: s.name.trim(),
    name_translations: trOf(s.name_ar),
    sort,
    min: Number(s.min),
    max: Number(s.max),
    default_item_id: s.default_item_id || null,
    default_size_label: s.default_item_id ? orNull(s.default_size_label) : null,
    choices: s.choices.map(choiceToWire),
  };
}

export function toWire(v: ComboFormValues): ComboWrite {
  return {
    name: v.name.trim(),
    name_translations: trOf(v.name_ar),
    category_id: v.category_id || null,
    description: orNull(v.description),
    description_translations: trOf(v.description_ar),
    is_active: v.is_active,
    price: moneyIn(v.price) ?? 0,
    windows: v.windows.map(windowToWire),
    slots: v.slots.map(slotToWire),
  };
}

/**
 * The same mapping for the live economics panel, tolerant of a half-typed
 * form: it drops choices with no target and returns null until there is a
 * price and at least one slot with a choice, so the panel never asks the
 * server about a combo that can't exist.
 */
export function toEconomicsBody(v: ComboFormInput): ComboWrite | null {
  const price = moneyIn(v.price);
  if (price === null || !Number.isFinite(price) || price < 0) return null;
  // A watched form can hold holes for a moment (a row being added or removed).
  const slots = (v.slots ?? [])
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s, i) => {
      const choices = (s.choices ?? []).filter((c) => !!c && (c.target === "item" ? !!c.menu_item_id : !!c.category_id));
      const min = Number(s.min);
      const max = Number(s.max);
      if (!choices.length || !Number.isInteger(min) || !Number.isInteger(max) || max < 1 || min > max) return null;
      return slotToWire({ ...(s as SlotFormValues), min, max, name: s.name || "—", choices: choices as ChoiceFormValues[] }, i);
    })
    .filter((s): s is ComboSlotWrite => s !== null);
  if (!slots.length) return null;
  return {
    name: v.name?.trim() || "—",
    name_translations: {},
    category_id: v.category_id || null,
    description: null,
    is_active: v.is_active ?? true,
    price,
    windows: [],
    slots,
  };
}
