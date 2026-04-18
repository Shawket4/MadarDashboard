import { apiClient } from "@/shared/api/client";
import type { AddonIngredient, DrinkRecipe } from "@/shared/types";

export const recipeApi = {
  listDrink: (menuItemId: string) => apiClient.get<DrinkRecipe[]>(`/recipes/drinks/${menuItemId}`).then((r) => r.data),
  upsertDrink: (
    menuItemId: string,
    data: {
      size_label: string;
      org_ingredient_id?: string | null;
      ingredient_name: string;
      ingredient_unit: string;
      quantity_used: number;
    },
  ) => apiClient.post<DrinkRecipe>(`/recipes/drinks/${menuItemId}`, data).then((r) => r.data),
  removeDrink: (menuItemId: string, sizeLabel: string, ingredientName: string) =>
    apiClient
      .delete(`/recipes/drinks/${menuItemId}/${sizeLabel}`, { params: { ingredient_name: ingredientName } })
      .then(() => undefined),
  listAddon: (addonId: string) => apiClient.get<AddonIngredient[]>(`/recipes/addons/${addonId}`).then((r) => r.data),
  upsertAddon: (
    addonId: string,
    data: { org_ingredient_id?: string | null; ingredient_name: string; unit: string; quantity_used: number },
  ) => apiClient.post<AddonIngredient>(`/recipes/addons/${addonId}`, data).then((r) => r.data),
  removeAddon: (addonId: string, ingredientName: string) =>
    apiClient.delete(`/recipes/addons/${addonId}`, { params: { ingredient_name: ingredientName } }).then(() => undefined),
};
