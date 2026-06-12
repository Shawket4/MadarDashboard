import { Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

// 1-12 for display
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/** Parses a 24-hr "HH:MM" or "HH:MM:SS" string into 12-hr parts. */
export function parseTimeValue(value: string | null | undefined): {
  hour12: string;
  minute: string;
  ampm: "AM" | "PM";
} | null {
  if (!value?.trim()) return null;
  const m = value.trim().match(/^(\d{2}):(\d{2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const minute = m[2];
  const ampm: "AM" | "PM" = h < 12 ? "AM" : "PM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour12: String(h).padStart(2, "0"), minute, ampm };
}

/** Converts 12-hr parts back to a 24-hr "HH:MM:SS" string for the backend. */
function to24(hour12: string, minute: string, ampm: "AM" | "PM"): string {
  let h = parseInt(hour12, 10);
  if (ampm === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${minute}:00`;
}

export interface TimeInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({ value, onChange, disabled, className }: TimeInputProps) {
  const { t } = useTranslation();
  const parsed = parseTimeValue(value);
  const hour12 = parsed?.hour12 ?? "";
  const minute = parsed?.minute ?? "";
  const ampm = parsed?.ampm ?? "AM";

  const update = (h: string, m: string, ap: "AM" | "PM") => {
    if (!h && !m) {
      onChange("");
      return;
    }
    onChange(to24(h || "12", m || "00", ap));
  };

  const innerTrigger = cn(
    "h-8 min-w-0 border-0 bg-transparent shadow-none",
    "focus:ring-0 focus:ring-offset-0 px-1.5 flex-1",
  );

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-0.5 rounded-lg border border-input bg-background px-2",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />

      {/* Hour */}
      <Select
        value={hour12 || undefined}
        onValueChange={(h) => update(h, minute || "00", ampm)}
        disabled={disabled}
      >
        <SelectTrigger className={innerTrigger}>
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={h} className="tabular-nums">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm font-semibold text-muted-foreground tabular-nums select-none">:</span>

      {/* Minute */}
      <Select
        value={minute || undefined}
        onValueChange={(m) => update(hour12 || "12", m, ampm)}
        disabled={disabled}
      >
        <SelectTrigger className={innerTrigger}>
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m} className="tabular-nums">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM / PM toggle */}
      <div className="flex shrink-0 rounded-md overflow-hidden border border-input text-xs font-bold">
        {(["AM", "PM"] as const).map((ap) => (
          <button
            key={ap}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (hour12) update(hour12, minute || "00", ap);
            }}
            className={cn(
              "px-1.5 py-0.5 transition-colors",
              ampm === ap
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            {ap}
          </button>
        ))}
      </div>

      {/* Clear */}
      {parsed && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t("timePicker.clearTime")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
