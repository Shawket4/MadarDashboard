import { createFileRoute } from "@tanstack/react-router";
import { BasiraPage } from "@/features/basira/basira-page";

/** Basira — the analytics assistant. Named for بصيرة, "insight". */
export const Route = createFileRoute("/_app/basira")({
  component: BasiraPage,
});
