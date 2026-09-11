import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Plug, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CredentialDialog } from "./credential-dialog";
import { HandoffDialog } from "./handoff-dialog";
import { hasSecureRandom } from "./passphrase";
import type { IssuedCredential } from "./use-credential-handoff";
import { invalidateCredentials, isRevoked } from "./util";
import { revokeCredential, rotateCredential, useListCredentials } from "@/data/api/generated/api";
import type { CredentialSummary } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDateTime } from "@/lib/format";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";
import { useAuthStore } from "@/data/stores/auth.store";
import { Restricted } from "@/components/app/restricted";

export function IntegrationsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();
  // A partner credential is an agreement between us and a third party, and the
  // secret it mints reads this shop's order data. A shop can AUDIT the list —
  // "who has access?" is a fair question to answer without asking us — and
  // issue, rotate and revoke are ours. The backend refuses all three for
  // anyone below super admin; this is so nobody is shown a button that will
  // only fail.
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";
  // Org admin and above may read; below that there is nothing here at all, not
  // even the list. `list_credentials` on the backend says the same.
  const mayView = isSuperAdmin || role === "org_admin";

  const list = useListCredentials({ query: { enabled: !!orgId } });
  const credentials = useMemo(() => list.data ?? [], [list.data]);

  const [s, update] = usePageSearch<{ edit: string }>();
  // `?edit=new` is a URL anyone can type. The dialog opens only for the role
  // whose requests the backend will actually accept.
  const creating = s.edit === "new";

  // Held in local state, never refetched and never put in the query cache:
  // this is the only moment the plaintext secret exists on the client.
  const [issued, setIssued] = useState<IssuedCredential | null>(null);

  const rotate = async (c: CredentialSummary) => {
    // Same pre-flight as create: never mint a password we already know we
    // cannot package into a handoff file.
    if (!hasSecureRandom()) {
      toast.error(
        t(
          "integrations.handoff.noSecureRandom",
          "This browser cannot generate a secure password. Open the dashboard over HTTPS and try again.",
        ),
      );
      return;
    }
    const ok = await confirm({
      title: t("integrations.rotateTitle", "Rotate password?"),
      description: t(
        "integrations.rotateHint",
        "{{name}} will stop working immediately until the partner updates to the new password.",
        { name: c.name },
      ),
      confirmLabel: t("integrations.rotate", "Rotate"),
      destructive: true,
    });
    if (!ok) return;
    try {
      const next = await rotateCredential(c.id);
      void invalidateCredentials();
      setIssued({ credential: next, mode: "rotated" });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const revoke = async (c: CredentialSummary) => {
    const ok = await confirm({
      title: t("integrations.revokeTitle", "Revoke access?"),
      description: t(
        "integrations.revokeHint",
        "{{name}} loses access immediately and permanently. This cannot be undone — issue a new credential if they need access again.",
        { name: c.name },
      ),
      confirmLabel: t("integrations.revoke", "Revoke"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeCredential(c.id);
      void invalidateCredentials();
      toast.success(t("integrations.revoked", "Access revoked"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = useMemo<ColumnDef<CredentialSummary>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("integrations.label", "Label"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.original.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">{row.original.username}</p>
          </div>
        ),
      },
      { accessorKey: "branch_name", header: t("integrations.branch", "Branch") },
      {
        accessorKey: "last_used_at",
        header: t("integrations.lastUsed", "Last used"),
        cell: ({ row }) =>
          row.original.last_used_at ? (
            <span className="text-sm">{fmtDateTime(row.original.last_used_at)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{t("integrations.never", "Never")}</span>
          ),
      },
      {
        id: "status",
        header: t("common.status", "Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={isRevoked(row.original)
              ? "border-transparent bg-muted text-muted-foreground"
              : "border-transparent bg-success/15 text-success"}
          >
            {isRevoked(row.original) ? t("integrations.revokedStatus", "Revoked") : t("common.active", "Active")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* A revoked credential is a permanent audit record — nothing left to do to it. */}
            {isRevoked(row.original) || !isSuperAdmin ? null : (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void rotate(row.original)}
                  aria-label={t("integrations.rotate", "Rotate")}
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void revoke(row.original)}
                  aria-label={t("integrations.revoke", "Revoke")}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, isSuperAdmin],
  );

  if (!mayView) {
    return <Restricted title={t("integrations.title", "Integrations")} />;
  }

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("integrations.title", "Integrations")} />
        <EmptyState icon={Plug} title={t("users.pickOrg", "Select an organization")} />
      </Page>
    );
  }

  const active = credentials.filter((c) => !isRevoked(c)).length;

  return (
    <Page>
      <PageHeader
        title={t("integrations.title", "Integrations")}
        description={
          isSuperAdmin
            ? t(
                "integrations.hint",
                "Give a partner read-only access to one branch's order analytics.",
              )
            : t(
                "integrations.hintReadOnly",
                "Partners with read-only access to a branch's order analytics. Ask Madar to add, rotate or revoke one.",
              )
        }
        actions={
          isSuperAdmin ? (
            <Button onClick={() => update({ edit: "new" })}>
              <Plus className="size-4" /> {t("integrations.issue", "Issue credential")}
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("common.total", "Total")} value={credentials.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={active} accent="success" loading={list.isLoading} />
        <StatCard
          label={t("integrations.revokedStatus", "Revoked")}
          value={credentials.length - active}
          accent="warning"
          loading={list.isLoading}
        />
      </div>
      <DataTable
        columns={columns}
        data={credentials}
        loading={list.isLoading}
        getRowId={(c) => c.id}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={
          <EmptyState
            icon={KeyRound}
            title={t("integrations.emptyTitle", "No integrations yet")}
            description={t(
              "integrations.emptyHint",
              "Issue a credential to let a partner pull this branch's order analytics.",
            )}
          />
        }
      />
      <CredentialDialog
        orgId={orgId}
        open={creating && isSuperAdmin}
        onOpenChange={(o) => { if (!o) update({ edit: undefined }); }}
        onIssued={(credential) => setIssued({ credential, mode: "created" })}
      />
      {/* Mounted per issued credential: one mount is one passphrase. */}
      {issued ? <HandoffDialog issued={issued} onClose={() => setIssued(null)} /> : null}
    </Page>
  );
}
