/**
 * The staff drinks pool, for the organisation or for one branch.
 *
 * The pool belongs to the BRANCH for a business day, not to a person. There is
 * deliberately no "who is this for" picker: the owner's decision was that a
 * shop gives out N drinks a day and a human writes down who got one and why.
 * That note is required on every drink at the till — which is why this screen
 * has nothing to configure about people, only about how many and which items.
 *
 * Going over the allowance is allowed and marked, never blocked. A till that
 * refuses a manager a coffee at 11pm is a till that gets worked around, and a
 * worked-around till records nothing at all.
 *
 * Scope comes from the app-wide picker in the header: "All branches" is the
 * organisation's own row, a branch is that branch's override.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/app/empty-state";
import { Restricted } from "@/components/app/restricted";
import { useConfirm } from "@/components/app/confirm-dialog";
import { PaneHeader } from "@/features/settings/pane-header";
import { deleteStaffPoolSettings, usePutStaffPoolSettings } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";

import { EligibleItemsControl } from "./eligible-items-control";
import { fromWire, poolIsOff, staffPoolSchema, toWire, type StaffPoolValues } from "./form-schema";
import { useStaffPoolSettings, type StaffPoolScope } from "./use-staff-pool";

export function StaffPoolSettingsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const authz = useAuthz();
  const canRead = authz.can(Cap.orgSettingsRead) || authz.can(Cap.orgSettingsEdit);
  const canEdit = authz.can(Cap.orgSettingsEdit);

  // A super admin's token carries no org; the one they picked in the header does.
  const orgId = useOrgId() ?? "";
  const { branchId } = useScope();
  const scope: StaffPoolScope = { orgId, branchId };

  const { query, settings, inherited } = useStaffPoolSettings(scope, canRead && !!orgId);
  const save = usePutStaffPoolSettings();

  const form = useForm<StaffPoolValues>({
    resolver: zodResolver(staffPoolSchema),
    values: settings ? fromWire(settings) : undefined,
  });

  // The form is a copy of the scope's settings; switching branch must reload it
  // rather than leave the previous branch's numbers on screen.
  useEffect(() => {
    if (settings) form.reset(undefined, { keepValues: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.branchId]);

  const enabled = form.watch("enabled");
  const items = form.watch("eligible_item_ids") ?? [];
  const off = poolIsOff({ enabled, eligible_item_ids: items });
  const allowanceError = form.formState.errors.daily_allowance?.message;

  if (authz.ready && !canRead) {
    return (
      <Restricted
        title={t("staffPool.settingsTitle", "Staff drinks")}
        who={t("staffPool.noAccess", "Your account can't change this. The owner can give you access.")}
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !settings) {
    return (
      <ErrorState
        title={t("staffPool.loadFailed", "Couldn't load the staff drinks settings")}
        message={query.error ? getErrorMessage(query.error) : undefined}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const submit = async (v: StaffPoolValues) => {
    try {
      await save.mutateAsync({ data: toWire(v, scope, settings) });
      toast.success(t("staffPool.saved", "Staff drinks saved"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const revert = async () => {
    if (!scope.branchId) return;
    const ok = await confirm({
      title: t("staffPool.revertTitle", "Use the organisation's allowance here?"),
      description: t(
        "staffPool.revertBody",
        "This branch will follow the organisation-wide staff drinks settings again. Its own allowance and item list are removed.",
      ),
      confirmLabel: t("staffPool.revert", "Follow the organisation"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteStaffPoolSettings({ branch_id: scope.branchId });
      toast.success(t("staffPool.reverted", "Back to the organisation's allowance"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
      <PaneHeader
        title={t("staffPool.settingsTitle", "Staff drinks")}
        description={t(
          "staffPool.settingsSubtitle",
          "How many drinks a branch may give its own people in a day, and which items count. Every one needs a note saying who it was for.",
        )}
      />

      {!canEdit ? (
        <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          {t("staffPool.readOnly", "You can see these settings, but only an owner or admin can change them.")}
        </p>
      ) : null}

      {/* A disabled fieldset disables every input inside it, so a read-only
          viewer cannot half-edit a form they cannot save. */}
      <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
        {inherited ? (
          <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            {t(
              "staffPool.inheritedHint",
              "This branch follows the organisation's staff drinks settings. Saving here gives it an allowance of its own.",
            )}
          </p>
        ) : null}

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold">{t("staffPool.enabled", "Staff drinks are on")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("staffPool.enabledHint", "Tellers can ring up a staff drink against the day's pool.")}
                </p>
              </div>
              <Switch
                checked={enabled}
                // `shouldDirty` on every control: a switch that does not mark
                // the form dirty is a setting that silently does not save.
                onCheckedChange={(v) => form.setValue("enabled", v, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="daily_allowance">
                {t("staffPool.allowance", "Drinks a day, for the whole branch")}
              </Label>
              <Input
                id="daily_allowance"
                type="number"
                min={0}
                step={1}
                className="font-mono"
                aria-invalid={allowanceError ? true : undefined}
                aria-describedby={allowanceError ? "daily_allowance-error" : undefined}
                {...form.register("daily_allowance")}
              />
              {allowanceError ? (
                <p id="daily_allowance-error" role="alert" className="text-xs text-destructive">
                  {t(String(allowanceError))}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "staffPool.allowanceHint",
                    "The pool belongs to the branch for the day, not to any one person, and it resets at the branch's own midnight. Going over is allowed — it is just marked on the report.",
                  )}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("staffPool.items", "Items that count")}</Label>
              <EligibleItemsControl
                value={items}
                onChange={(ids) =>
                  form.setValue("eligible_item_ids", ids, { shouldDirty: true })
                }
                disabled={!canEdit}
              />
              {/* The rule, once, where the items are chosen. It is the server's
                  rule and not a setting — so it is said, not offered. */}
              <p className="max-w-[70ch] text-xs text-muted-foreground">
                {t(
                  "staffPool.pricingRule",
                  "What's free is the smallest size and the default of each required choice. A bigger size, extras and pricier choices are charged as usual, and tax applies only to what is charged.",
                )}
              </p>
            </div>

            {off ? (
              // Said in words, not implied by a grey toggle: with no items, an
              // "on" switch buys nothing, and that is the one thing about this
              // screen people get wrong.
              <p
                role="status"
                className="rounded-xl bg-warning/12 p-3 text-sm text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]"
              >
                {items.length === 0
                  ? t(
                      "staffPool.offNoItems",
                      "The pool is off: with no items chosen, nobody can ring up a staff drink — whatever the switch above says.",
                    )
                  : t("staffPool.offDisabled", "The pool is off. Tellers can't ring up a staff drink here.")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </fieldset>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={save.isPending || (!form.formState.isDirty && !inherited)}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("common.save", "Save")}
          </Button>
          {scope.branchId && !inherited ? (
            <Button type="button" variant="outline" onClick={() => void revert()}>
              <RotateCcw className="size-4" />
              {t("staffPool.revert", "Follow the organisation")}
            </Button>
          ) : null}
          {Object.keys(form.formState.errors).length > 0 ? (
            <p role="alert" className="text-xs text-destructive">
              {t("staffPool.fixErrors", "Fix the highlighted fields before saving.")}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
