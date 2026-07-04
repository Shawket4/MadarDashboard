import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Layers, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/app/combobox";
import { EmptyState } from "@/components/app/empty-state";
import { useListGroups } from "@/data/api/generated/api";
import type { GroupOut } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";
import { AddonDialog } from "@/features/menu/addon-dialog";
import { invalidateStudio, type AttachDraft } from "./util";

interface Props {
  orgId: string | null;
  itemId: string;
  attached: AttachDraft[];
  setAttached: Dispatch<SetStateAction<AttachDraft[]>>;
}

const humanizeType = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const base = type.endsWith("_type") ? type.slice(0, -"_type".length) : type;
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Section 3 — Modifiers: the item's attached reusable groups. Chips toggle each
 * option in/out of the attachment's allowlist (all-included collapses to null);
 * min/max/required are per-attachment overrides. Attaching, detaching and every
 * override edit are drafts — Save replace-sets the attachments in current order.
 * Creating a brand-new group/option reuses the AddonDialog wiring (its managed
 * legacy-addon-type dropdown keeps old POS clients seeing the option).
 */
export function SectionModifiers({ orgId, itemId, attached, setAttached }: Props) {
  const { t } = useTranslation();
  const groupsQ = useListGroups({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const allGroups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);
  const [newAddon, setNewAddon] = useState(false);

  const attachedIds = useMemo(() => new Set(attached.map((a) => a.group_id)), [attached]);
  const pickable = useMemo(
    () => allGroups.filter((g) => g.is_active && !attachedIds.has(g.id)),
    [allGroups, attachedIds],
  );
  const pickerOptions = pickable.map((g) => ({
    value: g.id,
    label: g.name,
    hint: humanizeType(g.legacy_addon_type) ?? t("menu.studio.modifiers.option", "options"),
  }));

  const attach = (groupId: string) => {
    const g: GroupOut | undefined = allGroups.find((x) => x.id === groupId);
    if (!g) return;
    setAttached((prev) => [
      ...prev,
      {
        group_id: g.id,
        name: g.name,
        legacy_addon_type: g.legacy_addon_type ?? null,
        selection_type: g.selection_type,
        min: g.min_selections,
        max: g.max_selections ?? null,
        is_required: g.is_required,
        included_option_ids: null,
        allOptions: g.options.map((o) => ({ id: o.id, name: o.name, price: o.price })),
      },
    ]);
  };

  const update = (idx: number, patch: Partial<AttachDraft>) =>
    setAttached((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const detach = (idx: number) => setAttached((prev) => prev.filter((_, i) => i !== idx));

  const toggleOption = (idx: number, optionId: string) =>
    setAttached((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        const current = a.included_option_ids ?? a.allOptions.map((o) => o.id);
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        // If the allowlist now covers everything, collapse back to null (offer all).
        const allIds = a.allOptions.map((o) => o.id);
        return { ...a, included_option_ids: next.length === allIds.length ? null : next };
      }),
    );

  /** Refresh the reusable-groups list after the create dialog closes. */
  const onNewAddonOpenChange = (open: boolean) => {
    setNewAddon(open);
    if (!open) invalidateStudio(itemId);
  };

  return (
    <div className="space-y-3">
      {attached.length === 0 ? (
        <EmptyState icon={Layers} title={t("menu.studio.modifiers.empty", "No modifier groups attached")} />
      ) : (
        attached.map((a, idx) => (
          <div key={a.group_id} className="rounded-lg border p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{a.name}</span>
              {humanizeType(a.legacy_addon_type) ? (
                <Badge variant="secondary" className="font-normal">
                  {humanizeType(a.legacy_addon_type)}
                </Badge>
              ) : null}
              <Badge variant="outline" className="font-normal">
                {a.selection_type === "single"
                  ? t("menu.studio.modifiers.single", "Single choice")
                  : t("menu.studio.modifiers.multi", "Multi choice")}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ms-auto text-destructive"
                aria-label={t("menu.studio.modifiers.detach", "Detach")}
                onClick={() => detach(idx)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Offered options (allowlist chips) */}
            <div className="mt-3">
              {a.allOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("menu.studio.modifiers.noOptions", "This group has no options yet.")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {a.allOptions.map((o) => {
                    const offered = a.included_option_ids == null || a.included_option_ids.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={offered}
                        onClick={() => toggleOption(idx, o.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                          offered
                            ? "border-border bg-accent text-foreground"
                            : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {offered ? <Check className="size-3" /> : null}
                        {o.name}
                        {o.price > 0 ? <span className="text-muted-foreground tabular">+{fmtMoney(o.price)}</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Per-attachment constraint overrides */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3">
              <label className="flex items-center gap-2">
                <Switch checked={a.is_required} onCheckedChange={(v) => update(idx, { is_required: v })} />
                <span className="text-sm">{t("menu.studio.modifiers.required", "Required")}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {t("menu.studio.modifiers.min", "Min")}
                <Input
                  type="number"
                  min="0"
                  value={a.min}
                  onChange={(e) => update(idx, { min: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                  className="h-8 w-16 tabular"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {t("menu.studio.modifiers.max", "Max")}
                <Input
                  type="number"
                  min="0"
                  value={a.max ?? ""}
                  placeholder={t("menu.studio.modifiers.unlimited", "∞")}
                  onChange={(e) =>
                    update(idx, { max: e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10)) })
                  }
                  className="h-8 w-16 tabular"
                />
              </label>
            </div>
          </div>
        ))
      )}

      {/* Attach an existing group / create a new one */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-64 max-w-full">
          <Combobox
            options={pickerOptions}
            value={null}
            onChange={attach}
            placeholder={t("menu.studio.modifiers.attach", "Attach a group…")}
            disabled={pickable.length === 0}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => setNewAddon(true)} disabled={!orgId}>
          <Plus className="size-4" /> {t("menu.newAddon", "New add-on")}
        </Button>
      </div>

      {newAddon && orgId ? (
        <AddonDialog orgId={orgId} addon={null} open={newAddon} onOpenChange={onNewAddonOpenChange} />
      ) : null}
    </div>
  );
}
