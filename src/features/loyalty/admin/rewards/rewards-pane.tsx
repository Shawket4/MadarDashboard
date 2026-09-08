/**
 * Which menu items a customer may claim, and what each one costs.
 *
 * Per-item pricing is the point: one list holds "espresso, 5 orders" beside
 * "cake, 10 orders", which a single program-wide threshold could not express.
 *
 * Scoped like the settings — a branch with no list of its own inherits the
 * org's, so an org curates one catalogue and a branch departs from it only when
 * it means to. An empty branch list means INHERIT, not "no rewards": a branch
 * that wants none turns the program off for itself.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/app/combobox";
import { EmptyState } from "@/components/app/empty-state";
import {
  useGetLoyaltyRewardItems,
  useGetLoyaltySettings,
  useListMenuItems,
  usePutLoyaltyRewardItems,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney } from "@/lib/format";

import { currencyLabel, modeOf } from "../../shared/util";
import type { ProgramScope } from "../use-program";

interface Row {
  menu_item_id: string;
  name: string;
  cost_amount: number;
}

export function RewardsPane({ scope }: { scope: ProgramScope }) {
  const { orgId, branchId } = scope;
  const { t } = useTranslation();
  const params = branchId ? { branch_id: branchId } : {};
  const catalogue = useGetLoyaltyRewardItems(params);
  const settings = useGetLoyaltySettings(params);
  const menu = useListMenuItems(
    { org_id: orgId },
    { query: { enabled: !!orgId } },
  );
  const save = usePutLoyaltyRewardItems();

  const mode = modeOf(settings.data);
  const [rows, setRows] = useState<Row[]>([]);
  const [picked, setPicked] = useState<string>("");

  // The server's list is the truth; local edits start from whatever it last
  // returned, including an inherited list a branch is about to depart from.
  useEffect(() => {
    if (!catalogue.data) return;
    setRows(
      catalogue.data.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        name: i.name,
        cost_amount: i.cost_amount,
      })),
    );
  }, [catalogue.data]);

  const options = useMemo(
    () =>
      (menu.data ?? [])
        .filter((m) => !rows.some((r) => r.menu_item_id === m.id))
        .map((m) => ({ value: m.id, label: `${m.name} · ${fmtMoney(m.base_price)}` })),
    [menu.data, rows],
  );

  if (catalogue.isLoading || settings.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const add = () => {
    const item = (menu.data ?? []).find((m) => m.id === picked);
    if (!item) return;
    setRows((r) => [
      ...r,
      {
        menu_item_id: item.id,
        name: item.name,
        // The scope's default, which the admin can then price on its own.
        cost_amount: settings.data?.default_reward_cost ?? 100,
      },
    ]);
    setPicked("");
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        data: {
          branch_id: branchId,
          items: rows.map((r) => ({
            menu_item_id: r.menu_item_id,
            // Every reward is priced in what this scope collects — a points
            // reward in a stamp program would be unbuyable.
            cost_currency: mode,
            cost_amount: r.cost_amount,
          })),
        },
      });
      toast.success(t("loyalty.rewardsSaved", "Rewards saved"));
      await catalogue.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const inherited = catalogue.data?.inherited === true && Boolean(branchId);

  return (
    <div className="space-y-4">
      {inherited ? (
        <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          {t(
            "loyalty.rewardsInherited",
            "This branch offers the organisation's rewards. Saving here gives it a list of its own.",
          )}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-5">
          {rows.length === 0 ? (
            <EmptyState
              title={t("loyalty.noRewards", "No rewards yet")}
              description={t(
                "loyalty.noRewardsHint",
                "Add the items a customer can claim, and price each one.",
              )}
            />
          ) : (
            rows.map((row, i) => (
              <div
                key={row.menu_item_id}
                className="flex flex-wrap items-end gap-3 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                </div>
                <div className="w-24 shrink-0 space-y-1.5 sm:w-32">
                  <Label className="text-xs text-muted-foreground">
                    {currencyLabel(mode, row.cost_amount)}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    className="font-mono"
                    value={row.cost_amount}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, j) =>
                          j === i ? { ...r, cost_amount: Number(e.target.value) } : r,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("common.remove", "Remove")}
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}

          <div className="flex items-end gap-3 border-t border-border/60 pt-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("loyalty.addReward", "Add a reward")}
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
        </CardContent>
      </Card>

      <Button onClick={() => void submit()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t("common.save", "Save")}
      </Button>
    </div>
  );
}
