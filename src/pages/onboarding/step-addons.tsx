import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { useListAddonItems } from "@/shared/api/generated/api";
import { AddonDialog } from "@/features/dialogs/addon-dialog";
import { getTranslatedName } from "@/shared/lib/translation";
import { fmtMoney } from "@/shared/lib/format";
import { StepFrame } from "./step-frame";

/** Addons & extras — thin wrapper over the existing addon manager (skippable). */
export function StepAddons({ orgId, onMutated }: { orgId: string; onMutated: () => void }) {
  const { t, i18n } = useTranslation();
  const [dlg, setDlg] = useState(false);
  const { data: addons = [] } = useListAddonItems({ org_id: orgId }, { query: { enabled: !!orgId } });

  return (
    <StepFrame title={t("onboarding.addons.title")} description={t("onboarding.addons.description")}>
      {addons.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("onboarding.addons.emptyTitle")}
          description={t("onboarding.addons.emptyDescription")}
          action={
            <Button onClick={() => setDlg(true)} className="gap-1">
              <Plus size={15} /> {t("onboarding.addons.add")}
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("menu.addons")} ({addons.length})</p>
              <Button size="sm" variant="outline" onClick={() => setDlg(true)} className="gap-1">
                <Plus size={14} /> {t("common.add")}
              </Button>
            </div>
            <ul className="space-y-1 max-h-80 overflow-y-auto">
              {addons.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span>{getTranslatedName(a, i18n.language)}</span>
                  <span className="tabular text-muted-foreground">{fmtMoney(a.default_price)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {dlg && (
        <AddonDialog open={dlg} onClose={() => { setDlg(false); onMutated(); }} edit={null} orgId={orgId} />
      )}
    </StepFrame>
  );
}
