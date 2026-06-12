import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useGetPublicMenu } from "@/shared/api/generated/api";
import type { PublicMenuItem } from "@/shared/api/generated/models";

import { MenuHeader } from "./components/menu-header";
import { SearchBar } from "./components/search-bar";
import { CategoryNav } from "./components/category-nav";
import { CategorySection } from "./components/category-section";
import { FloatingOrderBar } from "./components/floating-order-bar";
import { ItemDetailSheet } from "./components/item-detail-sheet";
import { CartSheet } from "./components/cart-sheet";
import { ShowToBaristaDialog, loadDotLottie } from "./components/show-to-barista-dialog";
import { MenuError, MenuSkeleton, MenuSearchEmpty } from "./components/menu-states";

import { useScrollSpy } from "./hooks/use-scroll-spy";
import { useImagePreload } from "./hooks/use-image-preload";
import { usePublicCart } from "./hooks/use-public-cart";

import { FLIGHT_MS, REFETCH_INTERVAL_MS } from "./lib/constants";
import { haptic, normalize } from "./lib/menu-format";
import { prefersReducedMotion } from "./lib/motion";
import type { CartLine } from "./lib/types";

export default function PublicMenuPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const { data: menu, isLoading, error } = useGetPublicMenu(orgId as string, {
    query: {
      enabled: !!orgId,
      staleTime: 60_000,
      refetchInterval: REFETCH_INTERVAL_MS,
      refetchOnWindowFocus: true,
    },
  });

  /* Lazy-load Cairo fonts + preload Lottie on idle */
  useEffect(() => {
    import("./cairo.css");
    const preloadLottie = () => {
      loadDotLottie().catch(() => {});
      fetch("/ShowTellerCup.lottie").catch(() => {});
    };
    if (typeof window !== "undefined") {
      const win = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
      if (typeof win.requestIdleCallback === "function") win.requestIdleCallback(preloadLottie);
      else setTimeout(preloadLottie, 1500);
    }
  }, []);

  /* Search */
  const [search, setSearch] = useState("");
  const trimmed = search.trim();
  const searchActive = trimmed.length > 0;
  const normalizedQuery = useMemo(() => normalize(trimmed), [trimmed]);

  const filteredCategories = useMemo(() => {
    if (!menu) return [];
    if (!searchActive) return menu.categories;
    return menu.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) =>
            normalize(it.name).includes(normalizedQuery) ||
            normalize(it.description ?? "").includes(normalizedQuery),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu, searchActive, normalizedQuery]);

  const categoryIds = useMemo(
    () => filteredCategories.map((c) => String(c.id)),
    [filteredCategories],
  );

  /* Scroll-spy + image preload */
  const { activeCat, registerSection, registerPill, onPillClick } = useScrollSpy(categoryIds, !!menu);
  useImagePreload(menu, activeCat);

  /* Cart */
  const { cart, count: cartCount, total: cartTotal, addLine, removeLine, updateQty } =
    usePublicCart(orgId ?? null);
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [baristaOpen, setBaristaOpen] = useState(false);

  /* Fly-to-cart animation */
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);

  const flyToCart = useCallback((sourceEl: HTMLElement | null) => {
    if (!sourceEl || !cartButtonRef.current || prefersReducedMotion()) {
      haptic("medium");
      return;
    }
    const sRect = sourceEl.getBoundingClientRect();
    const cRect = cartButtonRef.current.getBoundingClientRect();
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: "fixed",
      left: `${sRect.left}px`,
      top: `${sRect.top}px`,
      width: `${sRect.width}px`,
      height: `${sRect.height}px`,
      margin: "0",
      pointerEvents: "none",
      zIndex: "100",
      transition: `all ${FLIGHT_MS}ms cubic-bezier(0.55,0,0.55,1)`,
      willChange: "transform,opacity,width,height,left,top,border-radius",
      borderRadius: "50%",
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(clone);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const tx = cRect.left + cRect.width / 2 - 14;
      const ty = cRect.top + cRect.height / 2 - 14;
      Object.assign(clone.style, {
        left: `${tx}px`, top: `${ty}px`,
        width: "28px", height: "28px",
        opacity: "0.4", transform: "rotate(40deg)",
      } as Partial<CSSStyleDeclaration>);
    }));
    window.setTimeout(() => {
      clone.remove();
      cartButtonRef.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "cubic-bezier(0.34,1.56,0.64,1)" }
      );
      haptic("medium");
    }, FLIGHT_MS);
  }, []);

  const handleAdd = useCallback((line: CartLine, sourceEl: HTMLElement | null) => {
    flyToCart(sourceEl);
    addLine(line);
    window.setTimeout(() => setOpenItem(null), 80);
  }, [addLine, flyToCart]);

  if (isLoading) return <MenuSkeleton />;
  if (error || !menu) return <MenuError />;

  return (
    <div
      dir={i18n.dir()}
      className="pm-root min-h-screen bg-[#FAF8F5] antialiased"
    >
      <MenuHeader
        ref={cartButtonRef}
        orgName={menu.org_name}
        logoUrl={menu.logo_url}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="max-w-lg mx-auto px-4 pt-3 pb-32 space-y-8">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("menu.search.placeholder")}
        />

        {!searchActive && (
          <CategoryNav
            categories={filteredCategories}
            activeCat={activeCat}
            registerPill={registerPill}
            onPillClick={onPillClick}
          />
        )}

        {searchActive && filteredCategories.length === 0 ? (
          <MenuSearchEmpty query={trimmed} />
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((cat) => (
              <CategorySection
                key={String(cat.id)}
                category={cat}
                isRTL={isRTL}
                onSelect={setOpenItem}
                registerSection={registerSection}
              />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <FloatingOrderBar
          cartCount={cartCount}
          total={cartTotal}
          onOpen={() => setCartOpen(true)}
        />
      )}

      <ItemDetailSheet
        item={openItem}
        onClose={() => setOpenItem(null)}
        onAdd={handleAdd}
      />

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={cartTotal}
        onUpdateQty={updateQty}
        onRemove={removeLine}
        onShowToBarista={() => setBaristaOpen(true)}
      />

      <ShowToBaristaDialog
        open={baristaOpen}
        onClose={() => setBaristaOpen(false)}
        cart={cart}
        total={cartTotal}
      />
    </div>
  );
}
