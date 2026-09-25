import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TimeField } from "./time-field";
import { TimeRangeField, rangeProblem, type TimeRange } from "./time-range-field";
import { DurationField } from "./duration-field";
import { MoneyField } from "./money-field";
import { WeekdayPicker } from "./weekday-picker";
import { PhoneField } from "./phone-field";

const i18n = (await import("@/i18n")).default;

beforeAll(async () => {
  await i18n.changeLanguage("en");
  // jsdom has no scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(async () => {
  await i18n.changeLanguage("en");
  document.documentElement.dir = "ltr";
});

function Time({ initial = "", onChange = vi.fn(), clearable = false }: { initial?: string; onChange?: (v: string) => void; clearable?: boolean }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <label htmlFor="t">Start</label>
      <TimeField id="t" value={v} clearable={clearable} onChange={(x) => { setV(x); onChange(x); }} />
      <output data-testid="value">{v}</output>
    </>
  );
}

describe("TimeField", () => {
  it("reads 930 as 09:30 and shows it on the 12-hour clock", async () => {
    const onChange = vi.fn();
    render(<Time onChange={onChange} />);
    const input = screen.getByLabelText("Start");
    await userEvent.type(input, "930");
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith("09:30");
    expect(input).toHaveValue("09:30 AM");
  });

  it("reads a typed pm", async () => {
    render(<Time />);
    await userEvent.type(screen.getByLabelText("Start"), "9:30p{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("21:30");
  });

  it("refuses what it can't read, keeps the last good time and says why", async () => {
    const onChange = vi.fn();
    render(<Time initial="08:00" onChange={onChange} />);
    const input = screen.getByLabelText("Start");
    await userEvent.clear(input);
    await userEvent.type(input, "9x");
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(`Couldn't read "9x"`);
    expect(screen.getByRole("alert")).toHaveTextContent("Kept 08:00 AM");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("08:00 AM");
    // Typing again clears the complaint.
    await userEvent.type(input, "1");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a required time can't be emptied; a clearable one can", async () => {
    const onChange = vi.fn();
    const { unmount } = render(<Time initial="08:00" onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Start"));
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Start")).toHaveValue("08:00 AM");
    unmount();

    render(<Time initial="08:00" onChange={onChange} clearable />);
    await userEvent.click(screen.getByRole("button", { name: "Clear the time" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("works by keyboard: ↓ opens the list, ↓ moves a quarter hour, PgDn an hour, Enter picks", async () => {
    render(<Time initial="09:00" />);
    const input = screen.getByLabelText("Start");
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveValue("09:15 AM");
    await userEvent.keyboard("{PageDown}");
    expect(input).toHaveValue("10:15 AM");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/10:15$/);
    await userEvent.keyboard("{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("10:15");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("Escape closes the list, then undoes the typing", async () => {
    render(<Time initial="09:00" />);
    const input = screen.getByLabelText("Start");
    await userEvent.clear(input);
    await userEvent.type(input, "11");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("09:00 AM");
  });

  it("picks from the list with the mouse or a tap", async () => {
    render(<Time />);
    await userEvent.click(screen.getByLabelText("Start"));
    await userEvent.click(screen.getByRole("option", { name: "06:30 PM" }));
    expect(screen.getByTestId("value")).toHaveTextContent("18:30");
  });

  it("in Arabic: ص/م with Latin digits, and Arabic-Indic typing", async () => {
    await i18n.changeLanguage("ar");
    document.documentElement.dir = "rtl";
    render(<Time initial="21:30" />);
    const input = screen.getByLabelText("Start");
    expect(input).toHaveValue("09:30 م");
    await userEvent.clear(input);
    await userEvent.type(input, "٧:١٥ ص");
    await userEvent.tab();
    expect(screen.getByTestId("value")).toHaveTextContent("07:15");
    expect(input).toHaveValue("07:15 ص");
  });

  it("can show a 24-hour face", () => {
    render(<TimeField aria-label="t24" value="21:30" hourCycle="h23" onChange={() => {}} />);
    expect(screen.getByLabelText("t24")).toHaveValue("21:30");
  });
});

function Range({ initial, onChange = vi.fn() }: { initial: TimeRange; onChange?: (r: TimeRange) => void }) {
  const [v, setV] = useState(initial);
  return <TimeRangeField value={v} onChange={(r) => { setV(r); onChange(r); }} />;
}

describe("TimeRangeField", () => {
  it("shows the length of a day shift", () => {
    render(<Range initial={{ start: "09:00", end: "17:00" }} />);
    expect(screen.getByText("8 h")).toBeInTheDocument();
    expect(screen.queryByText("Ends the next day")).toBeNull();
  });

  it("an overnight shift is a badge, not an error", () => {
    render(<Range initial={{ start: "22:00", end: "06:00" }} />);
    expect(screen.getByText("8 h")).toBeInTheDocument();
    expect(screen.getByText("Ends the next day")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("the same time at both ends is refused", () => {
    render(<Range initial={{ start: "09:00", end: "09:00" }} />);
    expect(screen.getByText("It can't start and end at the same time.")).toBeInTheDocument();
    expect(screen.getByLabelText("Starts")).toHaveAttribute("aria-invalid", "true");
  });

  it("catches 9 to 5 typed as 09:00 → 05:00 and fixes it in one tap", async () => {
    const onChange = vi.fn();
    render(<Range initial={{ start: "09:00", end: "05:00" }} onChange={onChange} />);
    expect(screen.getByText(/That's 20 h, overnight/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "End at 05:00 PM instead" }));
    expect(onChange).toHaveBeenLastCalledWith({ start: "09:00", end: "17:00" });
    expect(screen.getByText("8 h")).toBeInTheDocument();
  });

  it("each end-time pick says how long the shift would be", async () => {
    render(<Range initial={{ start: "16:00", end: "" }} />);
    await userEvent.click(screen.getByLabelText("Ends"));
    expect(screen.getByRole("option", { name: /12:00 AM\s*8 h · next day/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /11:00 PM\s*7 h$/ })).toBeInTheDocument();
  });

  it("rangeProblem", () => {
    expect(rangeProblem({ start: "22:00", end: "06:00" })).toBeNull();
    expect(rangeProblem({ start: "", end: "" }, true)).toBeNull();
    expect(rangeProblem({ start: "", end: "" })).toBe("missing_start");
    expect(rangeProblem({ start: "09:00", end: "" })).toBe("missing_end");
    expect(rangeProblem({ start: "09:00", end: "09:00" })).toBe("same_time");
  });
});

describe("DurationField", () => {
  function Dur({ initial = 15 as number | null, onChange = vi.fn() }) {
    const [v, setV] = useState<number | null>(initial);
    return <DurationField aria-label="Grace" unit="min" max={120} presets={[0, 10, 15, 30]} value={v} onChange={(n) => { setV(n); onChange(n); }} />;
  }

  it("steps with the arrow keys and the −/+ buttons", async () => {
    render(<Dur />);
    const input = screen.getByRole("spinbutton", { name: "Grace" });
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input).toHaveValue("20");
    await userEvent.click(screen.getByRole("button", { name: "Less" }));
    await userEvent.click(screen.getByRole("button", { name: "Less" }));
    expect(input).toHaveValue("10");
  });

  it("refuses a value past the limit and keeps the old one", async () => {
    const onChange = vi.fn();
    render(<Dur onChange={onChange} />);
    const input = screen.getByRole("spinbutton", { name: "Grace" });
    await userEvent.clear(input);
    await userEvent.type(input, "500");
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Between 0 and 120 min");
    expect(input).toHaveValue("15");
  });

  it("presets and the hours read-back", async () => {
    render(<DurationField aria-label="Break" unit="min" value={90} onChange={() => {}} />);
    expect(screen.getByText("= 1 h 30 min")).toBeInTheDocument();
  });
});

describe("MoneyField", () => {
  it("stores piastres, shows and takes pounds", async () => {
    const onChange = vi.fn();
    function M() {
      const [v, setV] = useState<number | null>(1250000);
      return <MoneyField aria-label="Salary" value={v} onChange={(p) => { setV(p); onChange(p); }} />;
    }
    render(<M />);
    const input = screen.getByRole("spinbutton", { name: "Salary" });
    expect(input).toHaveValue("12,500.00");
    await userEvent.clear(input);
    await userEvent.type(input, "٨٬٠٠٠٫٥");
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(800050);
    expect(input).toHaveValue("8,000.50");
    expect(screen.getByText("EGP")).toBeInTheDocument();
  });
});

describe("WeekdayPicker", () => {
  function Days({ initial = [6, 0, 1] }: { initial?: number[] }) {
    const [v, setV] = useState(initial);
    return (
      <>
        <WeekdayPicker value={v} onChange={setV} />
        <output data-testid="days">{v.join(",")}</output>
      </>
    );
  }

  it("Saturday first; toggles; shortcuts", async () => {
    render(<Days />);
    const chips = screen.getAllByRole("button", { pressed: true }).concat(screen.getAllByRole("button", { pressed: false }));
    expect(chips.length).toBeGreaterThanOrEqual(7);
    const group = screen.getByRole("group", { name: "Days of the week" });
    const names = [...group.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    await userEvent.click(screen.getByRole("button", { name: "Friday" }));
    expect(screen.getByTestId("days")).toHaveTextContent("0,1,5,6");
    await userEvent.click(screen.getByRole("button", { name: "Every day" }));
    expect(screen.getByTestId("days")).toHaveTextContent("0,1,2,3,4,5,6");
  });

  it("the arrow keys follow reading order, so they flip in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<Days />);
    const group = screen.getByRole("group");
    const [sat, sun] = [...group.querySelectorAll("button")];
    sat.focus();
    fireEvent.keyDown(sat, { key: "ArrowLeft" }); // forward in RTL
    expect(document.activeElement).toBe(sun);
    fireEvent.keyDown(sun, { key: "ArrowRight" });
    expect(document.activeElement).toBe(sat);
    // Only one chip is a tab stop.
    expect([...group.querySelectorAll("button")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });
});

describe("PhoneField", () => {
  function P() {
    const [v, setV] = useState("");
    return <PhoneField aria-label="Phone" value={v} onChange={setV} />;
  }
  it("says what's wrong only after leaving the field, and reads a good number back", async () => {
    render(<P />);
    const input = screen.getByLabelText("Phone");
    await userEvent.type(input, "010123");
    expect(screen.queryByRole("alert")).toBeNull();
    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
    await userEvent.type(input, "45678");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("+20 101 234 5678")).toBeInTheDocument();
  });
});
