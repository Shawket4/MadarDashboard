import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Layers, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/app/combobox";
import { EmptyState } from "@/components/app/empty-state";
import { putModifierGroups, useListGroups } from "@/data/api/generated/api";
import type { GroupOut, ModifierGroupOut, StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney } from "@/lib/format";
import { StudioSection } from "./studio-section";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  orgId: string | null;
  onSaved: () => void;
}

interface AttachState {
  group_id: string;
  name: string;
  legacy_addon_type: string | null;
  selection_type: string;
  sort: number;
  min: number;
  max: number | null;
  is_required: boolean;
  /** null = offer all; else the allowlisted subset. */
  included_option_ids: string[] | null;
  /** All options the group offers (for the allowlist UI). */
  allOptions: { id: string; name: string; price: number }[];
}

const humanizeType = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const base = type.endsWith("_type") ? type.slice(0, -"_type".length) : type;
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const fromAggregate = (g: ModifierGroupOut): AttachState => {
  const allOptions = g.options.map((o) => ({ id: o.id, name: o.name, price: o.price }));
  const includedIds = g.options.filter((o) => o.included).map((o) => o.id);
  const allIncluded = includedIds.length === allOptions.length;
  return {
    group_id: g.group_id,
    name: g.name,
    legacy_addon_type: g.legacy_addon_type ?? null,
    selection_type: g.selection_type,
    sort: g.sort,
    min: g.min,
    max: g.max ?? null,
    is_required: g.is_required,
    included_option_ids: allIncluded ? null : includedIds,
    allOptions,
  };
};

export function ModifiersTab({ studio, itemId, orgId, onSaved }: Props) {
  const { t } = useTranslation();
  const groupsQ = useListGroups({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const allGroups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);

  const [attached, setAttached] = useState<AttachState[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAttached([...studio.modifier_groups].sort((a, b) => a.sort - b.sort).map(fromAggregate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.catalog_revision]);

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
        sort: prev.length,
        min: g.min_selections,
        max: g.max_selections ?? null,
        is_required: g.is_required,
        included_option_ids: null,
        allOptions: g.options.map((o) => ({ id: o.id, name: o.name, price: o.price })),
      },
    ]);
  };

  const update = (idx: number, patch: Partial<AttachState>) =>
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

  const save = async () => {
    setSaving(true);
    try {
      await putModifierGroups(itemId, {
        groups: attached.map((a, i) => ({
          group_id: a.group_id,
          sort: i,
          min_override: a.min,
          max_override: a.max,
          is_required_override: a.is_required,
          included_option_ids: a.included_option_ids,
        })),
      });
      toast.success(t("common.savedChanges", "Changes saved"));
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StudioSection
        title={t("menu.studio.tabs.modifiers", "Modifiers")}
        description={t(
          "menu.studio.modifiers.desc",
          "Attach reusable modifier groups. Pick which options are offered and set the rules per item.",
        )}
        actions={
          <div className="w-56">
            <Combobox
              options={pickerOptions}
              value={null}
              onChange={attach}
              placeholder={t("menu.studio.modifiers.attach", "Attach a group…")}
              disabled={pickable.length === 0}
            />
          </div>
        }
      >
        {attached.length === 0 ? (
          <EmptyState icon={Layers} title={t("menu.studio.modifiers.empty", "No modifier groups attached")} />
        ) : (
          <div className="space-y-3">
            {attached.map((a, idx) => (
              <div key={a.group_id} className="rounded-lg border bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{a.name}</span>
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
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    aria-label={t("menu.studio.modifiers.detach", "Detach")}
                    onClick={() => detach(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="space-y-4 p-4">
                  {/* Rules */}
                  <div className="flex flex-wrap items-end gap-4">
                    <label className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        {t("menu.studio.modifiers.min", "Min")}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={a.min}
                        onChange={(e) => update(idx, { min: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                        className="h-9 w-20 tabular"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        {t("menu.studio.modifiers.max", "Max")}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={a.max ?? ""}
                        placeholder={t("menu.studio.modifiers.unlimited", "∞")}
                        onChange={(e) =>
                          update(idx, { max: e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10)) })
                        }
                        className="h-9 w-20 tabular"
                      />
                    </label>
                    <label className="flex items-center gap-2 pb-2">
                      <Switch checked={a.is_required} onCheckedChange={(v) => update(idx, { is_required: v })} />
                      <span className="text-sm">{t("menu.studio.modifiers.required", "Required")}</span>
                    </label>
                  </div>

                  {/* Offered options (allowlist) */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("menu.studio.modifiers.offered", "Offered options")}
                    </p>
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
                              onClick={() => toggleOption(idx, o.id)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                                offered
                                  ? "border-border bg-accent text-foreground"
                                  : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                              }`}
                            >
                              {offered ? <Check className="size-3" /> : null}
                              {o.name}
                              {o.price > 0 ? (
                                <span className="text-muted-foreground">+{fmtMoney(o.price)}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StudioSection>

      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => void save()} loading={saving}>
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  );
}
