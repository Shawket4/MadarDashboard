import { createFileRoute } from "@tanstack/react-router";
import { RequestsInboxPage } from "@/features/staff/requests-inbox";

export const Route = createFileRoute("/_app/staff/requests")({
  component: RequestsInboxPage,
});
