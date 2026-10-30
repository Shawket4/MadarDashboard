/**
 * The till's sales by who served them (TELLER_PICK §3.8): the server sends
 * `by_person` only when someone on the till was picked at checkout, largest
 * first. Absent or empty, there is no section at all.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TillPersonLine } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber } from "@/lib/format";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { TillByPerson } = await import("./till-by-person");

const LINES: TillPersonLine[] = [
  { person_id: "u-karim", name: "Karim Saleh", order_count: 1204, total: 848_470, tips: 2_500 },
  { person_id: "u-mona", name: "Mona Adel", order_count: 66, total: 608_685, tips: 0 },
  { person_id: null, name: null, order_count: 4, total: 12_000, tips: 0 },
];

describe("TillByPerson", () => {
  it("renders nothing when the report has no by_person key, or an empty one", () => {
    const { container, rerender } = render(<TillByPerson lines={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<TillByPerson lines={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("By person")).not.toBeInTheDocument();
  });

  it("lists name, orders, total and tips per person, in the server's order", () => {
    render(<TillByPerson lines={LINES} />);
    expect(screen.getByRole("heading", { name: "By person" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Teller", "Orders", "Total", "Tips"]);
    const rows = screen.getAllByTestId("till-person-line");
    expect(rows.map((r) => within(r).getAllByRole("cell").map((c) => c.textContent))).toEqual([
      ["Karim Saleh", fmtNumber(1204), fmtMoney(848_470), fmtMoney(2_500)],
      ["Mona Adel", fmtNumber(66), fmtMoney(608_685), fmtMoney(0)],
      ["—", fmtNumber(4), fmtMoney(12_000), fmtMoney(0)],
    ]);
  });

  it("speaks the till's Arabic: the teller is الصراف", async () => {
    await i18n.changeLanguage("ar");
    try {
      render(<TillByPerson lines={LINES} />);
      expect(screen.getByRole("heading", { name: "حسب الشخص" })).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["الصراف", "الطلبات", "الإجمالي", "البقشيش"]);
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
