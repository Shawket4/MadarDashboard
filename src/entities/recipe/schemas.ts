import { z } from "zod";
import { UpsertDrinkRecipeBody, UpsertAddonIngredientBody } from "@/shared/api/generated/zod/api.zod";

export const drinkRecipeSchema = UpsertDrinkRecipeBody.extend({
  size_label: z.string().min(1),
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().trim().min(1),
  ingredient_unit: z.string().min(1),
  quantity_used: z.coerce.number().positive(),
});
export type DrinkRecipeValues = z.infer<typeof drinkRecipeSchema>;

// FIX: overrode a stray `unit` field while the contract's required
// `ingredient_unit` stayed unset — zodResolver rejected every submit silently
export const addonRecipeSchema = UpsertAddonIngredientBody.extend({
  org_ingredient_id: z.string().nullish(),
  ingredient_name: z.string().trim().min(1),
  ingredient_unit: z.string().min(1),
  quantity_used: z.coerce.number().positive(),
});
export type AddonRecipeValues = z.infer<typeof addonRecipeSchema>;
