/**
 * Write a one-line message, pick who gets it, send now or later.
 *
 * The line is checked in the browser by madar-card's `message_validate` (the
 * server's own check), the segment by `audience_validate`, and the count of who
 * can be reached comes from the server as the segment changes. Sending asks
 * once more with that count: a message reaches people's phones and cannot be
 * taken back.
 */
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { z } from "zod";
import { Send } from "lucide-react";

import { useConfirm } from "@/components/app/confirm-dialog";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getListLoyaltyBroadcastsQueryKey,
  useCountLoyaltyBroadcastAudience,
  useCreateLoyaltyBroadcast,
} from "@/data/api/generated/api";
import type { Limits, Rule } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import type { CardRules } from "@/lib/rules/card";

import { AudienceBuilder } from "../audience/audience-builder";
import { useAudienceValid } from "../audience/use-audience-valid";
import { useCardRules } from "../use-card-rules";
import { useTrackNames } from "../use-track-names";
import { MessagePreview } from "./message-preview";
import { messageProblemText, minutesAhead, scheduleOk, toLocalInput } from "./util";

const DEBOUNCE_MS = 400;

const composerSchema = (card: CardRules | undefined, limits: Limits) =>
  z
    .object({
      en: z.string(),
      ar: z.string(),
      when: z.enum(["now", "later"]),
      at: z.string(),
      whatsapp: z.boolean(),
    })
    .superRefine((v, ctx) => {
      for (const p of card?.message_validate({ en: v.en, ar: v.ar }) ?? []) {
        if (p.severity !== "error") continue;
        ctx.addIssue({ code: "custom", path: [p.path === "message.ar" ? "ar" : "en"], message: p.code });
      }
      if (v.when === "later" && !scheduleOk(minutesAhead(v.at), limits)) {
        ctx.addIssue({ code: "custom", path: ["at"], message: "schedule" });
      }
    });

type ComposerValues = z.infer<ReturnType<typeof composerSchema>>;

const chars = (s: string) => [...s.trim()].length;

