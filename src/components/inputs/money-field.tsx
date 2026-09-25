import { currencyLabel, egpToPiastres, piastresToEgp } from "@/lib/format";
import { NumberField, type NumberFieldProps } from "./number-field";
import { useLang } from "./use-lang";

export interface MoneyFieldProps
  extends Omit<NumberFieldProps, "value" | "onChange" | "suffix" | "decimals" | "minDecimals" | "step" | "min" | "max" | "unitWord"> {
  /** The amount in PIASTRES (the API's integer money), or `null` for empty. */
  value: number | null | undefined;
  /** Emits piastres. */
  onChange: (piastres: number | null) => void;
  /** Lowest amount in piastres (default 0: money here is never negative). */
  min?: number;
  max?: number;
  /** −/+ step in pounds. */
  stepPounds?: number;
}

/**
 * Money in Egyptian pounds. The value is piastres, like every amount the API
 * speaks; what a person types and reads is pounds, grouped (`12,500.00`), with
 * the currency after it (`EGP` / `ج.م`). Arabic digits and `٫` are read too.
 */
export function MoneyField({ value, onChange, min = 0, max, stepPounds = 50, ...rest }: MoneyFieldProps) {
  useLang(); // re-render when the language (and so the currency label) changes
  return (
    <NumberField
      {...rest}
      value={value === null || value === undefined ? null : piastresToEgp(value)}
      onChange={(egp) => onChange(egp === null ? null : egpToPiastres(egp))}
      min={piastresToEgp(min)}
      max={max === undefined ? undefined : piastresToEgp(max)}
      step={stepPounds}
      decimals={2}
      minDecimals={2}
      suffix={currencyLabel()}
      unitWord={currencyLabel()}
    />
  );
}
