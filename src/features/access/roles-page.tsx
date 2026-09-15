import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  deleteRole,
  getListRolesQueryKey,
  setRoleGrant,
  useListRoles,
} from "@/data/api/generated/api";
import type { RoleView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useAuthz } from "@/data/authz/use-authz";
import { usePageSearch } from "@/data/scope/use-page-search";
import { Cap, ROLE_KIND_LABELS, type CapabilityMeta, type RoleKind } from "@/generated/capabilities";
import { Restricted } from "@/components/app/restricted";

import { AskManagerCard } from "./ask-manager-card";
import { AlwaysOn, CapabilityGroups } from "./capability-groups";
import { bilingual, isCoreFor, roleHolds } from "./catalog";
import { RoleDialog } from "./role-dialog";

export function RolesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const authz = useAuthz();
  const confirm = useConfirm();
  const canRead = authz.canAny(Cap.staffPermissionsRead, Cap.staffRolesManage);
  const canManage = authz.can(Cap.staffRolesManage);

  const [s, update] = usePageSearch<{ role: string }>();
  const q = useListRoles({ query: { enabled: canRead } });
  const roles = useMemo(() => q.data ?? [], [q.data]);
  const selected = roles.find((r) => r.id === s.role) ?? roles.find((r) => r.kind === "branch_manager") ?? roles[0];
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "rename"; role: RoleView } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (authz.ready && !canRead) {
    return <Restricted title={t("nav.rolesPermissions", "Roles & Permissions")} who={t("access.noAccess", "Only people who can see permissions can open this page.")} />;
  }

  const roleName = (r: RoleView) => bilingual(r.name_en, r.name_ar, lang);
  const kindLabel = (k: string) => {
    const l = ROLE_KIND_LABELS[k as RoleKind];
    return l ? bilingual(l.en, l.ar, lang) : k;
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });

  const toggle = async (role: RoleView, meta: CapabilityMeta, granted: boolean) => {
    setBusy(meta.key);
    try {
      await setRoleGrant(role.id, { capability: meta.key, granted });
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (role: RoleView) => {
    const ok = await confirm({
      title: t("access.deleteRoleTitle", "Delete this role?"),
      description: t("access.deleteRoleBody", "Nobody holds it. This cannot be undone."),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteRole(role.id);
      update({ role: undefined });
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const held = selected ? roleHolds(selected.grants, selected.kind) : new Set<string>();

  const control = (meta: CapabilityMeta) => {
    if (!selected) return null;
    if (isCoreFor(meta, selected.kind)) return <AlwaysOn />;
    const on = held.has(meta.key);
    return (
      <Switch
        checked={on}
        disabled={!canManage || !selected.editable || busy === meta.key}
        onCheckedChange={(v) => void toggle(selected, meta, v)}
        aria-label={meta.key}
      />
    );
  };

  return (
    <Page>
      <PageHeader
        title={t("nav.rolesPermissions", "Roles & Permissions")}
        subtitle={t("access.rolesSubtitle", "What each role may do. Change one person's access from Users.")}
        actions={
          canManage ? (
            <Button onClick={() => setDialog({ mode: "create" })}>
              <Plus className="size-4" />
              {t("access.newRole", "New role")}
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[280px_1fr]">
        <ListCard className="rounded-xl">
          {q.isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : q.error ? (
            <ErrorState title={t("access.rolesLoadError", "Couldn't load roles")} onRetry={() => void q.refetch()} retrying={q.isFetching} className="py-8" />
          ) : roles.length === 0 ? (
            <EmptyState icon={Shield} title={t("access.noRoles", "No roles yet")} className="py-8" />
          ) : (
            <div className="divide-y">
              {roles.map((r) => (
                <ListRow
                  key={r.id}
                  variant="nav"
                  selected={selected?.id === r.id}
                  onClick={() => update({ role: r.id })}
                  title={roleName(r)}
                  meta={`${kindLabel(r.kind)} · ${t("access.members", { count: r.members, defaultValue: "{{count}} people" })}`}
                />
              ))}
            </div>
          )}
        </ListCard>

        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <p className="font-bold">{roleName(selected)}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.editable
                    ? t("access.behavesLike", { kind: kindLabel(selected.kind), defaultValue: "Works like {{kind}} on older tablets" })
                    : t("access.ownerHoldsAll", "The owner can do everything. This role cannot be changed.")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.is_system ? <Badge variant="outline">{t("access.builtIn", "Built in")}</Badge> : null}
                {canManage ? (
                  <Button variant="outline" size="sm" onClick={() => setDialog({ mode: "rename", role: selected })}>
                    <Pencil className="size-4" />
                    {t("access.rename", "Rename")}
                  </Button>
                ) : null}
                {canManage && !selected.is_system ? (
                  <Button variant="outline" size="sm" disabled={selected.members > 0} onClick={() => void remove(selected)}>
                    <Trash2 className="size-4" />
                    {t("common.delete", "Delete")}
                  </Button>
                ) : null}
              </div>
            </div>
            {selected.editable ? <CapabilityGroups control={control} /> : null}
            {canManage ? <AskManagerCard /> : null}
          </div>
        ) : null}
      </div>
      {dialog ? (
        <RoleDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          role={dialog.mode === "rename" ? dialog.role : null}
          roles={roles}
          onSaved={(r) => {
            setDialog(null);
            update({ role: r.id });
            void refresh();
          }}
        />
      ) : null}
    </Page>
  );
}
