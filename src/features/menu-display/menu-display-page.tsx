/**
 * The shop's menu WITHOUT prices: `<slug>.madar-pos.cloud/menu`, or
 * `loyalty.madar-pos.cloud/menu/<org id>` for a shop with no host of its own.
 *
 * Built from the ordering flow's own pieces — its frame (`StepShell`), the
 * category tabs and cards (`MenuStep`), the item and combo customizers and the
 * basket — with prices switched off (`PriceModeContext`). The menu itself
 * comes from `GET /public/menu-display`, whose types have no price field at
 * all, so there is nothing on this page, or in its network tab, to hide.
 *
 * The basket ends in "Show to staff" (`ShowToStaff`): a list for a waiter.
 * Nothing is submitted and no order is created. It is not linked from the
 * ordering, booking or rewards pages, nor from the links page.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UtensilsCrossed } from "lucide-react";

import { usePublicMenuDisplay } from "@/data/api/generated/api";
import type { PublicMenuDisplay } from "@/data/api/generated/models/publicMenuDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShellBrand } from "@/features/public-shell/storefront-shell";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { StepShell } from "@/features/public-ordering/components/step-shell";
import { MenuStep } from "@/features/public-ordering/components/menu-step";
import { CartBar, CartEmptyHint, HeaderSearch } from "@/features/public-ordering/components/menu-bar";
import { CartPanel, CartSheet } from "@/features/public-ordering/components/cart-sheet";
import { ItemCustomizer } from "@/features/public-ordering/components/item-customizer";
import { ComboCustomizer } from "@/features/public-ordering/components/combo-customizer";
import { isCombo } from "@/features/public-ordering/combo";
import { useCart } from "@/features/public-ordering/use-cart";
import { PriceModeContext } from "@/features/public-ordering/price-mode";
import type { CartLine } from "@/features/public-ordering/types";

import { ShowToStaff } from "./show-to-staff";
import { loadList, saveList } from "./list-storage";

/** The shop is named by id (the generic host's path) or by its host's slug. */
export function MenuDisplayPage({ orgId, slug }: { orgId?: string | null; slug?: string | null }) {
  const { t } = useTranslation();
  const params = orgId ? { org_id: orgId } : slug ? { slug } : undefined;
  const q = usePublicMenuDisplay(params, {
    query: { enabled: !!params, staleTime: 60_000, retry: false },
  });

  if (params && q.isPending) {
    return (
      <StorefrontShell>
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-full" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[84px] w-full rounded-2xl" />
          ))}
        </div>
      </StorefrontShell>
    );
  }

  if (!q.data) {
    // Off, no such shop, or no shop named: one answer (the server's 404).
    return (
      <StorefrontShell>
        <div className="flex flex-col items-center rounded-2xl border border-border/70 bg-card px-6 py-12 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UtensilsCrossed className="size-6" />
          </span>
          <p className="font-medium">{t("menuDisplay.unavailable", "This menu isn't available")}</p>
          <p className="mt-1 max-w-[32ch] text-sm text-muted-foreground">
            {t("menuDisplay.unavailableHint", "Check the address, or ask a member of staff.")}
          </p>
        </div>
      </StorefrontShell>
    );
  }

  return <MenuDisplayBody key={`${q.data.brand.org_id}:${q.data.branch.id}`} page={q.data} />;
}

function MenuDisplayBody({ page }: { page: PublicMenuDisplay }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const orgId = page.brand.org_id;
  const branchId = page.branch.id;

  const cart = useCart(loadList(orgId, branchId));
  useEffect(() => saveList(orgId, branchId, cart.lines), [orgId, branchId, cart.lines]);

  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [editing, setEditing] = useState<CartLine | null>(null);
  const [showing, setShowing] = useState(false);

  const brand = useMemo<ShellBrand>(
    () => ({
      orgId,
      orgName: page.brand.name,
      logoUrl: page.brand.logo_url?.trim() || null,
      background: page.brand.background_color,
      ownBranding: page.brand.custom_branding,
    }),
    [orgId, page.brand],
  );

  const title =
    (lang.startsWith("ar") ? page.title_ar || page.title_en : page.title_en || page.title_ar) ||
    t("menuDisplay.title", "Menu");

  const showToStaff = () => {
    setCartOpen(false);
    setShowing(true);
  };
  const staffLabel = t("menuDisplay.showToStaff", "Show to staff");
  const listHint = t("menuDisplay.listHint", "Build your order, then show it to a member of staff.");

  return (
    <PriceModeContext.Provider value={false}>
      <StepShell
        step="menu"
        showLocationDot={false}
        title={title}
        wide
        brand={brand}
        hideProgress
        menuHeading={{ title, subtitle: page.branch.name }}
        headerSearch={<HeaderSearch value={query} onChange={setQuery} />}
        footer={
          cart.itemCount > 0 ? (
            <CartBar count={cart.itemCount} total={0} onOpen={() => setCartOpen(true)} />
          ) : (
            <CartEmptyHint />
          )
        }
      >
        <MenuStep
          branchId={branchId}
          // The menu is supplied, so MenuStep fetches nothing; the channel is
          // only a label this layout never shows.
          channel="in_mall"
          menu={page.menu}
          emptyHint={t("table.menuEmpty", "There is nothing on the menu right now.")}
          countByItem={cart.countByItem}
          onAdd={cart.addOrUpdate}
          query={query}
          onQueryChange={setQuery}
          cartSlot={
            <CartPanel
              lines={cart.lines}
              onEdit={(line) => setEditing(line)}
              onRemove={cart.remove}
              onSetQty={cart.setQty}
              onCheckout={showToStaff}
              checkoutLabel={staffLabel}
              description={listHint}
            />
          }
        />
      </StepShell>

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        lines={cart.lines}
        onEdit={(line) => {
          setCartOpen(false);
          setEditing(line);
        }}
        onRemove={cart.remove}
        onSetQty={cart.setQty}
        onCheckout={showToStaff}
        onAddMore={() => setCartOpen(false)}
        checkoutLabel={staffLabel}
        description={listHint}
      />

      {/* Editing a line: a combo reopens its picker, anything else the customizer. */}
      <ItemCustomizer
        item={editing && !isCombo(editing.item) ? editing.item : null}
        addons={page.menu.addons}
        editing={editing}
        open={!!editing && !isCombo(editing.item)}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={(line) => {
          cart.addOrUpdate(line);
          setEditing(null);
        }}
      />
      <ComboCustomizer
        item={editing && isCombo(editing.item) ? editing.item : null}
        editing={editing}
        open={!!editing && isCombo(editing.item)}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={(line) => {
          cart.addOrUpdate(line);
          setEditing(null);
        }}
      />

      <ShowToStaff
        open={showing}
        onOpenChange={setShowing}
        lines={cart.lines}
        shopName={page.brand.name}
        branchName={page.branch.name}
        onClear={() => {
          cart.clear();
          setShowing(false);
        }}
      />
    </PriceModeContext.Provider>
  );
}
