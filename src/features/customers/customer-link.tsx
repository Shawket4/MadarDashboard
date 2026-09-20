/**
 * A customer's name, wherever staff meet it — an order, a bill, a booking, a
 * delivery. It opens the customer when there is one to open (`customer_id`) and
 * the viewer holds `customers.view`; otherwise it is the plain text it always
 * was. The name shown stays the SNAPSHOT the row carries: what was typed is
 * what the driver called, whatever the customer is named today.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

export interface CustomerLinkControl {
  /** The viewer may open a customer at all (`customers.view`). */
  canOpen: boolean;
  open: (customerId: string) => void;
}

export function CustomerLink({
  name,
  customerId,
  control,
  className,
}: {
  name: string;
  customerId?: string | null;
  control: CustomerLinkControl;
  className?: string;
}) {
  if (!customerId || !control.canOpen) {
    return (
      <span dir="auto" className={className}>
        {name}
      </span>
    );
  }
  return (
    <Button
      variant="link"
      size="sm"
      className={cn("h-auto min-w-0 max-w-full p-0 text-start", className)}
      onClick={(e) => {
        // Rows are often clickable themselves; the name opens the person, not the row.
        e.stopPropagation();
        control.open(customerId);
      }}
    >
      <span dir="auto" className="truncate">
        {name}
      </span>
    </Button>
  );
}

/**
 * "Ordered by X for Y": a one-time order to someone else's number. The order
 * belongs to the customer; the name and phone on it are who the driver calls.
 */
export function ContactOverrideNote({
  customerName,
  snapshotName,
  snapshotPhone,
  className,
}: {
  /** The customer the order belongs to, when it is known by name. */
  customerName?: ReactNode;
  snapshotName: string;
  snapshotPhone?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const contact = (
    <>
      <span dir="auto">{snapshotName}</span>
      {snapshotPhone ? (
        <>
          {" · "}
          <bdi dir="ltr" className="font-mono">
            {formatPhoneDisplay(snapshotPhone)}
          </bdi>
        </>
      ) : null}
    </>
  );
  return (
    <p role="note" className={cn("rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground", className)}>
      {customerName ? (
        <>
          {t("customers.orderedBy", "Ordered by")} <span className="font-medium text-foreground">{customerName}</span>{" "}
          {t("customers.orderedFor", "for")} <span className="font-medium text-foreground">{contact}</span>
        </>
      ) : (
        <>
          {t("customers.orderedForSomeoneElse", "Ordered for someone else:")}{" "}
          <span className="font-medium text-foreground">{contact}</span>
        </>
      )}
    </p>
  );
}
