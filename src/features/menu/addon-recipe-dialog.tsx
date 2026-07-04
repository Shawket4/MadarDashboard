import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { RecipeBuilder, type CleanRow, type RecipeRowInit } from "@/features/recipes/recipe-builder";
import {
  listAddonIngredients,
  putOptionRecipe,
  useListAddonIngredients,
  useListCatalog,
} from "@/data/api/generated/api";
import type { AddonItem } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  addon: AddonItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit a reusable add-on's ingredient recipe. An add-on is a modifier OPTION
 * in the unified model (same stable id); its recipe is one replace-set of
 * id-keyed lines written via `putOptionRecipe`. Add-ons aren't sized, so the
 * builder runs a single `one_size` column. This is the home for add-on recipe
 * editing after the standalone Recipes page was retired.
 */
export function AddonRecipeDialog({ orgId, addon, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const catalogQ = useListCatalog(orgId, { query: { enabled: open && !!orgId } });
  const catalog = useMemo(() => catalogQ.data ?? [], [catalogQ.data]);
  const ingredients = useListAddonIngredients(addon?.id ?? "", { query: { enabled: open && !!addon?.id } });

  const initialRows = useMemo<RecipeRowInit[]>(
    () =>
      (ingredients.data ?? []).map((r) => ({
        size_label: "one_size",
        org_ingredient_id: r.org_ingredient_id ?? null,
        ingredient_name: r.ingredient_name,
        ingredient_unit: r.unit,
        quantity_used: r.quantity_used,
      })),
    [ingredients.data],
  );

  const saveAll = async (rows: CleanRow[]) => {
    if (!addon) return;
    try {
      const lines = rows
        .filter((r) => r.org_ingredient_id)
        .map((r) => ({ ingredient_id: r.org_ingredient_id!, quantity: r.quantity_used, unit: r.ingredient_unit }));
      await putOptionRecipe(addon.id, lines);
      void invalidateCatalog();
      toast.success(t("recipes.builder.saved", "Recipe saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("menu.addonRecipe.title", "Add-on recipe")}</DialogTitle>
          <DialogDescription>
            {addon?.name} — {t("menu.addonRecipe.desc", "Ingredients deducted from stock when this add-on is chosen.")}
          </DialogDescription>
        </DialogHeader>
        {open && addon ? (
          ingredients.isLoading ? (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          ) : (
            <RecipeBuilder
              orgId={orgId}
              sizes={["one_size"]}
              initialRows={initialRows}
              catalog={catalog}
              priceForSize={() => addon.default_price ?? null}
              copySources={[]}
              fetchCopyRows={async (id) =>
                (await listAddonIngredients(id)).map((r) => ({
                  size_label: "one_size",
                  org_ingredient_id: r.org_ingredient_id ?? null,
                  ingredient_name: r.ingredient_name,
                  ingredient_unit: r.unit,
                  quantity_used: r.quantity_used,
                }))
              }
              onSave={saveAll}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
