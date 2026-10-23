/**
 * Rewards › Programme › Stamp tracks: one card can hold up to four stamp
 * tracks (coffee, croissants, …). Track 1 is the programme's own card (its
 * size is "stamps per card" under Programme); tracks 2–4 each have a name, a
 * size, a stamp and the menu items a POS sale earns them with. A track with no
 * items is stamped at the counter only (the Rewards teller page).
 *
 * Saved with `loyalty.card.design`; read with `loyalty.read`.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Circle, Coffee, Gift, Heart, Plus, Square, Star, Trash2, X, type LucideIcon } from "lucide-react";

import { Combobox } from "@/components/app/combobox";
import { useConfirm } from "@/components/app/confirm-dialog";
import { ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useGetLoyaltyTracks, useListMenuItems, usePutLoyaltyTracks } from "@/data/api/generated/api";
import type { StampShape, TracksView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { isPickable } from "@/features/loyalty/admin/rewards/earning-schema";
import { useOrgId } from "@/hooks/use-org-id";
import type { Mode } from "@/lib/rules/card";

import { rewardsAccess } from "../access";
import { useCardRules } from "../use-card-rules";
import {
  MAX_TRACKS,
  SHAPES,
  fromWire,
  newTrack,
  problemsAt,
  toWire,
  trackProblemText,
  tracksSchema,
  type TracksValues,
} from "./tracks-schema";

const SHAPE_ICON: Record<StampShape, LucideIcon> = {
  circle: Circle,
  square: Square,
  star: Star,
  heart: Heart,
  cup: Coffee,
  gift: Gift,
  check: Check,
};

/** Reads that show a track's numbers or look: refreshed after a save. */
const TOUCHED = ["/loyalty/tracks", "/loyalty/settings", "/loyalty/card-design"];

