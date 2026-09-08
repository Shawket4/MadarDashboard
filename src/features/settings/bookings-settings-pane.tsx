/**
 * Booking rules, per branch.
 *
 * The BOOKINGS page is operational — the host's day, working the phone and
 * seating people — and stays where it is. What moved here is the configuration
 * behind it: opening windows, slot length, party limits, holds, and the phone
 * code. Same split as delivery: the orders are work, the fees are settings.
 *
 * The editor itself is the dialog the bookings page already used, so there is
 * one form and not two that drift apart.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useOrgId } from "@/hooks/use-org-id";

import { PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useListBranches } from "@/data/api/generated/api";
import { BookingSettingsDialog } from "@/features/bookings/settings-dialog";

export function BookingsSettingsPane() {
  const { t } = useTranslation();
  // The scoped org, not the token's: a super admin's token carries none, and
  // reading it directly left them looking at an empty shop on a page they are
  // entitled to use.
  const orgId = useOrgId() ?? "";
  const branches = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId } });
  const [branchId, setBranchId] = useState<string>("");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.bookings", "Bookings")}
        description={t(
          "settings.bookingsDesc",
          "Slots, party sizes, holds and the phone code.",
        )}
      />
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("settings.pickBranch", "Pick a branch")} />
            </SelectTrigger>
            <SelectContent>
              {(branches.data ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!branchId} onClick={() => setOpen(true)}>
            {t("settings.editRules", "Edit rules")}
          </Button>
          {/* Booking rules are per branch with no org-wide default — a branch
              with no row simply takes no online bookings, which is the safe
              state for a room nobody has configured. */}
          <p className="w-full text-xs text-muted-foreground">
            {t(
              "settings.bookingsPerBranch",
              "Every branch has its own rules. A branch you have not set up takes no online bookings.",
            )}
          </p>
        </CardContent>
      </Card>
      {branchId ? (
        <BookingSettingsDialog branchId={branchId} open={open} onOpenChange={setOpen} />
      ) : null}
    </div>
  );
}
