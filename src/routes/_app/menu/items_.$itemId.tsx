import { createFileRoute } from "@tanstack/react-router";
import { MenuStudioPage } from "@/features/menu/studio/menu-studio-page";

/**
 * The flagship one-page "Menu Studio" item editor. `?tab=` selects the active
 * section (basics | sizes | recipe | modifiers | options | availability).
 */
export const Route = createFileRoute("/_app/menu/items_/$itemId")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: MenuStudioPage,
});
