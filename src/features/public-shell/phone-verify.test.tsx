/**
 * The one phone + code component behind ordering, bookings and the loyalty
 * sign-up, driven through an injected transport — no endpoint is assumed.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneVerify } from "./phone-verify";
import type { PhoneOtpTransport } from "./use-phone-otp";

const transport = (over: Partial<PhoneOtpTransport> = {}): PhoneOtpTransport => ({
  requestCode: vi.fn().mockResolvedValue(undefined),
  verifyCode: vi.fn().mockResolvedValue("device-tok"),
  sending: false,
  verifying: false,
  ...over,
});

function mount(props: Partial<React.ComponentProps<typeof PhoneVerify>> & { transport: PhoneOtpTransport }) {
  const onVerified = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PhoneVerify
        otpRequired
        onVerified={onVerified}
        copy={{ title: "Your number", hint: "We will text you", sent: (p) => `Sent to ${p}`, submitLabel: "Go" }}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onVerified };
}

const phoneBox = () => screen.getByRole("textbox", { name: "Your number" });
const codeBoxes = () => screen.getAllByRole("textbox", { name: /Verification code/i });

beforeEach(() => localStorage.clear());

describe("PhoneVerify", () => {
  it("refuses a number that is not a phone, without calling anything", async () => {
    const tr = transport();
    const { onVerified } = mount({ transport: tr });
    await userEvent.type(phoneBox(), "12345");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(tr.requestCode).not.toHaveBeenCalled();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("takes the number as-is when OTP is off, in canonical form", async () => {
    const tr = transport();
    const { onVerified } = mount({ transport: tr, otpRequired: false });
    await userEvent.type(phoneBox(), "0100 123 4567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onVerified).toHaveBeenCalledWith("201001234567", null);
    expect(tr.requestCode).not.toHaveBeenCalled();
  });

  it("skips the code for a phone this device already proved", async () => {
    localStorage.setItem("madar_delivery_device:201001234567", "old-tok");
    const tr = transport();
    const { onVerified } = mount({ transport: tr });
    await userEvent.type(phoneBox(), "+20 100 123 4567");
    await userEvent.keyboard("{Enter}");
    expect(onVerified).toHaveBeenCalledWith("201001234567", "old-tok");
    expect(tr.requestCode).not.toHaveBeenCalled();
  });

  it("requests a code, verifies it, remembers the device", async () => {
    const tr = transport();
    const { onVerified } = mount({ transport: tr });
    await userEvent.type(phoneBox(), "01001234567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(tr.requestCode).toHaveBeenCalledWith("201001234567"));
    expect(await screen.findByText(/Sent to .*\+20 100 123 4567/)).toBeInTheDocument();

    await userEvent.type(codeBoxes()[0], "1");
    await userEvent.type(codeBoxes()[1], "2");
    await userEvent.type(codeBoxes()[2], "3");
    expect(tr.verifyCode).not.toHaveBeenCalled();
    await userEvent.type(codeBoxes()[3], "4");
    await waitFor(() => expect(tr.verifyCode).toHaveBeenCalledWith("201001234567", "1234"));
    await waitFor(() => expect(onVerified).toHaveBeenCalledWith("201001234567", "device-tok"));
    expect(localStorage.getItem("madar_delivery_device:201001234567")).toBe("device-tok");
  });

  it("takes a pasted code in any box", async () => {
    const tr = transport();
    mount({ transport: tr });
    await userEvent.type(phoneBox(), "01001234567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    const boxes = await waitFor(codeBoxes);
    boxes[1].focus();
    await userEvent.paste("9876");
    await waitFor(() => expect(tr.verifyCode).toHaveBeenCalledWith("201001234567", "9876"));
  });

  it("a wrong code empties the boxes and says so; nothing is remembered", async () => {
    const tr = transport({ verifyCode: vi.fn().mockRejectedValue(new Error("no")) });
    const { onVerified } = mount({ transport: tr });
    await userEvent.type(phoneBox(), "01001234567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    const boxes = await waitFor(codeBoxes);
    boxes[0].focus();
    await userEvent.paste("0000");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await waitFor(() => expect(codeBoxes().every((b) => (b as HTMLInputElement).value === "")).toBe(true));
    expect(onVerified).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it("a code that cannot be sent stays on the phone", async () => {
    const tr = transport({ requestCode: vi.fn().mockRejectedValue(new Error("no")) });
    mount({ transport: tr });
    await userEvent.type(phoneBox(), "01001234567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(phoneBox()).toBeInTheDocument();
  });

  it("resends, and goes back to change the number", async () => {
    const tr = transport();
    mount({ transport: tr });
    await userEvent.type(phoneBox(), "01001234567");
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    await userEvent.click(await screen.findByRole("button", { name: /Resend/i }));
    await waitFor(() => expect(tr.requestCode).toHaveBeenCalledTimes(2));
    await userEvent.click(screen.getByRole("button", { name: /Change number/i }));
    expect(phoneBox()).toHaveValue("01001234567");
  });
});
