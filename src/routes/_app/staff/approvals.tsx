import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsPage } from "@/features/dawam/approvals-page";

export const Route = createFileRoute("/_app/staff/approvals")({
  component: ApprovalsPage,
});
