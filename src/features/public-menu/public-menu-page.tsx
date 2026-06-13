import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useGetPublicMenu } from "@/data/api/generated/api";
import type { PublicMenuItem } from "@/data/api/generated/models";
import { useAppStore } from "@/data/stores/app.store";
import { ItemDetailSheet } from "./item-detail-sheet";
import { normalize, type CartLine } from "./lib";

export function PublicMenuPage({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const setLanguage = useAppStore((s) => s.setLanguage);

  const { data: menu, isLoading, error } = useGetPublicMenu(orgId, {
    query: { enabled: !!orgId, staleTime: 60_000, refetchInterval: 120_000, refetchOnWindowFocus: true },
  });

  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const nq = normalize(search.trim());
  const categories = useMemo(() => {
    const cats = menu?.categories ?? [];
    if (!nq) return cats;
    return cats
      .map((c) => ({ ...c, items: c.items.filter((it) => normalize(getTranslatedName(it, lang)).includes(nq) || normalize(it.description ?? "").includes(nq)) }))
      .filter((c) => c.items.length > 0);
  }, [menu, nq, lang]);

  // Scroll-spy: highlight the category whose section is in view.
  useEffect(() => {
    if (!categories.length) return;
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) setActiveCat(e.target.id.replace("cat-", "")); },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    categories.forEach((c) => { const el = sectionRefs.current[c.id]; if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [categories]);

  const scrollTo = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  const addLine = (line: CartLine) =>
    setCart((prev) => {
      const i = prev.findIndex((l) => l.key === line.key);
      if (i === -1) return [...prev, line];
      const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + line.qty }; return next;
    });
  const setQty = (key: string, delta: number) =>
    setCart((prev) => prev.flatMap((l) => l.key === key ? (l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }]) : [l]));

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }
  if (error || !menu) {
    return <div className="grid min-h-screen place-items-center p-6"><EmptyState icon={ShoppingBag} title={t("publicMenu.unavailable", "Menu unavailable")} description={t("publicMenu.unavailableHint", "This menu could not be loaded. Please try again later.")} /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 p-4">
          {menu.logo_url ? <img src={menu.logo_url} alt="" className="size-11 shrink-0 rounded-xl object-cover" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{menu.org_name.slice(0, 2).toUpperCase()}</span>}
          <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold">{menu.org_name}</h1><p className="text-xs text-muted-foreground">{t("publicMenu.tagline", "Browse & build your order")}</p></div>
          <Button variant="ghost" size="icon-sm" onClick={() => setLanguage(lang === "ar" ? "en" : "ar")} aria-label="Language"><Languages className="size-4" /></Button>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search", "Search…")} className="ps-9" />
          </div>
        </div>
        {!nq && categories.length > 0 ? (
          <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <button key={c.id} onClick={() => scrollTo(c.id)}
                className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors", activeCat === c.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                {getTranslatedName(c, lang)}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* Sections */}
      <main className="mx-auto max-w-3xl space-y-8 p-4">
        {categories.length === 0 ? (
          <EmptyState icon={Search} title={t("publicMenu.noResults", "Nothing matches your search")} className="py-16" />
        ) : categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} ref={(el) => { sectionRefs.current[c.id] = el; }} className="scroll-mt-40 space-y-3">
            <h2 className="text-base font-bold">{getTranslatedName(c, lang)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.items.map((it) => (
                <button key={it.id} onClick={() => setOpenItem(it)} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-start transition-colors hover:bg-muted/50">
                  {it.image_url ? <img src={it.image_url} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><ShoppingBag className="size-5" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{getTranslatedName(it, lang)}</p>
                    {it.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{lang === "ar" ? ((it.description_translations as { ar?: string } | null)?.ar ?? it.description) : it.description}</p> : null}
                    <p className="mt-1 text-sm font-bold text-primary">{fmtMoney(it.sizes[0]?.price_override ?? it.base_price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Floating order bar */}
      {count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 p-4">
          <button onClick={() => setCartOpen(true)} className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-transform hover:scale-[1.01]">
            <span className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-primary-foreground/20 text-xs">{count}</span> {t("publicMenu.viewOrder", "View order")}</span>
            <span className="font-bold tabular">{fmtMoney(total)}</span>
          </button>
        </div>
      ) : null}

      <ItemDetailSheet item={openItem} open={!!openItem} onOpenChange={(o) => { if (!o) setOpenItem(null); }} onAdd={addLine} />

      {/* Order summary ("show to barista") */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader><SheetTitle>{t("publicMenu.yourOrder", "Your order")}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            {cart.length === 0 ? <EmptyState icon={ShoppingBag} title={t("publicMenu.emptyOrder", "Your order is empty")} /> : cart.map((l) => (
              <div key={l.key} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{l.name}{l.sizeLabel ? <span className="text-muted-foreground"> · {l.sizeLabel}</span> : null}</p>
                  {l.addons.length ? <p className="text-xs text-muted-foreground">{l.addons.map((a) => a.name).join(", ")}</p> : null}
                  <p className="mt-1 text-sm font-medium tabular">{fmtMoney(l.unitPrice * l.qty)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border p-0.5">
                  <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setQty(l.key, -1)}>{l.qty === 1 ? <Trash2 className="size-3.5 text-destructive" /> : <Minus className="size-3.5" />}</Button>
                  <span className="w-5 text-center text-sm font-semibold tabular">{l.qty}</span>
                  <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setQty(l.key, 1)}><Plus className="size-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
          {cart.length > 0 ? (
            <SheetFooter className="flex-col gap-2 border-t pt-4">
              <div className="flex items-center justify-between text-base font-bold"><span>{t("common.total", "Total")}</span><span className="tabular">{fmtMoney(total)}</span></div>
              <p className="text-center text-xs text-muted-foreground">{t("publicMenu.showBarista", "Show this screen to the barista to place your order.")}</p>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
