/**
 * The shop's read-only menu opens an item the same way ordering does — the
 * real options, and what the drink comes to with them — with nothing to add.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { DeliveryMenu } from "@/data/api/generated/models/deliveryMenu";
import { MOCK_PUBLIC_MENU } from "@/data/api/mock/data";

// The category rail tracks scrolling; jsdom has no layout to observe.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

await import("@/i18n");
const { MenuStep } = await import("./menu-step");

const renderMenu = (props: { menuMode?: boolean; readOnly?: boolean }) => {
  const onAdd = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MenuStep
        branchId="br_zamalek"
        channel="pickup"
        menu={MOCK_PUBLIC_MENU as unknown as DeliveryMenu}
        countByItem={{}}
        onAdd={onAdd}
        query=""
        onQueryChange={() => {}}
        browseOnly
        {...props}
      />
    </QueryClientProvider>,
  );
  return onAdd;
};

const footerTotal = () => screen.getByText("Total").parentElement?.textContent ?? "";

describe("MenuStep on the read-only menu", () => {
  for (const mode of [{ menuMode: true }, { readOnly: true }]) {
    it(`opens the item sheet and prices the picks (${Object.keys(mode)[0]})`, () => {
      const onAdd = renderMenu(mode);

      fireEvent.click(screen.getByText("Cappuccino"));
      const sheet = screen.getByRole("dialog");
      expect(footerTotal()).toMatch(/45\.00/);

      fireEvent.click(within(sheet).getByText("Medium"));
      expect(footerTotal()).toMatch(/55\.00/);
      fireEvent.click(within(sheet).getByText("Oat Milk"));
      expect(footerTotal()).toMatch(/70\.00/);

      // A menu, not a cart: no add button, no kitchen notes.
      expect(within(sheet).queryByRole("button", { name: /^Add ·/ })).toBeNull();
      expect(within(sheet).queryByText("Special requests")).toBeNull();
      expect(onAdd).not.toHaveBeenCalled();
    });
  }

  it("still adds to the cart when the menu is an order being built", () => {
    const onAdd = renderMenu({});
    fireEvent.click(screen.getByText("Cappuccino"));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Add ·/ }));
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
