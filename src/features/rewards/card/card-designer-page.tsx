/**
 * Rewards › Card design: how the shop's wallet card looks.
 *
 * Start from a template, place stamps, bars, counts, words and the logo on
 * the strip's 12×6 grid, choose the colours, the ground and what each OS-drawn
 * field shows, and see the card as Apple and Google lay it out, in English and
 * Arabic. Every change is checked by madar-card (`card_validate`, the server's
 * own rules), and the server's exact image is shown beside the live one.
 *
 * Reading needs `loyalty.read`; saving, publishing and going back to the
 * classic look need `loyalty.card.design`.
 */
import { useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CircleAlert, RotateCcw, Send } from "lucide-react";

import { useConfirm } from "@/components/app/confirm-dialog";
import { ErrorState } from "@/components/app/empty-state";
import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { SegmentedControl } from "@/components/app/segmented-control";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGetLoyaltyCardDesignQueryKey,
  useGetLoyaltyCardDesign,
  usePublishLoyaltyCardDesign,
  usePutLoyaltyCardDesign,
  useUnpublishLoyaltyCardDesign,
} from "@/data/api/generated/api";
import type { CardDesign, CardDesignView, Element, ElementKind } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { fmtDateTime } from "@/lib/format";
import type { CardRules, CardState, Ctx, Store } from "@/lib/rules/card";
import { cn } from "@/lib/utils";

import { rewardsAccess } from "../access";
import { useCardRules } from "../use-card-rules";
import { trackLabel } from "../use-track-names";
import { initEditor, isDirty, reducer } from "./design-state";
import { GridEditor } from "./grid-editor";
import { ElementPanel, FieldsPanel, Section, StylePanel, type TrackInfo } from "./panels";
import { problemElement, problemText } from "./problems";
import { StripSvg } from "@/components/loyalty-card/strip-svg";
import { AppleMock, GoogleMock, ServerPreview } from "./wallet-preview";

export function CardDesignerPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  const q = useGetLoyaltyCardDesign({ query: { enabled: access.canReadProgram } });
  const card = useCardRules();
  const title = t("rewards.card.title", "Card design");

  if (authz.ready && !access.canReadProgram) {
    return <Restricted title={title} who={t("rewards.card.noAccess", "Your account can't open the card design. The owner can give you access.")} />;
  }
  if (q.isError || card.failed) {
    return (
      <Page>
        <PageHeader title={title} />
        <ErrorState
          message={q.error ? getErrorMessage(q.error) : t("rewards.card.rulesFailed", "Couldn't load the designer. Check the connection and try again.")}
          onRetry={() => (q.isError ? void q.refetch() : card.retry())}
        />
      </Page>
    );
  }
  if (!q.data || !card.rules) {
    return (
      <Page>
        <PageHeader title={title} />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Page>
    );
  }
  return <Designer view={q.data} rules={card.rules} canEdit={access.canDesign} />;
}

