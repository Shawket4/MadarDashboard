import { useTranslation } from "react-i18next";

import { useGetOrg } from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { formatRate } from "@/features/orgs/tax-rate";

/**
 * Whether a menu price already contains the tax, said next to the price.
 *
 * The organisation's `tax_inclusive` decides what a price means — the amount
 * the customer pays (tax inside) or a net amount tax is added to at checkout —
 * and the editor used to show a bare number either way. A branch may override
 * the setting; the hint says so rather than guess which branch is meant.
 */
export function PriceTaxHint({ className }: { className?: string }) {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const org = useGetOrg(orgId ?? "", { query: { enabled: !!orgId } }).data;
  if (!org || !(org.tax_rate > 0)) return null;
  const rate = formatRate(org.tax_rate);
  return (
    <span className={className ?? "block text-xs text-muted-foreground"} data-testid="price-tax-hint">
      {org.tax_inclusive
        ? t("menu.priceIncludesTax", { rate, defaultValue: "Prices include tax ({{rate}})" })
        : t("menu.priceExcludesTax", { rate, defaultValue: "Tax ({{rate}}) is added at checkout" })}
      {" · "}
      {t("menu.priceTaxBranchNote", "branches may override")}
    </span>
  );
}
