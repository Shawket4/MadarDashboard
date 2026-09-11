/**
 * A month and a day. No year, and no native date input.
 *
 * The browser's `type="date"` opens the platform's own calendar, which is built
 * for picking a date near today — a customer entering a birthday scrolls back
 * through decades of months to reach one. It also cannot express "no year",
 * and the year is the part worth not collecting: a full date of birth is an
 * identity credential, and an annual greeting needs to know WHEN, not how old.
 *
 * Two selects instead. The day list follows the month, so 31 February is not
 * offerable rather than merely rejected — February keeps 29 so someone born on
 * a leap day can say so, and the server greets them on the 28th in a common
 * year.
 */
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Birthday {
  month: number | null;
  day: number | null;
}

/** Longest each month can be. February is 29 — see the note above. */
const LENGTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** A sentinel, because "" is not a selectable value. */
const NONE = "__none__";

export function BirthdayPicker({
  value,
  onChange,
  label,
  hint,
}: {
  value: Birthday;
  onChange: (b: Birthday) => void;
  label: string;
  hint?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const hintId = useId();

  // The reader's own month names, from the platform rather than a table we
  // would have to translate and keep in step.
  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      // 2001 is not a leap year, so no month rolls over.
      label: fmt.format(new Date(2001, i, 1)),
    }));
  }, [locale]);

  const days = value.month ? LENGTH[value.month - 1] : 31;

  const setMonth = (m: number | null) => {
    // Changing month must not leave a day that month does not have. Clearing it
    // asks the question again rather than moving their birthday for them.
    const day = value.day && m && value.day > LENGTH[m - 1] ? null : value.day;
    onChange({ month: m, day });
  };

  return (
    // A fieldset, because the two selects are one question. Each trigger still
    // carries its own name ("Month", "Day") so a screen reader announces both
    // the question and which half it is on.
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">
        {label}
        <span className="ms-1.5 font-normal text-muted-foreground">
          {t("loyalty.optional", "(optional)")}
        </span>
      </legend>
      <div className="grid grid-cols-[1.6fr_1fr] gap-2">
        <Select
          value={value.month ? String(value.month) : NONE}
          onValueChange={(v) => setMonth(v === NONE ? null : Number(v))}
        >
          <SelectTrigger
            aria-label={t("loyalty.month", "Month")}
            aria-describedby={hint ? hintId : undefined}
            className="h-12 w-full rounded-xl px-4 text-base"
          >
            <SelectValue placeholder={t("loyalty.month", "Month")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("loyalty.month", "Month")}</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={String(m.value)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.day ? String(value.day) : NONE}
          onValueChange={(v) =>
            onChange({ ...value, day: v === NONE ? null : Number(v) })
          }
        >
          <SelectTrigger
            aria-label={t("loyalty.day", "Day")}
            aria-describedby={hint ? hintId : undefined}
            className="h-12 w-full rounded-xl px-4 text-base tabular-nums"
          >
            <SelectValue placeholder={t("loyalty.day", "Day")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("loyalty.day", "Day")}</SelectItem>
            {Array.from({ length: days }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)} className="tabular-nums">
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hint ? (
        <p id={hintId} className="text-[13px] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Both or neither — half a birthday is not one. */
export const isComplete = (b: Birthday): b is { month: number; day: number } =>
  b.month !== null && b.day !== null;
