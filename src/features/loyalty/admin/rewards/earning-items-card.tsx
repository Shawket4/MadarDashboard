/**
 * Which items COLLECT a stamp — the other half of the rewards page.
 *
 * It sits under the reward catalogue because the two questions always arrive
 * together and are never the same question: that list is what a balance buys,
 * this one is what fills it. A shop may well let you collect on coffee and
 * spend on cake, so the two are independent lists rather than one flag.
 *
 * Shown only for a stamp card. Points already follow the money, and narrowing
 * them by item would be a second rule about the same bill.
 *
 * Scoped like everything else here: a branch with no list of its own inherits
 * the organisation's, and saving here gives it one.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/app/combobox";
import {
  useGetLoyaltyEarningItems,
  useListMenuItems,
  usePutLoyaltyEarningItems,
} from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { fmtMoney } from "@/lib/format";

import { loyaltyAccess } from "../../shared/access";
import { loyaltyServerError } from "../../shared/server-errors";
import type { ProgramScope } from "../use-program";
import {
  isPickable,
  listChanged,
  rowsFromList,
  rowsToWire,
  type EarningRow,
} from "./earning-schema";

export function EarningItemsCard({
  scope,
  /** Whether the programme counts per item. Off, the list is inert. */
  perLineItem,
}: {
  scope: ProgramScope;
  perLineItem: boolean;
}) {
  const { orgId, branchId } = scope;
  const { t } = useTranslation();
  const params = branchId ? { branch_id: branchId } : {};
  const list = useGetLoyaltyEarningItems(params);
  const menu = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const save = usePutLoyaltyEarningItems();
  const { canEditProgram } = loyaltyAccess(useAuthz());

  // Plain state rather than a field array: a row here carries no editable
  // value, so there is nothing for react-hook-form to hold.
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [picked, setPicked] = useState<string>("");

  useEffect(() => {
    if (list.data) setRows(rowsFromList(list.data.items));
  }, [list.data]);

  const options = useMemo(
    () =>
      (menu.data ?? [])
        .filter(isPickable)
        .filter((m) => !rows.some((r) => r.menu_item_id === m.id))
        .map((m) => ({ value: m.id, label: `${m.name} · ${fmtMoney(m.base_price)}` })),
    [menu.data, rows],
  );

  if (list.isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  // A list that would not load is not worth its own error panel on a page that
  // already has one for the catalogue; the empty state below reads as "nothing
  // narrowed", which is also the safe reading.
  const saved = list.data?.items ?? [];
  const dirty = listChanged(rows, saved);
  const inherited = list.data?.inherited === true && Boolean(branchId);

  const add = () => {
    const item = (menu.data ?? []).find((m) => m.id === picked);
    if (!item || !isPickable(item)) return;
    if (rows.some((r) => r.menu_item_id === item.id)) return;
    setRows([...rows, { menu_item_id: item.id, name: item.name }]);
    setPicked("");
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        data: { branch_id: branchId, menu_item_ids: rowsToWire(rows) },
      });
      toast.success(t("loyalty.earningSaved", "Saved"));
      await list.refetch();
    } catch (e) {
      toast.error(loyaltyServerError(e, t).message);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div>
          <p className="text-sm font-bold">
            {t("loyalty.earningItems", "Items that collect a stamp")}
          </p>
          <p className="text-xs text-muted-foreground">
            {rows.length === 0
              ? t(
                  "loyalty.earningItemsAll",
                  "Nothing picked, so everything on the menu collects. Pick items here to narrow it.",
                )
              : t(
                  "loyalty.earningItemsSome",
                  "Only these items collect. Remove them all to go back to the whole menu.",
                )}
          </p>
        </div>

        {/* Said plainly rather than by hiding the card: an admin who has
            narrowed the list needs to know it is not in force, and one who
            has not needs to know where the switch is. */}
        {!perLineItem ? (
          <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            {t(
              "loyalty.earningItemsInert",
              "This programme gives one stamp per order, so every sale counts the same and this list is not used. Turn on “a stamp for every item” under Programme to use it.",
            )}
          </p>
        ) : null}

        {inherited ? (
          <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            {t(
              "loyalty.earningItemsInherited",
              "This branch uses the organisation's list. Saving here gives it one of its own.",
            )}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <ul className="space-y-1">
            {rows.map((r, i) => (
              <li key={r.menu_item_id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                {canEditProgram ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("common.remove", "Remove")}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {canEditProgram ? (
          <>
            <div className="flex items-end gap-3 border-t border-border/60 pt-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("loyalty.addEarningItem", "Add an item that collects")}
                </Label>
                <Combobox
                  value={picked}
                  onChange={setPicked}
                  options={options}
                  placeholder={t("loyalty.pickItem", "Pick a menu item")}
                />
              </div>
              <Button type="button" variant="outline" onClick={add} disabled={!picked}>
                <Plus className="size-4" />
                {t("common.add", "Add")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={save.isPending || (!dirty && !inherited)}
              >
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("common.save", "Save")}
              </Button>
              {dirty ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRows(rowsFromList(saved))}
                >
                  {t("loyalty.discardChanges", "Discard changes")}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
