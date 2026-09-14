import { createFileRoute } from "@tanstack/react-router";
import { TillsPage, validateTillsSearch } from "@/features/tills/tills-page";

/** ?report=<id> opens that till's report sheet; filters live in the URL too. */
export const Route = createFileRoute("/_app/tills")({
  validateSearch: validateTillsSearch,
  component: TillsPage,
});
