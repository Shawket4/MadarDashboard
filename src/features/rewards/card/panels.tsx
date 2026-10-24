/**
 * The designer's side panels: what to add to the strip, the selected
 * element's properties, the colours, ground and stamp, and which data each
 * wallet field shows. Every change is an action on the one reducer.
 */
import type { Dispatch, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Plus, Trash2 } from "lucide-react";

import { DashboardLink } from "@/components/app/dashboard-link";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CardDesign, Colours, ElementKind, FieldSource } from "@/data/api/generated/models";
import type { CardRules, Ctx, Problem } from "@/lib/rules/card";

import { defaultSize, sourceFrom, sourceKey, type Action } from "./design-state";

export interface TrackInfo {
  position: number;
  size: number;
  name: string;
}

const SHAPES = ["circle", "square", "star", "heart", "cup", "gift", "check"] as const;

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

// ── Palette + properties ─────────────────────────────────────────────────────

export function ElementPanel({
  rules,
  design,
  ctx,
  tracks,
  selected,
  dispatch,
  disabled,
  kindLabel,
}: {
  rules: CardRules;
  design: CardDesign;
  ctx: Ctx;
  tracks: TrackInfo[];
  selected: number | null;
  dispatch: Dispatch<Action>;
  disabled?: boolean;
  kindLabel: (type: ElementKind["type"]) => string;
}) {
  const { t } = useTranslation();
  const elements = design.elements ?? [];
  const full = elements.length >= rules.card_rules().max_elements;

  const add = (kind: ElementKind) => {
    const { w, h } = defaultSize(kind.type);
    // The first free spot, else a smaller one, else the top corner (validation then says what is wrong).
    const cell = rules.card_first_free(design, w, h) ?? rules.card_first_free(design, 2, 1) ?? { col: 0, row: 0, w, h };
    dispatch({ type: "add", kind, cell });
  };

  const choices: { key: string; label: string; kind: ElementKind }[] = [
    ...tracks.flatMap((tr) => [
      ...(ctx.mode === "points" && tr.position === 1
        ? []
        : [{ key: `stamps${tr.position}`, label: `${kindLabel("stamps")} · ${tr.name}`, kind: { type: "stamps", track: tr.position } as ElementKind }]),
      { key: `bar${tr.position}`, label: `${kindLabel("bar")} · ${tr.name}`, kind: { type: "bar", track: tr.position } as ElementKind },
      { key: `count${tr.position}`, label: `${kindLabel("count")} · ${tr.name}`, kind: { type: "count", track: tr.position } as ElementKind },
    ]),
    { key: "text", label: kindLabel("text"), kind: { type: "text", en: "", ar: "", size: "medium", align: "start" } },
    { key: "logo", label: kindLabel("logo"), kind: { type: "logo" } },
  ];

  const sel = selected !== null ? elements[selected] : undefined;

  return (
    <Section title={t("rewards.card.elements", "On the strip")}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("rewards.card.addElement", "Add to the strip")}>
        {choices.map((c) => (
          <Button key={c.key} type="button" variant="outline" size="sm" disabled={disabled || full} onClick={() => add(c.kind)}>
            <Plus className="size-3.5" />
            {c.label}
          </Button>
        ))}
      </div>
      {sel && selected !== null ? (
        <div className="space-y-3 border-t pt-3" data-testid="element-properties">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{kindLabel(sel.kind.type)}</p>
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => dispatch({ type: "remove", index: selected })}>
              <Trash2 className="size-4" />
              {t("rewards.card.removeElement", "Remove")}
            </Button>
          </div>
          {"track" in sel.kind ? (
            <Field label={t("rewards.card.track", "Stamp track")}>
              <Select
                value={String(sel.kind.track)}
                disabled={disabled}
                onValueChange={(v) => dispatch({ type: "kind", index: selected, kind: { ...(sel.kind as { type: "bar"; track: number }), track: Number(v) } })}
              >
                <SelectTrigger className="w-full" aria-label={t("rewards.card.track", "Stamp track")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((tr) => (
                    <SelectItem key={tr.position} value={String(tr.position)}>
                      {tr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          {sel.kind.type === "text" ? <TextProps kind={sel.kind} index={selected} dispatch={dispatch} disabled={disabled} /> : null}
          <p className="text-xs text-muted-foreground" dir="ltr">
            {t("rewards.card.cellReadout", {
              defaultValue: "Column {{col}}, row {{row}} · {{w}} × {{h}}",
              col: sel.cell.col + 1,
              row: sel.cell.row + 1,
              w: sel.cell.w,
              h: sel.cell.h,
            })}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("rewards.card.selectHint", "Select a box on the strip to change it.")}</p>
      )}
    </Section>
  );
}

function TextProps({
  kind,
  index,
  dispatch,
  disabled,
}: {
  kind: Extract<ElementKind, { type: "text" }>;
  index: number;
  dispatch: Dispatch<Action>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const set = (patch: Partial<typeof kind>) => dispatch({ type: "kind", index, kind: { ...kind, ...patch } });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t("rewards.card.textEn", "Words (English)")} htmlFor="card-text-en">
        <Input id="card-text-en" dir="ltr" value={kind.en ?? ""} disabled={disabled} onChange={(e) => set({ en: e.target.value })} />
      </Field>
      <Field label={t("rewards.card.textAr", "Words (Arabic)")} htmlFor="card-text-ar">
        <Input id="card-text-ar" dir="rtl" value={kind.ar ?? ""} disabled={disabled} onChange={(e) => set({ ar: e.target.value })} />
      </Field>
      <Field label={t("rewards.card.textSize", "Size")}>
        <SegmentedControl
          value={kind.size}
          disabled={disabled}
          aria-label={t("rewards.card.textSize", "Size")}
          onChange={(size) => set({ size })}
          options={[
            { value: "small", label: t("rewards.card.sizeSmall", "Small") },
            { value: "medium", label: t("rewards.card.sizeMedium", "Medium") },
            { value: "large", label: t("rewards.card.sizeLarge", "Large") },
          ]}
        />
      </Field>
      <Field label={t("rewards.card.textAlign", "Alignment")}>
        <SegmentedControl
          value={kind.align}
          disabled={disabled}
          aria-label={t("rewards.card.textAlign", "Alignment")}
          onChange={(align) => set({ align })}
          options={[
            { value: "start", label: t("rewards.card.alignStart", "Start") },
            { value: "centre", label: t("rewards.card.alignCentre", "Centre") },
            { value: "end", label: t("rewards.card.alignEnd", "End") },
          ]}
        />
      </Field>
    </div>
  );
}

// ── Colours, ground, stamp ──────────────────────────────────────────────────

export function StylePanel({
  design,
  ctx,
  customBranding,
  dispatch,
  disabled,
  problems,
}: {
  design: CardDesign;
  ctx: Ctx;
  customBranding: boolean;
  dispatch: Dispatch<Action>;
  disabled?: boolean;
  problems: Problem[];
}) {
  const { t } = useTranslation();
  const locked = disabled || !customBranding;
  const colours = design.colours;
  const setColour = (k: keyof Colours, v: string) => dispatch({ type: "patch", patch: { colours: { ...colours, [k]: v } } });
  const flagged = (path: string) => problems.some((p) => p.path === path);

  const colourRow = (k: keyof Colours, label: string) => (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={label}
        value={/^#[0-9a-fA-F]{6}$/.test(colours[k]) ? colours[k] : "#000000"}
        disabled={locked}
        onChange={(e) => setColour(k, e.target.value.toUpperCase())}
        className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-card p-1 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor={`card-colour-${k}`} className="text-xs">
          {label}
        </Label>
        <Input
          id={`card-colour-${k}`}
          dir="ltr"
          className="h-8 font-mono"
          value={colours[k]}
          maxLength={7}
          disabled={locked}
          aria-invalid={flagged(`colours.${k}`) || undefined}
          onChange={(e) => setColour(k, e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <Section title={t("rewards.card.look", "Colours and ground")}>
      {!customBranding ? (
        <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground" data-testid="colours-locked">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {t(
              "rewards.card.coloursLocked",
              "Your card wears Madar's colours: custom colours and the card photo come with custom branding, which Madar switches on. Your logo and photo are set in",
            )}{" "}
            <DashboardLink to="/settings/brand" className="font-medium text-foreground underline underline-offset-2">
              {t("rewards.card.brandLink", "Settings › Brand")}
            </DashboardLink>
            .
          </span>
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {colourRow("background", t("rewards.card.colourBackground", "Background"))}
        {colourRow("foreground", t("rewards.card.colourForeground", "Text and stamps"))}
        {colourRow("label", t("rewards.card.colourLabel", "Labels"))}
      </div>

      <Field label={t("rewards.card.ground", "Ground")}>
        <SegmentedControl
          value={design.ground.kind}
          disabled={disabled}
          aria-label={t("rewards.card.ground", "Ground")}
          onChange={(kind) =>
            dispatch({ type: "patch", patch: { ground: { kind, pattern: kind === "pattern" ? (design.ground.pattern ?? "dots") : null } } })
          }
          options={[
            { value: "colour", label: t("rewards.card.groundColour", "Colour") },
            ...(ctx.has_photo && customBranding ? [{ value: "photo" as const, label: t("rewards.card.groundPhoto", "Card photo") }] : []),
            { value: "pattern", label: t("rewards.card.groundPattern", "Pattern") },
          ]}
        />
      </Field>
      {!ctx.has_photo ? (
        <p className="text-xs text-muted-foreground">{t("rewards.card.noPhoto", "Upload a card photo in Settings › Brand to use it as the ground.")}</p>
      ) : null}
      {design.ground.kind === "pattern" ? (
        <Field label={t("rewards.card.pattern", "Pattern")}>
          <SegmentedControl
            value={design.ground.pattern ?? "dots"}
            disabled={disabled}
            aria-label={t("rewards.card.pattern", "Pattern")}
            onChange={(pattern) => dispatch({ type: "patch", patch: { ground: { kind: "pattern", pattern } } })}
            options={[
              { value: "dots", label: t("rewards.card.patternDots", "Dots") },
              { value: "lines", label: t("rewards.card.patternLines", "Lines") },
              { value: "grid", label: t("rewards.card.patternGrid", "Grid") },
            ]}
          />
        </Field>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("rewards.card.stampShape", "Stamp shape")}>
          <Select
            value={design.stamp.shape}
            disabled={disabled}
            onValueChange={(shape) => dispatch({ type: "patch", patch: { stamp: { ...design.stamp, shape: shape as (typeof SHAPES)[number] } } })}
          >
            <SelectTrigger className="w-full" aria-label={t("rewards.card.stampShape", "Stamp shape")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHAPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`rewards.card.shape.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("rewards.card.stampEmpty", "A stamp not yet earned")}>
          <SegmentedControl
            value={design.stamp.empty}
            disabled={disabled}
            aria-label={t("rewards.card.stampEmpty", "A stamp not yet earned")}
            onChange={(empty) => dispatch({ type: "patch", patch: { stamp: { ...design.stamp, empty } } })}
            options={[
              { value: "outline", label: t("rewards.card.emptyOutline", "Outline") },
              { value: "faint", label: t("rewards.card.emptyFaint", "Faint") },
            ]}
          />
        </Field>
      </div>
    </Section>
  );
}

// ── Wallet fields ───────────────────────────────────────────────────────────

export function fieldOptions(tracks: TrackInfo[], t: (k: string, d: string) => string): { key: string; label: string }[] {
  return [
    ...tracks.flatMap((tr) => [
      { key: `balance:${tr.position}`, label: `${t("rewards.card.srcBalance", "Balance")} · ${tr.name}` },
      { key: `progress:${tr.position}`, label: `${t("rewards.card.srcProgress", "Progress")} · ${tr.name}` },
      { key: `rewards:${tr.position}`, label: `${t("rewards.card.srcRewards", "Rewards earned")} · ${tr.name}` },
    ]),
    { key: "member", label: t("rewards.card.srcMember", "Member's name") },
  ];
}

function SourceSelect({
  value,
  onChange,
  options,
  label,
  disabled,
}: {
  value: FieldSource;
  onChange: (f: FieldSource) => void;
  options: { key: string; label: string }[];
  label: string;
  disabled?: boolean;
}) {
  return (
    <Select value={sourceKey(value)} disabled={disabled} onValueChange={(k) => onChange(sourceFrom(k))}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FieldsPanel({
  design,
  tracks,
  dispatch,
  disabled,
  rules,
}: {
  design: CardDesign;
  tracks: TrackInfo[];
  dispatch: Dispatch<Action>;
  disabled?: boolean;
  rules: CardRules;
}) {
  const { t } = useTranslation();
  const options = fieldOptions(tracks, t);
  const apple = design.apple;
  const google = design.google;
  const limits = rules.card_rules();
  const first: FieldSource = { type: "balance", track: tracks[0]?.position ?? 1 };
  const setApple = (patch: Partial<typeof apple>) => dispatch({ type: "patch", patch: { apple: { ...apple, ...patch } } });
  const below = (apple.secondary?.length ?? 0) + (apple.auxiliary?.length ?? 0);

  const list = (key: "header" | "secondary" | "auxiliary", title: string, canAdd: boolean) => {
    const items = apple[key] ?? [];
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label>{title}</Label>
          <Button type="button" variant="ghost" size="xs" disabled={disabled || !canAdd} onClick={() => setApple({ [key]: [...items, first] })}>
            <Plus />
            {t("rewards.card.addField", "Add")}
          </Button>
        </div>
        {items.length === 0 ? <p className="text-xs text-muted-foreground">{t("rewards.card.noFields", "None")}</p> : null}
        {items.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <SourceSelect
              value={f}
              options={options}
              label={title}
              disabled={disabled}
              onChange={(v) => setApple({ [key]: items.map((x, j) => (j === i ? v : x)) })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={t("rewards.card.removeField", "Remove field")}
              onClick={() => setApple({ [key]: items.filter((_, j) => j !== i) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Section title={t("rewards.card.fields", "What the wallet writes")}>
      <p className="text-xs text-muted-foreground">
        {t(
          "rewards.card.fieldsHint",
          "Apple and Google write these fields themselves, in the phone's own font. You choose what each one shows.",
        )}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("rewards.card.apple", "Apple Wallet")}</h3>
          {list("header", t("rewards.card.appleHeader", "Beside the logo (up to 2)"), (apple.header?.length ?? 0) < limits.max_header)}
          <div className="space-y-1.5">
            <Label>{t("rewards.card.applePrimary", "Over the strip (optional)")}</Label>
            <Select
              value={apple.primary ? sourceKey(apple.primary) : "none"}
              disabled={disabled}
              onValueChange={(k) => setApple({ primary: k === "none" ? null : sourceFrom(k) })}
            >
              <SelectTrigger className="w-full" aria-label={t("rewards.card.applePrimary", "Over the strip (optional)")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("rewards.card.noPrimary", "Nothing (keep the strip clear)")}</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {list("secondary", t("rewards.card.appleSecondary", "Under the strip"), below < limits.max_secondary_and_auxiliary)}
          {list("auxiliary", t("rewards.card.appleAuxiliary", "Second row"), below < limits.max_secondary_and_auxiliary)}
          <p className="text-xs text-muted-foreground">
            {t("rewards.card.appleBelowHint", "Up to 3 under the strip in all: one more row is kept for the messages you send.")}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("rewards.card.google", "Google Wallet")}</h3>
          <div className="space-y-1.5">
            <Label>{t("rewards.card.googlePoints", "Main figure")}</Label>
            <SourceSelect
              value={google.points}
              options={options}
              label={t("rewards.card.googlePoints", "Main figure")}
              disabled={disabled}
              onChange={(points) => dispatch({ type: "patch", patch: { google: { ...google, points } } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("rewards.card.googleSecondary", "Second figure (optional)")}</Label>
            <Select
              value={google.secondary ? sourceKey(google.secondary) : "none"}
              disabled={disabled}
              onValueChange={(k) => dispatch({ type: "patch", patch: { google: { ...google, secondary: k === "none" ? null : sourceFrom(k) } } })}
            >
              <SelectTrigger className="w-full" aria-label={t("rewards.card.googleSecondary", "Second figure (optional)")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("rewards.card.noField", "Nothing")}</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Section>
  );
}
