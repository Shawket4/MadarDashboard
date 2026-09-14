import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, CheckCircle, MinusCircle, Shield, X, XCircle } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { ExportButton } from "@/components/app/export-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  deleteUserPermission, upsertUserPermission,
  useGetPermissionMatrix, useListUsers,
  getGetPermissionMatrixQueryKey, getGetUserPermissionsQueryKey,
} from "@/data/api/generated/api";
import type { PermissionMatrix } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { usePageSearch } from "@/data/scope/use-page-search";
import { RoleDefaults } from "./role-defaults";

// Preferred display order; resources the backend returns that aren't listed are
// appended alphabetically, so new resources show up without a code change.
const RESOURCE_ORDER = [
  "orgs", "branches", "users", "permissions", "settings",
  "categories", "menu_items", "addon_groups", "addon_items", "recipes",
  "inventory", "inventory_adjustments", "inventory_transfers", "stocktakes",
  "inventory_waste", "suppliers", "purchase_orders",
  "orders", "order_items", "payments", "tills", "soft_serve_batches",
];
// `waive_service` is a grant on `orders` alone (removing the service charge from a table's bill);
// it sits after the CRUD rungs, and every other resource shows "—" in its column.
const ACTION_ORDER = ["read", "create", "update", "delete", "waive_service"];

