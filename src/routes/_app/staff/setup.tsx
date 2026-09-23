import { createFileRoute } from "@tanstack/react-router";
import { SetupPage } from "@/features/dawam/setup-page";

export const Route = createFileRoute("/_app/staff/setup")({
  component: SetupPage,
});
