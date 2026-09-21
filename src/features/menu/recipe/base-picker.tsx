import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

import { putSizeBase } from "@/data/api/generated/api";
import type { RecipeBaseOut } from "@/data/api/generated/models";

const NONE = "__none";
const MIXED = "__mixed";

interface Props {
  /** Saved sizes (id + current base). Unsaved sizes can't take a base yet. */
  sizes: { id: string; baseId: string | null }[];
  bases: RecipeBaseOut[];
  /** Disabled while the sizes section has unsaved edits (a base change re-expands server-side). */
  disabled: boolean;
  onChanged: () => void;
}

/** "Base: [none ▾]" — sets one recipe base on every size of the item. */
export function BasePicker({ sizes, bases, disabled, onChanged }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const canEdit = useAuthz().can(Cap.menuItemsEdit);

  const ids = new Set(sizes.map((s) => s.baseId ?? NONE));
  const value = sizes.length === 0 ? NONE : ids.size === 1 ? [...ids][0] : MIXED;

  const apply = async (next: string) => {
    if (next === MIXED || next === value) return;
    const baseId = next === NONE ? null : next;
    setBusy(true);
    try {
      for (const s of sizes) await putSizeBase(s.id, { base_id: baseId });
      toast.success(
        baseId
          ? t("modeling.base.applied", "Base applied to {{count}} sizes", { count: sizes.length })
          : t("modeling.base.cleared", "Base removed"),
      );
      onChanged();
    } catch (e) {
      toast.error(getErrorMessage(e));
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="text-sm text-muted-foreground">{t("modeling.base.label", "Base")}</Label>
      <Select value={value} onValueChange={(v) => void apply(v)} disabled={!canEdit || disabled || busy || sizes.length === 0}>
        <SelectTrigger className="h-8 w-48" aria-label={t("modeling.base.label", "Base")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t("modeling.base.none", "None")}</SelectItem>
          {value === MIXED ? (
            <SelectItem value={MIXED} disabled>
              {t("modeling.base.mixed", "Different per size")}
            </SelectItem>
          ) : null}
          {bases
            .filter((b) => b.is_active || ids.has(b.id))
            .map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Button asChild variant="link" size="sm" className="h-auto px-0">
        <Link to="/menu/bases">{t("modeling.base.manage", "Manage bases")}</Link>
      </Button>
      {disabled ? (
        <span className="text-xs text-muted-foreground">
          {t("modeling.base.saveFirst", "Save or discard size changes to change the base.")}
        </span>
      ) : null}
    </div>
  );
}
