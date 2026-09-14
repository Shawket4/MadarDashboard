import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { CheckCircle2, History, Pencil, Tablet } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/data/api/errors";
import { usePageSearch } from "@/data/scope/use-page-search";
import { useScope } from "@/data/scope/use-scope";
import { fmtStamp } from "@/lib/format";

import { DEVICE_CODE_RE, useClientVersions, useDevices, usePatchDevice, type ClientSeen, type Device } from "./api";

type View = "devices" | "clients";
const DAY_OPTIONS = [7, 14, 30, 90] as const;

export type DevicesSearch = {
  view?: View;
  days?: number;
  all?: boolean;
};

export function validateDevicesSearch(s: Record<string, unknown>): DevicesSearch {
  const days = Number(s.days);
  return {
    view: s.view === "clients" ? "clients" : undefined,
    days: DAY_OPTIONS.includes(days as (typeof DAY_OPTIONS)[number]) ? days : undefined,
    all: s.all === true || s.all === "true" || undefined,
  };
}

export function DevicesPage() {
  const { t } = useTranslation();
  const { branchId } = useScope();
  const [search, update] = usePageSearch<DevicesSearch>();
  const view: View = search.view ?? "devices";
  const [editing, setEditing] = useState<Device | null>(null);

  return (
    <Page>
      <PageHeader
        title={t("devices.title", "Devices")}
        description={t("devices.subtitle", "POS, kitchen and waiter devices that have signed in at this branch.")}
        below={
          <SegmentedControl<View>
            value={view}
            onChange={(v) => update({ view: v === "devices" ? undefined : v })}
            options={[
              { value: "devices", label: t("devices.tabDevices", "Devices") },
              { value: "clients", label: t("devices.clients.title", "Client versions") },
            ]}
          />
        }
      />
      {view === "clients" ? (
        <ClientVersionsView
          branchId={branchId}
          days={search.days ?? 14}
          legacyOnly={!search.all}
          onChange={(p) => update(p)}
        />
      ) : !branchId ? (
        <EmptyState icon={Tablet} title={t("tills.pickBranch", "Select a branch")} description={t("devices.pickBranchHint", "Devices are registered per branch.")} />
      ) : (
        <DevicesSection branchId={branchId} onEdit={setEditing} />
      )}
      <DeviceDialog device={editing} onClose={() => setEditing(null)} />
    </Page>
  );
}

function DevicesSection({ branchId, onEdit }: { branchId: string; onEdit: (d: Device) => void }) {
  const devices = useDevices(branchId);
  return (
    <DevicesTable
      devices={devices.data ?? []}
      loading={devices.isLoading}
      error={devices.error}
      onRetry={() => void devices.refetch()}
      onEdit={onEdit}
    />
  );
}

