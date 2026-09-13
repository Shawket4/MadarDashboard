import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Tablet } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime } from "@/lib/format";

import { DEVICE_CODE_RE, useDevices, usePatchDevice, type Device } from "./api";

export function DevicesPage() {
  const { t } = useTranslation();
  const { branchId } = useScope();
  const devices = useDevices(branchId);
  const [editing, setEditing] = useState<Device | null>(null);

  return (
    <Page>
      <PageHeader
        title={t("devices.title", "Devices")}
        description={t("devices.subtitle", "POS, kitchen and waiter devices that have signed in at this branch.")}
      />
      {!branchId ? (
        <EmptyState icon={Tablet} title={t("tills.pickBranch", "Select a branch")} />
      ) : devices.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <DevicesTable devices={devices.data ?? []} onEdit={setEditing} />
      )}
      <DeviceDialog device={editing} onClose={() => setEditing(null)} />
    </Page>
  );
}

export function DevicesTable({ devices, onEdit }: { devices: Device[]; onEdit: (d: Device) => void }) {
  const { t } = useTranslation();
  if (devices.length === 0) return <EmptyState icon={Tablet} title={t("devices.empty", "No devices yet")} />;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-start font-medium">{t("devices.code", "Code")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("devices.label", "Name")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("devices.kind", "Type")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("devices.app", "App")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("devices.lastSeen", "Last seen")}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="border-t" data-testid="device-row">
              <td className="px-3 py-2">
                <span className="font-mono font-medium">{d.code}</span>
                {d.code_conflict ? (
                  <Badge variant="secondary" className="ms-2 bg-warning/10 text-warning" data-testid="code-conflict">
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    {t("devices.codeConflict", "Another device uses this code")}
                  </Badge>
                ) : null}
              </td>
              <td className="px-3 py-2">{d.label ?? "—"}</td>
              <td className="px-3 py-2">{t(`devices.kinds.${d.kind}`, d.kind)}</td>
              <td className="px-3 py-2 text-muted-foreground">{[d.platform, d.app_version].filter(Boolean).join(" · ") || "—"}</td>
              <td className="px-3 py-2 tabular">
                {fmtDateTime(d.last_seen_at)}
                {d.retired_at ? <Badge variant="secondary" className="ms-2">{t("devices.retired", "Retired")}</Badge> : null}
              </td>
              <td className="px-3 py-2 text-end">
                <Button size="sm" variant="ghost" onClick={() => onEdit(d)}>
                  {t("common.edit", "Edit")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const deviceSchema = z.object({
  code: z.string().trim().toUpperCase().regex(DEVICE_CODE_RE, "code"),
  label: z.string(),
  retired: z.boolean(),
});
type DeviceForm = z.infer<typeof deviceSchema>;

function DeviceDialog({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const { t } = useTranslation();
  const patch = usePatchDevice();
  const form = useForm<DeviceForm>({ resolver: zodResolver(deviceSchema), defaultValues: { code: "", label: "", retired: false } });
  useEffect(() => {
    if (device) form.reset({ code: device.code, label: device.label ?? "", retired: !!device.retired_at });
  }, [device, form]);

  const submit = (v: DeviceForm) =>
    device &&
    patch.mutate(
      { id: device.id, data: { code: v.code, label: v.label.trim() || null, retired: v.retired } },
      {
        onSuccess: () => {
          toast.success(t("common.saved", "Saved"));
          onClose();
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  return (
    <Dialog open={!!device} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("devices.edit", "Edit device")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="device-code">{t("devices.code", "Code")}</Label>
            <Input id="device-code" className="font-mono uppercase" maxLength={6} {...form.register("code")} />
            {form.formState.errors.code ? (
              <p className="text-xs text-destructive">{t("devices.codeInvalid", "1–6 letters or digits")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="device-label">{t("devices.label", "Name")}</Label>
            <Input id="device-label" {...form.register("label")} />
          </div>
          <Label className="flex items-center gap-2 font-normal">
            <Switch checked={form.watch("retired")} onCheckedChange={(c) => form.setValue("retired", c, { shouldDirty: true })} />
            {t("devices.retired", "Retired")}
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel", "Cancel")}</Button>
            <Button type="submit" loading={patch.isPending}>{t("common.save", "Save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
