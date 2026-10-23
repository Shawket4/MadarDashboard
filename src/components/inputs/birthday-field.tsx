/**
 * A birthday in ONE field. Tapping it opens a sheet of wheels (day, month and,
 * where the form asks, year) that a thumb flicks and snaps, the way a phone's
 * own date picker works, instead of three selects or a calendar built for
 * picking a date near today.
 *
 * Each wheel is a scroll-snap list, so the platform does the flinging: native
 * momentum on iOS Safari and Android Chrome, no gesture code here. It is also a
 * real `listbox` of `option`s: a screen reader walks the values and activates
 * one; a keyboard moves with the arrows, Page Up/Down, Home/End, or by typing
 * ("ma" for March, "17" for the 17th). Only a scroll the person started picks a
 * value; a scroll a screen reader causes is put back. The sheet keeps a draft
 * and commits on Done, so a wheel flicked by accident changes nothing.
 *
 * The year is optional by design (see `birthday.ts`): `year="none"` leaves it
 * out, `"optional"` starts it on "No year", `"required"` asks for a full date.
 * Nothing in the future can be picked.
 */
import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Cake, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { DEFAULT_LOCALE_AR, DEFAULT_LOCALE_EN } from "@/data/config/constants";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  EMPTY_BIRTHDAY,
  birthdayBounds,
  birthdayComplete,
  clampBirthday,
  formatBirthday,
  limits,
  monthNames,
  partOrder,
  startingBirthday,
  typeaheadIndex,
  type Birthday,
  type BirthdayBounds,
  type YearMode,
} from "./birthday";
import { useLang } from "./use-lang";

/** One row of a wheel: a 44px target, the touch minimum. */
const ROW = 44;
/** Rows in view; the middle one is the pick. */
const ROWS = 5;
const PAD = ((ROWS - 1) / 2) * ROW;
/** The year wheel's "skip it" entry. */
const NO_YEAR = 0;

export interface BirthdayFieldProps {
  value: Birthday;
  onChange: (value: Birthday) => void;
  /** The sheet's heading; usually the field's own label. */
  title: string;
  /** `none` (default): month and day only. `optional`: a year that may be skipped. `required`. */
  year?: YearMode;
  minYear?: number;
  maxYear?: number;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  /** The visible label's id; the field reads as the label and then its value. */
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Today, for the bounds; tests pin it. */
  today?: Date;
}

