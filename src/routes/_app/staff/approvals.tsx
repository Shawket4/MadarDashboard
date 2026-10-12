import { createFileRoute } from "@tanstack/react-router";
import { approvalsSearch } from "@/features/dawam/search";
import { ApprovalsPage } from "@/features/dawam/approvals-page";

export const Route = createFileRoute("/_app/staff/approvals")({
  validateSearch: approvalsSearch.validateSearch,
  beforeLoad: approvalsSearch.beforeLoad,
  component: ApprovalsPage,
});
