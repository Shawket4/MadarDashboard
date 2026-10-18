/**
 * A hidden option (an archived ingredient) still names a saved value but is
 * never offered in the list.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { Combobox } = await import("./combobox");

const options = [
  { value: "milk", label: "Milk" },
  { value: "old", label: "Old Syrup", hidden: true },
];

describe("Combobox hidden options", () => {
  it("labels a saved hidden value", () => {
    render(<Combobox options={options} value="old" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Old Syrup");
  });

  it("does not offer a hidden option", () => {
    render(<Combobox options={options} value={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.queryByText("Old Syrup")).toBeNull();
  });
});
