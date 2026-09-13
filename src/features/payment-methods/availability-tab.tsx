import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useListPaymentMethods, useListUsers } from "@/data/api/generated/api";
import type { OrgPaymentMethod } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";
import { allowListFor, useAvailability, useDevices, usePutAvailability, type AllowList, type AvailabilityScope } from "@/features/devices/api";

import { AllowListEditor, type MethodOption } from "./allow-list-editor";
import { labelOf } from "./util";

/** Org methods → branch subset → per teller → per device. Charge shows the intersection. */
export function AvailabilityTab() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const { branchId } = useScope();
  const methodsQ = useListPaymentMethods({ query: { enabled: !!orgId } });
  const usersQ = useListUsers({ org_id: orgId || undefined }, { query: { enabled: !!orgId } });
  const availability = useAvailability(branchId);
  const devices = useDevices(branchId);
  const put = usePutAvailability();

  if (!branchId) {
    return <EmptyState title={t("tills.pickBranch", "Select a branch")} />;
  }
  if (availability.isLoading || methodsQ.isLoading) return <Skeleton className="h-40 w-full" />;

  const active = (methodsQ.data ?? []).filter((m: OrgPaymentMethod) => m.is_active);
  const all: MethodOption[] = active.map((m) => ({ id: m.id, name: labelOf(m, i18n.language) }));
  const branchList = allowListFor(availability.data, "branches", branchId);
  // Tellers and devices narrow the branch's set, never widen it.
  const branchMethods = branchList.restricted ? all.filter((m) => branchList.payment_method_ids.includes(m.id)) : all;
  const tellers = (usersQ.data ?? []).filter(
    (u) => u.is_active && (u.role === "teller" || u.role === "branch_manager") && (!u.branch_id || u.branch_id === branchId),
  );

  const save = (scope: AvailabilityScope, id: string) => (data: AllowList) =>
    put.mutate(
      { scope, id, data },
      {
        onSuccess: () => toast.success(t("common.saved", "Saved")),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t("paymentMethods.availability.branch", "Branch")}</h2>
        <AllowListEditor idPrefix="branch" title={t("paymentMethods.availability.branch", "Branch")} value={branchList} methods={all} onSave={save("branches", branchId)} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t("paymentMethods.availability.tellers", "Tellers")}</h2>
        {tellers.map((u) => (
          <AllowListEditor key={u.id} idPrefix={`user-${u.id}`} title={u.name} value={allowListFor(availability.data, "users", u.id)} methods={branchMethods} onSave={save("users", u.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t("paymentMethods.availability.devices", "Devices")}</h2>
        {(devices.data ?? []).filter((d) => !d.retired_at).map((d) => (
          <AllowListEditor key={d.id} idPrefix={`device-${d.id}`} title={[d.code, d.label].filter(Boolean).join(" · ")} value={allowListFor(availability.data, "devices", d.id)} methods={branchMethods} onSave={save("devices", d.id)} />
        ))}
      </section>
    </div>
  );
}
