import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateCatalogItem } from "@/data/api/generated/api";
import type { OrgIngredient } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres } from "@/lib/format";

/**
 * Inline "fix cost" flow — set the ingredient's cost per unit without leaving the
 * editor. Patches the org catalog item; the live cost recomputes on refetch.
 * (Extracted unchanged from the old recipe tab.)
 */
export function FixCostPopover({
  ingredient,
  orgId,
  onFixed,
}: {
  ingredient: OrgIngredient;
  orgId: string | null;
  onFixed: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!orgId) return;
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0) {
      toast.error(t("menu.studio.recipe.invalidCost", "Enter a valid cost"));
      return;
    }
    setSaving(true);
    try {
      await updateCatalogItem(orgId, ingredient.id, { cost_per_unit: egpToPiastres(n) });
      toast.success(t("menu.studio.recipe.costSet", "Ingredient cost set"));
      setOpen(false);
      onFixed();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-warning/40 px-2 py-0.5 text-xs font-medium text-warning hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Coins className="size-3" />
          {t("menu.studio.recipe.setCost", "Set cost")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{ingredient.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("menu.studio.recipe.costPerUnit", {
              unit: t(`units.${ingredient.unit}`, ingredient.unit),
              defaultValue: "Cost per {{unit}} (EGP)",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            className="tabular"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <Button type="button" size="sm" loading={saving} onClick={() => void submit()}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
