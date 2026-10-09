import { useTranslation } from "react-i18next";

import { formatSpan } from "./time";
import { fmtFigure } from "./number";
import { NumberField, type NumberFieldProps } from "./number-field";
import { useLang } from "./use-lang";

export interface DurationFieldProps
  extends Omit<NumberFieldProps, "suffix" | "prefix" | "unitWord" | "presetLabel" | "decimals" | "minDecimals"> {
  /** What the number counts. Minutes read back as hours past 60 ("= 1 h 30 min"). */
  unit: "min" | "h";
}

/**
 * A length of time in minutes or hours: grace, a break, a lateness tier, a
 * labour limit. A {@link NumberField} with its unit, −/+ steps (5 minutes, or
 * half an hour), presets read as durations, and minutes past an hour read back
 * as hours so "90" is visibly "1 h 30 min".
 */
export function DurationField({ unit, step, stepper = true, hint, value, ...rest }: DurationFieldProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const unitWord = unit === "min" ? t("inputs.unitMin", "min") : t("inputs.unitHour", "h");
  const asHours =
    unit === "min" && value !== null && value !== undefined && value >= 60 ? `= ${formatSpan(value, lang)}` : null;
  return (
    <NumberField
      {...rest}
      value={value}
      step={step ?? (unit === "min" ? 5 : 0.5)}
      decimals={unit === "h" ? 2 : 0}
      stepper={stepper}
      align="center"
      suffix={unitWord}
      unitWord={unitWord}
      presetLabel={(p) => (unit === "min" && p >= 60 ? formatSpan(p, lang) : `${fmtFigure(p)} ${unitWord}`)}
      hint={hint ?? asHours}
    />
  );
}
