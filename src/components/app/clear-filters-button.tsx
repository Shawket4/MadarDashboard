import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { ListFilters } from "@/data/scope/use-list-filters";
import type { ListSpec } from "@/data/scope/list-search";

/**
 * "Clear filters" for a URL-bound list (useListFilters). Filters now follow
 * the reader around (they are restored on return), so every filtered list
 * offers one obvious way back to the full list. Renders nothing at defaults.
 * `keep` names keys that are not filters (the tab) — kept, and not counted.
 */
export function ClearFiltersButton<S extends ListSpec>({ filters, keep = [] }: { filters: ListFilters<S>; keep?: (keyof S)[] }) {
  const { t } = useTranslation();
  if (!filters.isFiltered(keep)) return null;
  return (
    <Button variant="ghost" size="sm" className="h-9" onClick={() => filters.reset(keep)}>
      <X aria-hidden />
      {t("common.clearFilters", "Clear filters")}
    </Button>
  );
}