export function BirthdayField({
  value, onChange, title, year = "none", minYear, maxYear, id, placeholder, invalid, disabled, className,
  "aria-labelledby": labelledBy, "aria-describedby": describedBy, today,
}: BirthdayFieldProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const locale = lang === "ar" ? DEFAULT_LOCALE_AR : DEFAULT_LOCALE_EN;
  const reactId = useId();
  const fieldId = id ?? `birthday-${reactId}`;
  const valueId = `${fieldId}-value`;
  const [open, setOpen] = useState(false);
  const has = birthdayComplete(value);
  const bounds = useMemo(() => birthdayBounds(today, minYear, maxYear), [today, minYear, maxYear]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex h-9 w-full min-w-0 items-center rounded-md border bg-transparent shadow-xs transition-[color,box-shadow,border-color] dark:bg-input/30",
          "has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50",
          invalid ? "border-destructive" : "border-input",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          // Read as the question, then the answer: "Your birthday, 17 March".
          aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
          aria-describedby={describedBy}
          onClick={() => setOpen(true)}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[inherit] ps-3 pe-2 text-start outline-none disabled:cursor-not-allowed"
        >
          <Cake aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
          {labelledBy ? null : <span className="sr-only">{title}: </span>}
          <span id={valueId} className={cn("min-w-0 flex-1 truncate", !has && "text-muted-foreground")}>
            {has ? formatBirthday(value, locale) : (placeholder ?? t("inputs.birthday.add", "Add your birthday"))}
          </span>
          {has ? null : <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
        </button>
        {has && !disabled ? (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_BIRTHDAY })}
            aria-label={t("inputs.birthday.clear", "Remove the birthday")}
            className="me-1 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>
      <DrawerContent className="mx-auto w-full max-w-[480px] rounded-t-[28px] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {open ? (
          <BirthdaySheet
            value={value}
            mode={year}
            bounds={bounds}
            locale={locale}
            title={title}
            idBase={fieldId}
            onDone={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

/** The sheet's body: a draft, the wheels, and Done. Mounted per opening, so it starts from the field's value. */
function BirthdaySheet({
  value, mode, bounds, locale, title, idBase, onDone,
}: {
  value: Birthday;
  mode: YearMode;
  bounds: BirthdayBounds;
  locale: string;
  title: string;
  idBase: string;
  onDone: (b: Birthday) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => startingBirthday(value, mode, bounds));
  const set = (part: "day" | "month" | "year", v: number) =>
    setDraft((d) => clampBirthday({ ...d, [part]: part === "year" && v === NO_YEAR ? null : v }, bounds));
  const done = () => onDone(mode === "none" ? { ...draft, year: null } : draft);

  const names = useMemo(() => monthNames(locale), [locale]);
  const { maxMonth, maxDay } = limits(draft.year, draft.month, bounds.today);
  const wheels = {
    day: {
      label: t("inputs.birthday.day", "Day"),
      items: Array.from({ length: maxDay }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
      value: draft.day,
      width: "minmax(0,0.85fr)",
    },
    month: {
      label: t("inputs.birthday.month", "Month"),
      items: names.slice(0, maxMonth).map((label, i) => ({ value: i + 1, label })),
      value: draft.month,
      width: "minmax(0,1.6fr)",
    },
    year: {
      label: t("inputs.birthday.year", "Year"),
      items: [
        ...(mode === "optional" ? [{ value: NO_YEAR, label: t("inputs.birthday.noYear", "No year") }] : []),
        ...Array.from({ length: bounds.maxYear - bounds.minYear + 1 }, (_, i) => {
          const y = bounds.maxYear - i;
          return { value: y, label: String(y) };
        }),
      ],
      value: draft.year ?? NO_YEAR,
      width: "minmax(0,1.15fr)",
    },
  };
  const parts = partOrder(locale).filter((p) => p !== "year" || mode !== "none");

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-4">
        <DrawerTitle className="text-sm font-medium text-muted-foreground">{title}</DrawerTitle>
        {/* What Done will save, in words: a wheel shows a value even before
            anyone has touched it, so the sheet says plainly which one. */}
        <p className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.01em]">{formatBirthday(draft, locale)}</p>
        <DrawerDescription className="sr-only">
          {t("inputs.birthday.how", "Scroll a column, tap a value, or use the arrow keys, then choose Done.")}
        </DrawerDescription>
      </div>

      {/* The wheels own vertical drags; the sheet must not take them for a swipe down. */}
      <div data-vaul-no-drag className="relative mx-4 mt-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: parts.map((p) => wheels[p].width).join(" ") }}>
          {parts.map((p) => (
            <span key={p} aria-hidden className="pb-1.5 text-center text-xs font-medium text-muted-foreground">
              {wheels[p].label}
            </span>
          ))}
        </div>
        <div className="relative">
          {/* The pick's band, behind the middle row of every wheel. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 rounded-xl bg-primary/10 ring-1 ring-primary/15" style={{ top: PAD, height: ROW }} />
          <div className="relative grid gap-1" style={{ gridTemplateColumns: parts.map((p) => wheels[p].width).join(" ") }}>
            {parts.map((p) => (
              <Wheel
                key={p}
                id={`${idBase}-${p}`}
                label={wheels[p].label}
                items={wheels[p].items}
                value={wheels[p].value}
                onChange={(v) => set(p, v)}
                onEnter={done}
              />
            ))}
          </div>
          {/* The rows fade toward the edges, so the middle one reads as the pick. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-background to-background/0" style={{ height: PAD }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background to-background/0" style={{ height: PAD }} />
        </div>
      </div>

      {mode === "optional" ? (
        <p className="mx-6 mt-3 text-center text-[13px] leading-snug text-muted-foreground">
          {t("inputs.birthday.yearOptional", "The year is optional. Leave it on “No year” to skip it.")}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-[1fr_1.6fr] gap-3 px-6">
        <DrawerClose asChild>
          <Button variant="outline" className="h-12 rounded-xl text-base">
            {t("common.cancel", "Cancel")}
          </Button>
        </DrawerClose>
        <Button className="h-12 rounded-xl text-base" onClick={done}>
          {t("common.done", "Done")}
        </Button>
      </div>
    </div>
  );
}

interface WheelItem {
  value: number;
  label: string;
}

/**
 * One column: a scroll-snap `listbox`. The value moves the scroll when it
 * changes from outside (opening, a clamp from another wheel); a scroll the
 * person makes moves the value when it settles.
 */
function Wheel({
  id, label, items, value, onChange, onEnter,
}: {
  id: string;
  label: string;
  items: WheelItem[];
  value: number;
  onChange: (value: number) => void;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  // The row under the band while a scroll is under way; the value's row otherwise.
  const [rows, setRows] = useState({ index, centered: index });
  if (rows.index !== index) setRows({ index, centered: index });
  const centered = rows.centered;
  const center = (at: number) => setRows((r) => (r.centered === at ? r : { ...r, centered: at }));
  /** A touch, a pointer or a mouse wheel started the scroll in progress. */
  const byPerson = useRef(false);
  /** The value this wheel just set: its scroll is already where it belongs. */
  const own = useRef<number | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typed = useRef({ text: "", at: 0 });

  // The value moved from outside (opening, another wheel's clamp): the scroll follows, at once.
  useLayoutEffect(() => {
    const mine = own.current === value;
    own.current = null;
    if (mine) return;
    const el = ref.current;
    if (el && el.scrollTop !== index * ROW) el.scrollTop = index * ROW;
  }, [value, index, items.length]);

  useLayoutEffect(() => () => clearTimeout(settle.current), []);

  const clampIndex = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const commit = (i: number) => {
    const next = items[clampIndex(i)].value;
    if (next === value) return;
    own.current = next;
    onChange(next);
  };
  const go = (i: number, smooth = false) => {
    const at = clampIndex(i);
    const el = ref.current;
    if (el) {
      if (smooth && el.scrollTo && !prefersReducedMotion()) el.scrollTo({ top: at * ROW, behavior: "smooth" });
      else el.scrollTop = at * ROW;
    }
    center(at);
    commit(at);
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const at = clampIndex(Math.round(el.scrollTop / ROW));
    center(at);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (byPerson.current) {
        byPerson.current = false;
        commit(at);
      } else if (at !== index) {
        // A screen reader scrolled an option into view: reading is not choosing.
        el.scrollTop = index * ROW;
        center(index);
      }
    }, 120);
  };

  const STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let to: number | null = null;
    if (e.key in STEPS) to = index + STEPS[e.key];
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = items.length - 1;
    else if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
      return;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const text = (now - typed.current.at < 800 ? typed.current.text : "") + e.key;
      typed.current = { text, at: now };
      const hit = typeaheadIndex(items.map((i) => i.label), text);
      if (hit >= 0) to = hit;
    }
    if (to === null) return;
    e.preventDefault();
    go(to);
  };

  const person = () => {
    byPerson.current = true;
  };

  return (
    <div
      ref={ref}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${id}-${items[index]?.value}`}
      onScroll={onScroll}
      onPointerDown={person}
      onTouchStart={person}
      onWheel={person}
      onKeyDown={onKeyDown}
      className="snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      style={{ height: ROWS * ROW, paddingBlock: PAD }}
    >
      {items.map((item, i) => (
        <div
          key={item.value}
          id={`${id}-${item.value}`}
          role="option"
          aria-selected={i === index}
          onClick={() => go(i, true)}
          className={cn(
            "flex snap-center items-center justify-center truncate px-1 text-lg tabular-nums transition-colors select-none",
            i === centered ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
          style={{ height: ROW }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
