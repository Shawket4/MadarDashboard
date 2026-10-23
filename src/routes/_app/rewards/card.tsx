import { createFileRoute } from "@tanstack/react-router";
import { CardDesignerPage } from "@/features/rewards/card/card-designer-page";

/** The card designer: templates, the grid, wallet fields, live preview, publish. */
export const Route = createFileRoute("/_app/rewards/card")({
  component: CardDesignerPage,
});
