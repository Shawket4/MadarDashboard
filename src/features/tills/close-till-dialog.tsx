import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney } from "@/lib/format";

import { useCloseTill, useCloseTillPreview, type CloseTillPreview, type LastTillWarning, type Till } from "./api";
import { closeTillSchema, defaultCloseForm, toReconciliationInputs, type CloseTillForm } from "./util";

interface Props {
  till: Till | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseTillDialog({ till, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const preview = useCloseTillPreview(till?.id ?? null, open);
  const { mutate, isPending } = useCloseTill();
  const [warning, setWarning] = useState<LastTillWarning | null>(null);

  const submit = (values: CloseTillForm) => {
    if (!till) return;
    mutate(
      {
        tillId: till.id,
        data: {
          closing_cash_declared: egpToPiastres(Number(values.cash)),
          cash_note: values.cashNote.trim() || null,
          reconciliation: toReconciliationInputs(values.rows, egpToPiastres),
        },
      },
      {
        onSuccess: (res) => {
          toast.success(t("tills.closedToast", "Till closed"));
          if (res?.last_till_warning) setWarning(res.last_till_warning);
          onOpenChange(false);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("tills.closeTill", "Close till")}</DialogTitle>
            <DialogDescription>{t("tills.closeDesc", "Count the drawer and check each payment method.")}</DialogDescription>
          </DialogHeader>
          {preview.isLoading || !preview.data ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <CloseTillFormView
              key={till?.id}
              preview={preview.data}
              pending={isPending}
              onCancel={() => onOpenChange(false)}
              onSubmit={submit}
            />
          )}
        </DialogContent>
      </Dialog>
      <LastTillWarningDialog warning={warning} onClose={() => setWarning(null)} />
    </>
  );
}

/** Presentational form; exported for tests. Never blocks on mismatches — it only asks for a note. */
export function CloseTillFormView({
  preview,
  pending,
  onCancel,
  onSubmit,
}: {
  preview: CloseTillPreview;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (v: CloseTillForm) => void;
}) {
  const { t } = useTranslation();
  const form = useForm<CloseTillForm>({ resolver: zodResolver(closeTillSchema), defaultValues: defaultCloseForm(preview) });
  const { fields } = useFieldArray({ control: form.control, name: "rows" });
  const rows = form.watch("rows");
  const errors = form.formState.errors;
  const byMethod = new Map(preview.methods.map((m) => [m.method, m]));

  useEffect(() => form.reset(defaultCloseForm(preview)), [preview, form]);

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="closing-cash">{t("tills.closingCash", "Cash counted in drawer")}</Label>
        <Input id="closing-cash" type="number" inputMode="decimal" step="0.01" min="0" {...form.register("cash")} />
        <p className="text-xs text-muted-foreground">
          {t("tills.expectedCash", "Expected cash")}: {fmtMoney(preview.expected_cash)}
        </p>
        {errors.cash ? <p className="text-xs text-destructive">{t("tills.cashRequired", "Enter the counted cash.")}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="close-note">{t("common.notes", "Notes")}</Label>
        <Textarea id="close-note" rows={2} {...form.register("cashNote")} />
      </div>

      {fields.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{t("tills.reconciliation.title", "Payment check")}</legend>
          {fields.map((f, i) => {
            const m = byMethod.get(f.method);
            const disagreed = rows[i]?.status === "disagreed";
            const rowErr = errors.rows?.[i];
            return (
              <div key={f.id} className="space-y-2 rounded-md border p-3" data-testid="reconcile-row">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{t(`payments.${f.method}`, f.method)}</span>
                  <span className="tabular text-muted-foreground">
                    {t("tills.reconciliation.system", "System total")}: {fmtMoney(m?.system_total ?? 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={disagreed ? "outline" : "default"}
                    aria-pressed={!disagreed}
                    onClick={() => form.setValue(`rows.${i}.status`, "checked")}
                  >
                    {t("tills.reconciliation.checked", "Checked")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={disagreed ? "default" : "outline"}
                    aria-pressed={disagreed}
                    onClick={() => form.setValue(`rows.${i}.status`, "disagreed")}
                  >
                    {t("tills.reconciliation.disagreed", "Doesn't match")}
                  </Button>
                </div>
                {disagreed ? (
                  <div className="grid gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      aria-label={t("tills.reconciliation.amount", "Amount you see")}
                      placeholder={t("tills.reconciliation.amount", "Amount you see")}
                      {...form.register(`rows.${i}.declared`)}
                    />
                    <Textarea
                      rows={2}
                      aria-label={t("tills.reconciliation.note", "What happened?")}
                      placeholder={t("tills.reconciliation.note", "What happened?")}
                      {...form.register(`rows.${i}.note`)}
                    />
                    {rowErr?.note || rowErr?.declared ? (
                      <p className="text-xs text-destructive" role="alert">
                        {t("tills.reconciliation.noteRequired", "Add the amount and a note for the difference.")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button type="submit" loading={pending}>
          {t("tills.closeTill", "Close till")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function LastTillWarningDialog({ warning, onClose }: { warning: LastTillWarning | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!warning} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
            {t("tills.lastTillTitle", "That was the last open till")}
          </DialogTitle>
          <DialogDescription>
            {t("tills.lastTillBody", {
              bills: warning?.open_bills_count ?? 0,
              amount: fmtMoney(warning?.open_bills_amount ?? 0),
              tables: warning?.seated_tables_count ?? 0,
              defaultValue: "{{bills}} bills ({{amount}}) are still open and {{tables}} tables are seated.",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.ok", "OK")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
