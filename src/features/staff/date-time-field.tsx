/**
 * A punch's day and time on the branch's clock, from the input kit: the day
 * from DateField (the app's Saturday-first calendar), the time from TimeField
 * (typed the way it is said: 930, 9:30p, ٩:٣٠ م). The value stays what the
 * attendance forms already speak — `YYYY-MM-DDTHH:MM`, "" for none — so their
 * schemas and the branch-zone conversion are unchanged.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DateField, TimeField } from "@/components/inputs";

export const splitDateTime = (v: string | null | undefined): { date: string; time: string } => {
  const [date = "", time = ""] = (v ?? "").split("T");
  return { date, time: time.slice(0, 5) };
};

/** Both halves, or "" (nothing to save yet). */
export const joinDateTime = (date: string, time: string): string => (date && time ? `${date}T${time}` : "");

export function DateTimeField({
  id, value, onChange, onBlur, invalid, "aria-describedby": describedBy,
}: {
  id?: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const { t } = useTranslation();
  // A half-typed pair (a day, no time yet) is kept here; the form hears only whole values.
  const [draft, setDraft] = useState(() => splitDateTime(value));
  const shown = joinDateTime(draft.date, draft.time) === (value ?? "") || !value ? draft : splitDateTime(value);
  const set = (next: { date: string; time: string }) => {
    setDraft(next);
    onChange(joinDateTime(next.date, next.time));
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,8.5rem)] gap-2" onBlur={onBlur}>
      <DateField id={id} value={shown.date} invalid={invalid} aria-describedby={describedBy} onChange={(date) => set({ ...shown, date })} />
      <TimeField
        id={id ? `${id}-time` : undefined}
        value={shown.time}
        invalid={invalid}
        aria-label={t("dawamOps.timeOfDay", "Time")}
        onChange={(time) => set({ ...shown, time })}
      />
    </div>
  );
}
