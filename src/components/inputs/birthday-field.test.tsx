/**
 * The birthday field: one field, a sheet of wheels, a draft that only Done
 * saves. Driven the way a keyboard or a screen reader drives it: each wheel is
 * a listbox of options.
 */
import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BirthdayField } from "./birthday-field";
import type { Birthday, YearMode } from "./birthday";

const i18n = (await import("@/i18n")).default;

// vaul captures the pointer on press; jsdom has no pointer capture.
HTMLElement.prototype.setPointerCapture ??= () => {};
HTMLElement.prototype.releasePointerCapture ??= () => {};

/** 23 October 2026. */
const TODAY = new Date(2026, 9, 23);

function Harness({
  initial = { month: null, day: null },
  year,
  onChange,
}: {
  initial?: Birthday;
  year?: YearMode;
  onChange?: (b: Birthday) => void;
}) {
  const [value, setValue] = useState<Birthday>(initial);
  return (
    <>
      <span id="label">Your birthday</span>
      <BirthdayField
        value={value}
        onChange={(b) => {
          setValue(b);
          onChange?.(b);
        }}
        title="Your birthday"
        year={year}
        today={TODAY}
        aria-labelledby="label"
      />
    </>
  );
}

const open = async () => {
  await userEvent.click(screen.getByRole("button", { name: /your birthday/i }));
  return screen.findByRole("dialog");
};
const wheel = (name: string) => screen.getByRole("listbox", { name });
const picked = (name: string) => within(wheel(name)).getByRole("option", { selected: true }).textContent;
const press = (name: string, key: string, times = 1) => {
  for (let i = 0; i < times; i++) fireEvent.keyDown(wheel(name), { key });
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("BirthdayField", () => {
  it("is one field that reads as the question and its answer", () => {
    render(<Harness />);
    const field = screen.getByRole("button", { name: "Your birthday Add your birthday" });
    expect(field).toHaveAttribute("aria-haspopup", "dialog");
    expect(field).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a sheet of wheels on today's day and month, with no year asked", async () => {
    render(<Harness />);
    const sheet = await open();
    expect(within(sheet).getByText("23 October")).toBeInTheDocument();
    expect(picked("Day")).toBe("23");
    expect(picked("Month")).toBe("October");
    expect(screen.queryByRole("listbox", { name: "Year" })).not.toBeInTheDocument();
  });

  it("saves only on Done, and reads back what was picked", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await open();
    press("Month", "ArrowUp", 7); // October → March
    press("Day", "ArrowDown", 2); // 23 → 25
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith({ month: 3, day: 25, year: null });
    expect(screen.getByRole("button", { name: "Your birthday 25 March" })).toBeInTheDocument();
  });

  it("changes nothing when cancelled", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await open();
    press("Month", "Home");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("never offers a day the month does not have, and never forgets the one picked", async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ month: 1, day: 31 }} onChange={onChange} />);
    await open();
    press("Month", "ArrowDown"); // February keeps the 29th without a year
    expect(picked("Day")).toBe("29");
    expect(within(wheel("Day")).getAllByRole("option")).toHaveLength(29);
    press("Month", "ArrowDown"); // March: the 31st again
    expect(picked("Day")).toBe("31");
    press("Month", "ArrowDown"); // April
    expect(picked("Day")).toBe("30");
    expect(within(wheel("Day")).getAllByRole("option")).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenLastCalledWith({ month: 4, day: 30, year: null });
  });

  it("finds a value by typing it, in either script", async () => {
    render(<Harness />);
    await open();
    fireEvent.keyDown(wheel("Month"), { key: "m" });
    fireEvent.keyDown(wheel("Month"), { key: "a" });
    fireEvent.keyDown(wheel("Month"), { key: "y" });
    expect(picked("Month")).toBe("May");
    fireEvent.keyDown(wheel("Day"), { key: "١" });
    fireEvent.keyDown(wheel("Day"), { key: "٧" });
    expect(picked("Day")).toBe("17");
  });

  it("takes a value a screen reader activates", async () => {
    render(<Harness />);
    await open();
    await userEvent.click(within(wheel("Month")).getByRole("option", { name: "June" }));
    expect(picked("Month")).toBe("June");
    expect(wheel("Month")).toHaveAttribute("aria-activedescendant", within(wheel("Month")).getByRole("option", { name: "June" }).id);
  });

  it("offers the year as optional: it starts on no year, and a year is a choice", async () => {
    const onChange = vi.fn();
    render(<Harness year="optional" onChange={onChange} />);
    await open();
    expect(picked("Year")).toBe("No year");
    expect(screen.getByText(/the year is optional/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenLastCalledWith({ month: 10, day: 23, year: null });

    await open();
    press("Year", "ArrowDown", 37); // No year → 2026 … 1990
    expect(picked("Year")).toBe("1990");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenLastCalledWith({ month: 10, day: 23, year: 1990 });
    expect(screen.getByRole("button", { name: "Your birthday 23 October 1990" })).toBeInTheDocument();
  });

  it("asks a required year without a way round it, and never offers a day after today", async () => {
    render(<Harness year="required" />);
    await open();
    expect(within(wheel("Year")).queryByRole("option", { name: "No year" })).not.toBeInTheDocument();
    press("Year", "Home"); // this year
    expect(picked("Year")).toBe("2026");
    // Today is the 23rd of October: November and December are not offered.
    expect(within(wheel("Month")).getAllByRole("option")).toHaveLength(10);
    press("Month", "End");
    expect(within(wheel("Day")).getAllByRole("option")).toHaveLength(23);
  });

  it("clears in one tap", async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ month: 3, day: 17 }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove the birthday" }));
    expect(onChange).toHaveBeenCalledWith({ month: null, day: null, year: null });
    expect(screen.getByRole("button", { name: "Your birthday Add your birthday" })).toBeInTheDocument();
  });

  it("speaks Arabic, with the months the reader knows", async () => {
    await i18n.changeLanguage("ar");
    render(<Harness initial={{ month: 3, day: 17 }} />);
    expect(screen.getByText("17 مارس")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /17 مارس/ }));
    await screen.findByRole("dialog");
    expect(picked("الشهر")).toBe("مارس");
    expect(picked("اليوم")).toBe("17");
    expect(screen.getByRole("button", { name: "تم" })).toBeInTheDocument();
  });
});
