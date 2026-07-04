import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired: item recipes live in the Menu Studio (per-size Recipe tab), add-on
 *  recipes in the Add-ons manager's "Edit recipe". Old deep links land on the
 *  items list. */
export const Route = createFileRoute("/_app/menu/recipes")({
  beforeLoad: () => {
    throw redirect({ to: "/menu/items" });
  },
});
