import { createFileRoute } from "@tanstack/react-router";
import { ComboEditorPage } from "@/features/combos/combo-editor-page";

/**
 * The combo editor. `new` creates one. The trailing underscore un-nests it
 * from the list route (like `items_.$itemId`), so the route id carries it too.
 */
export const Route = createFileRoute("/_app/menu/combos_/$comboId")({
  component: ComboEditorPage,
});
