import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { canonicalPhone, formatPhoneDisplay } from "@/lib/phone";
import { latinDigits } from "./time";
import { errorTextClass, innerInputClass, shellClass } from "./shell";

/** Why a typed phone fails, in words a person can act on; `null` when fine or empty. */
export function phoneProblem(raw: string): "short" | "long" | "prefix" | "bad" | null {
  const text = raw.trim();
  if (!text) return null;
  if (canonicalPhone(text)) return null;
  const digits = latinDigits(text).replace(/\D/g, "");
  const national = digits.replace(/^(00)?20/, "0");
  if (/^01/.test(national)) {
    if (!/^01[0125]/.test(national)) return "prefix";
    return national.length < 11 ? "short" : "long";
  }
  return "bad";
}

export interface PhoneFieldProps {
  /** As typed; send `canonicalPhone(value)` on the wire. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  /** A form error (it wins over the field's own wording). */
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * A phone number, Egyptian-first. Takes it however it's pasted (`010…`,
 * `+20 10…`, `0020…`, Arabic digits), always left-to-right, and reads it back
 * as `+20 100 123 4567` once it's a real number. A wrong one says what's wrong
 * (too short, not a mobile prefix) after you leave the field, not while typing.
 */
export function PhoneField({
  value, onChange, onBlur, id, name, ref, disabled, invalid, placeholder, className,
  "aria-label": ariaLabel, "aria-describedby": describedBy,
}: PhoneFieldProps) {
  const { t } = useTranslation();
  const reactId = React.useId();
  const inputId = id ?? `phone-${reactId}`;
  const noteId = `${inputId}-note`;
  const [touched, setTouched] = React.useState(false);

  const canonical = canonicalPhone(value);
  const problem = touched ? phoneProblem(value) : null;
  const words: Record<string, string> = {
    short: t("inputs.phoneShort", "Too short: an Egyptian mobile is 11 digits, like 010 1234 5678."),
    long: t("inputs.phoneLong", "Too long: an Egyptian mobile is 11 digits, like 010 1234 5678."),
    prefix: t("inputs.phonePrefix", "Egyptian mobiles start 010, 011, 012 or 015."),
    bad: t("inputs.phoneBad", "Not a phone number. Type it like 010 1234 5678."),
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      <div dir="ltr" className={shellClass({ invalid: invalid || !!problem, disabled })}>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          aria-label={ariaLabel}
          aria-invalid={invalid || !!problem || undefined}
          aria-describedby={[describedBy, problem || canonical ? noteId : null].filter(Boolean).join(" ") || undefined}
          disabled={disabled}
          placeholder={placeholder ?? "010 1234 5678"}
          value={value}
          className={cn(innerInputClass, "tabular-nums")}
          onChange={(e) => { onChange(e.target.value); if (touched && canonicalPhone(e.target.value)) setTouched(false); }}
          onBlur={() => { setTouched(true); onBlur?.(); }}
        />
        {canonical ? <Check aria-hidden className="size-4 shrink-0 text-success" /> : null}
      </div>
      {problem && !invalid ? (
        <p id={noteId} role="alert" className={errorTextClass}>{words[problem]}</p>
      ) : canonical ? (
        <p id={noteId} className="text-xs text-muted-foreground">
          <bdi dir="ltr" className="tabular-nums">{formatPhoneDisplay(canonical)}</bdi>
        </p>
      ) : null}
    </div>
  );
}
