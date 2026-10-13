import { createFileRoute } from "@tanstack/react-router";
import { requestsSearch } from "@/features/staff/search";
import { RequestsInboxPage } from "@/features/staff/requests-inbox";

export const Route = createFileRoute("/_app/staff/requests")({
  validateSearch: requestsSearch.validateSearch,
  beforeLoad: requestsSearch.beforeLoad,
  component: RequestsInboxPage,
});
