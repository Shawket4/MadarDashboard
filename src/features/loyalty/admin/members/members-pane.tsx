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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListLoyaltyMembers } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
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
  const page = useListLoyaltyMembers({
    ...(branchId ? { branch_id: branchId } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
    limit: 100,
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("loyalty.searchMembers", "Search by name or phone")}
          className="ps-9"
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
