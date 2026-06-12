import { forwardRef, useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface Props {
  orgName: string;
  logoUrl?: string | null;
  cartCount: number;
  onCartClick: () => void;
}

export const MenuHeader = forwardRef<HTMLButtonElement, Props>(
  ({ orgName, logoUrl, cartCount, onCartClick }, cartRef) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
      const handler = () => setScrolled(window.scrollY > 12);
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler);
    }, []);

    const initials = orgName.trim().charAt(0).toUpperCase();

    return (
      <header
        className={cn(
          "sticky top-0 z-30 flex items-center justify-between h-14 px-4 transition-all duration-300",
          scrolled
            ? "bg-white/85 backdrop-blur-lg border-b border-neutral-100/80 shadow-sm"
            : "bg-transparent"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-[#0A2540] flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white leading-none">{initials}</span>
            </div>
          )}
          <span className="text-sm font-semibold text-[#0A2540] truncate leading-none">
            {orgName}
          </span>
        </div>

        {/* Cart button */}
        <button
          ref={cartRef}
          onClick={onCartClick}
          aria-label="View cart"
          className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0A2540] text-white active:scale-90 transition-transform duration-100 flex-shrink-0"
        >
          <ShoppingBag size={17} strokeWidth={2} />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C25B3F] text-white text-[10px] font-bold flex items-center justify-center leading-none"
              style={{ animation: "pm-badge-pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </header>
    );
  }
);
MenuHeader.displayName = "MenuHeader";
