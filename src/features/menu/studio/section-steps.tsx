import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useListStepPresets } from "@/data/api/generated/api";
import type { RecipeStepPreset } from "@/data/api/generated/models";
import { cn } from "@/lib/utils";

import { StepPreview } from "./step-preview";
import type { StepDraft } from "./util";

interface Props {
  steps: StepDraft[];
  setSteps: Dispatch<SetStateAction<StepDraft[]>>;
}

/**
 * Section 3 — How it's made: the ordered steps a barista follows.
 *
 * A step is one of the curated PRESETS, which owns its animation, its name and
 * its note, or a line someone TYPED, which has no animation. Typing your own
 * name is exactly what makes a step custom: there is no renaming a preset,
 * because a preset that says something different on one item stops being a
 * shared vocabulary.
 *
 * Amounts deliberately do not appear here. They live in the per-size recipe
 * above, which is the only place they can differ between a 12 oz and a 16 oz.
 */
export function SectionSteps({ steps, setSteps }: Props) {
  const { t, i18n } = useTranslation();
  const [picking, setPicking] = useState(false);
  const presetsQ = useListStepPresets();
  const presets = useMemo(() => presetsQ.data ?? [], [presetsQ.data]);
  const bySlug = useMemo(() => new Map(presets.map((p) => [p.slug, p])), [presets]);
  const ar = i18n.language.startsWith("ar");

  const nameOf = (p: RecipeStepPreset) => (ar && p.name_ar ? p.name_ar : p.name);
  const noteOf = (p: RecipeStepPreset) => (ar && p.note_ar ? p.note_ar : p.note);

  const move = (from: number, to: number) =>
    setSteps((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  const remove = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx));
  const setTitle = (idx: number, patch: Partial<StepDraft>) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-3">
      {steps.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("menu.studio.steps.empty", "No steps yet. Add the order of preparation so anyone can make this the same way.")}
        </p>
      ) : null}

      <ol className="space-y-2">
        {steps.map((step, idx) => {
          const preset = step.kind === "preset" ? bySlug.get(step.preset_slug ?? "") : undefined;
          const missing = step.kind === "preset" && !preset && !presetsQ.isLoading;
          return (
            <li
              key={`${step.kind}-${step.preset_slug ?? ""}-${idx}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-2.5"
            >
              <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground/50" />
              <span className="w-5 shrink-0 text-center text-sm font-semibold tabular text-muted-foreground">
                {idx + 1}
              </span>
              <StepPreview url={preset?.animation_url} size={44} play={false} />

              <div className="min-w-0 flex-1">
                {step.kind === "preset" ? (
                  <>
                    <p className="truncate text-sm font-medium">
                      {preset ? nameOf(preset) : step.preset_slug}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {missing
                        ? t("menu.studio.steps.retired", "This step is no longer in the library")
                        : (noteOf(preset ?? ({} as RecipeStepPreset)) ?? t("menu.studio.steps.fromLibrary", "From the library"))}
                    </p>
                  </>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={step.title}
                      onChange={(e) => setTitle(idx, { title: e.target.value })}
                      placeholder={t("menu.studio.steps.titlePlaceholder", "What to do")}
                      aria-label={t("menu.studio.steps.titleEn", "Step (English)")}
                    />
                    <Input
                      value={step.title_ar}
                      onChange={(e) => setTitle(idx, { title_ar: e.target.value })}
                      placeholder={t("menu.studio.steps.titlePlaceholderAr", "بالعربية")}
                      dir="rtl"
                      aria-label={t("menu.studio.steps.titleAr", "Step (Arabic)")}
                    />
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button" variant="ghost" size="icon" className="size-8"
                  disabled={idx === 0} onClick={() => move(idx, idx - 1)}
                  aria-label={t("menu.studio.steps.moveUp", "Move up")}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button" variant="ghost" size="icon" className="size-8"
                  disabled={idx === steps.length - 1} onClick={() => move(idx, idx + 1)}
                  aria-label={t("menu.studio.steps.moveDown", "Move down")}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button" variant="ghost" size="icon" className="size-8 text-destructive"
                  onClick={() => remove(idx)}
                  aria-label={t("common.remove", "Remove")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
          <Plus className="size-4" />
          {t("menu.studio.steps.addFromLibrary", "Add a step")}
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => setSteps((prev) => [...prev, { kind: "custom", preset_slug: null, title: "", title_ar: "" }])}
        >
          <Type className="size-4" />
          {t("menu.studio.steps.addCustom", "Write your own")}
        </Button>
      </div>

      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("menu.studio.steps.pickTitle", "Add a step")}</DialogTitle>
            <DialogDescription>
              {t("menu.studio.steps.pickDesc", "Each of these plays on the till while the drink is made. Pick one, or write your own if nothing fits.")}
            </DialogDescription>
          </DialogHeader>

          {presetsQ.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : presets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("menu.studio.steps.noPresets", "The animation library is empty.")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {presets.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    setSteps((prev) => [...prev, { kind: "preset", preset_slug: p.slug, title: "", title_ar: "" }]);
                    setPicking(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                    "hover:border-primary hover:bg-muted/50",
                  )}
                >
                  <StepPreview url={p.animation_url} size={72} />
                  <span className="text-sm font-medium">{nameOf(p)}</span>
                  {noteOf(p) ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{noteOf(p)}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-1">
            <Button
              type="button" variant="ghost"
              onClick={() => {
                setSteps((prev) => [...prev, { kind: "custom", preset_slug: null, title: "", title_ar: "" }]);
                setPicking(false);
              }}
            >
              <Pencil className="size-4" />
              {t("menu.studio.steps.addCustom", "Write your own")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPicking(false)}>
              {t("common.close", "Close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