const orderBy = (items: string[], pref: string[]) => {
  const rank = (s: string) => { const i = pref.indexOf(s); return i === -1 ? pref.length : i; };
  return [...items].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

const orderResources = (items: string[]) => orderBy(items, RESOURCE_ORDER);
const orderActions = (items: string[]) => orderBy(items, ACTION_ORDER);

export function PermissionsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const authUserId = useAuthStore((s) => s.user?.id);
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const [s, update] = usePageSearch<{ user: string }>();
  const selUser = s.user ?? null;

  const usersQ = useListUsers({ org_id: orgId || undefined }, { query: { enabled: !!orgId } });
  const users = useMemo(() => (usersQ.data ?? []).filter((u) => u.id !== authUserId), [usersQ.data, authUserId]);
  const matrixQ = useGetPermissionMatrix(selUser ?? "", { query: { enabled: !!selUser } });
  const matrix = useMemo(() => matrixQ.data ?? [], [matrixQ.data]);

  const resources = useMemo(() => orderBy([...new Set(matrix.map((m) => m.resource))], RESOURCE_ORDER), [matrix]);
  const actions = useMemo(() => orderBy([...new Set(matrix.map((m) => m.action))], ACTION_ORDER), [matrix]);
  const cellOf = (r: string, a: string) => matrix.find((m) => m.resource === r && m.action === a);
  const selected = usersQ.data?.find((u) => u.id === selUser);

  const refetchMatrix = () => selUser && Promise.all([
    queryClient.invalidateQueries({ queryKey: getGetPermissionMatrixQueryKey(selUser) }),
    queryClient.invalidateQueries({ queryKey: getGetUserPermissionsQueryKey(selUser) }),
  ]);

  const toggle = async (resource: string, action: string, cell: PermissionMatrix | undefined) => {
    if (!cell || !selUser) return;
    try {
      if (cell.user_override !== null && cell.user_override !== undefined) {
        await deleteUserPermission(selUser, resource, action);
      } else {
        await upsertUserPermission(selUser, { resource, action, granted: !cell.role_default });
      }
      void refetchMatrix();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };


  // The file is the matrix on screen: one row per resource, one column per
  // action, and in each cell the effective answer plus whether an override is
  // what made it so — which is the only thing this screen exists to show.
  // A user's matrix arrives whole in one request, so there is nothing to page.
  const handleExport = async () => {
    if (!selUser || !selected) return;
    setExporting(true);
    try {
      const cols: ExcelColumn<string>[] = [
        {
          header: t("permissions.resource", "Resource"),
          accessor: (resource) => t(`permissions.resources.${resource}`, { defaultValue: resource.replace(/_/g, " ") }),
          type: "text",
          width: 26,
        },
        ...actions.map((action): ExcelColumn<string> => ({
          header: t(`permissions.actions.${action}`, action),
          accessor: (resource) => {
            const cell = cellOf(resource, action);
            if (!cell) return "—";
            const verdict = cell.effective ? t("permissions.allowed", "Allowed") : t("permissions.denied", "Denied");
            const hasOverride = cell.user_override !== null && cell.user_override !== undefined;
            return hasOverride
              ? `${verdict} (${t("permissions.override", "Override")})`
              : `${verdict} (${t("permissions.roleDefault", "Role default")})`;
          },
          type: "text",
          width: 22,
        })),
      ];
      await exportToExcel({
        filename: `Madar-Permissions-${selected.name}`,
        logoUrl,
        meta: t(`roles.${selected.role}`, selected.role),
        sheets: [{
          name: t("permissions.title", "Permissions"),
          title: t("permissions.title", "Permissions"),
          subtitle: selected.name,
          rows: resources as unknown as Record<string, unknown>[],
          columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
        }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t("permissions.title", "Permissions")}
        subtitle={t("permissions.subtitle", "Manage per-user access overrides")}
        actions={<ExportButton onExport={handleExport} loading={exporting} disabled={!selUser || resources.length === 0} />}
      />
      <div className="grid grid-cols-1 items-start gap-4">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_1fr]">
        {/* User picker */}
        <ListCard className="rounded-xl">
          <div className="px-4 py-3 sm:px-5"><p className="text-sm font-semibold">{t("permissions.selectUser", "Select a user")}</p></div>
          <ScrollArea className="max-h-[min(600px,calc(100vh-14rem))] overflow-y-auto">
            {usersQ.isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex min-h-14 items-center gap-3 px-4 sm:px-5">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
                  </div>
                ))}
              </div>
            ) : usersQ.error ? (
              <ErrorState title={t("permissions.usersLoadError", "Couldn't load users")} onRetry={() => void usersQ.refetch()} retrying={usersQ.isFetching} className="py-8" />
            ) : users.length === 0 ? (
              <EmptyState icon={Shield} title={t("permissions.noUsers", "Other staff accounts appear here once they're added")} className="py-8" />
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <ListRow
                    key={u.id}
                    variant="nav"
                    selected={selUser === u.id}
                    onClick={() => update({ user: u.id })}
                    leading={<Avatar className="size-9 shrink-0"><AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback></Avatar>}
                    title={u.name}
                    meta={t(`roles.${u.role}`, u.role)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </ListCard>

        {/* Matrix */}
        <div className="overflow-hidden rounded-xl border bg-card">
          {!selUser ? (
            <EmptyState icon={Shield} title={t("permissions.selectUser", "Select a user")} description={t("permissions.selectUserHint", "Choose a user to view and manage their permissions")} className="min-h-[min(600px,calc(100vh-14rem))]" />
          ) : (
            <>
              <div className="flex items-center justify-between border-b bg-muted/30 p-4">
                <div><p className="font-bold">{selected?.name ?? "—"}</p><p className="text-xs text-muted-foreground">{t("permissions.overridesApplied", "Overrides applied on top of role defaults")}</p></div>
                {selected ? <Badge variant="outline" className="border-transparent bg-info/15 text-info">{t(`roles.${selected.role}`, selected.role)}</Badge> : null}
              </div>
              <ScrollArea className="max-h-[min(520px,calc(100vh-18rem))] overflow-y-auto">
                {matrixQ.error ? (
                  <ErrorState title={t("permissions.matrixLoadError", "Couldn't load this user's permissions")} onRetry={() => void matrixQ.refetch()} retrying={matrixQ.isFetching} className="py-10" />
                ) : matrixQ.isLoading ? (
                  <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b bg-background">
                      <tr>
                        <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("permissions.resource", "Resource")}</th>
                        {actions.map((a) => <th key={a} className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(`permissions.actions.${a}`, a)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr key={resource} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">{t(`permissions.resources.${resource}`, { defaultValue: resource.replace(/_/g, " ") })}</td>
                          {actions.map((action) => {
                            const cell = cellOf(resource, action);
                            if (!cell) return <td key={action} className="px-3 py-3 text-center text-muted-foreground">—</td>;
                            const hasOverride = cell.user_override !== null && cell.user_override !== undefined;
                            const eff = cell.effective;
                            return (
                              <td key={action} className="px-3 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <button onClick={() => void toggle(resource, action, cell)}
                                    title={hasOverride ? t("permissions.override", "Override") : t("permissions.roleDefault", "Role default")}
                                    className={cn("grid size-7 place-items-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                      hasOverride
                                        ? eff ? "border-primary bg-primary text-primary-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"
                                        : eff ? "border-border bg-muted text-muted-foreground" : "border-border bg-muted text-muted-foreground/40")}>
                                    {eff ? <Check className="size-3" /> : <X className="size-3" />}
                                  </button>
                                  {hasOverride ? <span className="text-xs font-bold uppercase text-primary">{t("permissions.override", "Override")}</span> : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
              <div className="flex flex-wrap items-center gap-4 border-t bg-muted/20 p-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5 text-primary" /><span className="size-3.5 rounded border border-primary/30 bg-primary/20" /> {t("permissions.overrideGranted", "Override granted")}</span>
                <span className="flex items-center gap-1.5"><XCircle className="size-3.5 text-destructive" /><span className="size-3.5 rounded border border-destructive/30 bg-destructive/10" /> {t("permissions.overrideDenied", "Override denied")}</span>
                <span className="flex items-center gap-1.5"><MinusCircle className="size-3.5 text-muted-foreground" /><span className="size-3.5 rounded border border-border bg-muted" /> {t("permissions.roleDefault", "Role default")}</span>
              </div>
            </>
          )}
        </div>
      </div>
      <RoleDefaults orderResources={orderResources} orderActions={orderActions} />
      </div>
    </Page>
  );
}