export function DevicesTable({
  devices,
  loading,
  error,
  onRetry,
  onEdit,
}: {
  devices: Device[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onEdit: (d: Device) => void;
}) {
  const { t } = useTranslation();
  const columns = useMemo<ColumnDef<Device>[]>(
    () => [
      {
        accessorKey: "code",
        header: t("devices.code", "Code"),
        meta: { phone: "title", label: t("devices.code", "Code") },
        cell: ({ row }) => {
          const d = row.original;
          return (
            <span className="flex flex-wrap items-center gap-2" data-testid="device-row">
              <span className="font-mono font-semibold">{d.code}</span>
              {d.code_conflict ? (
                <span data-testid="code-conflict" className="contents">
                  <StatusPill tone="warning" size="sm">{t("devices.codeConflict", "Another device uses this code")}</StatusPill>
                </span>
              ) : null}
            </span>
          );
        },
      },
      { accessorKey: "label", header: t("devices.label", "Name"), meta: { label: t("devices.label", "Name") }, cell: ({ row }) => row.original.label ?? <span className="text-muted-foreground">—</span> },
      { accessorKey: "kind", header: t("devices.kind", "Type"), meta: { label: t("devices.kind", "Type") }, cell: ({ row }) => t(`devices.kinds.${row.original.kind}`, row.original.kind) },
      {
        id: "app",
        header: t("devices.app", "App"),
        meta: { label: t("devices.app", "App") },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {[row.original.platform, row.original.app_version].filter(Boolean).join(" · ") || "—"}
          </span>
        ),
      },
      {
        id: "state",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) =>
          row.original.retired_at ? (
            <StatusPill size="sm">{t("devices.retired", "Retired")}</StatusPill>
          ) : (
            <StatusPill size="sm" tone="success">{t("devices.active", "Active")}</StatusPill>
          ),
      },
      {
        accessorKey: "last_seen_at",
        header: t("devices.lastSeen", "Last seen"),
        meta: { numeric: true, label: t("devices.lastSeen", "Last seen") },
        cell: ({ row }) => fmtStamp(row.original.last_seen_at),
      },
    ],
    [t],
  );
  return (
    <DataTable
      columns={columns}
      data={devices}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(d) => d.id}
      onRowClick={onEdit}
      hideViewOptions
      pageSize={20}
      rowActions={(d) => (
        <Button variant="ghost" size="icon-sm" aria-label={t("common.edit", "Edit")} onClick={() => onEdit(d)}>
          <Pencil className="size-4" />
        </Button>
      )}
      emptyState={
        <EmptyState
          icon={Tablet}
          title={t("devices.empty", "No devices yet")}
          description={t("devices.emptyHint", "A device appears here the first time it signs in at this branch.")}
        />
      }
    />
  );
}

/** Who still talks to the server through pre-rework paths (G-old gate). */
export function ClientVersionsView({
  branchId,
  days,
  legacyOnly,
  onChange,
}: {
  branchId: string | null;
  days: number;
  legacyOnly: boolean;
  onChange: (p: DevicesSearch) => void;
}) {
  const { t } = useTranslation();
  const q = useClientVersions(branchId, legacyOnly, days);
  const rows = useMemo(() => q.data ?? [], [q.data]);
  const legacyCount = rows.filter((r) => r.last_legacy_at).length;
  const versions = new Set(rows.map((r) => r.app_version).filter(Boolean)).size;

  const kpis: LedgerItem[] = [
    { key: "clients", label: t("devices.clients.seen", "Clients seen"), value: rows.length, loading: q.isLoading },
    { key: "legacy", label: t("devices.clients.onLegacy", "On legacy paths"), value: legacyCount, accent: legacyCount ? "warning" : "success", loading: q.isLoading },
    { key: "versions", label: t("devices.clients.versions", "App versions"), value: versions, loading: q.isLoading },
  ];

  return (
    <div className="space-y-6">
      <LedgerStrip items={kpis} />
      <ClientVersionsTable
        rows={rows}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        showBranch={!branchId}
        days={days}
        legacyOnly={legacyOnly}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => onChange({ days: Number(v) === 14 ? undefined : Number(v) })}>
              <SelectTrigger className="h-9 w-auto min-w-32" aria-label={t("devices.clients.window", "Window")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{t("devices.clients.lastDays", { count: d, defaultValue: "Last {{count}} days" })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="flex h-9 items-center gap-2 rounded-[10px] border bg-card px-3 text-sm font-normal">
              <Switch checked={legacyOnly} onCheckedChange={(c) => onChange({ all: c ? undefined : true })} />
              {t("devices.clients.legacyOnly", "Legacy clients only")}
            </Label>
          </div>
        }
      />
    </div>
  );
}

