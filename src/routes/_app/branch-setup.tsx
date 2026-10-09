import { createFileRoute } from "@tanstack/react-router";
import { BranchBuilderPage } from "@/features/branch-builder/builder-page";

export const Route = createFileRoute("/_app/branch-setup")({
  component: BranchBuilderPage,
});
