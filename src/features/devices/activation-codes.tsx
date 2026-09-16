/**
 * Device activation codes (POS_SIGNIN_OVERHAUL §4). An owner issues a code for
 * a branch; a tablet enters it and binds itself — no manager email login on the
 * tablet. Codes are 8 digits, single-use, and expire after 24 hours.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { SectionHeader } from "@/components/app/section-header";
import { StatusPill, type StatusTone } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/data/api/errors";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtStamp } from "@/lib/format";

import { useActivationCodes, useIssueActivationCode, useRevokeActivationCode, type ActivationCode, type DeviceKind } from "./api";

const STATE_TONE: Record<ActivationCode["state"], StatusTone> = {
  free: "success",
  used: "neutral",
  expired: "warning",
  revoked: "danger",
};

/** "4072 1958" — easier to read aloud and type. */
export const groupCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code);

export function ActivationCodesSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const canIssue = useCan(Cap.branchesEdit);
  const codes = useActivationCodes(canIssue ? branchId : null);
  const revoke = useRevokeActivationCode();
  const confirm = useConfirm();
  const [issuing, setIssuing] = useState(false);

  const columns = useMemo<ColumnDef<ActivationCode>[]>(
    () => [
      {
        accessorKey: "code",
        header: t("devices.activation.code", "Code"),
        meta: { phone: "title", label: t("devices.activation.code", "Code") },
        cell: ({ row }) => (
          <bdi dir="ltr" data-testid="activation-code" className={row.original.state === "free" ? "font-mono text-base font-semibold tabular-nums" : "font-mono text-muted-foreground line-through tabular-nums"}>
            {groupCode(row.original.code)}
          </bdi>
        ),
      },
      {
        accessorKey: "label",
        header: t("devices.label", "Name"),
        meta: { label: t("devices.label", "Name") },
        cell: ({ row }) => row.original.label ?? <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "kind",
        header: t("devices.kind", "Type"),
        meta: { label: t("devices.kind", "Type") },
        cell: ({ row }) => t(`devices.kinds.${row.original.kind}`, row.original.kind),
      },
      {
        id: "state",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => (
          <StatusPill size="sm" tone={STATE_TONE[row.original.state]}>
            {t(`devices.activation.states.${row.original.state}`, row.original.state)}
          </StatusPill>
        ),
      },
      {
        id: "when",
        header: t("devices.activation.when", "Expires / used"),
        meta: { numeric: true, label: t("devices.activation.when", "Expires / used") },
        cell: ({ row }) => fmtStamp(row.original.used_at ?? row.original.revoked_at ?? row.original.expires_at),
      },
    ],
    [t],
  );

  if (!canIssue) return null;

  const onRevoke = async (c: ActivationCode) => {
    const ok = await confirm({
      title: t("devices.activation.revokeTitle", "Withdraw this code?"),
      description: t("devices.activation.revokeBody", "A tablet can no longer be activated with it."),
      confirmLabel: t("devices.activation.revoke", "Withdraw"),
      destructive: true,
    });
    if (!ok) return;
    revoke.mutate({ id: c.id }, { onError: (e) => toast.error(getErrorMessage(e)) });
  };

  return (
    <section className="space-y-3" aria-labelledby="activation-codes">
      <SectionHeader
        title={<span id="activation-codes">{t("devices.activation.title", "Activation codes")}</span>}
        description={t("devices.activation.subtitle", "Enter a code on a new tablet to bind it to this branch. Each code works once, for 24 hours.")}
        icon={KeyRound}
        trailing={
          <Button size="sm" onClick={() => setIssuing(true)}>
            <Plus className="size-4" />
            {t("devices.activation.issue", "New code")}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={codes.data ?? []}
        loading={codes.isLoading}
        error={codes.error}
        onRetry={() => void codes.refetch()}
        getRowId={(c) => c.id}
        hideViewOptions
        pageSize={10}
        rowActions={(c) =>
          c.state === "free" ? (
            <Button variant="ghost" size="sm" onClick={() => void onRevoke(c)}>
              {t("devices.activation.revoke", "Withdraw")}
            </Button>
          ) : null
        }
        emptyState={
          <EmptyState
            icon={KeyRound}
            title={t("devices.activation.empty", "No codes yet")}
            description={t("devices.activation.emptyHint", "Issue a code, then type it on the tablet you are setting up.")}
          />
        }
      />
      <IssueCodeDialog branchId={branchId} open={issuing} onClose={() => setIssuing(false)} />
    </section>
  );
}

const issueSchema = z.object({
  label: z.string().trim().max(120),
  kind: z.enum(["pos", "kds", "waiter"]),
});
type IssueForm = z.infer<typeof issueSchema>;

function IssueCodeDialog({ branchId, open, onClose }: { branchId: string; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const issue = useIssueActivationCode();
  const [issued, setIssued] = useState<ActivationCode | null>(null);
  const form = useForm<IssueForm>({ resolver: zodResolver(issueSchema), defaultValues: { label: "", kind: "pos" } });

  const close = () => {
    setIssued(null);
    form.reset({ label: "", kind: "pos" });
    onClose();
  };

  const submit = (v: IssueForm) =>
    issue.mutate(
      { data: { branch_id: branchId, label: v.label || null, kind: v.kind as DeviceKind } },
      { onSuccess: (c) => setIssued(c), onError: (e) => toast.error(getErrorMessage(e)) },
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("devices.activation.issueTitle", "New activation code")}</DialogTitle>
          <DialogDescription>
            {t("devices.activation.issueHint", "On the tablet, choose “Activate with a code” and type it. It works once, within 24 hours.")}
          </DialogDescription>
        </DialogHeader>
        {issued ? (
          <div className="space-y-4">
            <p dir="ltr" data-testid="issued-code" className="rounded-[10px] border bg-secondary py-5 text-center font-mono text-3xl font-semibold tracking-[0.2em] tabular-nums">
              {groupCode(issued.code)}
            </p>
            <DialogFooter>
              <Button onClick={close}>{t("common.done", "Done")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="code-label">{t("devices.activation.labelField", "Tablet name (optional)")}</Label>
              <Input id="code-label" maxLength={120} placeholder={t("devices.activation.labelPlaceholder", "Front counter")} {...form.register("label")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-kind">{t("devices.kind", "Type")}</Label>
              <Select value={form.watch("kind")} onValueChange={(v) => form.setValue("kind", v as IssueForm["kind"])}>
                <SelectTrigger id="code-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["pos", "kds", "waiter"] as const).map((k) => (
                    <SelectItem key={k} value={k}>{t(`devices.kinds.${k}`, k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={issue.isPending}>{t("devices.activation.issue", "New code")}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