function Designer({ view, rules, canEdit }: { view: CardDesignView; rules: CardRules; canEdit: boolean }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const save = usePutLoyaltyCardDesign();
  const publish = usePublishLoyaltyCardDesign();
  const unpublish = useUnpublishLoyaltyCardDesign();
  const [s, dispatch] = useReducer(reducer, view, (v) => initEditor(v.draft ?? v.published ?? v.default_design));
  const design = s.design;
  const ctx = view.ctx as Ctx;
  const disabled = !canEdit;

  // Preview controls.
  const [store, setStore] = useState<Store>("apple");
  const [lang, setLang] = useState<"en" | "ar">(i18n.language.startsWith("ar") ? "ar" : "en");
  const arabic = lang === "ar";
  const [balances, setBalances] = useState<Record<number, number>>(() =>
    Object.fromEntries(ctx.tracks.map((tr) => [tr.position, Math.ceil(tr.size / 2)])),
  );

  const tracksIn = (ar: boolean, tf: (k: string, o: Record<string, unknown>) => string): TrackInfo[] =>
    ctx.tracks.map((ref) => {
      const def = view.tracks.find((x) => x.position === ref.position);
      const fallback =
        ref.position === 1
          ? (ar ? view.programme_name_ar : null) || view.programme_name || tf("rewards.common.trackOne", { defaultValue: "Main card" })
          : tf("rewards.common.trackN", { defaultValue: "Track {{n}}", n: ref.position });
      return { position: ref.position, size: ref.size, name: trackLabel(def, ar, fallback) };
    });
  const uiArabic = i18n.language.startsWith("ar");
  const uiTracks = tracksIn(uiArabic, t as never);
  const previewTracks = tracksIn(arabic, i18n.getFixedT(lang) as never);

  const state: CardState = useMemo(
    () => ({
      arabic,
      tracks: ctx.tracks.map((ref) => {
        const def = view.tracks.find((x) => x.position === ref.position);
        return { position: ref.position, size: ref.size, balance: balances[ref.position] ?? 0, colour: def?.colour ?? null, shape: def?.shape ?? null };
      }),
    }),
    [arabic, ctx.tracks, view.tracks, balances],
  );

  // A shop on Madar's palette cannot change its colours, so a colour warning
  // would be one it can never act on: shown only to shops that can.
  const problems = useMemo(
    () =>
      rules
        .card_validate(design as never, ctx)
        .filter((p) => view.custom_branding || !(p.severity === "warning" && p.path.startsWith("colours."))),
    [rules, design, ctx, view.custom_branding],
  );
  const errors = problems.filter((p) => p.severity === "error");
  const valid = errors.length === 0;
  const problemIndexes = useMemo(() => {
    const out = new Set<number>();
    for (const p of errors) for (const m of p.path.matchAll(/elements\[(\d+)\]/g)) out.add(Number(m[1]));
    return out;
  }, [errors]);

  const templates = useMemo(
    () => rules.card_templates(design.colours, ctx, view.tracks as never) as CardDesign[],
    [rules, design.colours, ctx, view.tracks],
  );

  const kindLabel = (type: ElementKind["type"]) =>
    ({
      stamps: t("rewards.card.kindStamps", "Stamps"),
      bar: t("rewards.card.kindBar", "Bar"),
      count: t("rewards.card.kindCount", "Count"),
      text: t("rewards.card.kindText", "Text"),
      logo: t("rewards.card.kindLogo", "Logo"),
    })[type];
  const elementLabel = (e: Element) => {
    const k = e.kind;
    if ("track" in k) return `${kindLabel(k.type)} · ${uiTracks.find((x) => x.position === k.track)?.name ?? k.track}`;
    if (k.type === "text") return `${kindLabel("text")} “${(uiArabic ? k.ar || k.en : k.en || k.ar) ?? ""}”`;
    return kindLabel(k.type);
  };

  const dirty = isDirty(s);
  const refresh = () => qc.invalidateQueries({ queryKey: getGetLoyaltyCardDesignQueryKey() });

  const saveDraft = async (): Promise<boolean> => {
    try {
      await save.mutateAsync({ data: { design } });
      dispatch({ type: "saved" });
      void refresh();
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    }
  };

  const onSave = async () => {
    if (await saveDraft()) toast.success(t("rewards.card.saved", "Draft saved. Members still see the published card."));
  };

  const onPublish = async () => {
    const ok = await confirm({
      title: t("rewards.card.publishTitle", "Publish this card?"),
      description: t(
        "rewards.card.publishBody",
        "Every member's card updates within minutes, in Apple Wallet and Google Wallet. You can go back to the classic look at any time.",
      ),
      confirmLabel: t("rewards.card.publish", "Publish"),
    });
    if (!ok) return;
    if ((dirty || !view.draft) && !(await saveDraft())) return;
    try {
      await publish.mutateAsync();
      toast.success(t("rewards.card.published", "Published. Members' cards are updating."));
      void refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onUnpublish = async () => {
    const ok = await confirm({
      title: t("rewards.card.classicTitle", "Go back to the classic look?"),
      description: t("rewards.card.classicBody", "Every member's card goes back to the standard Rewards look within minutes. Your draft is kept."),
      confirmLabel: t("rewards.card.classic", "Back to the classic look"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await unpublish.mutateAsync();
      toast.success(t("rewards.card.unpublished", "Back to the classic look. Members' cards are updating."));
      void refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const busy = save.isPending || publish.isPending || unpublish.isPending;

  return (
    <Page>
      <PageHeader
        title={t("rewards.card.title", "Card design")}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {view.published ? (
              <StatusPill tone="success" size="sm">
                {t("rewards.card.statusPublished", { defaultValue: "Published {{date}}", date: fmtDateTime(view.published_at) })}
              </StatusPill>
            ) : (
              <StatusPill tone="neutral" size="sm">
                {t("rewards.card.statusClassic", "Members see the classic look")}
              </StatusPill>
            )}
            {dirty ? (
              <StatusPill tone="warning" size="sm">
                {t("rewards.card.statusDirty", "Unsaved changes")}
              </StatusPill>
            ) : null}
          </span>
        }
        actions={
          canEdit ? (
            <>
              {view.published ? (
                <Button type="button" variant="ghost" disabled={busy} onClick={() => void onUnpublish()}>
                  <RotateCcw className="size-4" />
                  {t("rewards.card.classic", "Back to the classic look")}
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={busy || !dirty || !valid} loading={save.isPending} onClick={() => void onSave()}>
                {t("rewards.card.saveDraft", "Save draft")}
              </Button>
              <Button type="button" disabled={busy || !valid} loading={publish.isPending} onClick={() => void onPublish()}>
                <Send className="size-4" />
                {t("rewards.card.publish", "Publish")}
              </Button>
            </>
          ) : null
        }
      />

      {!canEdit ? (
        <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground" data-testid="read-only">
          {t("rewards.card.readOnly", "You can look at the card design here; changing it needs the card design permission.")}
        </p>
      ) : null}

      <Section title={t("rewards.card.templates", "Start from a template")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label={t("rewards.card.templates", "Start from a template")}>
          {templates.map((tpl) => {
            const id = tpl.template ?? "";
            const on = design.template === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                disabled={disabled}
                data-press="product"
                onClick={() => dispatch({ type: "template", design: tpl })}
                className={cn(
                  "space-y-1.5 rounded-xl border p-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                  on ? "border-primary ring-1 ring-primary" : "hover:bg-accent",
                )}
              >
                <StripSvg rules={rules} design={tpl} state={state} store="apple" scale={1} photoUrl={view.photo_url} logoUrl={view.logo_url} primaryField={tpl.apple.primary != null} className="overflow-hidden rounded-md" />
                <span className="block px-1 text-sm font-medium">{t(`rewards.card.template.${id}`, id)}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <Section
            title={t("rewards.card.strip", "The strip")}
            aside={<span className="text-xs text-muted-foreground">{arabic ? t("rewards.card.editingAr", "Arabic card (mirrored)") : t("rewards.card.editingEn", "English card")}</span>}
          >
            <GridEditor
              rules={rules}
              design={design}
              state={state}
              selected={s.selected}
              dispatch={dispatch}
              disabled={disabled}
              elementLabel={elementLabel}
              photoUrl={view.photo_url}
              logoUrl={view.logo_url}
              problemIndexes={problemIndexes}
            />
          </Section>

          {problems.length > 0 ? (
            <section aria-label={t("rewards.card.problems", "Problems")} className="space-y-1.5 rounded-2xl border bg-card p-4" data-testid="problems">
              <h2 className="text-sm font-semibold">{t("rewards.card.problems", "Problems")}</h2>
              <ul className="space-y-1">
                {problems.map((p, i) => {
                  const el = problemElement(p.path);
                  const Icon = p.severity === "error" ? CircleAlert : AlertTriangle;
                  return (
                    <li key={`${p.code}-${p.path}-${i}`}>
                      <button
                        type="button"
                        disabled={el === null}
                        onClick={() => el !== null && dispatch({ type: "select", index: el })}
                        className="flex w-full items-start gap-2 rounded-md p-1 text-start text-sm enabled:hover:bg-accent"
                      >
                        <Icon
                          aria-hidden
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            p.severity === "error"
                              ? "text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]"
                              : "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]",
                          )}
                        />
                        <span>
                          <span className="sr-only">{p.severity === "error" ? t("rewards.card.error", "Must fix:") : t("rewards.card.warning", "Note:")} </span>
                          {problemText(p.code, t)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <ElementPanel rules={rules} design={design} ctx={ctx} tracks={uiTracks} selected={s.selected} dispatch={dispatch} disabled={disabled} kindLabel={kindLabel} />
          <StylePanel design={design} ctx={ctx} customBranding={view.custom_branding} dispatch={dispatch} disabled={disabled} problems={problems} />
          <FieldsPanel design={design} tracks={uiTracks} dispatch={dispatch} disabled={disabled} rules={rules} />
        </div>

        <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-4">
          <Section title={t("rewards.card.preview", "Preview")}>
            <div className="flex flex-wrap gap-2">
              <SegmentedControl
                value={store}
                onChange={setStore}
                aria-label={t("rewards.card.wallet", "Wallet")}
                options={[
                  { value: "apple", label: t("rewards.card.apple", "Apple Wallet") },
                  { value: "google", label: t("rewards.card.google", "Google Wallet") },
                ]}
              />
              <SegmentedControl
                value={lang}
                onChange={setLang}
                aria-label={t("rewards.card.language", "Card language")}
                options={[
                  { value: "en", label: "EN" },
                  { value: "ar", label: "AR" },
                ]}
              />
            </div>
            {ctx.tracks.map((ref) => {
              const name = uiTracks.find((x) => x.position === ref.position)?.name ?? "";
              const id = `card-sample-${ref.position}`;
              const value = balances[ref.position] ?? 0;
              return (
                <div key={ref.position} className="space-y-1">
                  <label htmlFor={id} className="flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>{t("rewards.card.sample", { defaultValue: "Sample balance · {{name}}", name })}</span>
                    <bdi className="font-mono tabular">{value}</bdi>
                  </label>
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={ref.size * 2}
                    value={value}
                    onChange={(e) => setBalances((b) => ({ ...b, [ref.position]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              );
            })}
            {store === "apple" ? (
              <AppleMock rules={rules} design={design} state={state} tracks={previewTracks} programme={(arabic && view.programme_name_ar) || view.programme_name} logoUrl={view.logo_url} photoUrl={view.photo_url} />
            ) : (
              <GoogleMock rules={rules} design={design} state={state} tracks={previewTracks} programme={(arabic && view.programme_name_ar) || view.programme_name} logoUrl={view.logo_url} photoUrl={view.photo_url} />
            )}
          </Section>
          <section className="rounded-2xl border bg-card p-4">
            <ServerPreview design={design} store={store} state={state} valid={valid} />
          </section>
        </aside>
      </div>
    </Page>
  );
}
