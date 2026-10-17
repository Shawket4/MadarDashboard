/**
 * Whether the storefront components show prices.
 *
 * On (the default) everywhere a customer orders. Off on the shop's menu
 * without prices (`features/menu-display`), whose menu carries no figure at
 * all: the same tabs, cards, customizers and basket, with every price,
 * currency, delta, subtotal, fee and total left out of the rendering.
 */
import { createContext, useContext } from "react";

export const PriceModeContext = createContext<boolean>(true);

/** `false` inside `<PriceModeContext.Provider value={false}>`. */
export const useShowPrices = (): boolean => useContext(PriceModeContext);
