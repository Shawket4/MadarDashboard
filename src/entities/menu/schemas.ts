import { z } from "zod";
import { egpToPiastres, translationMap } from "@/shared/lib/zod-utils";
import { CreateCategoryBody, CreateMenuItemBody, CreateAddonItemBody, CreateAddonSlotBody, CreateOptionalFieldBody } from "@/shared/api/generated/zod/api.zod";

// FIX: these schemas extended the generated request bodies WITHOUT omitting
// org_id — a required uuid the dialogs never render (the page injects it at
// call time). zodResolver therefore rejected every submit silently: no
// console output, no network request. Page-injected fields must never be
// part of a form schema.

export const categorySchema = CreateCategoryBody.omit({ org_id: true }).extend({
  name: z.string().trim().min(1),
  name_translations: translationMap,
  display_order: z.coerce.number().int().min(0).default(0),
  // not part of CreateCategoryRequest, but UpdateCategoryRequest accepts it
  is_active: z.boolean().default(true),
});
export type CategoryValues = z.infer<typeof categorySchema>;

const menuItemBase = CreateMenuItemBody.omit({ org_id: true }).extend({
  name: z.string().trim().min(1),
  name_translations: translationMap,
  description: z.string().trim().nullish().or(z.literal("")),
  description_translations: translationMap,
  base_price: egpToPiastres,
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
  // client-side only — sizes are replayed through upsertSize after save
  sizes: z.array(z.object({
    id: z.string().optional(),
    label: z.string().trim().min(1),
    price_override: egpToPiastres,
    display_order: z.coerce.number().int().min(0).default(0),
  })).default([]),
});

// CreateMenuItemRequest marks category_id REQUIRED (non-nullable uuid)…
export const menuItemSchema = menuItemBase.extend({ category_id: z.string().min(1) });
// …while UpdateMenuItemRequest allows clearing it ("" → null at the call site)
export const updateMenuItemSchema = menuItemBase.extend({ category_id: z.string() });
export type MenuItemValues = z.infer<typeof updateMenuItemSchema>;

export const addonSchema = CreateAddonItemBody.omit({ org_id: true }).extend({
  name: z.string().trim().min(1),
  name_translations: translationMap,
  addon_type: z.string().trim().min(1),
  default_price: egpToPiastres,
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type AddonValues = z.infer<typeof addonSchema>;

export const slotSchema = CreateAddonSlotBody.extend({
    addon_type: z.string().trim().min(1),
    label: z.string().trim().nullish().or(z.literal("")),
    label_translations: translationMap,
    is_required: z.boolean().default(false),
    min_selections: z.coerce.number().int().min(0).default(0),
    max_selections: z.coerce.number().int().min(1).nullish(),
    display_order: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => !v.max_selections || v.max_selections >= v.min_selections, {
    message: "Max must be ≥ min",
    path: ["max_selections"],
  });
export type SlotValues = z.infer<typeof slotSchema>;

export const optionalSchema = CreateOptionalFieldBody.extend({
  name: z.string().trim().min(1),
  name_translations: translationMap,
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().nullish(),
  ingredient_unit: z.string().nullish(),
  quantity_used: z.coerce.number().min(0).nullish(),
  is_active: z.boolean().default(true),
});
export type OptionalValues = z.infer<typeof optionalSchema>;
