import { TimeField } from "@/components/inputs";
import { cn } from "@/lib/utils";

interface Props {
  /** Selected time as `HH:MM:SS` (matching the backend `NaiveTime`), or `null` when unset. */
  value: string | null;
  /** Emits the picked time as `HH:MM:SS`, or `null` when cleared. */
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Kept for existing call sites; the list opens under the field. */
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * The older `NaiveTime` picker's props over the kit's {@link TimeField}: type
 * `930` or `9:30 pm`, or pick a quarter hour. Value stays `HH:MM:SS` or `null`.
 */
export function TimePicker({ value, onChange, placeholder, triggerClassName, disabled, id }: Props) {
  return (
    <TimeField
      id={id}
      value={value}
      clearable
      disabled={disabled}
      placeholder={placeholder}
      className={cn(triggerClassName)}
      onChange={(v) => onChange(v ? `${v}:00` : null)}
    />
  );
}
