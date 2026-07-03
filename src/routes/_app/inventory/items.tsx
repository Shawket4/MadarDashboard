import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — inventory Items renamed to Ingredients. */
export const Route = createFileRoute("/_app/inventory/items")({
  beforeLoad: () => {
    throw redirect({ to: "/inventory/ingredients" });
  },
});
