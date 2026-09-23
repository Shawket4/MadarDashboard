/**
 * Route-level module gating (PS-2, PS-3): a page that belongs to a module the
 * org has switched off is not reachable by typing its URL, not just hidden
 * from the nav. The module of a path comes from the nav config (the one place
 * pages are tagged), and the org's modules from the server.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "@tanstack/react-router";
import { Blocks } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { getErrorMessage } from "@/data/api/errors";
import { moduleOfPath } from "@/config/nav";
import { useOrgModulesState } from "@/hooks/use-org-modules";

export function ModuleGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { modules, known, error, retry } = useOrgModulesState();
  const needs = moduleOfPath(pathname);
  if (!needs) return <>{children}</>;
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
  return <>{children}</>;
}