export function Composer({ limits, atLimit }: { limits: Limits; atLimit: boolean }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { rules: card } = useCardRules();
  const { tracks } = useTrackNames();
  const [rules, setRules] = useState<Rule[]>([]);
  const audienceValid = useAudienceValid(rules, tracks.length);
  const count = useCountLoyaltyBroadcastAudience();
  const create = useCreateLoyaltyBroadcast();
  const ids = { en: useId(), ar: useId(), at: useId(), wa: useId() };

  const form = useForm<ComposerValues>({
    resolver: (values, context, options) => zodResolver(composerSchema(card, limits))(values, context, options),
    defaultValues: { en: "", ar: "", when: "now", at: "", whatsapp: false },
  });
  const v = form.watch();

  // The live checks (the resolver runs the same ones again on Send).
  const problems = useMemo(
    () => (card ? card.message_validate({ en: v.en, ar: v.ar }).filter((p) => p.severity === "error") : []),
    [card, v.en, v.ar],
  );
  const untouched = !v.en.trim() && !v.ar.trim();
  const shown = untouched ? [] : problems;
  const scheduleBad = v.when === "later" && !scheduleOk(minutesAhead(v.at), limits);

  // Who can be reached, recounted shortly after the segment settles.
  const rulesKey = JSON.stringify(rules);
  const { mutate: recount } = count;
  useEffect(() => {
    if (!audienceValid) return;
    const id = setTimeout(() => recount({ data: { audience: { rules: JSON.parse(rulesKey) as Rule[] } } }), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [rulesKey, audienceValid, recount]);

  const c = count.data;
  const reach = c ? c.apple + c.google + (v.whatsapp ? c.no_card : 0) : null;

  const disabled =
    !card || atLimit || create.isPending || problems.length > 0 || !audienceValid || scheduleBad || reach === 0;

  const submit = async (values: ComposerValues) => {
    const later = values.when === "later";
    const n = reach ?? 0;
    const ok = await confirm({
      title: later
        ? t("rewards.notifications.confirmScheduleTitle", { defaultValue: "Schedule this message for {{count}} members?", count: n })
        : t("rewards.notifications.confirmSendTitle", { defaultValue: "Send this message to {{count}} members?", count: n }),
      description: later
        ? t("rewards.notifications.confirmScheduleBody", {
            defaultValue: "It goes out at {{at}}. It reaches their phones and can't be taken back once sent.",
            at: fmtDateTime(new Date(values.at)),
          })
        : t("rewards.notifications.confirmSendBody", "It reaches their phones within minutes and can't be taken back."),
      confirmLabel: later ? t("rewards.notifications.schedule", "Schedule") : t("rewards.notifications.send", "Send"),
    });
    if (!ok) return;
    try {
      await create.mutateAsync({
        data: {
          message: { en: values.en.trim(), ar: values.ar.trim() },
          audience: { rules },
          whatsapp_fallback: values.whatsapp,
          ...(later ? { scheduled_for: new Date(values.at).toISOString() } : {}),
        },
      });
      toast.success(later ? t("rewards.notifications.scheduled", "Message scheduled") : t("rewards.notifications.sent", "Message on its way"));
      form.reset();
      await qc.invalidateQueries({ queryKey: getListLoyaltyBroadcastsQueryKey() });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const counter = (s: string) => (
    <span className="font-mono text-xs text-muted-foreground tabular" dir="ltr" data-testid="char-count">
      {chars(s)}/{limits.line_max}
    </span>
  );
  const problemsFor = (field: "en" | "ar") =>
    shown
      .filter((p) => (field === "ar" ? p.path === "message.ar" : p.path !== "message.ar"))
      .map((p) => (
        <p key={p.code} role="alert" className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
          {messageProblemText(p.code, t, limits.line_max)}
        </p>
      ));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-5 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t("rewards.notifications.composeTitle", "New message")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(
              "rewards.notifications.composeHint",
              "One line on the card, up to 100 characters, no links. Each member gets it in their language, or the other one if you write only one.",
            )}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={ids.en}>{t("rewards.notifications.lineEn", "Message in English")}</Label>
              {counter(v.en)}
            </div>
            <Input id={ids.en} dir="ltr" autoComplete="off" aria-invalid={shown.some((p) => p.path !== "message.ar") || undefined} {...form.register("en")} />
            {problemsFor("en")}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={ids.ar}>{t("rewards.notifications.lineAr", "Message in Arabic")}</Label>
              {counter(v.ar)}
            </div>
            <Input id={ids.ar} dir="rtl" autoComplete="off" aria-invalid={shown.some((p) => p.path === "message.ar") || undefined} {...form.register("ar")} />
            {problemsFor("ar")}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t("rewards.notifications.audienceTitle", "Who gets it")}</h3>
          <AudienceBuilder rules={rules} onChange={setRules} tracks={tracks} />
          <AudienceCountLine count={c} loading={count.isPending} whatsapp={v.whatsapp} reach={reach} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Label htmlFor={ids.wa} className="text-sm font-medium">
              {t("rewards.notifications.whatsapp", "Also WhatsApp members with no card")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t(
                "rewards.notifications.whatsappHint",
                "Off by default. Each WhatsApp message costs the shop; members with a card in a wallet get it on the card for free.",
              )}
            </p>
          </div>
          <Switch id={ids.wa} checked={v.whatsapp} onCheckedChange={(on) => form.setValue("whatsapp", on, { shouldDirty: true })} />
        </div>

        <div className="space-y-2">
          <SegmentedControl
            value={v.when}
            onChange={(w) => {
              form.setValue("when", w, { shouldDirty: true });
              if (w === "later" && !form.getValues("at")) form.setValue("at", toLocalInput(new Date(Date.now() + 60 * 60_000)));
            }}
            options={[
              { value: "now", label: t("rewards.notifications.now", "Send now") },
              { value: "later", label: t("rewards.notifications.later", "Schedule") },
            ]}
          />
          {v.when === "later" ? (
            <div className="space-y-1.5">
              <Label htmlFor={ids.at}>{t("rewards.notifications.at", "Send at")}</Label>
              <Input id={ids.at} type="datetime-local" className="w-auto font-mono" dir="ltr" aria-invalid={scheduleBad || undefined} {...form.register("at")} />
              {scheduleBad ? (
                <p role="alert" className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
                  {t("rewards.notifications.scheduleWindow", {
                    defaultValue: "Pick a time between {{min}} minutes and {{days}} days from now.",
                    min: limits.schedule_min_minutes,
                    days: limits.schedule_max_days,
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={disabled} loading={create.isPending}>
            <Send className="size-4 rtl:-scale-x-100" />
            {v.when === "later" ? t("rewards.notifications.scheduleAction", "Schedule message") : t("rewards.notifications.sendAction", "Send message")}
          </Button>
          {atLimit ? (
            <p className="text-xs text-muted-foreground">
              {t("rewards.notifications.limitReached", {
                defaultValue: "The shop has sent {{limit}} messages in the last 24 hours, the most allowed. Try again later.",
                limit: limits.daily_limit,
              })}
            </p>
          ) : null}
        </div>
      </form>

      <MessagePreview message={{ en: v.en, ar: v.ar }} />
    </div>
  );
}

function AudienceCountLine({
  count,
  loading,
  whatsapp,
  reach,
}: {
  count: { members: number; opted_out: number; apple: number; google: number; no_card: number } | undefined;
  loading: boolean;
  whatsapp: boolean;
  reach: number | null;
}) {
  const { t } = useTranslation();
  if (!count) {
    return <p className="text-xs text-muted-foreground">{loading ? t("rewards.notifications.counting", "Counting…") : null}</p>;
  }
  return (
    <div className="space-y-1 text-xs text-muted-foreground" data-testid="audience-count" aria-live="polite">
      <p className="text-sm text-foreground">
        {t("rewards.notifications.reach", { defaultValue: "{{count}} members will get it", count: reach ?? 0 })}
      </p>
      <p>
        {t("rewards.notifications.countBreakdown", {
          defaultValue: "{{members}} match · {{apple}} on Apple Wallet · {{google}} on Google Wallet · {{noCard}} with no card · {{optedOut}} opted out of offers",
          members: fmtNumber(count.members),
          apple: fmtNumber(count.apple),
          google: fmtNumber(count.google),
          noCard: fmtNumber(count.no_card),
          optedOut: fmtNumber(count.opted_out),
        })}
      </p>
      {!whatsapp && count.no_card > 0 ? (
        <p>{t("rewards.notifications.noCardSkipped", "Members with no card are left out unless you switch WhatsApp on.")}</p>
      ) : null}
    </div>
  );
}
