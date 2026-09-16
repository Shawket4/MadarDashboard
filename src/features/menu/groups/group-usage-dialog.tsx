import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStudio, putModifierGroups, useListMenuItems } from "@/data/api/generated/api";
import type { GroupOut } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { invalidateCatalog } from "../util";
import type { GroupUse } from "./use-group-usage";

interface Props {
  orgId: string;
  group: GroupOut;
  uses: GroupUse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Used on N items → Manage…": tick the items that offer this group. Applying
 * re-writes each changed item's attachment set through the same per-item
 * endpoint the Menu Studio saves with (`PUT /menu-items/{id}/modifier-groups`):
 * read the item's current attachments, add or drop this group, write back.
 */
export function GroupUsageDialog({ orgId, group, uses, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const itemsQ = useListMenuItems({ org_id: orgId }, { query: { enabled: open } });
  const items = useMemo(
    () => [...(itemsQ.data ?? [])].filter((i) => !i.deleted_at).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsQ.data],
  );
  const usedIds = useMemo(() => new Set(uses.map((u) => u.item_id)), [uses]);
  const useById = useMemo(() => new Map(uses.map((u) => [u.item_id, u])), [uses]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setPicked(new Set(usedIds));
  }, [open, usedIds]);

  const shown = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = async () => {
    const add = [...picked].filter((id) => !usedIds.has(id));
    const remove = [...usedIds].filter((id) => !picked.has(id));
    setBusy(true);
    let failed = 0;
    for (const itemId of [...add, ...remove]) {
      try {
        const studio = await getStudio(itemId);
        const current = [...studio.modifier_groups].sort((a, b) => a.sort - b.sort);
        const kept = current
          .filter((g) => g.group_id !== group.id || add.includes(itemId))
          .map((g, i) => ({
            group_id: g.group_id,
            sort: i,
            min_override: g.min,
            max_override: g.max ?? null,
            is_required_override: g.is_required,
            included_option_ids: g.options.every((o) => o.included) ? null : g.options.filter((o) => o.included).map((o) => o.id),
          }));
        if (add.includes(itemId) && !current.some((g) => g.group_id === group.id)) {
          kept.push({
            group_id: group.id,
            sort: kept.length,
            min_override: group.min_selections,
            max_override: group.max_selections ?? null,
            is_required_override: group.is_required,
            included_option_ids: null,
          });
        }
        await putModifierGroups(itemId, { groups: kept });
      } catch (e) {
        failed++;
        toast.error(getErrorMessage(e));
      }
    }
    setBusy(false);
    void invalidateCatalog();
    void queryClient.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0].startsWith("/catalog") || q.queryKey[0].includes("/studio")),
    });
    if (failed === 0) {
      toast.success(t("common.savedChanges", "Changes saved"));
      onOpenChange(false);
    }
  };

  const dirty = picked.size !== usedIds.size || [...picked].some((id) => !usedIds.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("menu.groups.usage.title", { name: group.name, defaultValue: "Items offering {{name}}" })}</DialogTitle>
          <DialogDescription>
            {t("menu.groups.usage.desc", "Tick the items that offer this group. Per-item rules (required, which options) stay editable in each item's editor.")}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search", "Search…")}
          aria-label={t("common.search", "Search…")}
        />
        <ul className="max-h-[50dvh] divide-y overflow-y-auto rounded-md border">
          {shown.map((item) => {
            const use = useById.get(item.id);
            return (
              <li key={item.id}>
                <label className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Checkbox checked={picked.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {!item.is_active ? (
                    <Badge variant="outline" className="font-normal">
                      {t("common.inactive", "Inactive")}
                    </Badge>
                  ) : null}
                  {use ? (
                    <Badge variant="secondary" className="font-normal">
                      {use.is_required ? t("menu.groups.usage.required", "Required") : t("menu.groups.usage.optional", "Optional")}
                    </Badge>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" onClick={() => void apply()} loading={busy} disabled={!dirty}>
            {t("menu.groups.usage.apply", "Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
