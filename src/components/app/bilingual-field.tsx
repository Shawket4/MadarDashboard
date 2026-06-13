import type { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props<T extends FieldValues> {
  control: Control<T>;
  enName: Path<T>;
  arName: Path<T>;
  label: string;
  textarea?: boolean;
}

/** Paired English + Arabic inputs for a translatable field. */
export function BilingualField<T extends FieldValues>({ control, enName, arName, label, textarea }: Props<T>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField
        control={control}
        name={enName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {textarea ? (
                <Textarea {...field} value={field.value ?? ""} />
              ) : (
                <Input {...field} value={field.value ?? ""} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={arName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} (ع)</FormLabel>
            <FormControl>
              {textarea ? (
                <Textarea dir="rtl" {...field} value={field.value ?? ""} />
              ) : (
                <Input dir="rtl" {...field} value={field.value ?? ""} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
