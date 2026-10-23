/**
 * Moved: the card is `LoyaltyCard` in the loyalty-card kit
 * (`@/components/loyalty-card/loyalty-card`). This keeps the old props for code
 * written against them (Settings › Brand's preview, branches in flight); the
 * figures it was handed are worked out by the card itself now, from the balance
 * and the target, so those props are accepted and ignored.
 */
import type { ResolvedBrand } from "@/components/loyalty-card/card-brand";
import { LoyaltyCard } from "@/components/loyalty-card/loyalty-card";

export function CardFace({
  brand,
  mode,
  balance,
  target,
  memberName,
  memberPlaceholder,
  qrUrl,
  codePending,
}: {
  brand: ResolvedBrand;
  mode: string;
  balance: number;
  target: number;
  toGo?: number;
  canRedeem?: boolean;
  memberName?: string | null;
  memberPlaceholder?: string;
  qrUrl?: string | null;
  codePending?: boolean;
  rewardsReady?: number;
  progress?: number;
}) {
  const member = memberName || memberPlaceholder || qrUrl || codePending;
  return (
    <LoyaltyCard
      brand={brand}
      mode={mode}
      balance={balance}
      target={target}
      member={member ? { name: memberName, placeholder: memberPlaceholder, qrUrl, codePending } : undefined}
    />
  );
}
