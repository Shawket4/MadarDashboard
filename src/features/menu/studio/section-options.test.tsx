/**
 * MENU-STUDIO-112 (W8): the Options section is gated on menu.items.edit, the
 * capability its save needs. Without it the options are shown, not edited.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { SectionOptions } = await import("./section-options");

const row = { id: "o1", name: "Extra shot", price: "15", is_active: true, ingredient_id: "i1", quantity: "18", unit: "g" };
const mount = (readOnly: boolean, rows = [row]) =>
  render(
    <SectionOptions
      rows={rows}
      setRows={vi.fn()}
      catalogById={new Map([["i1", { id: "i1", name: "Espresso", unit: "g" } as never]])}
      ingredientOptions={[{ value: "i1", label: "Espresso" }]}
      readOnly={readOnly}
    />,
  );

describe("SectionOptions gating (W8)", () => {
  it("read-only: every control disabled, no add / remove / clear", () => {
    mount(true);
    expect(screen.getByDisplayValue("Extra shot")).toBeDisabled();
    expect(screen.getByDisplayValue("15")).toBeDisabled();
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByLabelText("Quantity")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add option/ })).not.toBeInTheDocument();
  });

  it("read-only with no options says so instead of an empty section", () => {
    mount(true, []);
    expect(screen.getByText("No options yet")).toBeInTheDocument();
  });

  it("an editor gets the controls", () => {
    mount(false);
    expect(screen.getByDisplayValue("Extra shot")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add option/ })).toBeInTheDocument();
    expect(screen.queryByText("No options yet")).not.toBeInTheDocument();
  });
});
