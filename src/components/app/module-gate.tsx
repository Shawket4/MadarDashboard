/**
 * Route-level module gating (PS-2, PS-3): a page that belongs to a module the
 * org has switched off is not reachable by typing its URL, not just hidden
 * from the nav. The module of a path comes from the nav config (the one place
 * pages are tagged), and the org's modules from the server. A page of a plan
 * feature the org's plan lacks (Free) shows the upgrade page the same way.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouterState } from "@tanstack/react-router";
import { Blocks } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { getErrorMessage } from "@/data/api/errors";
import { featureOfPath, moduleOfPath } from "@/config/nav";
import { UpgradePage } from "@/components/app/upgrade-page";
import { useAuthStore } from "@/data/stores/auth.store";
import { orgHasFeature } from "@/lib/plan-features";
import { useAuthzLoadError } from "@/data/authz/use-authz";
import { useOrgModulesState } from "@/hooks/use-org-modules";

export function ModuleGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // The path of the page ON SCREEN, not of the one being navigated to: while a
  // redirect (the onboarding gate) loads its target, the old page is still
  // rendered under the new location, and judging it by that location let a
  // paid page mount, and ask for what Free may not read, on its way out.
  const pathname = useRouterState({ select: (s) => (s.resolvedLocation ?? s.location).pathname });
  const { modules, known, error, retry } = useOrgModulesState();
  const authzFailed = useAuthzLoadError();
  const needs = moduleOfPath(pathname);
  const plan = useAuthStore((s) => s.plan);
  useAuthStore((s) => s.addons); // an add-on switched alone re-renders the gate
  const feature = featureOfPath(pathname);
  if (authzFailed) {
    return (
      <div className="p-6">
        <ErrorState
          title={t("shell.accessLoadError", "Couldn't load what you're allowed to do here.")}
          message={getErrorMessage(authzFailed.error)}
          onRetry={authzFailed.retry}
        />
      </div>
    );
  }
  // A page of a feature the Free plan lacks is the upgrade page, however the
  // URL was reached. An unknown plan reads as Paid (nothing is hidden on a guess).
  const lacksFeature = !!feature && !orgHasFeature(plan, feature);
  if (!needs) return lacksFeature ? <UpgradePage feature={feature} /> : <>{children}</>;
  if (!known && error) {
    // Say so: a blank page (or every module on a guess) is worse.
    return (
      <div className="p-6">
        <ErrorState
          title={t("dawam.modulesLoadError", "Couldn't check what this business has switched on")}
          message={getErrorMessage(error)}
          onRetry={retry}
        />
      </div>
    );
  }
  if (!known) return null;
  if (!modules.includes(needs)) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Blocks}
          title={t("dawam.moduleOffTitle", "Not part of this business's plan")}
          description={
            needs === "dawam"
              ? t("dawam.moduleDawamOff", "Dawam by Madar is switched off for this business. Ask Madar to switch it on.")
              : t("dawam.modulePosOff", "Madar POS is switched off for this business. Ask Madar to switch it on.")
          }
        />
      </div>
    );
  }
  return lacksFeature ? <UpgradePage feature={feature} /> : <>{children}</>;
}
