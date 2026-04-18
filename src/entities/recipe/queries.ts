import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { recipeApi } from "./api";

export const useDrinkRecipes = (menuItemId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.drinkRecipes(menuItemId ?? ""),
    queryFn: () => recipeApi.listDrink(menuItemId!),
    enabled: !!menuItemId,
  });

export const useAddonRecipes = (addonId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.addonRecipes(addonId ?? ""),
    queryFn: () => recipeApi.listAddon(addonId!),
    enabled: !!addonId,
  });
