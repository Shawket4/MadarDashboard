import { createFileRoute } from "@tanstack/react-router";
import { SetupPage } from "@/features/setup/setup-page";

/** Can the shop sell yet, and what stops it (GET /orgs/{id}/readiness). Signup lands here. */
export const Route = createFileRoute("/_app/setup")({
  component: SetupPage,
});
