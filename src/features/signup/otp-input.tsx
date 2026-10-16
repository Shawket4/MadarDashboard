/**
 * Six boxes for a one-time code.
 *
 * Typing a digit moves to the next box; Backspace on an empty box clears and
 * moves to the previous one; the arrows move; a paste (or an SMS/WhatsApp
 * autofill, which arrives as the whole code in one box) spreads over the boxes.
 * `onComplete` fires when the last box is filled, so the form can go on without
 * a click. The row is always left-to-right: a code reads like a number, in
 * Arabic too.
 */
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { latinDigits } from "@/components/inputs/time";
import { useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** The last box was filled (typed, pasted or autofilled): `value` is the whole code. */
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  /** The server is checking the code: boxes locked, a spinner over them. */
  busy?: boolean;
  /** Changes when the boxes should take focus again (a refused code cleared them). */
  refocus?: number;
  autoFocus?: boolean;
  /** Names the group for assistive technology; the visible label points here too. */
  id?: string;
  "aria-describedby"?: string;
}

const onlyDigits = (raw: string) => latinDigits(raw).replace(/\D/g, "");

export function OtpInput({
  value, onChange, onComplete, length = 6, invalid, disabled, busy, refocus, autoFocus, id, "aria-describedby": describedBy,
}: OtpInputProps) {
  const { t } = useTranslation();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // A refused code shakes the whole row once: `refocus` is bumped per refusal,
  // and typing clears `invalid`, so the boxes never move under a keystroke.
  const row = useRef<HTMLDivElement>(null);
  useShake(row, invalid && (refocus || 1));
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  // What the code is right now, ahead of the next render: a digit moves focus on
  // before React has re-rendered, and that focus must see the digit.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const write = (next: string) => {
    latest.current = next;
    onChange(next);
  };

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, length - 1)]?.focus();
    // On mount only: a later change of `value` must not steal focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refocus && !busy) refs.current[0]?.focus();
  }, [refocus, busy]);

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  /**
   * Write `incoming` digits from box `at` (never past the first empty box: the
   * code has no gaps), then move on and report a full code.
   */
  const spread = (incoming: string, at: number) => {
    if (!incoming) return;
    const cur = latest.current;
    const from = Math.min(at, cur.length);
    const joined = (cur.slice(0, from) + incoming + cur.slice(from + incoming.length)).slice(0, length);
    write(joined);
    focusBox(Math.min(from + incoming.length, length - 1));
    if (joined.length === length) onComplete?.(joined);
  };

  /** Remove the digit in box `i`; the ones after it move up. */
  const removeAt = (i: number) => write(latest.current.slice(0, i) + latest.current.slice(i + 1));

  return (
    <div
      ref={row}
      id={id}
      role="group"
      aria-label={t("signup.codeLabel", "Verification code")}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      dir="ltr"
      className={cn("relative flex w-full justify-center gap-1.5 sm:gap-2", busy && "[&>input]:opacity-50")}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          // The first box takes the whole code from an SMS or WhatsApp autofill.
          autoComplete={i === 0 ? "one-time-code" : "off"}
          enterKeyHint="done"
          aria-label={t("signup.digit", { n: i + 1, total: length, defaultValue: "Digit {{n}} of {{total}}" })}
          aria-invalid={invalid || undefined}
          disabled={disabled || busy}
          value={d}
          onFocus={(e) => {
            // The code has no gaps: a box past the next empty one hands focus to it.
            if (i > latest.current.length) focusBox(latest.current.length);
            else e.currentTarget.select();
          }}
          onChange={(e) => {
            let typed = onlyDigits(e.target.value);
            // Typing over a filled box gives two characters: keep the new one.
            if (d && typed.length > 1) typed = typed.replace(d, "").slice(-1) || typed.slice(-1);
            if (!typed) {
              if (d) removeAt(i);
              return;
            }
            spread(typed, i);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              e.preventDefault();
              removeAt(i - 1);
              focusBox(i - 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focusBox(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focusBox(i + 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              focusBox(0);
            } else if (e.key === "End") {
              e.preventDefault();
              focusBox(length - 1);
            }
          }}
          onPaste={(e) => {
            const pasted = onlyDigits(e.clipboardData.getData("text"));
            if (!pasted) return;
            e.preventDefault();
            // A whole code replaces what is there; a few digits go in from this box.
            spread(pasted.slice(0, length), pasted.length >= length ? 0 : i);
          }}
          className={cn(
            "h-14 min-w-0 max-w-14 flex-1 rounded-xl border bg-card text-center text-2xl font-semibold tabular-nums shadow-xs outline-none caret-transparent",
            "transition-[border-color,box-shadow,background-color] motion-reduce:transition-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-60",
            invalid
              ? "border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/25"
              : d ? "border-foreground/40" : "border-input",
          )}
        />
      ))}
      {busy ? (
        <span role="status" className="absolute inset-0 grid place-items-center">
          <Loader2 aria-hidden className="size-6 animate-spin text-foreground" />
          <span className="sr-only">{t("signup.verifying", "Checking the code…")}</span>
        </span>
      ) : null}
    </div>
  );
}
