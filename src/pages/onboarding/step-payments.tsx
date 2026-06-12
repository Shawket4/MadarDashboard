import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useListPaymentMethods, useActivatePaymentMethod, useDeactivatePaymentMethod,
  getListPaymentMethodsQueryKey,
} from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { getErrorMessage } from "@/shared/api/errors";
import { PaymentMethodDialog } from "@/features/dialogs/payment-method-dialog";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { StepFrame } from "./step-frame";
import { stepByKey } from "./use-onboarding";

/**
 * Payment methods are PRE-SEEDED by the backend when the org is created, so
 * this step is framed as "these are on — confirm and customize", not "add
 * your first method". The step regresses if every method is deactivated;
 * that warning is surfaced inline.
 */
export function StepPayments({
  orgId,
  status,
  onMutated,
}: {
  orgId: string;
  status: OnboardingStatus | undefined;
  onMutated: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: methods = [], isLoading } = useListPaymentMethods({ query: { staleTime: 0 } });
  const { getLabel } = usePaymentMethods();
  const [dlg, setDlg] = useState(false);

  const afterToggle = () => {
    qc.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
    onMutated();
  };
  const activate = useActivatePaymentMethod({
    mutation: { onSuccess: afterToggle, onError: (e) => toast.error(getErrorMessage(e)) },
  });
  const deactivate = useDeactivatePaymentMethod({
    mutation: { onSuccess: afterToggle, onError: (e) => toast.error(getErrorMessage(e)) },
  });

  const stepDone = !!stepByKey(status, "payment_methods")?.done;
  const noneActive = !isLoading && methods.every((m) => !m.is_active);

  return (
    <StepFrame title={t("onboarding.payments.title")} description={t("onboarding.payments.description")}>
      {noneActive && !stepDone && (
        <Card className="mb-4 border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-warning">
            <AlertTriangle size={16} className="shrink-0" />
            {t("onboarding.payments.noneActive")}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: m.color }} />
                  <span className="font-medium text-sm">{getLabel(m.name)}</span>
                </div>
                <Switch
                  checked={m.is_active}
                  disabled={activate.isPending || deactivate.isPending}
                  onCheckedChange={(on) =>
                    on ? activate.mutate({ id: m.id }) : deactivate.mutate({ id: m.id })
                  }
                />
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setDlg(true)} className="gap-1">
            <Plus size={15} /> {t("onboarding.payments.addCustom")}
          </Button>
        </div>
      )}

      {dlg && (
        <PaymentMethodDialog
          open={dlg}
          onClose={() => { setDlg(false); onMutated(); }}
          edit={null}
          orgId={orgId}
        />
      )}
    </StepFrame>
  );
}
