import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SectionTabsProvider } from "@/components/app/section-tabs";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

/**
 * Access shell — merges Users and Roles & Permissions into one section with a
 * standardized sub-nav. Each tab reuses its existing feature (features/users,
 * features/access) as the body; deep-link params (?edit / ?branches /
 * ?user) survive inside a tab but reset when switching between tabs.
 */
function AccessLayout() {
  const { t } = useTranslation();
  const canReview = useCan(Cap.approvalsReview);
  return (
    <SectionTabsProvider
      tabs={[
        { to: "/access/users", label: t("nav.users", "Users") },
        { to: "/access/roles", label: t("nav.rolesPermissions", "Roles & Permissions") },
        ...(canReview ? [{ to: "/access/review", label: t("access.review.title", "Review") }] : []),
      ]}
    >
      <Outlet />
    </SectionTabsProvider>
  );
}

export const Route = createFileRoute("/_app/access")({
  component: AccessLayout,
});
