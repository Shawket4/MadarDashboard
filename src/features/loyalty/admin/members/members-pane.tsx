/**
 * The members of the program, and one member's history.
 *
 * Read-mostly on purpose. The one write here is an adjustment, which is the
 * only action in the whole program that creates value from nothing — so it is
 * gated on an admin role by the server as well as by this screen.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listLoyaltyMembers, useListLoyaltyMembers } from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthStore } from "@/data/stores/auth.store";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { EXPORT_REQUEST, fetchAllPages } from "@/lib/export-all";
import { fmtDate } from "@/lib/format";

import { currencyLabel } from "../../shared/util";
import type { ProgramScope } from "../use-program";
import { GoogleObjectDialog } from "./google-object-dialog";

export function MembersPane({ scope }: { scope: ProgramScope }) {
  const { branchId } = scope;
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  // Super admin only: it reads Madar's plumbing out of Google in Google's own
  // vocabulary, which is nothing an org manager could act on. The endpoint
  // refuses them too, so this is presentation, not the guard.
  const isSuperAdmin = useAuthStore((s) => s.user?.role) === "super_admin";
  const [inspecting, setInspecting] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);
  const page = useListLoyaltyMembers({
    ...(branchId ? { branch_id: branchId } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
    limit: 100,
  });


  // The table shows the first hundred and says so underneath; the file must not
  // inherit that ceiling, so it walks the endpoint from the top under the same
  // branch and search. `total` comes back on the first page, which is what lets
  // an over-large program be refused before the walk rather than after it.
  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = {
        ...(branchId ? { branch_id: branchId } : {}),
        ...(q.trim() ? { q: q.trim() } : {}),
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
          subtitle: q.trim() || undefined,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("loyalty.searchMembers", "Search by name or phone")}
            className="ps-9"
          />
        </div>
        <ExportButton
          onExport={handleExport}
          loading={exporting}
          disabled={(page.data?.members.length ?? 0) === 0}
          className="shrink-0"
        />
      </div>

      {page.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (page.data?.members.length ?? 0) === 0 ? (
        <EmptyState
          title={t("loyalty.noMembers", "No members yet")}
          description={t(
            "loyalty.noMembersHint",
            "Customers join by scanning the counter code.",
          )}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("loyalty.member", "Member")}</TableHead>
                <TableHead>{t("loyalty.balance", "Balance")}</TableHead>
                <TableHead>{t("loyalty.progress", "To next reward")}</TableHead>
                <TableHead>{t("loyalty.joined", "Joined")}</TableHead>
                {isSuperAdmin ? <TableHead className="w-0" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.data?.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.phone}</p>
                  </TableCell>
                  <TableCell className="font-mono">
                    {m.balance} {currencyLabel(m.mode, m.balance)}
                  </TableCell>
                  <TableCell>
                    {m.can_redeem ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-success/15 text-success"
                      >
                        {t("loyalty.rewardReady", "Reward earned")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {m.points_to_next_reward}{" "}
                        {currencyLabel(m.mode, m.points_to_next_reward)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(m.enrolled_at)}
                  </TableCell>
                  {isSuperAdmin ? (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t(
                          "loyalty.googleObject",
                          "Google Wallet object",
                        )}
                        onClick={() =>
                          setInspecting({ id: m.id, name: m.name })
                        }
                      >
                        <Wallet className="size-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {page.data && page.data.total > (page.data.members.length ?? 0) ? (
        <p className="text-xs text-muted-foreground">
          {t("loyalty.showingOf", {
            defaultValue: "Showing {{shown}} of {{total}}",
            shown: page.data.members.length,
            total: page.data.total,
          })}
        </p>
      ) : null}

      <GoogleObjectDialog
        memberId={inspecting?.id ?? null}
        memberName={inspecting?.name ?? ""}
        onOpenChange={(o) => !o && setInspecting(null)}
      />
    </div>
  );
}
