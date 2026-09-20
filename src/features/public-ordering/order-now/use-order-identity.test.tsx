/**
 * What a changed name or phone means, settled at the moment the order is
 * placed (§4.4). Driven through a bare harness: the hook, a Place button, and
 * its own dialogs — the cart and the map have nothing to say about identity.
 *
 * Test phones are invented, and none is printed in a test name.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderIdentityFields, OrderNowSession, PlaceOutcome } from "./session";

const MINE = "201000004567";
const OTHER = "201000002222";
const OTHER_TYPED = "0100 000 2222";

const requestCode = vi.fn();
const verifyCode = vi.fn();
const replaceIdentity = vi.fn();
const combine = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useOtpRequest: () => ({ mutateAsync: requestCode, isPending: false }),
  useOtpVerify: () => ({ mutateAsync: verifyCode, isPending: false }),
  useOrderNowReplaceIdentity: () => ({ mutateAsync: replaceIdentity }),
  useOrderNowCombine: () => ({ mutateAsync: combine }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useOrderIdentity } = await import("./use-order-identity");

const refusal = (status: number, data: Record<string, unknown>) =>
  new AxiosError("refused", String(status), undefined, undefined, { status, data } as AxiosResponse);

const onIdentityReplaced = vi.fn();
const session: OrderNowSession = {
  memberToken: "card-token",
  orgId: "org-1",
  customer: { id: "c-1", name: "Sara Ali", phone: MINE },
  deviceToken: "tok-mine",
  lastBranch: null,
  addresses: [],
  paymentHint: null,
  onIdentityReplaced,
};

const place = vi.fn<(identity: OrderIdentityFields) => Promise<PlaceOutcome>>();
const report = vi.fn();
const onKeepNumber = vi.fn();

function Harness({ name, phone, otpRequired }: { name: string; phone: string; otpRequired: boolean }) {
  const identity = useOrderIdentity({ session, typed: { name, phone }, otpRequired, hasAddress: true, place, report, onKeepNumber });
  return (
    <>
      {identity.inline}
      <button type="button" onClick={() => void identity.begin()}>
        Place order
      </button>
      {identity.dialogs}
    </>
  );
}

const mount = (typed: { name?: string; phone?: string; otpRequired?: boolean } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness name={typed.name ?? "Sara Ali"} phone={typed.phone ?? "01000004567"} otpRequired={typed.otpRequired ?? false} />
    </QueryClientProvider>,
  );

const placeOrder = () => userEvent.click(screen.getByRole("button", { name: "Place order" }));
const choose = async (option: RegExp) => userEvent.click(await screen.findByRole("radio", { name: option }));
const go = (name: RegExp | string) => userEvent.click(screen.getByRole("button", { name }));
const typeCode = async () => {
  const boxes = await screen.findAllByRole("textbox", { name: /Verification code/i });
  boxes[0].focus();
  await userEvent.paste("1234");
};

beforeEach(() => {
  localStorage.clear();
  for (const fn of [requestCode, verifyCode, replaceIdentity, combine, place, report, onKeepNumber, onIdentityReplaced]) fn.mockReset();
  requestCode.mockResolvedValue(undefined);
  verifyCode.mockResolvedValue({ device_token: "tok-other" });
  replaceIdentity.mockResolvedValue({ customer_id: "c-1", combined: false, first_name: "Sara", phone_hint: "•••• 2222" });
  combine.mockResolvedValue({ customer_id: "c-1", combined: true, first_name: "Sara", phone_hint: "•••• 2222" });
  place.mockResolvedValue({ ok: true });
});

describe("useOrderIdentity", () => {
  it("nothing changed: the order goes as the customer, with the card's token and no question", async () => {
    mount();
    await placeOrder();
    expect(place).toHaveBeenCalledWith({ device_token: "tok-mine", member_token: "card-token" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("the same number written another way is not an edit", async () => {
    mount({ phone: "+20 100 000 4567" });
    await placeOrder();
    expect(place).toHaveBeenCalledWith({ device_token: "tok-mine", member_token: "card-token" });
  });

  it("name only: asked inline, already answered just-this-order — one_time, the address not kept unless ticked", async () => {
    mount({ name: "Omar" });
    expect(screen.getByRole("radio", { name: /Just this order/ })).toBeChecked();
    await placeOrder();
    expect(place).toHaveBeenLastCalledWith({ device_token: "tok-mine", member_token: "card-token", identity_change: "one_time", save_address: false });

    await userEvent.click(screen.getByRole("checkbox", { name: /Save this address/ }));
    await placeOrder();
    expect(place).toHaveBeenLastCalledWith(expect.objectContaining({ identity_change: "one_time", save_address: true }));
  });

  it("update my name: update_name, and the address is theirs as usual", async () => {
    mount({ name: "Sara Hassan" });
    await choose(/Update my name/);
    await placeOrder();
    expect(place).toHaveBeenCalledWith({ device_token: "tok-mine", member_token: "card-token", identity_change: "update_name" });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("a different phone blocks: nothing is sent until the question is answered, and nothing is pre-selected", async () => {
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Is this your new number?")).toBeInTheDocument();
    expect(place).not.toHaveBeenCalled();
    for (const radio of within(dialog).getAllByRole("radio")) expect(radio).not.toBeChecked();
    expect(within(dialog).getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("one-time, at a branch that does not ask for a code: one_time, no code sent, the save-address tick honoured", async () => {
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/Just this order/);
    await userEvent.click(screen.getByRole("checkbox", { name: /Save this address/ }));
    await go("Continue");
    await waitFor(() =>
      expect(place).toHaveBeenCalledWith({
        device_token: "tok-mine",
        member_token: "card-token",
        identity_change: "one_time",
        save_address: true,
        contact_device_token: null,
      }),
    );
    expect(requestCode).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith({ ok: true });
  });

  it("one-time, where the branch wants the other number proved: a code to THAT number, then contact_device_token", async () => {
    mount({ phone: OTHER_TYPED, otpRequired: true });
    await placeOrder();
    await choose(/Just this order/);
    await go("Continue");
    await waitFor(() => expect(requestCode).toHaveBeenCalledWith({ data: { phone: OTHER } }));
    expect(place).not.toHaveBeenCalled();
    await typeCode();
    await waitFor(() => expect(place).toHaveBeenCalledWith(expect.objectContaining({ identity_change: "one_time", save_address: false, contact_device_token: "tok-other", device_token: "tok-mine" })));
    expect(replaceIdentity).not.toHaveBeenCalled();
  });

  it("one-time, and only the server knew a code was needed: its 401 starts the code, and the order is sent again", async () => {
    place.mockResolvedValueOnce({ ok: false, status: 401 });
    mount({ phone: OTHER_TYPED, otpRequired: false });
    await placeOrder();
    await choose(/Just this order/);
    await go("Continue");
    await waitFor(() => expect(requestCode).toHaveBeenCalledWith({ data: { phone: OTHER } }));
    expect(report).not.toHaveBeenCalled();
    await typeCode();
    await waitFor(() => expect(place).toHaveBeenCalledTimes(2));
    expect(place).toHaveBeenLastCalledWith(expect.objectContaining({ contact_device_token: "tok-other" }));
    expect(report).toHaveBeenCalledWith({ ok: true });
  });

  it("replace: both proofs go to replace-identity, the guest store moves to the new number, and the order goes on as the same customer", async () => {
    mount({ phone: OTHER_TYPED, name: "Sara Hassan" });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await waitFor(() => expect(requestCode).toHaveBeenCalledWith({ data: { phone: OTHER } }));
    await typeCode();
    await waitFor(() =>
      expect(replaceIdentity).toHaveBeenCalledWith({
        token: "card-token",
        data: { device_token: "tok-mine", new_phone: OTHER, new_phone_device_token: "tok-other", name: "Sara Hassan" },
      }),
    );
    await waitFor(() => expect(place).toHaveBeenCalledWith({ device_token: "tok-other", member_token: "card-token" }));
    expect(onIdentityReplaced).toHaveBeenCalledWith({ phone: OTHER, deviceToken: "tok-other", name: "Sara Hassan" });
    expect(localStorage.getItem(`madar_delivery_device:${OTHER}`)).toBe("tok-other");
    expect(localStorage.getItem("madar_guest_phone:org-1")).toBe(OTHER);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("replace, name untouched: no name is sent", async () => {
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await typeCode();
    await waitFor(() => expect(replaceIdentity).toHaveBeenCalled());
    expect((replaceIdentity.mock.calls[0][0] as { data: { name: string | null } }).data.name).toBeNull();
  });

  it("the number belongs to another profile → these are both me → combine, with the same two proofs", async () => {
    replaceIdentity.mockRejectedValue(refusal(409, { code: "PHONE_BELONGS_TO_ANOTHER", can_combine: true }));
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await typeCode();
    expect(await screen.findByText("That number already has a profile here")).toBeInTheDocument();
    expect(place).not.toHaveBeenCalled();

    await go("These are both me — combine");
    await waitFor(() =>
      expect(combine).toHaveBeenCalledWith({
        token: "card-token",
        data: { device_token: "tok-mine", new_phone: OTHER, new_phone_device_token: "tok-other", name: null },
      }),
    );
    await waitFor(() => expect(place).toHaveBeenCalledWith({ device_token: "tok-other", member_token: "card-token" }));
    expect(onIdentityReplaced).toHaveBeenCalled();
  });

  it("…or declines to combine: both profiles untouched, the order goes one-time", async () => {
    replaceIdentity.mockRejectedValue(refusal(409, { code: "PHONE_BELONGS_TO_ANOTHER", can_combine: true }));
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await typeCode();
    await screen.findByText("That number already has a profile here");
    await go("Use it for just this order");
    await waitFor(() => expect(place).toHaveBeenCalledWith(expect.objectContaining({ identity_change: "one_time", member_token: "card-token" })));
    expect(combine).not.toHaveBeenCalled();
    expect(onIdentityReplaced).not.toHaveBeenCalled();
  });

  it("locked after a merge: said plainly, with one-time still on offer", async () => {
    replaceIdentity.mockRejectedValue(refusal(409, { code: "IDENTITY_LOCKED_AFTER_MERGE" }));
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await typeCode();
    expect(await screen.findByText(/combined with another in the last 24 hours/)).toBeInTheDocument();
    await go("Use it for just this order");
    await waitFor(() => expect(place).toHaveBeenCalledWith(expect.objectContaining({ identity_change: "one_time" })));
  });

  it("changed too often (429): says the shop can do it, offers one-time, and keeping the number sends nothing", async () => {
    replaceIdentity.mockRejectedValue(refusal(429, { code: "IDENTITY_REPLACE_LIMIT" }));
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    await typeCode();
    expect(await screen.findByText(/changed twice in the last 30 days/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use it for just this order" })).toBeInTheDocument();
    await go("Keep my number");
    expect(onKeepNumber).toHaveBeenCalled();
    expect(place).not.toHaveBeenCalled();
  });

  it("IDENTITY_CHOICE_REQUIRED from the server opens the question even when this page saw no edit", async () => {
    place.mockResolvedValueOnce({ ok: false, status: 409, code: "IDENTITY_CHOICE_REQUIRED" });
    mount();
    await placeOrder();
    expect(await screen.findByText("Is this your new number?")).toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
  });

  it("a code that cannot be sent comes back to the question with the server's words", async () => {
    requestCode.mockRejectedValue(refusal(400, { error: "This number is not on WhatsApp." }));
    mount({ phone: OTHER_TYPED });
    await placeOrder();
    await choose(/This is my new number/);
    await go("Continue");
    expect(await screen.findByRole("alert")).toHaveTextContent("This number is not on WhatsApp.");
    expect(replaceIdentity).not.toHaveBeenCalled();
  });
});
