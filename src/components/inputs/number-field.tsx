import * as React from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { decimalsOf, fmtFigure, parseNumber, roundTo } from "./number";
import { errorTextClass, innerInputClass, shellClass } from "./shell";

export interface NumberFieldProps {
  /** `null` = empty (only when `allowEmpty`). */
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  /** The −/+ and arrow-key step. */
  step?: number;
  /** Most decimals kept; defaults to the step's. */
  decimals?: number;
  /** Decimals always shown (2 for money). */
  minDecimals?: number;
  /** Unit after the number: `min`, `×`, `%`, `EGP`. */
  suffix?: React.ReactNode;
  /** Text before the number, e.g. `×`. */
  prefix?: React.ReactNode;
  /** Show −/+ buttons. */
  stepper?: boolean;
  /** One-tap values shown as chips under the field. */
  presets?: number[];
  presetLabel?: (n: number) => string;
  /** Empty is a real answer here (e.g. "use the branch's rules"). */
  allowEmpty?: boolean;
  /** What empty means, shown as the placeholder. */
  emptyLabel?: string;
  /** A quiet line under the field when nothing is wrong. */
  hint?: React.ReactNode;
  /** How the range is worded in the refusal (defaults to plain figures). */
  unitWord?: string;
  id?: string;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  /** Marked invalid by a form: its message then speaks, not the field's own. */
  invalid?: boolean;
  align?: "start" | "center";
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * The kit's number: typed in Latin or Arabic digits, stepped with −/+ or the
 * arrow keys, or set with a preset chip. A number outside the range, or one it
 * can't read, is refused out loud and the last good value stays — the field
 * never quietly clamps or saves something else.
 */
export function NumberField({
  value, onChange, onBlur, min = 0, max, step = 1, decimals, minDecimals = 0, suffix, prefix, stepper,
  presets, presetLabel, allowEmpty, emptyLabel, hint, unitWord, id, name, ref, disabled, invalid,
  align = "start", className, "aria-label": ariaLabel, "aria-describedby": describedBy,
}: NumberFieldProps) {
  const { t } = useTranslation();
  const reactId = React.useId();
  const inputId = id ?? `num-${reactId}`;
  const errId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  const places = decimals ?? decimalsOf(step);

  const [draft, setDraft] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  // What this field last handed the form. A different value arriving from
  // outside (a reset, a preset) replaces whatever refused text is on show.
  const emitted = React.useRef<number | null | undefined>(value);
  React.useEffect(() => {
    if (!Object.is(value, emitted.current)) {
      emitted.current = value;
      setDraft(null);
      setProblem(null);
    }
  }, [value]);

  const has = value !== null && value !== undefined && Number.isFinite(value);
  const u = unitWord ? ` ${unitWord}` : "";

  const rangeText = () =>
    max !== undefined
      ? t("inputs.between", { min: fmtFigure(min), max: fmtFigure(max), unit: u, defaultValue: `Between ${fmtFigure(min)} and ${fmtFigure(max)}${u}` })
      : t("inputs.atLeast", { min: fmtFigure(min), unit: u, defaultValue: `${fmtFigure(min)}${u} or more` });

  const emit = (n: number | null) => {
    emitted.current = n;
    if (!Object.is(n, value)) onChange(n);
  };

  const accept = (n: number | null) => {
    setDraft(null);
    setProblem(null);
    emit(n);
  };

  /**
   * A refusal never leaves the form holding the last good number (a Save right
   * after typing 30 where 12 is the most must not send 1). The typed text stays
   * on show, the field says what's wrong, and the form gets something its own
   * checks refuse: the number as typed when it is out of range (so a form's
   * range message still applies), or NaN when there is no number at all.
   */
  const refuse = (message: string, n: number) => {
    setProblem(message);
    emit(n);
  };

  const settle = () => {
    if (draft === null) return;
    const text = draft.trim();
    if (!text) {
      if (allowEmpty) accept(null);
      else refuse(t("inputs.required", "Needs a value"), NaN);
      return;
    }
    const n = parseNumber(text);
    if (n === null) { refuse(t("inputs.notANumber", { text, defaultValue: `"${text}" isn't a number` }), NaN); return; }
    if (n < min || (max !== undefined && n > max)) { refuse(rangeText(), roundTo(n, places)); return; }
    accept(roundTo(n, places));
  };

  const bump = (dir: 1 | -1) => {
    const base = has ? (value as number) : min;
    let next = roundTo(base + dir * step, places);
    if (next < min) next = min;
    if (max !== undefined && next > max) next = max;
    accept(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") { e.preventDefault(); bump(1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); bump(-1); }
    else if (e.key === "Enter" && draft !== null) { settle(); }
  };

  const shownValue = draft ?? (has ? fmtFigure(value as number, Math.min(minDecimals, places), places) : "");
  const stepBtn = "grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className={shellClass({ invalid: invalid || !!problem, disabled })}>
        {stepper ? (
          <button type="button" tabIndex={-1} disabled={disabled || (has && (value as number) <= min)}
            aria-label={t("inputs.less", "Less")} onClick={() => bump(-1)} className={cn(stepBtn, "-ms-1")}>
            <Minus className="size-3.5" />
          </button>
        ) : null}
        {prefix ? <span aria-hidden className="shrink-0 text-sm text-muted-foreground">{prefix}</span> : null}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="text"
          dir="ltr"
          inputMode={places > 0 ? "decimal" : "numeric"}
          role="spinbutton"
          autoComplete="off"
          aria-label={ariaLabel}
          aria-valuenow={has ? (value as number) : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={invalid || !!problem || undefined}
          aria-describedby={[describedBy, problem ? errId : hint ? hintId : null].filter(Boolean).join(" ") || undefined}
          disabled={disabled}
          placeholder={emptyLabel}
          value={shownValue}
          className={cn(innerInputClass, "tabular-nums", align === "center" ? "text-center" : "text-start rtl:text-end")}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => { setDraft(e.target.value); setProblem(null); }}
          onKeyDown={onKeyDown}
          onBlur={() => { settle(); onBlur?.(); }}
        />
        {suffix ? <span aria-hidden className="shrink-0 text-xs text-muted-foreground">{suffix}</span> : null}
        {stepper ? (
          <button type="button" tabIndex={-1} disabled={disabled || (has && max !== undefined && (value as number) >= max)}
            aria-label={t("inputs.more", "More")} onClick={() => bump(1)} className={cn(stepBtn, "-me-1")}>
            <Plus className="size-3.5" />
          </button>
        ) : null}
      </div>
      {presets?.length ? (
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              aria-pressed={value === p}
              onClick={() => accept(p)}
              className={cn(
                "h-6 rounded-full border px-2 text-xs tabular-nums transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
                value === p ? "border-primary bg-primary/8 font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {presetLabel ? presetLabel(p) : fmtFigure(p)}
            </button>
          ))}
        </div>
      ) : null}
      {problem && !invalid ? (
        <p id={errId} role="alert" className={errorTextClass}>{problem}</p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
