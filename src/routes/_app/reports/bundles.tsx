import { createFileRoute } from "@tanstack/react-router";
import { BundlesReportPage } from "@/features/reports/bundles/bundles-report-page";

/** Reports › Bundles: each combo and deal as its own line (C6). */
export const Route = createFileRoute("/_app/reports/bundles")({
  component: BundlesReportPage,
});
