import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useListCatalog } from "@/data/api/generated/api";
import type { OrgIngredient } from "@/data/api/generated/models";
import { isPickable } from "@/features/inventory/archive";

/** Shared org ingredient catalog → lookup + picker options. */
export const useIngredientPicker = (orgId: string | null) => {
  const { t } = useTranslation();
  const catalogQ = useListCatalog(orgId ?? "", undefined, { query: { enabled: !!orgId } });
  const catalog = useMemo(() => catalogQ.data ?? [], [catalogQ.data]);
  const catalogById = useMemo(() => new Map<string, OrgIngredient>(catalog.map((c) => [c.id, c])), [catalog]);
  const ingredientOptions = useMemo(
    () =>
      // Archived/inactive ones stay (hidden) so a saved line keeps its name.
      catalog.map((c) => ({ value: c.id, label: c.name, hint: t(`units.${c.unit}`, c.unit), keywords: c.category_name, hidden: !isPickable(c) })),
    [catalog, t],
  );
  return { catalogById, ingredientOptions };
};

