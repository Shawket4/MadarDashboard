import * as React from "react";
import { useTranslation } from "react-i18next";
import { TZDate } from "@date-fns/tz";
import { Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getActiveTz } from "@/lib/format";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  APP_HOUR_CYCLE, formatTime, minutesOf, nearestSlot, parseTime, slots, toHHMM, type HourCycle,
} from "./time";
import { errorTextClass, innerInputClass, shellClass } from "./shell";
import { useLang } from "./use-lang";

export interface TimeFieldProps {
  /** `HH:MM` (24-hour; API seconds are tolerated) or `""` for no time. */
  value: string | null | undefined;
  /**
   * Emits `HH:MM`, or `""` when cleared. Text it can't read is emitted as
   * typed (never swapped for the last good time), so the form's own time
   * check refuses it; the field shows it in the invalid state.
   */
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  /** Marked invalid from outside (a form error). */
  invalid?: boolean;
  /** Show an × that empties the field. Leave off for a required time. */
  clearable?: boolean;
  placeholder?: string;
  /** Minutes between quick picks. */
  step?: number;
  /** Clock face; the app reads 12-hour in both languages. */
  hourCycle?: HourCycle;
  /** Extra text beside a quick pick, e.g. the shift length for an end time. */
  describeOption?: (hhmm: string) => string | null;
  /** Where the list opens when there's no value (defaults to now, in the business's timezone). */
  anchorMinutes?: number;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const nowMinutes = () => {
  const d = new TZDate(Date.now(), getActiveTz());
  return d.getHours() * 60 + d.getMinutes();
};

/**
 * A time of day you can type or pick. Type it the way you'd say it (`930`,
 * `9:30p`, `21:30`, `٩:٣٠ م`) and it reads it back on the app's clock as you
 * go; or open the list of quarter hours, which scrolls to the current value or
 * to now. Something it can't read stays on show in the invalid state and
 * reaches the form as typed, so a save refuses it instead of quietly keeping
 * the last good time.
 *
 * Keyboard: ↓ opens the list and moves, ↑ moves back, PgUp/PgDn jump an hour,
 * Enter picks, Esc closes (a second Esc undoes the typing).
 */
export function TimeField({
  value, onChange, onBlur, id, name, ref, disabled, invalid, clearable, placeholder, step = 15,
  hourCycle = APP_HOUR_CYCLE, describeOption, anchorMinutes, className,
  "aria-label": ariaLabel, "aria-describedby": describedBy,
}: TimeFieldProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const reactId = React.useId();
  const inputId = id ?? `time-${reactId}`;
  const listId = `${inputId}-list`;
  const errId = `${inputId}-err`;

  const current = toHHMM(value);
  const shown = formatTime(current, { hourCycle, lang });

  const [draft, setDraft] = React.useState<string | null>(null); // null = not typing
  const [bad, setBad] = React.useState<string | null>(null); // the unreadable text, if any
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const options = React.useMemo(() => slots(step), [step]);
  const typed = draft !== null ? parseTime(draft) : null;
  // A typed time that isn't on the quarter-hour grid still gets a row of its own.
  const rows = typed && !options.includes(typed) ? [typed, ...options] : options;

  const scrollTo = React.useCallback((hhmm: string, block: ScrollLogicalPosition = "nearest") => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-value="${hhmm}"]`);
    el?.scrollIntoView?.({ block });
  }, []);

  // On open, land on the value, or near now.
  React.useEffect(() => {
    if (!open) return;
    const target = current || nearestSlot(anchorMinutes ?? nowMinutes(), step);
    setActive(current || null);
    const id = requestAnimationFrame(() => scrollTo(target, "center"));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // While typing, follow the reading in the list.
  React.useEffect(() => {
    if (!typed) return;
    setActive(typed);
    scrollTo(typed, "center");
  }, [typed, scrollTo]);

  const commit = (hhmm: string) => {
    setDraft(null);
    setBad(null);
    if (hhmm !== current) onChange(hhmm);
  };

  /** Settle what was typed: a reading, an empty field, or an honest refusal. */
  const settle = () => {
    if (draft === null) return;
    const text = draft.trim();
    if (!text) {
      if (clearable) commit("");
      else { setDraft(null); setBad(null); }
      return;
    }
    const parsed = parseTime(text);
    if (parsed) commit(parsed);
    else {
      // Never leave the form holding the last good time: it gets the text as
      // typed, which no time check accepts, and the text stays on show.
      setBad(text);
      setDraft(text);
      if (text !== current) onChange(text);
    }
  };

  const move = (delta: number) => {
    if (!open) { setOpen(true); return; }
    const from = active ?? current ?? nearestSlot(nowMinutes(), step);
    let i = rows.indexOf(from);
    if (i < 0) i = rows.indexOf(nearestSlot(minutesOf(from) ?? 0, step));
    const next = rows[Math.min(rows.length - 1, Math.max(0, i + delta))];
    setActive(next);
    // Like any autocomplete, the field reads what the arrows land on.
    setDraft(formatTime(next, { hourCycle, lang }));
    setBad(null);
    scrollTo(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const perHour = Math.max(1, Math.round(60 / step));
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); move(-1); break;
      case "PageDown": e.preventDefault(); move(perHour); break;
      case "PageUp": e.preventDefault(); move(-perHour); break;
      case "Enter":
        if (open && active && (draft === null || typed === active)) {
          e.preventDefault();
          commit(active);
          setOpen(false);
        } else if (draft !== null) {
          e.preventDefault();
          settle();
          setOpen(false);
        }
        break;
      case "Escape":
        if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
        else if (draft !== null) { e.preventDefault(); e.stopPropagation(); setDraft(null); }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const errorText = bad
    ? t("inputs.timeUnreadable", {
        text: bad,
        defaultValue: `Couldn't read "${bad}". Type it like 9:30, 930 or 9:30 pm.`,
      })
    : null;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className={shellClass({ invalid: invalid || !!bad, disabled })}>
            <Clock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={ref}
              id={inputId}
              name={name}
              type="text"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              aria-label={ariaLabel}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && active ? `${listId}-${active}` : undefined}
              aria-invalid={invalid || !!bad || undefined}
              aria-describedby={[describedBy, bad ? errId : null].filter(Boolean).join(" ") || undefined}
              disabled={disabled}
              placeholder={placeholder ?? (hourCycle === "h12" ? t("inputs.timePlaceholder", "e.g. 9:30 am") : "09:30")}
              value={draft ?? shown}
              className={cn(innerInputClass, "tabular-nums")}
              onFocus={(e) => e.currentTarget.select()}
              onClick={() => setOpen(true)}
              onChange={(e) => { setDraft(e.target.value); setBad(null); if (!open) setOpen(true); }}
              onKeyDown={onKeyDown}
              onBlur={() => { settle(); onBlur?.(); }}
            />
            {clearable && current && !disabled ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={t("inputs.clearTime", "Clear the time")}
                className="-me-1 grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setDraft(null); setBad(null); onChange(""); }}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-44 max-w-[min(18rem,calc(100vw-2rem))] p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Clicking back into the field keeps the list open.
            if ((e.target as HTMLElement | null)?.closest?.(`#${CSS.escape(inputId)}`)) e.preventDefault();
          }}
        >
          <div ref={listRef} id={listId} role="listbox" aria-label={ariaLabel ?? t("inputs.times", "Times")} className="max-h-64 overflow-y-auto overscroll-contain">
            {rows.map((hhmm) => {
              const selected = hhmm === current;
              const isActive = hhmm === active;
              const extra = describeOption?.(hhmm);
              return (
                <div
                  key={hhmm}
                  id={`${listId}-${hhmm}`}
                  role="option"
                  aria-selected={selected}
                  data-value={hhmm}
                  data-active={isActive || undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { commit(hhmm); setOpen(false); }}
                  onMouseMove={() => active !== hhmm && setActive(hhmm)}
                  className={cn(
                    "flex h-9 cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 text-sm tabular-nums",
                    isActive && "bg-accent text-accent-foreground",
                    selected && "font-semibold",
                  )}
                >
                  <span className="whitespace-nowrap">{formatTime(hhmm, { hourCycle, lang })}</span>
                  {extra ? <span className="truncate text-xs text-muted-foreground">{extra}</span> : null}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {errorText ? (
        <p id={errId} role="alert" className={cn("mt-1", errorTextClass)}>{errorText}</p>
      ) : null}
    </div>
  );
}
