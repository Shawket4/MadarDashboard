import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, CheckCircle, ChevronRight, MinusCircle, Shield, X, XCircle } from "lucide-react";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
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
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { usePageSearch } from "@/data/scope/use-page-search";

// Preferred display order; resources the backend returns that aren't listed are
// appended alphabetically, so new resources show up without a code change.
const RESOURCE_ORDER = [
  "orgs", "branches", "users", "permissions", "settings",
  "categories", "menu_items", "addon_groups", "addon_items", "recipes",
  "inventory", "inventory_adjustments", "inventory_transfers", "stocktakes",
  "inventory_waste", "suppliers", "purchase_orders",
  "orders", "order_items", "payments", "shifts", "soft_serve_batches",
];
const ACTION_ORDER = ["read", "create", "update", "delete"];

const orderBy = (items: string[], pref: string[]) => {
  const rank = (s: string) => { const i = pref.indexOf(s); return i === -1 ? pref.length : i; };
  return [...items].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

export function PermissionsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const authUserId = useAuthStore((s) => s.user?.id);

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

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("permissions.title", "Permissions")}</h1>
        <p className="text-sm text-muted-foreground">{t("permissions.subtitle", "Manage per-user access overrides")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* User picker */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b bg-muted/30 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("permissions.selectUser", "Select a user")}</p></div>
          <ScrollArea className="max-h-[min(600px,calc(100vh-14rem))] overflow-y-auto">
            {usersQ.isLoading ? (
              <div className="space-y-2 p-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : users.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">{t("common.noResults", "No results")}</p>
            ) : (
              users.map((u) => (
                <button key={u.id} onClick={() => update({ user: u.id })}
                  className={cn("flex w-full items-center gap-3 border-b px-4 py-3 text-start transition-colors last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1", selUser === u.id && "bg-accent")}>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{u.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{t(`roles.${u.role}`, u.role)}</p></div>
                  {selUser === u.id ? <ChevronRight className="size-3.5 shrink-0 text-primary rtl:rotate-180" /> : null}
                </button>
              ))
            )}
          </ScrollArea>
        </div>

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
                {matrixQ.isLoading ? (
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
    </Page>
  );
}
