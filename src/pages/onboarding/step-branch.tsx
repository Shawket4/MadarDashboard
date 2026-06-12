import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MapPin, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { useListBranches } from "@/shared/api/generated/api";
import { BranchDialog } from "@/features/dialogs/branch-dialog";
import type { Branch } from "@/shared/types";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { StepFrame } from "./step-frame";
import { stepByKey } from "./use-onboarding";

/** Create your first branch — embeds the existing branch form dialog. */
export function StepBranch({
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
  const [edit, setEdit] = useState<Branch | null>(null);
  const { data: branches = [] } = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId } });
  const done = !!stepByKey(status, "branch")?.done;

  return (
    <StepFrame title={t("onboarding.branch.title")} description={t("onboarding.branch.description")}>
      {done && (
        <Card className="mb-4 border-success/40 bg-success/5">
          <CardContent className="p-4 flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            {t("onboarding.branch.doneHint", { count: branches.length })}
          </CardContent>
        </Card>
      )}

      {branches.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t("onboarding.branch.emptyTitle")}
          description={t("onboarding.branch.emptyDescription")}
          action={
            <Button onClick={() => { setEdit(null); setDlg(true); }} className="gap-1">
              <Plus size={15} /> {t("onboarding.branch.add")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {branches.map((b) => (
            <Card key={b.id} className="hover:bg-muted/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{b.name}</p>
                  {b.address && <p className="text-xs text-muted-foreground">{b.address}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={b.is_active ? "success" : "secondary"}>
                    {b.is_active ? t("common.active") : t("common.inactive")}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => { setEdit(b); setDlg(true); }}>
                    {t("common.edit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={() => { setEdit(null); setDlg(true); }} className="gap-1">
            <Plus size={15} /> {t("onboarding.branch.addAnother")}
          </Button>
        </div>
      )}

      {dlg && (
        <BranchDialog
          open={dlg}
          onClose={() => { setDlg(false); setEdit(null); onMutated(); }}
          edit={edit}
          orgId={orgId}
        />
      )}
    </StepFrame>
  );
}
