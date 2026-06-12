import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, ListChecks, X } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { useGetOnboarding } from "@/shared/api/generated/api";
import { CoverageRing } from "@/pages/onboarding/coverage-ring";

/** Where each optional step is finished in the normal app. */
const STEP_LINKS: Record<string, string> = {
  ingredients: "/inventory",
  recipes: "/menu/recipes",
  addons: "/menu/add-ons",
  team: "/users",
  first_order: "/orders",
};

const OPTIONAL_KEYS = ["ingredients", "recipes", "addons", "team", "first_order"];

const dismissKey = (orgId: string) => `sufrix-setup-checklist-dismissed:${orgId}`;

/**
 * Post-wizard nudge card on the overview. Shows only optional steps, each
 * deep-linking to its normal screen. Dismiss persists in localStorage and the
 * card disappears on its own once every optional step is done.
 */
export function SetupChecklist() {
  const { t } = useTranslation();
  const { orgId, isOrgAdmin, isSuperAdmin } = useCurrentContext();
  const { can } = usePermissions();
  const eligible = !!orgId && isOrgAdmin && !isSuperAdmin && can("orgs", "read");

  const [dismissed, setDismissed] = useState(
    () => !!orgId && localStorage.getItem(dismissKey(orgId)) === "1",
  );

  const { data: status } = useGetOnboarding(orgId ?? "", {
    query: { enabled: eligible && !dismissed, staleTime: 60_000 },
  });

  if (!eligible || dismissed || !status?.completed) return null;

  const optional = status.steps.filter((s) => OPTIONAL_KEYS.includes(s.key));
  const undone = optional.filter((s) => !s.done);
  const lowCoverage = status.recipe_coverage < 0.8;
  if (undone.length === 0 && !lowCoverage) return null;

  const dismiss = () => {
    if (orgId) localStorage.setItem(dismissKey(orgId), "1");
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-primary shrink-0" />
            <p className="font-semibold text-sm">{t("onboarding.checklist.title")}</p>
          </div>
          <Button variant="ghost" size="iconSm" onClick={dismiss} aria-label={t("common.close")}>
            <X size={14} />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <ul className="space-y-1.5 flex-1 min-w-56">
            {optional.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                ) : (
                  <Circle size={15} className="text-muted-foreground/50 shrink-0" />
                )}
                {s.done ? (
                  <span className="text-muted-foreground line-through">
                    {t(`onboarding.stepKeys.${s.key}`, { defaultValue: s.key })}
                  </span>
                ) : (
                  <Link to={STEP_LINKS[s.key] ?? "/"} className="hover:underline underline-offset-4">
                    {t(`onboarding.stepKeys.${s.key}`, { defaultValue: s.key })}
                    {s.key === "first_order" && (
                      <span className="block text-xs text-muted-foreground">
                        {t("onboarding.checklist.firstOrderHint")}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {lowCoverage && (
            <CoverageRing ratio={status.recipe_coverage} size={72} strokeWidth={6} label={t("onboarding.costs.coverageLabel")} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
