import { z } from "zod";
import { egpToPiastres } from "@/shared/lib/zod-utils";

export const bundleSchema = z.object({
  name: z.string().trim().min(1, "Bundle name is required"),
  description: z.string().trim().nullish().or(z.literal("")),
  price: egpToPiastres, // EGP String input -> piastres integer on submit
  display_order: z.coerce.number().int().min(0).default(0),
  
  available_from_time: z.string().nullish().or(z.literal("")),
  available_until_time: z.string().nullish().or(z.literal("")),
  available_from_date: z.string().nullish().or(z.literal("")),
  available_until_date: z.string().nullish().or(z.literal("")),

  components: z
    .array(
      z.object({
        item_id: z.string().min(1, "Menu item is required"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
        position: z.number().int().optional(),
      })
    )
    .min(2, "A bundle must contain at least 2 items")
    .max(6, "A bundle cannot contain more than 6 items")
    .refine(
      (items) => {
        const ids = items.map((it) => it.item_id);
        return new Set(ids).size === ids.length;
      },
      {
        message: "Duplicate menu items are not allowed in components",
        path: [0, "item_id"],
      }
    ),

  branch_ids: z.array(z.string()).default([]),
});

export type BundleFormValues = z.infer<typeof bundleSchema>;
