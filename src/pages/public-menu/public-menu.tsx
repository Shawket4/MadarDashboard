// src/pages/public-menu/public-menu.tsx
//
// Customer-facing QR menu at /menu/:orgId. This file is the thin orchestrator:
// data fetching, top-level state, and layout. Presentation lives in
// ./components, behaviour in ./hooks, pure helpers in ./lib.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

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
import { MenuError, MenuSkeleton } from "./components/menu-states";

import { useScrollSpy } from "./hooks/use-scroll-spy";
import { useImagePreload } from "./hooks/use-image-preload";
import { usePublicCart } from "./hooks/use-public-cart";

import { FLIGHT_MS, REFETCH_INTERVAL_MS } from "./lib/constants";
import { haptic, normalize } from "./lib/menu-format";
import { prefersReducedMotion } from "./lib/motion";
import type { CartLine, FlyToCartFn } from "./lib/types";

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

  /* ---------- lazy-load Cairo fonts & preload Lottie assets on idle ---------- */
  useEffect(() => {
    import("./cairo.css");

    const preloadLottie = () => {
      loadDotLottie().catch(() => {});
      fetch("/ShowTellerCup.lottie").catch(() => {});
    };
    if (typeof window !== "undefined") {
      const win = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
      if (typeof win.requestIdleCallback === "function") win.requestIdleCallback(preloadLottie);
      else setTimeout(preloadLottie, 1500); // Safari fallback
    }
  }, []);

  /* ---------- search ---------- */
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

  /* ---------- sticky category nav (scroll-spy + hash anchoring) ---------- */
  const { activeCat, registerSection, registerPill, onPillClick } = useScrollSpy(
    categoryIds,
    !!menu,
  );
  useImagePreload(menu, activeCat);

  /* ---------- cart ---------- */
  const { cart, count: cartCount, total: cartTotal, addLine, removeLine, updateQty } =
    usePublicCart(orgId ?? null);
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [baristaOpen, setBaristaOpen] = useState(false);

  const onSelect = useCallback((item: PublicMenuItem) => setOpenItem(item), []);

  /* ---------- fly-to-cart animation (skipped under reduced motion) ---------- */
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const flyToCart = useCallback<FlyToCartFn>((sourceEl) => {
    if (!sourceEl || !cartButtonRef.current) return;
    if (prefersReducedMotion()) {
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
      transition: `all ${FLIGHT_MS}ms cubic-bezier(0.55, 0, 0.55, 1)`,
      willChange: "transform, opacity, width, height, left, top, border-radius",
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const tx = cRect.left + cRect.width / 2 - 14;
        const ty = cRect.top + cRect.height / 2 - 14;
        Object.assign(clone.style, {
          left: `${tx}px`,
          top: `${ty}px`,
          width: "28px",
          height: "28px",
          opacity: "0.45",
          borderRadius: "50%",
          transform: "rotate(40deg)",
        } as Partial<CSSStyleDeclaration>);
      });
    });

    window.setTimeout(() => {
      clone.remove();
      cartButtonRef.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
        { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
      haptic("medium");
    }, FLIGHT_MS);
  }, []);

  const handleAdd = useCallback(
    (line: CartLine, sourceEl: HTMLElement | null) => {
      flyToCart(sourceEl);
      addLine(line);
      // Hold the sheet open briefly so the flight visibly starts where tapped.
      window.setTimeout(() => setOpenItem(null), 80);
    },
    [addLine, flyToCart],
  );

  if (isLoading) return <MenuSkeleton />;
  if (error || !menu) return <MenuError />;

  const showEmptyResults = searchActive && filteredCategories.length === 0;

  return (
    <div
      dir={i18n.dir()}
      className="public-menu-root light-theme min-h-screen bg-[#F8FAFC] selection:bg-primary/20 antialiased text-foreground"
    >
      <MenuHeader
        ref={cartButtonRef}
        orgName={menu.org_name}
        logoUrl={menu.logo_url}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-40 space-y-6 sm:space-y-8">
        <SearchBar value={search} onChange={setSearch} placeholder={t("menu.search.placeholder")} />

        {!searchActive && (
          <CategoryNav
            categories={filteredCategories}
            activeCat={activeCat}
            registerPill={registerPill}
            onPillClick={onPillClick}
          />
        )}

        {showEmptyResults && (
          <div className="text-center py-16 sm:py-24 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-20 w-20 rounded-3xl bg-slate-100 mx-auto flex items-center justify-center text-slate-300">
              <Search size={28} />
            </div>
            <p className="text-base font-bold text-slate-700 px-6">
              {t("menu.search.noResults", { query: trimmed })}
            </p>
            <p className="text-sm text-slate-400 px-6">{t("menu.search.noResultsHint")}</p>
          </div>
        )}

        <div className="space-y-14 sm:space-y-20">
          {filteredCategories.map((cat) => (
            <CategorySection
              key={String(cat.id)}
              category={cat}
              isRTL={isRTL}
              onSelect={onSelect}
              registerSection={registerSection}
            />
          ))}
        </div>
      </main>

      {cartCount > 0 && (
        <FloatingOrderBar cartCount={cartCount} total={cartTotal} onOpen={() => setCartOpen(true)} />
      )}

      <ItemDetailSheet item={openItem} onClose={() => setOpenItem(null)} onAdd={handleAdd} />

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
