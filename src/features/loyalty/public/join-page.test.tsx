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

  it("draws the shop's published design, live with the name and the code's kept place", async () => {
    const { cardRulesNow } = await import("@/lib/rules/card");
    const w = cardRulesNow()!;
    const colours = { background: "#0D6273", foreground: "#EFF3F4", label: "#B9DCE3" };
    const tracks = [{ position: 1, name_en: "Coffee", name_ar: "قهوة", size: null, shape: "cup", colour: null, items: [], per_item: true, cap: null }];
    const design = w.card_default(colours, { mode: "visits", tracks: [{ position: 1, size: 6 }], has_photo: false }, tracks as never);
    info = { ...baseInfo, card: { revision: 1, design, tracks, track_one_size: 6, stamp_unit: "order" } } as JoinInfo;
    mount();
    // The page holds its skeleton until the design's code is there, then draws it once.
    const card = await screen.findByRole("group", { name: "Bean & Brew card" });
    expect(card.querySelector("svg")).not.toBeNull();
    expect(within(card).getByText("Your name", { selector: "bdi" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your name"), "Salma");
    expect(within(card).getByText("Salma", { selector: "bdi" })).toBeInTheDocument();
  });

  it("draws a returning member's every track when the answer carries them, and track 1 alone when not", async () => {
    const { cardRulesNow } = await import("@/lib/rules/card");
    const w = cardRulesNow()!;
    const tracks = [
      { position: 1, name_en: "Coffee", name_ar: "قهوة", size: null, shape: "cup", colour: null, items: [], per_item: true, cap: null },
      { position: 2, name_en: "Sandwich", name_ar: "ساندوتش", size: 6, shape: "heart", colour: "#F2B33D", items: [], per_item: true, cap: null },
    ];
    const ctx = { mode: "visits" as const, tracks: [{ position: 1, size: 6 }, { position: 2, size: 6 }], has_photo: false };
    const design = w.card_default({ background: "#0D6273", foreground: "#EFF3F4", label: "#B9DCE3" }, ctx, tracks as never);
    info = { ...baseInfo, card: { revision: 1, design, tracks, track_one_size: 6, stamp_unit: "order" } } as JoinInfo;
    const mt = (position: number, name_en: string, balance: number) => ({
      position, name_en, name_ar: "", size: 6, balance, rewards_ready: Math.floor(balance / 6), progress_to_next: balance % 6,
      points_to_next_reward: 6 - (balance % 6), can_redeem: balance >= 6,
    });
    api.join.mockResolvedValueOnce({ ...member, balance: 4, already_member: true, tracks: [mt(1, "Coffee", 4), mt(2, "Sandwich", 7)] });
    const { unmount } = mount();
    await screen.findByRole("group", { name: "Bean & Brew card" });
    expect(screen.queryByText(/Sandwich · Reward ready/)).toBeNull();
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText(/Sandwich · Reward ready/)).toBeInTheDocument(); // 7 of 6 on track 2
    unmount();

    // No tracks on the answer (an unproven retry, or one track): track 1 only, as before.
    api.join.mockResolvedValueOnce({ ...member, balance: 4, already_member: true });
    mount();
    await screen.findByRole("group", { name: "Bean & Brew card" });
    await fill();
    await getMyCard();
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.queryByText(/Sandwich · Reward ready/)).toBeNull();
  });

  it("writes the name on the card as it is typed", async () => {
    mount();
    expect(screen.getByText("Your name", { selector: "bdi" })).toBeInTheDocument(); // the card's placeholder
    await userEvent.type(screen.getByLabelText("Your name"), "Salma Adel");
    expect(screen.getByText("Salma Adel", { selector: "bdi" })).toBeInTheDocument();
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
    expect(document.body).toHaveTextContent(/sent your Bean & Brew card's link/);
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

  it("names a free item when the birthday gives one, never a stamp", async () => {
    info = { ...baseInfo, birthday_enabled: true, birthday_reward_amount: 2, birthday_gift: "item" } as JoinInfo;
    const { unmount } = mount();
    expect(screen.getByText("We'll wish you a happy birthday and give you a free item on us. We don't ask for the year.")).toBeInTheDocument();
    expect(screen.queryByText(/birthday.*stamp/i)).not.toBeInTheDocument();
    unmount();
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByText("سنهنئك بعيد ميلادك ونقدّم لك منتجًا مجانيًا على حسابنا. لا نسأل عن السنة.")).toBeInTheDocument();
  });

  it("keeps the stamps wording for an 'amount' birthday", () => {
    info = { ...baseInfo, birthday_enabled: true, birthday_reward_amount: 2, birthday_gift: "amount" } as JoinInfo;
    mount();
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

  it("says how many hold the card only when the server vouches for more than 100", async () => {
    const { rerender } = mount();
    expect(screen.queryByText(/already have this card/)).not.toBeInTheDocument();
    for (const [member_count, shown] of [[null, null], [100, null], [250, "250+ people already have this card"], [1200, "1,200+ people already have this card"]] as const) {
      info = { ...baseInfo, member_count } as JoinInfo;
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <JoinPage branchId="b1" key={String(member_count)} />
        </QueryClientProvider>,
      );
      if (shown) expect(screen.getByText(shown)).toBeInTheDocument();
      else expect(screen.queryByText(/already have this card/)).not.toBeInTheDocument();
    }
    await i18n.changeLanguage("ar");
    info = { ...baseInfo, member_count: 250 } as JoinInfo;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <JoinPage branchId="b1" key="ar" />
      </QueryClientProvider>,
    );
    expect(screen.getByText("أكثر من 250 شخصًا يحملون هذه البطاقة")).toBeInTheDocument();
  });

  it("speaks the programme's unit in every line that prints a figure", async () => {
    info = {
      ...baseInfo, stamp_unit: "item",
      rewards: [{ name: "Any hot drink", cost_currency: "visits", cost_amount: 6 }, { name: "Cake", cost_currency: "visits", cost_amount: 1 }],
    } as JoinInfo;
    api.join.mockResolvedValue(member);
    const { unmount } = mount();
    expect(screen.getByText("A stamp for every item you buy. Collect 6 for a reward.")).toBeInTheDocument();
    expect(screen.getByText("6 more items to your next reward.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 of 6 items" })).toBeInTheDocument();
    expect(screen.getByText("Any hot drink").closest("li")).toHaveTextContent("6 items");
    expect(screen.getByText("Cake").closest("li")).toHaveTextContent("1 item");
    await fill();
    await getMyCard();
    expect(await screen.findByText("Show it when you pay, and every item you buy adds a stamp.")).toBeInTheDocument();
    unmount();

    info = { ...baseInfo, stamp_unit: "stamp" } as JoinInfo;
    mount();
    expect(screen.getByText("Your card is stamped at the counter. Collect 6 for a reward.")).toBeInTheDocument();
    expect(screen.getByText("6 more stamps to your next reward.")).toBeInTheDocument();
  });

  it("sizes the card by the server's cheapest-reward card_size when it sends one, else by next_reward_cost", () => {
    info = { ...baseInfo, next_reward_cost: 6, card_size: 5 } as JoinInfo;
    const { unmount } = mount();
    expect(screen.getByRole("img", { name: "0 of 5 orders" })).toBeInTheDocument();
    expect(screen.getByText("5 more orders to your next reward.")).toBeInTheDocument();
    expect(screen.getByText("A stamp for every order. Collect 5 for a reward.")).toBeInTheDocument();
    unmount();
    info = { ...baseInfo, next_reward_cost: 6 };
    mount();
    expect(screen.getByRole("img", { name: "0 of 6 orders" })).toBeInTheDocument();
  });

  it("names the shop in the heading", () => {
    info = { ...baseInfo, brand: { ...brand, program_name: "Bean Club" } };
    mount();
    expect(screen.getByRole("heading", { name: "Get your Bean & Brew card" })).toBeInTheDocument();
    expect(screen.getByText("Bean Club")).toBeInTheDocument(); // the programme, on the card
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByRole("heading", { name: "احصل على بطاقة Bean & Brew" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "احصل على بطاقتي" })).toBeInTheDocument();
    expect(screen.getByText("ختم لكل طلب. اجمع 6 أختام لتحصل على مكافأة.")).toBeInTheDocument();
    expect(screen.getByText("بقيت 6 طلبات لمكافأتك التالية.")).toBeInTheDocument();
  });
});