export function ClientVersionsTable({
  rows,
  loading,
  error,
  onRetry,
  showBranch,
  days,
  legacyOnly,
  toolbar,
}: {
  rows: ClientSeen[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  showBranch?: boolean;
  days: number;
  legacyOnly: boolean;
  toolbar?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const columns = useMemo<ColumnDef<ClientSeen>[]>(
    () => [
      {
        id: "device",
        header: t("devices.clients.device", "Device"),
        meta: { phone: "title", label: t("devices.clients.device", "Device") },
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="min-w-0" data-testid="client-row">
              <p className="truncate font-semibold">
                {c.device_code ? <span className="font-mono">{c.device_code}</span> : t("devices.clients.unregistered", "Unregistered client")}
              </p>
              <p dir="ltr" className="max-w-xs truncate text-left rtl:text-right text-xs text-muted-foreground" title={c.client ?? undefined}>{c.client ?? "—"}</p>
            </div>
          );
        },
      },
      ...(showBranch
        ? ([{ id: "branch", header: t("tills.branch", "Branch"), meta: { label: t("tills.branch", "Branch") }, cell: ({ row }) => row.original.branch_name ?? "—" }] as ColumnDef<ClientSeen>[])
        : []),
      {
        accessorKey: "app_version",
        header: t("devices.clients.version", "Version"),
        meta: { label: t("devices.clients.version", "Version") },
        cell: ({ row }) => (row.original.app_version ? <bdi className="font-mono">{row.original.app_version}</bdi> : <span className="text-muted-foreground">—</span>),
      },
      {
        accessorKey: "last_seen_at",
        header: t("devices.lastSeen", "Last seen"),
        meta: { numeric: true, label: t("devices.lastSeen", "Last seen") },
        cell: ({ row }) => fmtStamp(row.original.last_seen_at),
      },
      {
        id: "legacy",
        header: t("devices.clients.lastLegacy", "Last legacy hit"),
        meta: { label: t("devices.clients.lastLegacy", "Last legacy hit") },
        cell: ({ row }) => {
          const c = row.original;
          if (!c.last_legacy_at) {
            return <StatusPill size="sm" tone="success">{t("devices.clients.upToDate", "Up to date")}</StatusPill>;
          }
          return (
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <StatusPill size="sm" tone="warning">{t("devices.clients.legacy", "Legacy")}</StatusPill>
                <bdi className="font-mono text-sm tabular-nums">{fmtStamp(c.last_legacy_at)}</bdi>
              </p>
              {c.last_legacy_kind ? (
                <p className="text-xs font-medium">
                  <bdi className="font-mono">{c.last_legacy_kind}</bdi>
                  {c.legacy_kinds.length > 1 ? <span className="ms-1 text-muted-foreground">+{c.legacy_kinds.length - 1}</span> : null}
                </p>
              ) : null}
              {c.last_legacy_path ? (
                <p dir="ltr" className="max-w-xs truncate text-left rtl:text-right font-mono text-xs text-muted-foreground" title={c.last_legacy_path}>
                  {c.last_legacy_path}
                </p>
              ) : null}
            </div>
          );
        },
      },
    ],
    [t, showBranch],
  );
  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(c) => `${c.device_id ?? ""}|${c.client ?? ""}|${c.first_seen_at}`}
      toolbar={toolbar}
      hideViewOptions
      pageSize={20}
      emptyState={
        legacyOnly ? (
          <EmptyState
            icon={CheckCircle2}
            title={t("devices.clients.noLegacy", "No legacy clients")}
            description={t("devices.clients.noLegacyHint", { count: days, defaultValue: "Nothing used a pre-rework path in the last {{count}} days." })}
          />
        ) : (
          <EmptyState
            icon={History}
            title={t("devices.clients.none", "No clients seen")}
            description={t("devices.clients.noneHint", { count: days, defaultValue: "No app has called the server in the last {{count}} days." })}
          />
        )
      }
    />
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
          <DialogDescription>{t("devices.editHint", "The code prefixes this device's order numbers, e.g. 36B-12.")}</DialogDescription>
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
          <Label className="flex items-center justify-between gap-2 rounded-[10px] border px-3 py-2.5 font-normal">
            <span>
              <span className="block text-sm font-medium">{t("devices.retired", "Retired")}</span>
              <span className="block text-xs text-muted-foreground">{t("devices.retiredHint", "Its code is freed for another device and it leaves the availability lists.")}</span>
            </span>
            <Switch checked={form.watch("retired")} onCheckedChange={(c) => form.setValue("retired", c, { shouldDirty: true })} />
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
