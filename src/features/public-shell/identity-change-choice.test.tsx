/**
 * The "just this order / this is me now" question: a name edit is answered by
 * default; a phone edit is not, and cannot go on until it is.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
const { IdentityChangeChoice } = await import("./identity-change-choice");

const phoneProps = { kind: "phone" as const, open: true, currentPhone: "201001234567", newPhone: "01112345678" };

describe("IdentityChangeChoice — name", () => {
  it("offers both answers inline, with the given one selected", async () => {
    await i18n.changeLanguage("en");
    const onChange = vi.fn();
    render(<IdentityChangeChoice kind="name" value="once" onChange={onChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Just this order/ })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: /Update my name/ }));
    expect(onChange).toHaveBeenCalledWith("replace");
  });
});

describe("IdentityChangeChoice — phone", () => {
  it("blocks with nothing chosen: Continue waits for an answer", async () => {
    await i18n.changeLanguage("en");
    const onConfirm = vi.fn();
    render(<IdentityChangeChoice {...phoneProps} value={null} onChange={() => {}} onConfirm={onConfirm} onCancel={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("+20 100 123 4567")).toBeInTheDocument();
    expect(within(dialog).getByText("+20 111 234 5678")).toBeInTheDocument();
    for (const radio of within(dialog).getAllByRole("radio")) expect(radio).not.toBeChecked();
    expect(within(dialog).getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("reports the answer, and goes on once there is one", async () => {
    await i18n.changeLanguage("en");
    const onChange = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <IdentityChangeChoice {...phoneProps} value={null} onChange={onChange} onConfirm={onConfirm} onCancel={() => {}} />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /This is my new number/ }));
    expect(onChange).toHaveBeenCalledWith("replace");
    rerender(<IdentityChangeChoice {...phoneProps} value="replace" onChange={onChange} onConfirm={onConfirm} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Keep my number and Escape both take the old number back", async () => {
    await i18n.changeLanguage("en");
    const onCancel = vi.fn();
    render(<IdentityChangeChoice {...phoneProps} value={null} onChange={() => {}} onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Keep my number" }));
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("cannot be answered or dismissed while the change is in flight", async () => {
    await i18n.changeLanguage("en");
    const onCancel = vi.fn();
    render(<IdentityChangeChoice {...phoneProps} value="replace" busy onChange={() => {}} onConfirm={() => {}} onCancel={onCancel} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
    expect(screen.getByRole("button", { name: "Keep my number" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    render(<IdentityChangeChoice {...phoneProps} value={null} onChange={() => {}} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("radio", { name: /هذا رقمي الجديد/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "أبقِ رقمي" })).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});
