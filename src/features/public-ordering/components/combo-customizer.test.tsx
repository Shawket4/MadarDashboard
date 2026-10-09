/**
 * The combo picker on the QR and online pages: a choice the shop switched off
 * is SHOWN greyed with "Unavailable" and can't be picked (owner, 2026-09-27),
 * and each slot reads in the page's language — in English and in Arabic.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

// The real i18n instance, so the Arabic words are the shipped ones.
const i18n = (await import("@/i18n")).default;
const { ComboCustomizer } = await import("./combo-customizer");

const choice = (id: string, name: string, ar: string, available = true) => ({
  menu_item_id: id,
  name,
  name_translations: { ar },
  image_url: null,
  base_price: 5000,
  included_size_label: "one_size",
  sizes: available ? [{ label: "one_size", price: 5000, extra: 0 }] : [],
  surcharge: 0,
  available,
});

const LUNCH = {
  id: "combo-1",
  kind: "combo",
  name: "Lunch deal",
  name_translations: { ar: "وجبة الغداء" },
  description: null,
  category_id: "cat-1",
  price: 15000,
  sizes: [],
  optionals: [],
  modifier_groups: [],
  allowed_addon_ids: [],
  combo: {
    is_fixed: false,
    slots: [
      {
        id: "slot-drink",
        name: "Drink",
        name_translations: { ar: "مشروب" },
        sort: 0,
        min: 1,
        max: 1,
        default_item_id: null,
        default_size_label: null,
        choices: [choice("latte", "Latte", "لاتيه"), choice("cola", "Cola", "كولا", false)],
      },
      {
        id: "slot-side",
        name: "Side",
        name_translations: {},
        sort: 1,
        min: 1,
        max: 2,
        default_item_id: null,
        default_size_label: null,
        choices: [choice("fries", "Fries", "بطاطس"), choice("salad", "Salad", "سلطة", false)],
      },
    ],
  },
} as unknown as DeliveryMenuItem;

afterEach(async () => {
  await i18n.changeLanguage("en");
});

const choiceRow = (region: HTMLElement, name: string) =>
  within(region)
    .getAllByTestId("combo-choice")
    .find((row) => within(row).queryByText(name))!;

/** A choice's own button (the one that picks it), not its stepper. */
const pickButton = (row: HTMLElement) =>
  within(row)
    .getAllByRole("button")
    .find((b) => b.hasAttribute("aria-pressed"))!;

describe("ComboCustomizer — unavailable choices", () => {
  it.each([
    { lang: "en", drink: "Drink", side: "Side", cola: "Cola", latte: "Latte", salad: "Salad", fries: "Fries", word: "Unavailable" },
    // Side has no Arabic name: it reads in English.
    { lang: "ar", drink: "مشروب", side: "Side", cola: "كولا", latte: "لاتيه", salad: "سلطة", fries: "بطاطس", word: "غير متاح" },
  ])("shows them greyed and unpickable ($lang)", async ({ lang, drink, side, cola, latte, salad, fries, word }) => {
    await i18n.changeLanguage(lang);
    const onConfirm = vi.fn();
    render(<ComboCustomizer item={LUNCH} open onOpenChange={() => {}} onConfirm={onConfirm} />);

    const drinkSlot = screen.getByRole("region", { name: drink });
    const sideSlot = screen.getByRole("region", { name: side });

    // Shown, marked, disabled.
    const colaRow = choiceRow(drinkSlot, cola);
    expect(colaRow).toHaveAttribute("data-unavailable", "true");
    expect(within(colaRow).getByText(word)).toBeInTheDocument();
    const colaButton = pickButton(colaRow);
    expect(colaButton).toBeDisabled();
    expect(colaButton).toHaveAttribute("aria-pressed", "false");
    // A multi-pick slot offers no stepper on it.
    const saladRow = choiceRow(sideSlot, salad);
    expect(within(saladRow).getByText(word)).toBeInTheDocument();
    expect(within(saladRow).getAllByRole("button")).toHaveLength(1);
    // The available ones carry no such word.
    expect(within(choiceRow(drinkSlot, latte)).queryByText(word)).toBeNull();

    // With Cola greyed, the Latte is the Drink slot's only pick: filled in.
    const latteButton = pickButton(choiceRow(drinkSlot, latte));
    expect(latteButton).toHaveAttribute("aria-pressed", "true");
    // Tapping a greyed choice picks nothing: the Latte stays.
    fireEvent.click(colaButton);
    expect(colaButton).toHaveAttribute("aria-pressed", "false");
    expect(latteButton).toHaveAttribute("aria-pressed", "true");
    // Side asks for 1 to 2: nothing pre-filled, and the greyed Salad can't answer it.
    fireEvent.click(pickButton(saladRow));
    expect(pickButton(choiceRow(sideSlot, fries))).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // The available ones still work, and what is added carries only them.
    fireEvent.click(pickButton(choiceRow(sideSlot, fries)));
    const add = screen
      .getAllByRole("button")
      .find((b) => /150\.00|١٥٠/.test(b.textContent ?? "") && !b.hasAttribute("disabled"));
    expect(add).toBeDefined();
    fireEvent.click(add!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0].combo.picks.map((p: { menu_item_id: string }) => p.menu_item_id)).toEqual([
      "latte",
      "fries",
    ]);
  });
});
