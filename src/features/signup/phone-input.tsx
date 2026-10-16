/**
 * An Egyptian mobile number with its country code fixed: the field holds only
 * the ten digits after +20 (`100 123 4567`), and takes the number however it
 * is typed or pasted (`010…`, `+20 10…`, `0020…`, Arabic digits). Left-to-right
 * inside the Arabic page; a wrong prefix is called out as it is typed, a short
 * number once the field is left.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { groupNational, nationalDigits, nationalIssue, NATIONAL_LENGTH } from "./util";

export interface PhoneInputProps {
  /** The ten digits after +20 (or fewer, while typing). */
  value: string;
  onChange: (digits: string) => void;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** A refusal from the server about this number (shown under the field). */
  invalid?: boolean;
  "aria-describedby"?: string;
}

export function PhoneInput({ value, onChange, id, disabled, autoFocus, invalid, "aria-describedby": describedBy }: PhoneInputProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const [touched, setTouched] = useState(false);
  const noteId = `${id ?? "phone"}-note`;

  const shown = groupNational(value);
  const issue = nationalIssue(value, touched);
  const complete = value.length === NATIONAL_LENGTH && !issue;
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
    short: t("signup.phoneShort", "Enter all 10 digits after +20, for example 100 123 4567."),
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
        <span
          aria-hidden
          className="flex shrink-0 select-none items-center gap-2 border-e border-input bg-muted/60 px-3.5 text-base font-medium tabular-nums text-foreground"
        >
          <svg viewBox="0 0 3 2" className="h-4 w-6 rounded-[3px] ring-1 ring-foreground/15">
            <rect width="3" height="0.667" fill="#CE1126" />
            <rect y="0.667" width="3" height="0.667" fill="#fff" />
            <rect y="1.333" width="3" height="0.667" fill="#111" />
            <circle cx="1.5" cy="1" r="0.2" fill="#C09300" />
          </svg>
          +20
        </span>
        <input
          ref={ref}
          id={id}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={t("signup.phonePlaceholder", "100 123 4567")}
          value={shown}
          aria-invalid={bad || undefined}
          aria-describedby={[describedBy, noteId].filter(Boolean).join(" ")}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-lg tabular-nums outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          onChange={(e) => {
            const el = e.target;
            const typed = el.value;
            const caret = el.selectionStart ?? typed.length;
            const next = nationalDigits(typed);
            // Digits before the caret, counted on what was typed (a paste has none to count).
            caretDigits.current = nationalDigits(typed.slice(0, caret)).length;
            onChange(next);
            if (nationalIssue(next, false) === null && next.length < NATIONAL_LENGTH) setTouched(false);
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
