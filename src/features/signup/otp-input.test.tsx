import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { OtpInput } = await import("./otp-input");

function Harness({ onComplete, invalid }: { onComplete?: (v: string) => void; invalid?: boolean }) {
  const [v, setV] = useState("");
  return <OtpInput value={v} onChange={setV} onComplete={onComplete} invalid={invalid} autoFocus />;
}
const box = (n: number) => screen.getByLabelText(`Digit ${n} of 6`);

describe("OtpInput", () => {
  it("is six labelled boxes, the first marked for one-time-code autofill, always left-to-right", () => {
    render(<Harness />);
    const group = screen.getByRole("group", { name: "Verification code" });
    expect(group).toHaveAttribute("dir", "ltr");
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(box(1)).toHaveAttribute("autocomplete", "one-time-code");
    expect(box(2)).toHaveAttribute("autocomplete", "off");
    expect(box(1)).toHaveAttribute("inputmode", "numeric");
    expect(box(1)).toHaveFocus();
  });

  it("advances on each digit and completes on the sixth", async () => {
    const done = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={done} />);
    await user.keyboard("12345");
    expect(box(6)).toHaveFocus();
    expect(done).not.toHaveBeenCalled();
    await user.keyboard("6");
    expect(done).toHaveBeenCalledOnce();
    expect(done).toHaveBeenCalledWith("123456");
  });

  it("ignores letters and reads Arabic digits", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard("a١b٢");
    expect(box(1)).toHaveValue("1");
    expect(box(2)).toHaveValue("2");
    expect(box(3)).toHaveValue("");
  });

  it("Backspace clears a digit, then steps back to the previous box", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard("123");
    expect(box(4)).toHaveFocus();
    await user.keyboard("{Backspace}");
    expect(box(3)).toHaveFocus();
    expect(box(3)).toHaveValue("");
    expect(box(2)).toHaveValue("2");
    await user.keyboard("{Backspace}");
    expect(box(2)).toHaveFocus();
    expect(box(2)).toHaveValue("");
  });

  it("the arrow keys move between boxes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard("12{ArrowLeft}");
    expect(box(2)).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(box(3)).toHaveFocus();
  });

  it("a paste fills every box and completes, whichever box it lands in", async () => {
    const done = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={done} />);
    await user.click(box(3));
    await user.paste("483 920");
    expect(screen.getAllByRole("textbox").map((e) => (e as HTMLInputElement).value).join("")).toBe("483920");
    expect(done).toHaveBeenCalledWith("483920");
  });

  it("an autofill that drops the whole code into the first box spreads over all six", async () => {
    const done = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={done} />);
    await user.click(box(1));
    // An SMS/WhatsApp autofill arrives as one change event carrying every digit.
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(box(1), { target: { value: "908172" } });
    expect(box(6)).toHaveValue("2");
    expect(done).toHaveBeenCalledWith("908172");
  });

  it("a few pasted digits go in from the focused box and do not complete", async () => {
    const done = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={done} />);
    await user.keyboard("12");
    await user.click(box(2));
    await user.paste("77");
    expect(screen.getAllByRole("textbox").map((e) => (e as HTMLInputElement).value).join("")).toBe("177");
    expect(done).not.toHaveBeenCalled();
  });

  it("never leaves a gap: a click past the next empty box lands on it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard("12");
    await user.click(box(5));
    expect(box(3)).toHaveFocus();
  });

  it("deleting a digit in the middle closes the gap", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard("1234");
    await user.click(box(2));
    await user.keyboard("{Backspace}");
    expect(screen.getAllByRole("textbox").map((e) => (e as HTMLInputElement).value).join("")).toBe("134");
  });

  it("marks every box invalid on a wrong code", () => {
    render(<Harness invalid />);
    for (let i = 1; i <= 6; i++) expect(box(i)).toBeInvalid();
  });
});
