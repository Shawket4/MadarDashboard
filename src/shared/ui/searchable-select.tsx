import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

export interface SearchableSelectOption<T = unknown> {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  data?: T;
}

export interface SearchableSelectProps<T = unknown> {
  options: SearchableSelectOption<T>[];
  value: string | null;
  onChange: (value: string | null, option: SearchableSelectOption<T> | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  /** Popover width; defaults to "var(--radix-popover-trigger-width)" */
  popoverWidth?: string;
}

export function SearchableSelect<T = unknown>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  allowClear = false,
  disabled,
  className,
  popoverWidth,
}: SearchableSelectProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate text-start">
            {selected ? selected.label : (placeholder ?? t("common.searchPlaceholder"))}
          </span>
          <ChevronsUpDown className="ms-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: popoverWidth ?? "var(--radix-popover-trigger-width)", minWidth: 240 }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? t("common.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{emptyMessage ?? t("common.noResults")}</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="max-h-64">
                {allowClear && (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(null, null);
                      setOpen(false);
                    }}
                    className="text-muted-foreground"
                  >
                    <Check className={cn("me-2", !value ? "opacity-100" : "opacity-0")} />
                    {t("common.none")}
                  </CommandItem>
                )}
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    disabled={opt.disabled}
                    onSelect={() => {
                      onChange(opt.value, opt);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("me-2", opt.value === value ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{opt.label}</span>
                    {opt.hint && <span className="ms-auto text-xs text-muted-foreground">{opt.hint}</span>}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
