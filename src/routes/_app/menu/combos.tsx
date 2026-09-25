import { createFileRoute } from "@tanstack/react-router";
import { CombosPage } from "@/features/combos/combos-page";

/** Menu › Combos: the list. A row opens the editor at `/menu/combos/$comboId`. */
export const Route = createFileRoute("/_app/menu/combos")({
  component: CombosPage,
});
