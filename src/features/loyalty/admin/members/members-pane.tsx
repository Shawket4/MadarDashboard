/**
 * The members of the program, and one member's history.
 *
 * Read-mostly on purpose. The one write here is an adjustment, which is the
 * only action in the whole program that creates value from nothing — so it is
 * gated on an admin role by the server as well as by this screen.
 *
 * A row opens the member: balances, the full ledger, and the orders behind it.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Wallet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { ListCount, PeopleList } from "@/components/app/people-list";
import { StatusPill } from "@/components/app/status-pill";
import {
  listLoyaltyMembers,
  useListBranches,
  useListLoyaltyMembers,
} from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useListSearch } from "@/hooks/use-list-search";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { fmtDate } from "@/lib/format";

import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";

import { loyaltyAccess } from "../../shared/access";
import { currencyLabel } from "../../shared/util";
import type { ProgramScope } from "../use-program";
import { AdjustDialog } from "./adjust-dialog";
import { GoogleObjectDialog } from "./google-object-dialog";
import { MemberDetailSheet } from "./member-detail-sheet";

export function MembersPane({ scope }: { scope: ProgramScope }) {
  const { branchId } = scope;
  const { t } = useTranslation();
  const { search, setSearch, q } = useListSearch();
  // Super admin only: it reads Madar's plumbing out of Google in Google's own
  // vocabulary, which is nothing an org manager could act on. The endpoint
  // refuses them too, so this is presentation, not the guard.
  const authz = useAuthz();
  const access = loyaltyAccess(authz);
  const isSuperAdmin = access.canInspectWallet;
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<MemberView | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const branches = useListBranches(
    { org_id: scope.orgId },
    { query: { enabled: !!scope.orgId && access.canAdjust } },
  );
  const activeBranches = useMemo(
    () => (branches.data ?? []).filter((b) => b.is_active).map((b) => ({ id: b.id, name: b.name })),
    [branches.data],
  );
  const [inspecting, setInspecting] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const columns = useMemo<ColumnDef<MemberView>[]>(
    () => [
      {
        id: "member",
        header: t("loyalty.member", "Member"),
        meta: { label: t("loyalty.member", "Member"), phone: "title" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.original.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
              {row.original.phone}
            </p>
          </div>
        ),
      },
      {
        id: "balance",
        header: t("loyalty.balance", "Balance"),
        meta: { label: t("loyalty.balance", "Balance"), numeric: true },
        cell: ({ row }) => `${row.original.balance} ${currencyLabel(row.original.mode, row.original.balance)}`,
      },
      {
        id: "progress",
        header: t("loyalty.progress", "To next reward"),
        meta: { label: t("loyalty.progress", "To next reward") },
        cell: ({ row }) =>
          row.original.can_redeem ? (
            <StatusPill tone="success">{t("loyalty.rewardReady", "Reward earned")}</StatusPill>
          ) : (
            <span className="text-sm text-muted-foreground">
              <bdi className="font-mono tabular-nums">{row.original.points_to_next_reward}</bdi>{" "}
              {currencyLabel(row.original.mode, row.original.points_to_next_reward)}
            </span>
          ),
      },
      {
        id: "joined",
        header: t("loyalty.joined", "Joined"),
        meta: { label: t("loyalty.joined", "Joined"), numeric: true },
        cell: ({ row }) => fmtDate(row.original.enrolled_at),
      },
    ],
    [t],
  );
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);
  const page = useListLoyaltyMembers({
    ...(branchId ? { branch_id: branchId } : {}),
    ...(q ? { q: q } : {}),
    limit: 100,
  }, { query: { enabled: access.canListMembers } });


  // The table shows the first hundred and says so underneath; the file must not
  // inherit that ceiling, so it walks the endpoint from the top under the same
  // branch and search. `total` comes back on the first page, which is what lets
  // an over-large program be refused before the walk rather than after it.
  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = {
        ...(branchId ? { branch_id: branchId } : {}),
        ...(q ? { q: q } : {}),
      };
      const members = await fetchAllPages<MemberView>(async (offset, limit) => {
        const res = await listLoyaltyMembers({ ...filters, limit, offset }, EXPORT_REQUEST);
        return { rows: res.members, total: res.total };
      });
      const cols: ExcelColumn<MemberView>[] = [
        { header: t("loyalty.member", "Member"), accessor: (m) => m.name, type: "text", width: 26 },
        { header: t("loyalty.phone", "Phone"), accessor: (m) => m.phone, type: "text", width: 18 },
        { header: t("loyalty.balance", "Balance"), accessor: (m) => m.balance, type: "integer", width: 12 },
        { header: t("loyalty.balanceUnit", "Unit"), accessor: (m) => currencyLabel(m.mode), type: "text", width: 12 },
        {
          header: t("loyalty.progress", "To next reward"),
          accessor: (m) =>
            m.can_redeem
              ? t("loyalty.rewardReady", "Reward earned")
              : `${m.points_to_next_reward} ${currencyLabel(m.mode, m.points_to_next_reward)}`,
          type: "text",
          width: 20,
        },
        { header: t("loyalty.joined", "Joined"), accessor: (m) => m.enrolled_at, type: "date", width: 16 },
      ];
      const title = t("loyalty.members", "Members");
      await exportToExcel({
        filename: "Madar-Loyalty-Members",
        logoUrl,
        sheets: [{
          name: title,
          title,
          subtitle: q || undefined,
          rows: members as unknown as Record<string, unknown>[],
          columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
        }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  if (!access.canListMembers) {
    return (
      <EmptyState
        title={t("loyalty.membersRestricted", "Members are for managers")}
        description={t(
          "loyalty.membersRestrictedHint",
          "Scan or look up the customer in front of you at the till.",
        )}
      />
    );
  }

  return (
    <>
      <PeopleList
        layout="above"
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("loyalty.searchMembers", "Search by name or phone"),
          className: "max-w-sm",
        }}
        actions={
          <ExportButton
            onExport={handleExport}
            loading={exporting}
            disabled={(page.data?.members.length ?? 0) === 0}
            className="shrink-0"
          />
        }
        footer={
          page.data && page.data.total > (page.data.members.length ?? 0) ? (
            <ListCount>
              {t("loyalty.showingOf", {
                defaultValue: "Showing {{shown}} of {{total}}",
                shown: page.data.members.length,
                total: page.data.total,
              })}
            </ListCount>
          ) : null
        }
        columns={columns}
        data={page.data?.members ?? []}
        loading={page.isLoading}
        error={page.error}
        onRetry={() => void page.refetch()}
        getRowId={(m) => m.id}
        onRowClick={(m) => setOpenMember(m.id)}
        selectedRowId={openMember}
        rowActions={
          isSuperAdmin
            ? (m) => (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("loyalty.googleObject", "Google Wallet object")}
                  onClick={() => setInspecting({ id: m.id, name: m.name })}
                >
                  <Wallet className="size-4" />
                </Button>
              )
            : undefined
        }
        emptyState={
          <EmptyState
            icon={Users}
            title={
              q
                ? t("loyalty.noMembersMatch", "No members match that search")
                : t("loyalty.noMembers", "No members yet")
            }
            description={
              q ? undefined : t("loyalty.noMembersHint", "Customers join by scanning the counter code.")
            }
          />
        }
      />

      <MemberDetailSheet
        memberId={openMember}
        branchId={branchId}
        canAdjust={access.canAdjust}
        canForget={access.canForget}
        onOpenChange={(o) => !o && setOpenMember(null)}
        onAdjust={setAdjusting}
        onOpenOrder={setOpenOrder}
      />
      {adjusting ? (
        <AdjustDialog
          member={adjusting}
          branches={activeBranches}
          defaultBranchId={branchId}
          open={!!adjusting}
          onOpenChange={(o) => !o && setAdjusting(null)}
        />
      ) : null}
      <OrderDetailSheet
        orderId={openOrder}
        open={!!openOrder}
        onOpenChange={(o) => !o && setOpenOrder(null)}
        onSwitchOrder={setOpenOrder}
      />

      <GoogleObjectDialog
        memberId={inspecting?.id ?? null}
        memberName={inspecting?.name ?? ""}
        onOpenChange={(o) => !o && setInspecting(null)}
      />
    </>
  );
}
