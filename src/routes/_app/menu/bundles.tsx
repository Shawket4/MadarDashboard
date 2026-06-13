import { createFileRoute } from "@tanstack/react-router";
import { BundlesPage } from "@/features/bundles/bundles-page";

/** ?edit=<id>|new opens the bundle editor, ?perf=<id> the performance dialog. */
export const Route = createFileRoute("/_app/menu/bundles")({
  validateSearch: (s: Record<string, unknown>): { edit?: string; perf?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    perf: typeof s.perf === "string" ? s.perf : undefined,
  }),
  component: BundlesPage,
});
