import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignBranch, unassignBranch, useListBranches, useListUserBranches,
} from "@/data/api/generated/api";
import type { UserPublic } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateUsers } from "./util";

interface Props {
  user: UserPublic;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function BranchAssignDialog({ user, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const orgId = user.org_id ?? "";

  const branchesQ = useListBranches({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  const assignedQ = useListUserBranches(user.id, { query: { enabled: open } });
  const branches = branchesQ.data ?? [];
  const assignedIds = new Set((assignedQ.data ?? []).map((a) => a.branch_id));
  const loading = branchesQ.isLoading || assignedQ.isLoading;

  const toggle = async (branchId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) await unassignBranch(user.id, branchId);
      else await assignBranch(user.id, { branch_id: branchId });
      await assignedQ.refetch();
      void invalidateUsers();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.branchAccess", "Branch Access")}</DialogTitle>
          <DialogDescription>{t("users.branchAccessHint", { name: user.name, defaultValue: `Toggle branch access for ${user.name}` })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {loading ? (
            <><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></>
          ) : branches.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("common.noResults", "No results")}</p>
          ) : (
            branches.map((b) => {
              const isAssigned = assignedIds.has(b.id);
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    {b.address ? <p className="truncate text-xs text-muted-foreground">{b.address}</p> : null}
                  </div>
                  <Switch checked={isAssigned} onCheckedChange={() => void toggle(b.id, isAssigned)} />
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t("common.done", "Done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
