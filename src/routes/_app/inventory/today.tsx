import { createFileRoute } from "@tanstack/react-router";
import { TodayPage } from "@/features/inventory/today-page";

export const Route = createFileRoute("/_app/inventory/today")({
  component: TodayPage,
});
