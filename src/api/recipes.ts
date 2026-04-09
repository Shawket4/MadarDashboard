import client from "@/lib/client";
import type { DrinkRecipe, AddonIngredient } from "@/types";

// ── Drink Recipes (base recipe per size) ──────────────────────────────────────
// These are unchanged — every drink has a base recipe independent of addons.
export const getDrinkRecipes = (menuItemId: string) => client.get<DrinkRecipe[]>(`/recipes/drinks/${menuItemId}`);
export const upsertDrinkRecipe = (menuItemId: string, data: Record<string, unknown>) => client.post<DrinkRecipe>(`/recipes/drinks/${menuItemId}`, data);
export const deleteDrinkRecipe = (itemId: string, size: string, ingredientName: string) =>
  client.delete(`/recipes/drinks/${itemId}/${size}`, { params: { ingredient_name: ingredientName } });

// ── Addon Ingredients (global addon recipe) ───────────────────────────────────
// These are unchanged — each addon has a global deduction recipe.
// The new override system (menu_item_addon_overrides) is accessed via menu.ts
// using the getAddonOverrides / upsertAddonOverride / deleteAddonOverride functions.
export const getAddonIngredients = (addonItemId: string) => client.get<AddonIngredient[]>(`/recipes/addons/${addonItemId}`);
export const upsertAddonIngredient = (addonItemId: string, data: Record<string, unknown>) => client.post<AddonIngredient>(`/recipes/addons/${addonItemId}`, data);
export const deleteAddonIngredient = (addonId: string, ingredientName: string) =>
  client.delete(`/recipes/addons/${addonId}`, { params: { ingredient_name: ingredientName } });

// Legacy option group override endpoints REMOVED.
// The new addon override system is managed via:
//   - getAddonOverrides(menuItemId) in menu.ts
//   - upsertAddonOverride(menuItemId, data) in menu.ts
//   - deleteAddonOverride(menuItemId, overrideId) in menu.ts