import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { useListUsers } from "@/shared/api/generated/api";
import { UserDialog } from "@/features/dialogs/user-dialog";
import { StepFrame } from "./step-frame";

/** Invite your team — thin wrapper over the existing user form (skippable). */
export function StepTeam({ orgId, onMutated }: { orgId: string; onMutated: () => void }) {
  const { t } = useTranslation();
  const [dlg, setDlg] = useState(false);
  const { data: users = [] } = useListUsers({ org_id: orgId }, { query: { enabled: !!orgId } });

  return (
    <StepFrame title={t("onboarding.team.title")} description={t("onboarding.team.description")}>
      {users.length <= 1 ? (
        <EmptyState
          icon={Users}
          title={t("onboarding.team.emptyTitle")}
          description={t("onboarding.team.emptyDescription")}
          action={
            <Button onClick={() => setDlg(true)} className="gap-1">
              <Plus size={15} /> {t("onboarding.team.add")}
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("users.title")} ({users.length})</p>
              <Button size="sm" variant="outline" onClick={() => setDlg(true)} className="gap-1">
                <Plus size={14} /> {t("common.add")}
              </Button>
            </div>
            <ul className="space-y-1 max-h-80 overflow-y-auto">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span>{u.name} <span className="text-xs text-muted-foreground">{u.email}</span></span>
                  <Badge variant="secondary">{t(`roles.${u.role}`, { defaultValue: u.role })}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {dlg && <UserDialog open={dlg} onClose={() => { setDlg(false); onMutated(); }} edit={null} />}
    </StepFrame>
  );
}
