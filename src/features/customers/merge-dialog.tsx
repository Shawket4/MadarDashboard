/**
 * Merge a duplicate into the customer that stays. The duplicate disappears;
 * its orders move over, and the kept one takes any phone or notes it lacked.
 *
 * A loyalty card decides the direction. A member's id is printed in their
 * wallet pass, so when only one of the two is a member that record stays —
 * the dialog turns the merge round and says why, and does the same if the
 * server refuses with `CUSTOMER_MERGE_MEMBER_SURVIVES` (the list it picked
 * from can be stale). When both are members it says, before anything is
 * confirmed, what happens to the points and to the other card.
 */
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Star } from "lucide-react";

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

import { useDebounced } from "@/lib/use-debounced";

import { isMemberMustSurvive, isPersonQuery } from "./util";

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
  const pickerId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [into, setInto] = useState<Customer | null>(null);
  // The server said the member must stay, about a pick that did not look like one.
  const [refused, setRefused] = useState(false);
  const q = useDebounced(search.trim());

  useEffect(() => {
    if (open) {
      setInto(null);
      setRefused(false);
      setSearch("");
    }
  }, [open, duplicate.id]);

  // Who goes and who stays. Turned round when only the opened customer holds a card.
  const reversed = !!into && (refused || (duplicate.is_member === true && into.is_member !== true));
  const from = reversed && into ? into : duplicate;
  const kept = reversed ? duplicate : into;
  const bothMembers = duplicate.is_member === true && into?.is_member === true;

  const list = useListCustomers({ q: q || undefined, limit: 20 }, { query: { enabled: open } });
  const options = (list.data ?? []).filter((c) => c.id !== duplicate.id);

  const submit = async () => {
    if (!kept) return;
    try {
      const result = await merge.mutateAsync({ id: from.id, data: { into: kept.id } });
      toast.success(t("customers.merged", "Customers merged"));
      await qc.invalidateQueries({ predicate: isPersonQuery });
      onMerged(result);
      onOpenChange(false);
    } catch (e) {
      // Not an error to show and forget: an offer to merge the other way round,
      // which the person confirms with the same button.
      if (isMemberMustSurvive(e) && !reversed) {
        setRefused(true);
        return;
      }
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
                "{{name}} is removed as a duplicate. Their orders move to the customer you keep, which also takes any phone or notes it lacks.",
              name: duplicate.name,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor={pickerId}>{t("customers.mergeWith", "Merge with")}</Label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id={pickerId}
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
                          setRefused(false);
                          setPickerOpen(false);
                        }}
                      >
                        <Check className={cn("size-4", into?.id === c.id ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{c.name}</span>
                        {c.is_member ? <Star aria-label={t("customers.member", "Member")} className="size-3.5 text-muted-foreground" /> : null}
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

        {into && kept ? (
          <div role="status" className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
            {reversed ? (
              <p data-testid="merge-reversed">
                {t("customers.mergeMemberStays", {
                  defaultValue:
                    "{{member}} is a loyalty member: their card and points live on that record, so it is the one that stays. {{other}} will be merged into {{member}} instead.",
                  member: kept.name,
                  other: from.name,
                })}
              </p>
            ) : null}
            {bothMembers ? (
              <p data-testid="merge-both-members">
                {t("customers.mergeBothMembers", {
                  defaultValue:
                    "Both are loyalty members. {{from}}'s points are added to {{into}}'s, and {{from}}'s card stops working after 90 days.",
                  from: from.name,
                  into: kept.name,
                })}
              </p>
            ) : null}
            <p>
              {t("customers.mergeConfirm", {
                defaultValue: "{{from}}'s orders will move to {{into}}, and {{from}} will be removed. This can't be undone.",
                from: from.name,
                into: kept.name,
              })}
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" disabled={!kept} loading={merge.isPending} onClick={() => void submit()}>
            {reversed && kept
              ? t("customers.mergeReversed", { defaultValue: "Merge into {{name}}", name: kept.name })
              : t("customers.merge", "Merge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
