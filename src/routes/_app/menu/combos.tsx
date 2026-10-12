import { createFileRoute } from "@tanstack/react-router";
import { CombosPage } from "@/features/combos/combos-page";
import { combosSearch } from "@/features/combos/search";

/** Menu › Combos: the list. A row opens the editor at `/menu/combos/$comboId`.
 *  Search, category, status and page live in the URL and are restored on return. */
export const Route = createFileRoute("/_app/menu/combos")({
  validateSearch: combosSearch.validateSearch,
  beforeLoad: combosSearch.beforeLoad,
  component: CombosPage,
});
