import { z } from "zod";
export const drinkRecipeSchema = z.object({
  size_label: z.string().min(1),
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().trim().min(1),
  ingredient_unit: z.string().min(1),
  quantity_used: z.coerce.number().positive(),
});
export type DrinkRecipeValues = z.infer<typeof drinkRecipeSchema>;

export const addonRecipeSchema = z.object({
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().trim().min(1),
  unit: z.string().min(1),
  quantity_used: z.coerce.number().positive(),
});
export type AddonRecipeValues = z.infer<typeof addonRecipeSchema>;
