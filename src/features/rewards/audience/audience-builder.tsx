/**
 * Builds a segment: preset chips for the common ones, and up to six filters
 * that must all hold. Used by the members table and by the message composer,
 * so "who" means the same in both. Checked in the browser with the crate's own
 * `audience_validate`; the server checks again.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Rule } from "@/data/api/generated/models";
import { cn } from "@/lib/utils";

import { useCardRules } from "../use-card-rules";
import { PRESETS, RULE_TYPES, audienceProblemText, newRule, presetLabel, ruleTypeLabel, sameRules } from "./rules";

export interface TrackName {
  position: number;
  name: string;
}

const MAX_RULES = 6;

export function AudienceBuilder({
  rules,
  onChange,
  tracks,
  disabled,
  className,
}: {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
  /** The card's tracks (track 1 first); a balance or reward filter picks one when there are several. */
  tracks: TrackName[];
  disabled?: boolean;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const month = new Date().getMonth() + 1;
  const { rules: card } = useCardRules();
  const problems = useMemo(
    () => (card ? card.audience_validate({ rules }, Math.max(1, tracks.length)) : []),
    [card, rules, tracks.length],
  );
  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2024, i, 15)));
  }, [i18n.language]);

  const set = (i: number, r: Rule) => onChange(rules.map((x, j) => (j === i ? r : x)));
  const remove = (i: number) => onChange(rules.filter((_, j) => j !== i));
  const problemAt = (i: number) => problems.find((p) => p.path === `rules[${i}]`);
  const general = problems.filter((p) => !/^rules\[\d+\]$/.test(p.path));

  const trackSelect = (i: number, r: Extract<Rule, { track: number }>) =>
    tracks.length > 1 ? (
      <Select value={String(r.track)} onValueChange={(v) => set(i, { ...r, track: Number(v) })} disabled={disabled}>
        <SelectTrigger size="sm" className="h-7 w-auto min-w-24" aria-label={t("rewards.audience.track", "Stamp track")}>
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
    ) : null;

  const numberInput = (value: number, label: string, onValue: (n: number) => void, max: number) => (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onValue(e.target.value === "" ? Number.NaN : Math.trunc(Number(e.target.value)))}
      className="h-7 w-20 font-mono"
      aria-label={label}
      disabled={disabled}
      dir="ltr"
    />
  );

  const editor = (r: Rule, i: number) => {
    switch (r.type) {
      case "balance_at_least":
      case "balance_at_most":
        return (
          <>
            {trackSelect(i, r)}
            {numberInput(r.value, t("rewards.audience.value", "Balance"), (value) => set(i, { ...r, value }), 1_000_000)}
          </>
        );
      case "reward_ready":
        return trackSelect(i, r);
      case "visited_within":
      case "not_visited_for":
      case "joined_within":
        return (
          <>
            {numberInput(r.days, t("rewards.audience.days", "Days"), (days) => set(i, { ...r, days }), 365)}
            <span className="text-xs text-muted-foreground">{t("rewards.audience.daysUnit", "days")}</span>
          </>
        );
      case "birthday_month":
        return (
          <Select value={String(r.month)} onValueChange={(v) => set(i, { ...r, month: Number(v) })} disabled={disabled}>
            <SelectTrigger size="sm" className="h-7 w-auto min-w-28" aria-label={t("rewards.audience.month", "Month")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, k) => (
                <SelectItem key={m} value={String(k + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "has_wallet":
        return (
          <Select value={r.wallet} onValueChange={(v) => set(i, { ...r, wallet: v as typeof r.wallet })} disabled={disabled}>
            <SelectTrigger size="sm" className="h-7 w-auto min-w-28" aria-label={t("rewards.audience.wallet", "Wallet")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">{t("rewards.audience.walletApple", "Apple Wallet")}</SelectItem>
              <SelectItem value="google">{t("rewards.audience.walletGoogle", "Google Wallet")}</SelectItem>
              <SelectItem value="none">{t("rewards.audience.walletNone", "Neither (no card)")}</SelectItem>
            </SelectContent>
          </Select>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("rewards.audience.segments", "Segments")}>
        <button
          type="button"
          aria-pressed={rules.length === 0}
          disabled={disabled}
          onClick={() => onChange([])}
          className={chip(rules.length === 0)}
        >
          {t("rewards.audience.everyone", "Every member")}
        </button>
        {PRESETS.map((p) => {
          const on = sameRules(rules, p.rules(month));
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(on ? [] : p.rules(month))}
              className={chip(on)}
            >
              {presetLabel(p.id, t)}
            </button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" disabled={disabled || rules.length >= MAX_RULES}>
              <Plus className="size-4" />
              {t("rewards.audience.addFilter", "Add a filter")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {RULE_TYPES.map((type) => (
              <DropdownMenuItem key={type} onSelect={() => onChange([...rules, newRule(type, month)])}>
                {ruleTypeLabel(type, t)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {rules.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("rewards.audience.filters", "Filters")}>
          {rules.map((r, i) => {
            const problem = problemAt(i);
            return (
              <li
                key={i}
                data-testid="audience-rule"
                className={cn(
                  "flex flex-wrap items-center gap-1.5 rounded-lg border bg-card py-1 ps-2.5 pe-1 text-sm",
                  problem && "border-destructive",
                )}
              >
                <span className="font-medium">{ruleTypeLabel(r.type, t)}</span>
                {editor(r, i)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  aria-label={t("rewards.audience.remove", "Remove filter")}
                >
                  <X />
                </Button>
                {problem ? (
                  <span role="alert" className="basis-full text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
                    {audienceProblemText(problem.code, t)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {general.map((p) => (
        <p key={p.code} role="alert" className="text-xs text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]">
          {audienceProblemText(p.code, t)}
        </p>
      ))}
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60",
    on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
  );
