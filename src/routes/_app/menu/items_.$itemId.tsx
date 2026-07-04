import { createFileRoute } from "@tanstack/react-router";
import { MenuStudioPage } from "@/features/menu/studio/menu-studio-page";

/**
 * The flagship one-page "Menu Studio" item editor — a single scrollable column
 * with one batched save. `?tab=` is kept for old deep links and maps onto the
 * section anchors (basics→item, sizes/recipe→sizes, modifiers, options;
 * availability now lives on /menu/pricing and lands on the header link).
 */
export const Route = createFileRoute("/_app/menu/items_/$itemId")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: MenuStudioPage,
});
