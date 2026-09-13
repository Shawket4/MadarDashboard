import { useTranslation } from "react-i18next";
import { Store, Tablet, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { SectionHeader } from "@/components/app/section-header";
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
    return (
      <EmptyState
        icon={Store}
        title={t("tills.pickBranch", "Select a branch")}
        description={t("paymentMethods.availability.pickBranchHint", "Availability is set per branch, then narrowed per teller and device.")}
      />
    );
  }
  if (availability.isLoading || methodsQ.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (availability.error || methodsQ.error) {
    return (
      <ErrorState
        title={t("paymentMethods.availability.loadError", "Couldn't load payment method availability")}
        message={getErrorMessage(availability.error ?? methodsQ.error)}
        onRetry={() => {
          void availability.refetch();
          void methodsQ.refetch();
        }}
      />
    );
  }

  const active = (methodsQ.data ?? []).filter((m: OrgPaymentMethod) => m.is_active);
  const all: MethodOption[] = active.map((m) => ({ id: m.id, name: labelOf(m, i18n.language) }));
  const branchList = allowListFor(availability.data, "branches", branchId);
  // Tellers and devices narrow the branch's set, never widen it.
  const branchMethods = branchList.restricted ? all.filter((m) => branchList.payment_method_ids.includes(m.id)) : all;
  const tellers = (usersQ.data ?? []).filter(
    (u) => u.is_active && (u.role === "teller" || u.role === "branch_manager") && (!u.branch_id || u.branch_id === branchId),
  );
  const liveDevices = (devices.data ?? []).filter((d) => !d.retired_at);

  const save = (scope: AvailabilityScope, id: string) => (data: AllowList) =>
    put.mutate(
      { scope, id, data },
      {
        onSuccess: () => toast.success(t("common.saved", "Saved")),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader
          icon={Store}
          title={t("paymentMethods.availability.branch", "Branch")}
          description={t("paymentMethods.availability.branchHint", "The methods any charge at this branch can offer.")}
        />
        <AllowListEditor idPrefix="branch" title={t("paymentMethods.availability.branch", "Branch")} value={branchList} methods={all} pending={put.isPending} onSave={save("branches", branchId)} />
      </section>
      <section className="space-y-3">
        <SectionHeader
          icon={Users}
          title={t("paymentMethods.availability.tellers", "Tellers")}
          count={tellers.length}
          description={t("paymentMethods.availability.tellersHint", "Narrow the branch's methods for one teller.")}
        />
        {tellers.length === 0 ? (
          <EmptyState className="py-8" icon={Users} title={t("paymentMethods.availability.noTellers", "No tellers at this branch")} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {tellers.map((u) => (
              <AllowListEditor key={u.id} idPrefix={`user-${u.id}`} title={u.name} value={allowListFor(availability.data, "users", u.id)} methods={branchMethods} pending={put.isPending} onSave={save("users", u.id)} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <SectionHeader
          icon={Tablet}
          title={t("paymentMethods.availability.devices", "Devices")}
          count={liveDevices.length}
          description={t("paymentMethods.availability.devicesHint", "Narrow the branch's methods for one POS device.")}
        />
        {liveDevices.length === 0 ? (
          <EmptyState className="py-8" icon={Tablet} title={t("paymentMethods.availability.noDevices", "No devices at this branch yet")} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {liveDevices.map((d) => (
              <AllowListEditor key={d.id} idPrefix={`device-${d.id}`} title={d.label ? `${d.code} · ${d.label}` : d.code} mono value={allowListFor(availability.data, "devices", d.id)} methods={branchMethods} pending={put.isPending} onSave={save("devices", d.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
