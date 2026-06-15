import { createFileRoute } from "@tanstack/react-router";
import { BranchOverridesPage } from "@/features/menu/branch-overrides-page";

export const Route = createFileRoute("/_app/menu/overrides")({
  component: BranchOverridesPage,
});
