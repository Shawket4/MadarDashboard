// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = any;
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";

/**
 * EGP money input for react-hook-form fields whose schema converts to
 * piastres (egpToPiastres / egpToPiastresNullable). Displays and accepts EGP.
 */
export function MoneyField({
  control,
  name,
  label,
  placeholder,
  autoFocus,
}: {
  control: AnyControl;
  name: string;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} (EGP)</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              autoFocus={autoFocus}
              placeholder={placeholder ?? "0.00"}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
