import { createFileRoute } from "@tanstack/react-router";
import { MenuAdvisorPage } from "@/features/menu-advisor/advisor-page";

export const Route = createFileRoute("/_app/menu/advisor")({
  component: MenuAdvisorPage,
});
