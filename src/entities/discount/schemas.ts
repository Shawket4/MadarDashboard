import { z } from "zod";
import { egpToPiastres, translationMap } from "@/shared/lib/zod-utils";

export const discountBaseSchema = z.object({
  name: z.string().trim().min(1),
  name_translations: translationMap,
  dtype: z.enum(["percentage", "fixed"]),
  percent_value: z.coerce.number().int().min(1).max(100).optional(),
  fixed_value: egpToPiastres.optional(),
  is_active: z.boolean().default(true),
});

export const discountSchema = discountBaseSchema.refine(
  (v) => v.dtype === "percentage" ? v.percent_value !== undefined : v.fixed_value !== undefined,
  {
    message: "Value is required",
    path: ["percent_value"],
  }
);

export type DiscountValues = z.infer<typeof discountSchema>;
