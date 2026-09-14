import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorState } from "@/components/app/empty-state";
import { cn } from "@/lib/utils";
import {
  getGetPermissionMatrixQueryKey, getGetRolePermissionsQueryKey, upsertRolePermission, useGetRolePermissions,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useAuthStore } from "@/data/stores/auth.store";

/** The roles whose defaults a shop works with. `super_admin` bypasses every check. */
export const EDITABLE_ROLES = ["org_admin", "branch_manager", "teller", "waiter", "kitchen"] as const;

type Props = {
  /** Display order for resources and actions, shared with the per-user matrix. */
  orderResources: (items: string[]) => string[];
  orderActions: (items: string[]) => string[];
};

/**
 * The role defaults every user starts from — e.g. `orders:waive_service`, which managers hold and
 * tellers do not. Defaults are shared by every organisation on the server, so only a super admin may
 * change them here; everyone else reads them and changes a person's access with an override above.
 */
export function RoleDefaults({ orderResources, orderActions }: Props) {
  const { t } = useTranslation();
  const isSuperAdmin = useAuthStore((s) => s.user?.role === "super_admin");
  const [role, setRole] = useState<string>("branch_manager");
  const [busy, setBusy] = useState<string | null>(null);
  const q = useGetRolePermissions();
  const rows = useMemo(() => (q.data ?? []).filter((r) => r.role === role), [q.data, role]);
  const resources = useMemo(() => orderResources([...new Set(rows.map((r) => r.resource))]), [rows, orderResources]);
  const actions = useMemo(() => orderActions([...new Set(rows.map((r) => r.action))]), [rows, orderActions]);
  const cellOf = (resource: string, action: string) => rows.find((r) => r.resource === resource && r.action === action);

  const toggle = async (resource: string, action: string, granted: boolean) => {
    const key = `${resource}:${action}`;
    setBusy(key);
    try {
      await upsertRolePermission({ role, resource, action, granted: !granted });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetRolePermissionsQueryKey() }),
        // Every user's resolved matrix reads the defaults too.
        queryClient.invalidateQueries({ predicate: (qq) => String(qq.queryKey[0]).startsWith(getGetPermissionMatrixQueryKey("")[0]) }),
      ]);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 p-4">
        <div>
          <p className="font-bold">{t("permissions.roleDefaults", "Role defaults")}</p>
          <p className="text-xs text-muted-foreground">
            {isSuperAdmin
              ? t("permissions.roleDefaultsHint", "What every user in a role holds unless an override says otherwise")
              : t("permissions.roleDefaultsReadOnly", "Shared by every organisation; change one person's access with an override above")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("permissions.roleDefaults", "Role defaults")}>
          {EDITABLE_ROLES.map((r) => (
            <Button key={r} size="sm" variant={r === role ? "default" : "outline"} role="radio" aria-checked={r === role} onClick={() => setRole(r)}>
              {t(`roles.${r}`, r)}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="max-h-[min(520px,calc(100vh-18rem))] overflow-y-auto">
        {q.error ? (
          <ErrorState title={t("permissions.roleDefaultsLoadError", "Couldn't load the role defaults")} onRetry={() => void q.refetch()} retrying={q.isFetching} className="py-10" />
        ) : q.isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
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
                <tr key={resource} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{t(`permissions.resources.${resource}`, { defaultValue: resource.replace(/_/g, " ") })}</td>
                  {actions.map((action) => {
                    const cell = cellOf(resource, action);
                    if (!cell) return <td key={action} className="px-3 py-3 text-center text-muted-foreground">—</td>;
                    const label = `${t(`permissions.resources.${resource}`, { defaultValue: resource })} · ${t(`permissions.actions.${action}`, action)}`;
                    return (
                      <td key={action} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          disabled={!isSuperAdmin || busy !== null}
                          aria-label={label}
                          aria-pressed={cell.granted}
                          onClick={() => void toggle(resource, action, cell.granted)}
                          className={cn(
                            "mx-auto grid size-7 place-items-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-default",
                            cell.granted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground/40",
                          )}
                        >
                          {cell.granted ? <Check className="size-3" /> : <X className="size-3" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollArea>
    </div>
  );
}
