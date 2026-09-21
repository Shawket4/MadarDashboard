/**
 * Where a customer has had orders sent — `GET /customers/{id}/addresses`,
 * behind `customers.addresses.view`. Its own capability because an address is
 * more than a name: someone who takes orders at a table has no use for it, and
 * without the capability the section is not drawn and nothing is asked for.
 *
 * Read-only. Addresses are saved by ordering to them, never typed in here.
 */
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCustomerAddresses } from "@/data/api/generated/api";
import type { CustomerAddress } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate, fmtNumber } from "@/lib/format";

/** One line a driver could follow: place, unit, floor, street, landmark — whatever was given. */
export function formatAddress(a: CustomerAddress, t: (key: string, opts: Record<string, unknown>) => string): string {
  return [
    a.place_name,
    a.unit_number ? t("customers.addresses.unit", { defaultValue: "Unit {{n}}", n: a.unit_number }) : null,
    a.floor ? t("customers.addresses.floor", { defaultValue: "Floor {{n}}", n: a.floor }) : null,
    a.address_line,
    a.landmark,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}

export function AddressesSection({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const q = useListCustomerAddresses(customerId);

  return (
    <section className="space-y-3" aria-labelledby="customer-addresses-title">
      <h3 id="customer-addresses-title" className="text-sm font-semibold">
        {t("customers.addresses.title", "Addresses")}
      </h3>
      {q.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : q.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">{getErrorMessage(q.error)}</span>
          <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
            {t("common.retry", "Retry")}
          </Button>
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          {t("customers.addresses.empty", "No saved addresses. One is kept the first time they order for delivery.")}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {(q.data ?? []).map((a) => {
            const line = formatAddress(a, t);
            return (
              <li key={a.id} data-testid="customer-address" className="flex items-start gap-3 p-3">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span dir="auto" className="font-medium">
                      {a.label?.trim() || t(`customers.addresses.channel.${a.channel}`, { defaultValue: a.channel })}
                    </span>
                    {a.label?.trim() ? (
                      <span className="text-xs text-muted-foreground">
                        {t(`customers.addresses.channel.${a.channel}`, { defaultValue: a.channel })}
                      </span>
                    ) : null}
                  </p>
                  {line ? (
                    <p dir="auto" className="text-muted-foreground">
                      {line}
                    </p>
                  ) : null}
                  {a.delivery_notes ? (
                    <p dir="auto" className="text-xs text-muted-foreground">
                      {a.delivery_notes}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-end text-xs text-muted-foreground">
                  <p>{t("customers.addresses.used", { defaultValue: "Used {{n}}×", n: fmtNumber(a.use_count) })}</p>
                  <p>{t("customers.addresses.lastUsed", { defaultValue: "Last {{date}}", date: fmtDate(a.last_used_at) })}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
