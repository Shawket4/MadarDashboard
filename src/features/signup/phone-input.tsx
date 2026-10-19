/**
 * A mobile number: the country (Egypt first, any other from the list) and the
 * number after its code. Egypt's is ten digits after +20 (`100 123 4567`),
 * taken however it is typed or pasted (`010…`, `+20 10…`, `0020…`, Arabic
 * digits); a number pasted with another `+code` switches the country. Left-to-
 * right inside the Arabic page; a wrong Egyptian prefix is called out as it is
 * typed, a short number once the field is left.
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { DIAL_CODES } from "./dial-codes";
import { DEFAULT_REGION, dialCode, groupNational, nationalComplete, nationalDigits, nationalIssue, regionOf } from "./util";

/** A region's flag as an emoji (two regional-indicator letters). */
const flagOf = (region: string): string =>
  String.fromCodePoint(...[...region].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** Every region, by its name in the page's language, the default first. */
function useRegions(lang: string) {
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([lang], { type: "region" });
    } catch {
      /* an engine without DisplayNames shows the codes */
    }
    const all = Object.keys(DIAL_CODES).map((r) => ({ region: r, name: names?.of(r) ?? r, code: DIAL_CODES[r] }));
    all.sort((a, b) => a.name.localeCompare(b.name, lang));
    return [...all.filter((r) => r.region === DEFAULT_REGION), ...all.filter((r) => r.region !== DEFAULT_REGION)];
  }, [lang]);
}

export interface PhoneInputProps {
  /** The digits after the country's code (or fewer, while typing). */
  value: string;
  onChange: (digits: string) => void;
  /** The country (ISO region, `EG`). */
  region: string;
  onRegionChange: (region: string) => void;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** A refusal from the server about this number (shown under the field). */
  invalid?: boolean;
  "aria-describedby"?: string;
}

export function PhoneInput({ value, onChange, region, onRegionChange, id, disabled, autoFocus, invalid, "aria-describedby": describedBy }: PhoneInputProps) {
  const { t, i18n } = useTranslation();
  const regions = useRegions(i18n.resolvedLanguage ?? "en");
  const egypt = region === DEFAULT_REGION;
  const code = dialCode(region);
  const ref = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const [touched, setTouched] = useState(false);
  const noteId = `${id ?? "phone"}-note`;

  const shown = groupNational(value);
  const issue = nationalIssue(value, touched, region);
  const complete = nationalComplete(value, region) && !issue;
  const bad = invalid || !!issue;

  // Keep the caret on the same digit when the spaces move around it.
  useLayoutEffect(() => {
    const at = caretDigits.current;
    const el = ref.current;
    if (at === null || !el || document.activeElement !== el) return;
    let seen = 0;
    let pos = 0;
    while (pos < shown.length && seen < at) {
      if (/\d/.test(shown[pos])) seen += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  });

  const words = {
    prefix: t("signup.phonePrefix", "Egyptian mobile numbers start with 10, 11, 12 or 15."),
    short: egypt
      ? t("signup.phoneShort", "Enter all 10 digits after +20, for example 100 123 4567.")
      : t("signup.phoneShortIntl", { code, defaultValue: "Enter the whole number after +{{code}}." }),
  };

  return (
    <div className="space-y-1.5">
      <div
        dir="ltr"
        className={cn(
          "flex h-12 w-full items-stretch overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow]",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          bad ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20" : "border-input",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {/* The country: a native list over the chip, so phones get their own picker. */}
        <label className="relative flex shrink-0 items-center gap-2 border-e border-input bg-muted/60 px-3.5 text-base font-medium tabular-nums text-foreground focus-within:bg-muted">
          <span aria-hidden className="flex items-center gap-2">
            {egypt ? (
              <svg viewBox="0 0 3 2" className="h-4 w-6 rounded-[3px] ring-1 ring-foreground/15">
                <rect width="3" height="0.667" fill="#CE1126" />
                <rect y="0.667" width="3" height="0.667" fill="#fff" />
                <rect y="1.333" width="3" height="0.667" fill="#111" />
                <circle cx="1.5" cy="1" r="0.2" fill="#C09300" />
              </svg>
            ) : (
              <span className="text-lg leading-none">{flagOf(region)}</span>
            )}
            +{code}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </span>
          <select
            value={region}
            disabled={disabled}
            aria-label={t("signup.country", "Country code")}
            onChange={(e) => {
              onRegionChange(e.target.value);
              ref.current?.focus();
            }}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          >
            {regions.map((r) => (
              <option key={r.region} value={r.region}>
                {r.name} (+{r.code})
              </option>
            ))}
          </select>
        </label>
        <input
          ref={ref}
          id={id}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={egypt ? t("signup.phonePlaceholder", "100 123 4567") : t("signup.phonePlaceholderIntl", "Mobile number")}
          value={shown}
          aria-invalid={bad || undefined}
          aria-describedby={[describedBy, noteId].filter(Boolean).join(" ")}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-lg tabular-nums outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          onChange={(e) => {
            const el = e.target;
            const typed = el.value;
            const caret = el.selectionStart ?? typed.length;
            // A number pasted with its +code (or 00code) brings its country along.
            const pasted = regionOf(typed, region);
            const at = pasted ?? region;
            if (pasted && pasted !== region) onRegionChange(pasted);
            const next = nationalDigits(typed, at);
            // Digits before the caret, counted on what was typed (a paste has none to count).
            caretDigits.current = nationalDigits(typed.slice(0, caret), at).length;
            onChange(next);
            if (nationalIssue(next, false, at) === null && !nationalComplete(next, at)) setTouched(false);
          }}
          onBlur={() => setTouched(true)}
        />
        {complete ? (
          <span aria-hidden className="flex shrink-0 items-center pe-3.5 text-success">
            <Check className="size-5" />
          </span>
        ) : null}
      </div>
      <div id={noteId} aria-live="polite" className="min-h-5 text-sm">
        {issue ? <p className="text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]">{words[issue]}</p> : null}
      </div>
    </div>
  );
}
