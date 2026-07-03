import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Store } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deletePriceOverride,
  putPriceOverride,
  useListBranches,
} from "@/data/api/generated/api";
import type {
  BranchAvailabilityOut,
  SizeOut,
  SizeOverrideOut,
  StudioAggregate,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { StudioSection } from "./studio-section";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  orgId: string | null;
  onSaved: () => void;
}

const ORG_CHANNEL = "__org__";
const CHANNELS = ["in_mall", "outside", "umbrella", "pickup"] as const;

const channelLabelKey = (c: string) => `menu.studio.availability.channel_${c}`;

export function AvailabilityTab({ studio, orgId, onSaved }: Props) {
  const { t } = useTranslation();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branches = useMemo(() => (branchesQ.data ?? []).filter((b) => b.is_active), [branchesQ.data]);
  const sizes = useMemo(() => [...studio.sizes].sort((a, b) => a.sort - b.sort), [studio.sizes]);

  // Selected channel scope per branch ("__org__" = branch-level, else per-channel).
  const [channelByBranch, setChannelByBranch] = useState<Record<string, string>>({});

  const availByBranch = useMemo(() => {
    const m = new Map<string, BranchAvailabilityOut>();
    for (const b of studio.availability.branches) m.set(b.branch_id, b);
    return m;
  }, [studio.availability.branches]);

  const overrideFor = (branchId: string, channel: string, sizeId: string): SizeOverrideOut | undefined => {
    const b = availByBranch.get(branchId);
    if (!b) return undefined;
    if (channel === ORG_CHANNEL) return b.sizes.find((s) => s.size_id === sizeId);
    return b.channels.find((c) => c.channel === channel)?.sizes.find((s) => s.size_id === sizeId);
  };

  if (branchesQ.isLoading) {
    return (
      <StudioSection title={t("menu.studio.tabs.availability", "Availability")}>
        <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
      </StudioSection>
    );
  }

  return (
    <div className="space-y-6">
      <StudioSection
        title={t("menu.studio.availability.orgTitle", "Organization availability")}
        description={t("menu.studio.availability.orgDesc", "The catalog-wide default. Toggle it on the Basics tab.")}
      >
        <div className="flex items-center gap-2">
          <Badge variant={studio.availability.org_active ? "default" : "secondary"}>
            {studio.availability.org_active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {studio.availability.org_active
              ? t("menu.studio.availability.orgOn", "Offered across the organization by default.")
              : t("menu.studio.availability.orgOff", "Hidden everywhere until reactivated.")}
          </span>
        </div>
      </StudioSection>

      <StudioSection
        title={t("menu.studio.availability.branchTitle", "Per-branch overrides")}
        description={t(
          "menu.studio.availability.branchDesc",
          "Override price or hide a size at a specific branch or delivery channel. Blank price inherits the catalog.",
        )}
      >
        {sizes.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/30 py-6 text-center text-sm text-muted-foreground">
            {t("menu.studio.availability.needSize", "Add a size before setting overrides.")}
          </p>
        ) : branches.length === 0 ? (
          <EmptyState icon={Store} title={t("menu.studio.availability.noBranches", "No active branches")} />
        ) : (
          <div className="space-y-4">
            {branches.map((b) => {
              const channel = channelByBranch[b.id] ?? ORG_CHANNEL;
              return (
                <div key={b.id} className="rounded-lg border bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <span className="text-sm font-semibold">{b.name}</span>
                    <Select
                      value={channel}
                      onValueChange={(v) => setChannelByBranch((prev) => ({ ...prev, [b.id]: v }))}
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ORG_CHANNEL}>
                          {t("menu.studio.availability.branchLevel", "Whole branch")}
                        </SelectItem>
                        {CHANNELS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {t(channelLabelKey(c), c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="divide-y">
                    {sizes.map((size) => (
                      <OverrideRow
                        key={size.id}
                        size={size}
                        branchId={b.id}
                        channel={channel}
                        existing={overrideFor(b.id, channel, size.id)}
                        onSaved={onSaved}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StudioSection>
    </div>
  );
}

function OverrideRow({
  size,
  branchId,
  channel,
  existing,
  onSaved,
}: {
  size: SizeOut;
  branchId: string;
  channel: string;
  existing: SizeOverrideOut | undefined;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [price, setPrice] = useState(existing?.price != null ? String(piastresToEgp(existing.price)) : "");
  const [available, setAvailable] = useState<boolean>(existing?.is_available ?? true);
  const [busy, setBusy] = useState(false);

  const scope = channel === ORG_CHANNEL ? "branch" : "branch_channel";

  const commit = async () => {
    setBusy(true);
    try {
      const n = parseFloat(price);
      await putPriceOverride({
        scope,
        branch_id: branchId,
        channel: channel === ORG_CHANNEL ? null : channel,
        target_type: "menu_item_size",
        target_id: size.id,
        price: price !== "" && Number.isFinite(n) ? egpToPiastres(n) : null,
        // Only send `false` (explicitly hidden); `true` (available) inherits.
        is_available: available ? null : false,
      });
      toast.success(t("common.savedChanges", "Changes saved"));
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await deletePriceOverride({
        scope,
        branch_id: branchId,
        channel: channel === ORG_CHANNEL ? null : channel,
        target_type: "menu_item_size",
        target_id: size.id,
        price: null,
        is_available: null,
      });
      setPrice("");
      setAvailable(true);
      toast.success(t("menu.overrides.clear", "Clear override"));
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const hasOverride = existing != null && (existing.price != null || existing.is_available != null);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="inline-flex min-w-24 items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        {size.label}
      </span>
      <span className="text-xs text-muted-foreground">
        {t("menu.overrides.orgPrice", "Org")}: <span className="tabular">{fmtMoney(size.price)}</span>
      </span>
      <div className="ms-auto flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <Switch checked={available} onCheckedChange={setAvailable} />
          <span className="text-xs text-muted-foreground">{t("menu.overrides.available", "Available")}</span>
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={price}
          placeholder={t("menu.overrides.inherits", "Inherits")}
          onChange={(e) => setPrice(e.target.value)}
          className="h-9 w-28 tabular"
        />
        <Button type="button" size="sm" variant="outline" loading={busy} onClick={() => void commit()}>
          {t("common.save", "Save")}
        </Button>
        {hasOverride ? (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void clear()}>
            {t("menu.overrides.clear", "Clear override")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
