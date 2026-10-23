/**
 * The sign-up, step by step, against the API's real shapes: what is sent,
 * which step follows which answer, and that the card under it is theirs.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JoinInfo, JoinResult } from "@/data/api/generated/models";

const api = vi.hoisted(() => ({ join: vi.fn(), otpRequest: vi.fn(), otpVerify: vi.fn() }));
let info: JoinInfo;
vi.mock("@/data/api/generated/api", () => ({
  useLoyaltyJoinInfo: () => ({ data: info, isLoading: false, error: null, refetch: vi.fn() }),
  useLoyaltyJoin: () => ({ mutateAsync: api.join, isPending: false }),
  useOtpRequest: () => ({ mutateAsync: api.otpRequest, isPending: false }),
  useOtpVerify: () => ({ mutateAsync: api.otpVerify, isPending: false }),
}));

const i18n = (await import("@/i18n")).default;
const { JoinPage } = await import("./join-page");
const { clearDeviceToken } = await import("@/features/public-shell/guest");

const brand = {
  org_name: "Bean & Brew", program_name: "Rewards", program_name_ar: "مكافآت", logo_url: null, logo_is_mark: false,
  card_image_url: null, background_color: "#0D6273", foreground_color: "#EFF3F4", label_color: "#2E94A6", social_links: [],
};
const baseInfo: JoinInfo = {
  branch_id: "b1", branch_name: "Zamalek", brand, enabled: true, require_otp: false, birthday_enabled: false,
  birthday_reward_amount: null, mode: "visits", next_reward_cost: 6, earn_piastres_per_point: 1000, rewards: [],
  terms: null, terms_ar: null,
};
const member: JoinResult = {
  member_token: "tok", name: "Salma", balance: 0, mode: "visits", next_reward_cost: 6, brand,
  passes: { any: false }, already_member: false, verify_required: false, card_link_sent: false,
};
const PHONE = "201001234567";

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <JoinPage branchId="b1" />
    </QueryClientProvider>,
  );
const fill = async (name = "Salma") => {
  await userEvent.type(screen.getByLabelText("Your name"), name);
  await userEvent.type(document.getElementById("loyalty-phone")!, "1001234567");
};
const getMyCard = () => userEvent.click(screen.getByRole("button", { name: "Get my card" }));
const refusal = (status: number, error: string) =>
  new AxiosError(error, "ERR_BAD_REQUEST", undefined, undefined, { status, data: { error, code: null } } as AxiosResponse);

beforeEach(async () => {
  info = { ...baseInfo };
  api.join.mockReset();
  api.otpRequest.mockReset().mockResolvedValue({ sent: true });
  api.otpVerify.mockReset().mockResolvedValue({ device_token: "dt" });
  clearDeviceToken(PHONE);
  await i18n.changeLanguage("en");
});

describe("the sign-up", () => {
  it("says what is missing, under the field, and puts the cursor there", async () => {
    mount();
    await getMyCard();
    expect(screen.getByText("Add your name — it goes on your card.")).toBeInTheDocument();
    expect(screen.getByText(/Enter all 10 digits after \+20/)).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText("Your name"));
    expect(api.join).not.toHaveBeenCalled();
  });

  it("writes the name on the card as it is typed", async () => {
    mount();
    expect(screen.getByText("Your name", { selector: "p" })).toBeInTheDocument(); // the card's placeholder
    await userEvent.type(screen.getByLabelText("Your name"), "Salma Adel");
    expect(screen.getByText("Salma Adel", { selector: "p" })).toBeInTheDocument();
  });

  it("joins at once where the shop asks no code, and hands over the card", async () => {
    api.join.mockResolvedValue(member);
    mount();
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "You're in" })).toBeInTheDocument();
    expect(api.join).toHaveBeenCalledWith({
      data: {
        branch_id: "b1", org_id: undefined, name: "Salma", phone: PHONE, device_token: undefined, locale: "en",
        birth_month: undefined, birth_day: undefined,
      },
    });
    expect(api.otpRequest).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /View my card/ })).toHaveAttribute("href", "/card/tok");
    expect(screen.getByRole("img", { name: "Your membership code" })).toHaveAttribute("src", "/api/public/loyalty/card/tok/qr.png");
  });

  it("asks a number that already has a card to prove it, then brings the card back", async () => {
    api.join
      .mockResolvedValueOnce({ ...member, member_token: null, passes: null, already_member: true, verify_required: true, card_link_sent: true })
      .mockResolvedValueOnce({ ...member, name: "Salma Adel", balance: 4, already_member: true });
    mount();
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "This number already has a card" })).toBeInTheDocument();
    expect(screen.getByText(/sent your Bean & Brew card's link/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send me a code" }));
    expect(api.otpRequest).toHaveBeenCalledWith({ data: { phone: PHONE } });
    expect(await screen.findByRole("heading", { name: "Check your WhatsApp" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Digit 1 of 4" }), { target: { value: "1234" } });
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(api.join).toHaveBeenLastCalledWith({ data: expect.objectContaining({ phone: PHONE, device_token: "dt" }) });
  });

  it("asks for the WhatsApp code first where the shop requires one", async () => {
    info = { ...baseInfo, require_otp: true };
    api.join.mockResolvedValue(member);
    mount();
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "Check your WhatsApp" })).toBeInTheDocument();
    expect(screen.getByText("+20 100 123 4567")).toBeInTheDocument();
    // The resend waits out the server's minute rather than inviting a refusal.
    expect(screen.getByRole("button", { name: /Resend the code in 1:00|Resend the code in 0:59/ })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Digit 1 of 4" }), { target: { value: "1234" } });
    expect(await screen.findByRole("heading", { name: "You're in" })).toBeInTheDocument();
    expect(api.otpVerify).toHaveBeenCalledWith({ data: { phone: PHONE, code: "1234" } });
    expect(api.join).toHaveBeenCalledWith({ data: expect.objectContaining({ device_token: "dt" }) });
  });

  it("takes 'a code was just sent' as sent: that code still works", async () => {
    info = { ...baseInfo, require_otp: true };
    api.otpRequest.mockRejectedValue(refusal(409, "Conflict: A code was just sent. Please wait a minute."));
    mount();
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "Check your WhatsApp" })).toBeInTheDocument();
  });

  it("asks for a birthday only where the shop runs birthdays, and says what it is for", async () => {
    mount();
    expect(screen.queryByRole("button", { name: /Your birthday/ })).not.toBeInTheDocument();
  });

  it("names the birthday gift in the programme's own unit", async () => {
    info = { ...baseInfo, birthday_enabled: true, birthday_reward_amount: 2 };
    mount();
    expect(screen.getByRole("button", { name: /Your birthday.*Add your birthday/ })).toBeInTheDocument();
    expect(screen.getByText(/add 2 stamps to your card\. We don't ask for the year\./)).toBeInTheDocument();
  });

  it("states the small print before the button, with the way out", () => {
    info = { ...baseInfo, terms: "One stamp per order." };
    mount();
    const consent = within(screen.getByText(/By joining you agree/).closest("p")!);
    expect(consent.getByRole("link", { name: "programme terms" })).toHaveAttribute("href", "#loyalty-terms");
    expect(consent.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("target", "_blank");
    expect(consent.getByText(/turn them off from your card at any time/)).toBeInTheDocument();
    expect(document.getElementById("loyalty-terms")).toHaveTextContent("One stamp per order.");
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByRole("heading", { name: "احصل على بطاقة مكافآت" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "احصل على بطاقتي" })).toBeInTheDocument();
    expect(screen.getByText("ختم لكل طلب. اجمع 6 لتحصل على مكافأة.")).toBeInTheDocument();
  });
});
