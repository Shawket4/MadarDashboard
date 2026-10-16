/**
 * Settings › Plan (Free orgs): the plan's limits in plain words and, for each
 * branch, its tills with their last sale and which one is active. A Free branch
 * sells on ONE till (without the realtime stream two tills cannot stay in step);
 * the owner chooses which here. The others show "this till isn't active" until
 * the owner switches them or the shop moves to the paid plan.
 */
import { Gem, Store, Tablet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { UpgradeButton } from "@/components/app/upgrade-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGetOrgPlanQueryKey, useGetOrgPlan, usePutActiveTill } from "@/data/api/generated/api";
import type { PlanBranch, PlanState, PlanTill } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtStamp } from "@/lib/format";

import { PaneHeader } from "./pane-header";

/** What a till is called: its label when it has one, else its short code. */
const tillName = (till: Pick<PlanTill, "code" | "label">): string => till.label?.trim() || till.code;

export function PlanPane() {
  const { t } = useTranslation();
  const orgId = useOrgId() ?? "";
  const authz = useAuthz();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const q = useGetOrgPlan(orgId, { query: { enabled: !!orgId } });
  const choose = usePutActiveTill({
    mutation: {
      onSuccess: (state: PlanState) => {
        queryClient.setQueryData(getGetOrgPlanQueryKey(orgId), state);
        toast.success(t("plan.pane.switched", "The active till was changed."));
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const plan = q.data;
  // Only the owner (or a super admin) chooses; the server refuses anyone else.
  const canSwitch = authz.owner || authz.platform;

  const switchTo = async (branch: PlanBranch, till: PlanTill) => {
    const others = branch.tills.filter((x) => x.device_id !== till.device_id && x.active);
    const ok = await confirm({
      title: t("plan.pane.switchTitle", { till: tillName(till), branch: branch.name, defaultValue: "Sell on {{till}} at {{branch}}?" }),
      description: others.length
        ? t("plan.pane.switchBody", {
            others: others.map(tillName).join(t("common.listSeparator", ", ")),
            defaultValue: "{{others}} will stop selling. Its sales so far are kept.",
          })
        : t("plan.pane.switchBodyNone", "This till will start selling again. Its sales so far are kept."),
      confirmLabel: t("plan.pane.switch", "Sell on this till"),
    });
    if (ok) choose.mutate({ id: orgId, data: { branch_id: branch.branch_id, device_id: till.device_id } });
  };

  return (
    <div className="space-y-6">
      <PaneHeader
        title={t("settings.plan", "Plan")}
        description={t("plan.pane.desc", "What the Free plan includes, and which till each branch sells on.")}
      />

      {q.isError ? (
        <ErrorState
          title={t("plan.pane.loadError", "Couldn't load your plan")}
          message={getErrorMessage(q.error)}
          onRetry={() => void q.refetch()}
        />
      ) : q.isLoading || !plan ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : plan.plan !== "free" ? (
        <EmptyState
          icon={Gem}
          title={t("plan.pane.paidTitle", "Your shop is on the paid plan")}
          description={t("plan.pane.paidBody", "Every feature is included and every till can sell.")}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {t("plan.pane.yourPlan", "Your plan")}
                <StatusPill tone="info" icon={Gem}>{t("plan.free", "Free")}</StatusPill>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
                <li>{t("plan.pane.limitBranch", "One branch, selling on one till.")}</li>
                <li>{t("plan.pane.limitStaff", "As many staff accounts as you need.")}</li>
                <li>{t("plan.pane.limitFeatures", "Selling, menu, payment methods, discounts and basic sales reports.")}</li>
              </ul>
              {plan.over_branch_limit ? (
                <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                  {t("plan.pane.overBranches", {
                    branches: plan.live_branches,
                    limit: plan.branch_limit ?? 1,
                    defaultValue: "Your shop has {{branches}} branches and the Free plan includes {{limit}}. Every branch keeps selling, on one till each, but you can't add a branch until you move to the paid plan.",
                  })}
                </p>
              ) : null}
              <UpgradeButton variant="outline" />
            </CardContent>
          </Card>

          {plan.branches.length === 0 ? (
            <EmptyState icon={Store} title={t("plan.pane.noBranches", "No branches yet")} />
          ) : (
            plan.branches.map((branch) => (
              <BranchTills
                key={branch.branch_id}
                branch={branch}
                canSwitch={canSwitch}
                busy={choose.isPending}
                onSwitch={(till) => void switchTo(branch, till)}
              />
            ))
          )}
          {!canSwitch ? (
            <p className="text-sm text-muted-foreground">
              {t("plan.pane.ownerOnly", "Only the shop's owner can change the active till.")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function BranchTills({
  branch,
  canSwitch,
  busy,
  onSwitch,
}: {
  branch: PlanBranch;
  canSwitch: boolean;
  busy: boolean;
  onSwitch: (till: PlanTill) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="size-4 text-muted-foreground" aria-hidden />
          {branch.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {branch.tills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("plan.pane.noTills", "No till has signed in to this branch yet.")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {branch.tills.map((till) => (
              <li key={till.device_id} className="flex flex-wrap items-center gap-3 py-3">
                <Tablet className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tillName(till)}</p>
                  <p className="text-xs text-muted-foreground">
                    {till.last_sale_at
                      ? t("plan.pane.lastSale", { when: fmtStamp(till.last_sale_at), defaultValue: "Last sale {{when}}" })
                      : t("plan.pane.noSales", "No sales yet")}
                    {" · "}
                    {t("plan.pane.lastSeen", { when: fmtStamp(till.last_seen_at), defaultValue: "Last online {{when}}" })}
                  </p>
                </div>
                {till.active ? (
                  <StatusPill tone="success">{t("plan.pane.active", "Active")}</StatusPill>
                ) : (
                  <>
                    <StatusPill tone="neutral">{t("plan.pane.off", "Switched off")}</StatusPill>
                    {canSwitch ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => onSwitch(till)}>
                        {t("plan.pane.switch", "Sell on this till")}
                      </Button>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