export function TracksEditor() {
  const { t } = useTranslation();
  const q = useGetLoyaltyTracks();
  if (q.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (q.isError || !q.data) {
    return (
      <ErrorState
        title={t("rewards.tracks.loadFailed", "Couldn't load the stamp tracks")}
        message={q.error ? getErrorMessage(q.error) : undefined}
        onRetry={() => void q.refetch()}
        retrying={q.isFetching}
      />
    );
  }
  return <TracksForm view={q.data} />;
}

function TracksForm({ view }: { view: TracksView }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { canDesign } = rewardsAccess(useAuthz());
  const { rules } = useCardRules();
  const mode: Mode = view.mode === "points" ? "points" : "visits";
  const save = usePutLoyaltyTracks();
  const orgId = useOrgId() ?? "";
  const menu = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId && mode === "visits" } });

  // Memoised: a new `values` object on every render would reset the form under the owner's typing.
  const values = useMemo(() => fromWire(mode === "points" ? view.tracks.slice(0, 1) : view.tracks), [view, mode]);
  const form = useForm<TracksValues>({ resolver: zodResolver(tracksSchema(rules, mode)), values });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "tracks" });
  const watched = useWatch({ control: form.control, name: "tracks" });
  const problems = useMemo(
    () => (rules && watched ? rules.tracks_validate(toWire({ tracks: watched }), mode) : []),
    [rules, watched, mode],
  );
  const shown = form.formState.submitCount > 0 ? problems : [];

  const submit = async (v: TracksValues) => {
    try {
      await save.mutateAsync({ data: { tracks: toWire(v) } });
      toast.success(t("rewards.tracks.saved", "Stamp tracks saved"));
      await qc.invalidateQueries({ predicate: (x) => TOUCHED.includes(String(x.queryKey[0])) });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const removeLast = async () => {
    const ok = await confirm({
      title: t("rewards.tracks.removeTitle", "Remove this track?"),
      description: t(
        "rewards.tracks.removeBody",
        "It leaves the card and the till after you save. Members' stamps on it are kept, and come back if you add the track again.",
      ),
      confirmLabel: t("rewards.tracks.remove", "Remove track"),
      destructive: true,
    });
    if (ok) remove(fields.length - 1);
  };

  const menuOptions = useMemo(
    () => (menu.data ?? []).filter(isPickable).map((m) => ({ value: m.id, label: m.name })),
    [menu.data],
  );
  const itemName = (id: string) => menu.data?.find((m) => m.id === id)?.name ?? t("rewards.tracks.unknownItem", "Removed item");

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
      <p className="max-w-prose text-sm text-muted-foreground">
        {mode === "points"
          ? t(
              "rewards.tracks.pointsIntro",
              "This programme collects points on spend, and points add up in one balance, so the card has one track. Switch the programme to stamps to add more.",
            )
          : t(
              "rewards.tracks.intro",
              "A track is a row of stamps of its own, such as one for coffee and one for croissants. A track bound to menu items is earned by a Madar POS sale of those items, and a full card covers one of them for free. A track with no items is stamped and completed at the counter, on the Rewards teller page.",
            )}
      </p>
      {!canDesign ? (
        <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          {t("rewards.tracks.readOnly", "You can view the tracks here, but only someone who may design the card can change them.")}
        </p>
      ) : null}

      <fieldset disabled={!canDesign} className="min-w-0 space-y-3">
        {fields.map((f, i) => (
          <Card key={f.id} className="py-0" data-testid="track-card">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {i === 0
                    ? t("rewards.tracks.trackOneTitle", "Track 1: the programme's card")
                    : t("rewards.tracks.trackTitle", { defaultValue: "Track {{n}}", n: i + 1 })}
                </h3>
                {i > 0 && i === fields.length - 1 && canDesign ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeLast()}>
                    <Trash2 className="size-4" />
                    {t("rewards.tracks.remove", "Remove track")}
                  </Button>
                ) : null}
              </div>
              <TrackFields form={form} i={i} trackOneSize={view.track_one_size} mode={mode} menuOptions={menuOptions} itemName={itemName} />
              {problemsAt(shown, i).map((p) => (
                <p key={p.code} role="alert" className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
                  {trackProblemText(p.code, t)}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
        {problemsAt(shown, null).map((p) => (
          <p key={p.code} role="alert" className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
            {trackProblemText(p.code, t)}
          </p>
        ))}
      </fieldset>

      {canDesign ? (
        <div className="flex flex-wrap items-center gap-2">
          {mode === "visits" && fields.length < MAX_TRACKS ? (
            <Button type="button" variant="outline" onClick={() => append(newTrack(fields.length + 1))}>
              <Plus className="size-4" />
              {t("rewards.tracks.add", "Add a track")}
            </Button>
          ) : null}
          <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
            {save.isPending ? <Spinner /> : null}
            {t("common.save", "Save")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function TrackFields({
  form,
  i,
  trackOneSize,
  mode,
  menuOptions,
  itemName,
}: {
  form: UseFormReturn<TracksValues>;
  i: number;
  trackOneSize: number;
  mode: Mode;
  menuOptions: { value: string; label: string }[];
  itemName: (id: string) => string;
}) {
  const { t } = useTranslation();
  const id = (k: string) => `track-${i}-${k}`;
  const items = useWatch({ control: form.control, name: `tracks.${i}.items` }) ?? [];
  const one = i === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("en")}>{t("rewards.tracks.nameEn", "Name")}</Label>
          <Input id={id("en")} maxLength={24} {...form.register(`tracks.${i}.name_en`)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("ar")}>{t("rewards.tracks.nameAr", "Name (Arabic)")}</Label>
          <Input id={id("ar")} dir="rtl" maxLength={24} {...form.register(`tracks.${i}.name_ar`)} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={id("size")}>{t("rewards.tracks.size", "Stamps per card")}</Label>
          {one ? (
            <p id={id("size")} className="flex h-9 items-center gap-2 text-sm">
              <span className="font-mono tabular">{trackOneSize}</span>
              <span className="text-xs text-muted-foreground">{t("rewards.tracks.sizeInProgramme", "Set under Programme")}</span>
            </p>
          ) : (
            <Input
              id={id("size")}
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              className="w-24 font-mono"
              {...form.register(`tracks.${i}.size`, { valueAsNumber: true })}
            />
          )}
        </div>
        <div className="space-y-1.5">
          <Label>{t("rewards.tracks.shape", "Stamp")}</Label>
          <Controller
            control={form.control}
            name={`tracks.${i}.shape`}
            render={({ field }) => (
              <Select value={field.value || "default"} onValueChange={(v) => field.onChange(v === "default" ? "" : v)}>
                <SelectTrigger className="w-40" aria-label={t("rewards.tracks.shape", "Stamp")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("rewards.tracks.shapeDefault", "The card's stamp")}</SelectItem>
                  {SHAPES.map((s) => {
                    const Icon = SHAPE_ICON[s];
                    return (
                      <SelectItem key={s} value={s}>
                        <Icon className="size-4" aria-hidden />
                        {t(`rewards.tracks.shape_${s}`, s)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("colour")}>{t("rewards.tracks.colour", "Colour")}</Label>
          <Controller
            control={form.control}
            name={`tracks.${i}.colour`}
            render={({ field }) => (
              <div className="flex items-center gap-1.5">
                <input
                  id={id("colour")}
                  type="color"
                  value={field.value || "#000000"}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className="h-9 w-12 cursor-pointer rounded-md border bg-card p-1"
                />
                <span className="w-20 font-mono text-xs text-muted-foreground" dir="ltr">
                  {field.value || t("rewards.tracks.colourDefault", "Card text")}
                </span>
                {field.value ? (
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => field.onChange("")} aria-label={t("rewards.tracks.colourClear", "Use the card's text colour")}>
                    <X />
                  </Button>
                ) : null}
              </div>
            )}
          />
        </div>
        {!one ? (
          <div className="space-y-1.5">
            <Label htmlFor={id("cap")}>{t("rewards.tracks.cap", "Most a member can hold")}</Label>
            <Input
              id={id("cap")}
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={t("rewards.tracks.capNone", "No limit")}
              className="w-28 font-mono"
              {...form.register(`tracks.${i}.cap`, { valueAsNumber: true })}
            />
          </div>
        ) : null}
      </div>

      {!one && mode === "visits" ? (
        <>
          <Controller
            control={form.control}
            name={`tracks.${i}.per_item`}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id={id("per")} checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor={id("per")} className="font-normal">
                  {field.value
                    ? t("rewards.tracks.perItem", "A stamp for every item bought")
                    : t("rewards.tracks.perSale", "One stamp per sale that holds any of the items")}
                </Label>
              </div>
            )}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("rewards.tracks.items", "Menu items")}</p>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? t("rewards.tracks.itemsNone", "No items: a counter-only track, stamped and completed on the Rewards teller page.")
                : t("rewards.tracks.itemsSome", "A Madar POS sale of these earns stamps here, and a full card covers one of them.")}
            </p>
            {items.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {items.map((itemId) => (
                  <li key={itemId} className="flex items-center gap-1 rounded-full border bg-card py-0.5 ps-2.5 pe-0.5 text-sm">
                    <bdi>{itemName(itemId)}</bdi>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("rewards.tracks.removeItem", "Remove item")}
                      onClick={() => form.setValue(`tracks.${i}.items`, items.filter((x) => x !== itemId), { shouldDirty: true })}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Combobox
              value={null}
              onChange={(v) => !items.includes(v) && form.setValue(`tracks.${i}.items`, [...items, v], { shouldDirty: true })}
              options={menuOptions.filter((o) => !items.includes(o.value))}
              placeholder={t("rewards.tracks.addItem", "Add a menu item")}
              aria-label={t("rewards.tracks.addItem", "Add a menu item")}
              className="w-full sm:w-72"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
