import { createFileRoute } from "@tanstack/react-router";
import { AutomationsPage } from "@/features/rewards/automations/automations-page";

/** Birthdays, win-back, sign-up and the pass: the programme form's other cards. */
export const Route = createFileRoute("/_app/rewards/automations")({
  component: AutomationsPage,
});
