import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { SCOPE_PRESETS, type ScopePreset } from "@/shared/scope/scope-store";

interface Branch {
  id: string;
  name: string;
}

interface Props {
  branches: Branch[];
  branchId: string | null;
  onBranch: (id: string) => void;
  from: string | null;
  to: string | null;
  preset: ScopePreset;
  onPreset: (p: Exclude<ScopePreset, "custom">) => void;
  onRange: (from: string | null, to: string | null) => void;
}

/**
 * Compact, mobile/tablet (<lg) replacement for the inline scope controls.
 * A summary chip opens a bottom sheet exposing the branch select, every date
 * preset (which the inline bar hides under lg), and the custom range picker.
 */
export function ScopeFilterDrawer({
  branches,
  branchId,
  onBranch,
  from,
  to,
  preset,
  onPreset,
  onRange,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = branches.find((b) => b.id === branchId);
  const presetLabel = preset === "custom" ? t("scope.custom") : t(`scope.presets.${preset}`);
  const summary =
    branches.length > 1 && current ? `${current.name} · ${presetLabel}` : presetLabel;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 h-8 max-w-[55vw] sm:max-w-[40vw] px-3 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
        >
          <SlidersHorizontal size={14} className="shrink-0 text-muted-foreground" />
          <span className="truncate">{summary}</span>
        </button>
      </DialogTrigger>

      <DialogContent sheet="bottom" showClose className="p-0">
        <div className="px-4 pt-4 pb-2">
          <DialogTitle>{t("common.filters")}</DialogTitle>
          <DialogDescription className="sr-only">{t("common.filters")}</DialogDescription>
        </div>

        <div
          className="px-4 space-y-5"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}
        >
          {/* Branch */}
          {branches.length > 1 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("scope.branch")}
              </label>
              <SearchableSelect
                className="w-full h-10 text-sm"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                value={branchId}
                onChange={(v) => v && onBranch(v)}
                placeholder={t("scope.selectBranch")}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} /> {branches[0]?.name}
            </div>
          )}

          {/* Date presets — all of them, unlike the inline bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("scope.period")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SCOPE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPreset(p)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium border transition-colors",
                    preset === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-muted",
                  )}
                >
                  {t(`scope.presets.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("scope.customRange")}
            </label>
            <DateRangePicker from={from} to={to} onChange={onRange} />
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold transition active:scale-[0.99]"
            >
              {t("common.done")}
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
