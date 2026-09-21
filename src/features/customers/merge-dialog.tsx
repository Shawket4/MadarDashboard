/**
 * Merge a duplicate into the customer that stays. The duplicate disappears;
 * its orders move over, and the kept one takes any phone, notes or loyalty
 * link it lacked.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useListCustomers, useMergeCustomer } from "@/data/api/generated/api";
import type { Customer, CustomerDetail } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { cn } from "@/lib/utils";

import { isCustomersQuery, useDebouncedValue } from "./util";

export function MergeDialog({
  duplicate,
  open,
  onOpenChange,
  onMerged,
}: {
  duplicate: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: (kept: CustomerDetail) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const merge = useMergeCustomer();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [into, setInto] = useState<Customer | null>(null);
  const q = useDebouncedValue(search.trim());

  useEffect(() => {
    if (open) {
      setInto(null);
      setSearch("");
    }
  }, [open, duplicate.id]);

  const list = useListCustomers({ q: q || undefined, limit: 20 }, { query: { enabled: open } });
  const options = (list.data ?? []).filter((c) => c.id !== duplicate.id);

  const submit = async () => {
    if (!into) return;
    try {
      const kept = await merge.mutateAsync({ id: duplicate.id, data: { into: into.id } });
      toast.success(t("customers.merged", "Customers merged"));
      await qc.invalidateQueries({ predicate: isCustomersQuery });
      onMerged(kept);
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customers.mergeTitle", "Merge into another customer")}</DialogTitle>
          <DialogDescription>
            {t("customers.mergeBody", {
              defaultValue:
                "{{name}} is removed as a duplicate. Their orders move to the customer you keep, which also takes any phone, notes or loyalty link it lacks.",
              name: duplicate.name,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>{t("customers.mergeKeep", "Customer to keep")}</Label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                className={cn("h-9 w-full justify-between font-normal", !into && "text-muted-foreground")}
              >
                <span className="truncate">{into ? into.name : t("customers.mergePick", "Search by name or phone…")}</span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder={t("customers.searchPlaceholder", "Search by name or phone")}
                />
                <CommandList>
                  <CommandEmpty>
                    {list.isLoading ? t("common.loading", "Loading…") : t("common.noResults", "No results found")}
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={() => {
                          setInto(c);
                          setPickerOpen(false);
                        }}
                      >
                        <Check className={cn("size-4", into?.id === c.id ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{c.name}</span>
                        {c.phone ? (
                          <span dir="ltr" className="ms-auto font-mono text-xs text-muted-foreground">
                            {c.phone}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {into ? (
          <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
            {t("customers.mergeConfirm", {
              defaultValue: "{{from}}'s orders will move to {{into}}, and {{from}} will be removed. This can't be undone.",
              from: duplicate.name,
              into: into.name,
            })}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" disabled={!into} loading={merge.isPending} onClick={() => void submit()}>
            {t("customers.merge", "Merge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
