/**
 * Add or take away points by hand. Admins only — the server refuses anyone
 * else, and this dialog is not offered to them.
 *
 * Every adjustment carries a reason, which lands on the ledger row as its note
 * and is shown on the member's history: the audit trail is the ledger itself.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useLoyaltyAdjust } from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";

import { loyaltyServerError } from "../../shared/server-errors";
import { currencyLabel } from "../../shared/util";
import { adjustSchema, adjustToWire, REASON_MAX, type AdjustValues } from "./adjust-schema";

export function AdjustDialog({
  member,
  branches,
  defaultBranchId,
  open,
  onOpenChange,
}: {
  member: MemberView;
  branches: { id: string; name: string }[];
  defaultBranchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const adjust = useLoyaltyAdjust();

  const initial: AdjustValues = {
    branch_id: defaultBranchId ?? (branches.length === 1 ? branches[0].id : ""),
    direction: "add",
    amount: Number.NaN,
    reason: "",
  };
  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema(member.balance)),
    defaultValues: initial,
  });

  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member.id]);

  const errors = form.formState.errors;
  const err = (key?: string) =>
    key ? (
      <p role="alert" className="text-xs text-destructive">
        {t(key, { balance: member.balance, unit: currencyLabel(member.mode, member.balance) })}
      </p>
    ) : null;

  const submit = async (v: AdjustValues) => {
    try {
      await adjust.mutateAsync({ data: adjustToWire(v, member.id) });
      toast.success(t("loyalty.adjusted", "Balance adjusted"));
      // The list, the detail and anything else showing this member.
      await qc.invalidateQueries({
        predicate: (q) => String(q.queryKey[0] ?? "").startsWith("/loyalty/members"),
      });
      onOpenChange(false);
    } catch (e) {
      // A refusal the form can point at goes on its field; otherwise the
      // server's sentence ("Sara has 4; that adjustment would go negative")
      // is the useful one, so it is shown as-is.
      const refused = loyaltyServerError(e, t);
      if (refused.kind === "noteRequired") {
        form.setError("reason", { type: "server", message: "loyalty.errors.serverNoteRequired" }, { shouldFocus: true });
      }
      toast.error(refused.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("loyalty.adjustTitle", "Adjust balance")}</DialogTitle>
          <DialogDescription>
            {t("loyalty.adjustBody", {
              defaultValue: "{{name}} has {{balance}} {{unit}}. The reason is kept on their history.",
              name: member.name,
              balance: member.balance,
              unit: currencyLabel(member.mode, member.balance),
            })}
          </DialogDescription>
        </DialogHeader>

        <form id="loyalty-adjust" onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          <Controller
            control={form.control}
            name="direction"
            render={({ field }) => (
              <SegmentedControl
                value={field.value}
                onChange={(v) => field.onChange(v)}
                options={[
                  { value: "add", label: t("loyalty.adjustAdd", "Add") },
                  { value: "deduct", label: t("loyalty.adjustDeduct", "Deduct") },
                ]}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="adjust-amount">
              {t("loyalty.adjustAmount", "Amount")} ({currencyLabel(member.mode)})
            </Label>
            <Input
              id="adjust-amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="font-mono"
              aria-invalid={errors.amount ? true : undefined}
              {...form.register("amount", { valueAsNumber: true })}
            />
            {err(errors.amount?.message)}
          </div>

          {branches.length > 1 || !form.getValues("branch_id") ? (
            <div className="space-y-1.5">
              <Label>{t("loyalty.adjustBranch", "Branch")}</Label>
              <Controller
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={errors.branch_id ? true : undefined} className="w-full">
                      <SelectValue placeholder={t("loyalty.adjustPickBranch", "Pick a branch")} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {err(errors.branch_id?.message)}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="adjust-reason">{t("loyalty.adjustReason", "Reason")}</Label>
            <Textarea
              id="adjust-reason"
              rows={2}
              maxLength={REASON_MAX}
              placeholder={t("loyalty.adjustReasonPlaceholder", "e.g. Stamp missed on 12 Sep order")}
              aria-invalid={errors.reason ? true : undefined}
              {...form.register("reason")}
            />
            {err(errors.reason?.message)}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" form="loyalty-adjust" disabled={adjust.isPending}>
            {adjust.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("loyalty.adjustConfirm", "Save adjustment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
