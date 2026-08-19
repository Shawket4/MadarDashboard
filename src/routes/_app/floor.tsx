import { createFileRoute } from "@tanstack/react-router";
import { FloorPage } from "@/features/floor/floor-page";

export const Route = createFileRoute("/_app/floor")({
  component: FloorPage,
});
