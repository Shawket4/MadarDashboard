import { useTranslation } from "react-i18next";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = any;
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";

export interface BilingualFieldProps {
  control: AnyControl;
  /** EN field path (e.g. "name"). */
  name: string;
  /** AR field path — defaults to `${name}_translations.ar`. */
  arName?: string;
  label: string;
  placeholder?: string;
  arPlaceholder?: string;
  multiline?: boolean;
}

/**
 * The EN/AR paired input used by every translatable field. The AR side is
 * always optional — the backend auto-translates blank Arabic values.
 */
export function BilingualField({
  control,
  name,
  arName,
  label,
  placeholder,
  arPlaceholder,
  multiline,
}: BilingualFieldProps) {
  const { t } = useTranslation();
  const Component = multiline ? Textarea : Input;
  const arPath = arName ?? `${name}_translations.ar`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} (EN)</FormLabel>
            <FormControl>
              <Component placeholder={placeholder} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={arPath}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label} (AR){" "}
              <span className="text-muted-foreground font-normal">· {t("common.autoTranslated")}</span>
            </FormLabel>
            <FormControl>
              <Component placeholder={arPlaceholder ?? ""} dir="rtl" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
