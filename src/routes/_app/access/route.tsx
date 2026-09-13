import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SectionTabsProvider } from "@/components/app/section-tabs";

/**
 * Access shell — merges Users and Roles & Permissions into one section with a
 * standardized sub-nav. Each tab reuses its existing feature (features/users,
 * features/permissions) as the body; deep-link params (?edit / ?branches /
 * ?user) survive inside a tab but reset when switching between tabs.
 */
function AccessLayout() {
  const { t } = useTranslation();
  return (
    <SectionTabsProvider
      tabs={[
        { to: "/access/users", label: t("nav.users", "Users") },
        { to: "/access/roles", label: t("nav.rolesPermissions", "Roles & Permissions") },
      ]}
    >
      <Outlet />
    </SectionTabsProvider>
  );
}

export const Route = createFileRoute("/_app/access")({
  component: AccessLayout,
});
