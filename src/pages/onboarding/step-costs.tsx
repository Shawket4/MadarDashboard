import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Boxes, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { useListCatalog } from "@/shared/api/generated/api";
import { CatalogItemDialog } from "@/features/dialogs/catalog-item-dialog";
import { fmtMoney, fmtUnit } from "@/shared/lib/format";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { StepFrame } from "./step-frame";
import { CoverageRing } from "./coverage-ring";

/**
 * Ingredient costs (recommended, fully skippable — never guilt-block).
 * Sells the cost engine: add ingredient costs and Sufrix computes profit
 * per item. recipe_coverage renders as a live ring.
 */
export function StepCosts({
  orgId,
  status,
  onMutated,
}: {
  orgId: string;
  status: OnboardingStatus | undefined;
  onMutated: () => void;
}) {
  const { t } = useTranslation();
  const [dlg, setDlg] = useState(false);
  const { data: ingredients = [] } = useListCatalog(orgId, { query: { enabled: !!orgId } });

  return (
    <StepFrame title={t("onboarding.costs.title")} description={t("onboarding.costs.description")}>
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <Card>
          <CardContent className="p-6">
            <CoverageRing ratio={status?.recipe_coverage ?? 0} label={t("onboarding.costs.coverageLabel")} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-semibold text-sm">{t("inventory.catalog.title")} ({ingredients.length})</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDlg(true)} className="gap-1">
                  <Plus size={14} /> {t("inventory.catalog.newIngredient")}
                </Button>
                <Button size="sm" variant="ghost" asChild className="gap-1">
                  <Link to="/menu/recipes" target="_blank" rel="noopener">
                    {t("onboarding.costs.openRecipes")} <ExternalLink size={13} />
                  </Link>
                </Button>
              </div>
            </div>
            {ingredients.length === 0 ? (
              <EmptyState icon={Boxes} title={t("inventory.catalog.empty")} description={t("onboarding.costs.emptyHint")} className="py-8" />
            ) : (
              <ul className="space-y-1 max-h-72 overflow-y-auto">
                {ingredients.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                    <span>{i.name} <span className="text-xs text-muted-foreground">/ {fmtUnit(i.unit)}</span></span>
                    <span className="tabular text-muted-foreground">
                      {(i.cost_per_unit ?? 0) > 0 ? fmtMoney(i.cost_per_unit ?? 0) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {dlg && (
        <CatalogItemDialog open={dlg} onClose={() => { setDlg(false); onMutated(); }} edit={null} orgId={orgId} />
      )}
    </StepFrame>
  );
}
