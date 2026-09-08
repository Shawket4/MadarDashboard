/**
 * The programme's rules, for the organisation or for one branch.
 *
 * This file owns the form's lifecycle — load, reset on scope change, save,
 * revert — and nothing about how any individual setting looks. The three cards
 * below it own that, and the wire mapping lives in `form-schema`, which is
 * where every defect this feature has shipped actually was.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/app/confirm-dialog";
import { deleteLoyaltySettings, usePutLoyaltySettings } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";

import { useProgram, type ProgramScope } from "../use-program";
import { CollectingCard } from "./collecting-card";
import { PassesCard } from "./passes-card";
import { SignupCard } from "./signup-card";
import { fromWire, programSchema, toWire, type ProgramValues } from "./form-schema";
import { TextRow, ToggleRow } from "./fields";
import { Card, CardContent } from "@/components/ui/card";

export function ProgramPane({ scope }: { scope: ProgramScope }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { query, settings, inherited } = useProgram(scope);
  const save = usePutLoyaltySettings();

  const form = useForm<ProgramValues>({
    resolver: zodResolver(programSchema),
    values: settings ? fromWire(settings) : undefined,
  });

  // The form is a copy of the scope's settings; switching scope must reload it
  // rather than leave the previous branch's numbers on screen.
  useEffect(() => {
    if (settings) form.reset(undefined, { keepValues: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.branchId]);

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const submit = async (v: ProgramValues) => {
    try {
      await save.mutateAsync({ data: toWire(v, scope, settings) });
      toast.success(t("loyalty.saved", "Program saved"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const revert = async () => {
    if (!scope.branchId) return;
    const ok = await confirm({
      title: t("loyalty.revertTitle", "Use the organisation's program here?"),
      description: t(
        "loyalty.revertBody",
        "This branch will follow the organisation-wide settings again. Its own rules are removed.",
      ),
    });
    if (!ok) return;
    try {
      await deleteLoyaltySettings({ branch_id: scope.branchId });
      toast.success(t("loyalty.reverted", "Back to the organisation's program"));
      await query.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      {inherited ? (
        <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          {t(
            "loyalty.inheritedHint",
            "This branch follows the organisation's program. Saving here gives it rules of its own.",
          )}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-5 p-5">
          <ToggleRow
            form={form}
            name="enabled"
            label={t("loyalty.enabled", "Program is running")}
            hint={t("loyalty.enabledHint", "Customers can join and collect here.")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextRow
              form={form}
              name="program_name"
              label={t("loyalty.programName", "Program name")}
            />
            <TextRow
              form={form}
              name="program_name_ar"
              dir="rtl"
              label={t("loyalty.programNameAr", "Program name (Arabic)")}
            />
          </div>
        </CardContent>
      </Card>

      <CollectingCard form={form} />
      <SignupCard form={form} saved={settings} />
      <PassesCard form={form} branchId={scope.branchId} />

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("common.save", "Save")}
        </Button>
        {scope.branchId && !inherited ? (
          <Button type="button" variant="outline" onClick={() => void revert()}>
            <RotateCcw className="size-4" />
            {t("loyalty.revert", "Follow the organisation")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
