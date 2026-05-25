import { z } from "zod";
import { egpToPiastres } from "@/shared/lib/zod-utils";
import { CreateCategoryBody, CreateMenuItemBody, CreateAddonItemBody, CreateAddonSlotBody, CreateOptionalFieldBody } from "@/shared/api/generated/zod/api.zod";

export const categorySchema = CreateCategoryBody.extend({
  name: z.string().trim().min(1),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type CategoryValues = z.infer<typeof categorySchema>;

export const menuItemSchema = CreateMenuItemBody.extend({
  name: z.string().trim().min(1),
  description: z.string().trim().nullish().or(z.literal("")),
  base_price: egpToPiastres,
  category_id: z.string().nullish().or(z.literal("")),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
  sizes: z.array(z.object({
    id: z.string().optional(),
    label: z.string().trim().min(1),
    price_override: egpToPiastres,
    display_order: z.coerce.number().int().min(0).default(0),
  })).default([]),
});
export type MenuItemValues = z.infer<typeof menuItemSchema>;

export const addonSchema = CreateAddonItemBody.extend({
  name: z.string().trim().min(1),
  addon_type: z.string().trim().min(1),
  default_price: egpToPiastres,
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type AddonValues = z.infer<typeof addonSchema>;

export const slotSchema = CreateAddonSlotBody.extend({
    addon_type: z.string().trim().min(1),
    label: z.string().trim().nullish().or(z.literal("")),
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
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().nullish(),
  ingredient_unit: z.string().nullish(),
  quantity_used: z.coerce.number().min(0).nullish(),
  is_active: z.boolean().default(true),
});
export type OptionalValues = z.infer<typeof optionalSchema>;
