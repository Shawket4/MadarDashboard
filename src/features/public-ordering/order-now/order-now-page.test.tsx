/**
 * `/now/<token>`: the token identifies, the device authorises.
 *
 *  - no proof on this device → the masked greeting; the customer types their
 *    number and proves it, and only then does the full context arrive;
 *  - a remembered proof → straight through, no form;
 *  - the branch and channel are seeded into the URL only when the server says
 *    they can be used as-is; stale ones fall back to the ordinary chooser.
 *
 * Test phones are invented, and none is printed in a test name.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderNowContext, OrderNowFull } from "@/data/api/generated/models";

import type { OrderNowSession } from "./session";

const OWNER = "201000004567";
const STRANGER = "201000009999";

const maskedCtx: OrderNowContext = {
  verify_required: true,
  org_id: "org-1",
  org_name: "Test Shop",
  first_name: "Sara",
  phone_hint: "•••• 4567",
  last_branch_name: "Downtown",
};
const fullOf = (over: Partial<OrderNowFull> = {}): OrderNowContext => ({
  ...maskedCtx,
  verify_required: false,
  full: {
    customer_id: "c-1",
    name: "Sara Ali",
    phone: OWNER,
    locale: "en",
    last_branch: { id: "b-1", name: "Downtown", channel: "outside", stale: false },
    last_payment_hint: "card",
    addresses: [],
    ...over,
  },
});

/** The server: only a token for the owner's phone unlocks the card. */
let unlockedAnswer: OrderNowContext = fullOf();
const unlocks = new Set<string>();
const contextCalls: (string | undefined)[] = [];
/** A refusal for the masked call, or for the unlocking one. */
let maskedError: unknown = null;
let unlockError: unknown = null;
const limited = () => new AxiosError("limited", "429", undefined, undefined, { status: 429, data: "Too many requests" } as AxiosResponse);
const requestCode = vi.fn();
const verifyCode = vi.fn();
const navigate = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useOrderNowContext: (_token: string, params?: { device_token?: string }, opts?: { query?: { enabled?: boolean } }) => {
    const deviceToken = params?.device_token;
    if (opts?.query?.enabled === false) return { data: undefined, isLoading: false, isError: false, isPlaceholderData: false, refetch: vi.fn() };
    contextCalls.push(deviceToken);
    const failure = deviceToken ? unlockError : maskedError;
    if (failure) return { data: undefined, error: failure, isLoading: false, isError: true, isFetching: false, isPlaceholderData: false, refetch: vi.fn() };
    const data = deviceToken && unlocks.has(deviceToken) ? unlockedAnswer : maskedCtx;
    return { data, isLoading: false, isError: false, isPlaceholderData: false, refetch: vi.fn() };
  },
  useOtpRequest: () => ({ mutateAsync: requestCode, isPending: false }),
  useOtpVerify: () => ({ mutateAsync: verifyCode, isPending: false }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/features/public-shell/use-brand", () => ({ usePublicBrand: () => null }));
vi.mock("@/features/public-shell/storefront-shell", () => ({
  StorefrontShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/features/public-shell/use-public-theme", () => ({
  usePublicTheme: { getState: () => ({ apply: vi.fn(), restoreGlobal: vi.fn() }) },
}));
let session: OrderNowSession | undefined;
vi.mock("../public-ordering-page", () => ({
  PublicOrderingPage: (props: { orgId: string; branch?: string; channel?: string; orderNow?: OrderNowSession }) => {
    session = props.orderNow;
    return <div data-testid="ordering" data-org={props.orgId} data-branch={props.branch ?? ""} data-channel={props.channel ?? ""} />;
  },
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { OrderNowPage } = await import("./order-now-page");

const mount = (props: { branch?: string; channel?: string } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrderNowPage token="card-token" {...props} />
    </QueryClientProvider>,
  );

const typeCode = async (code: string) => {
  const boxes = await screen.findAllByRole("textbox", { name: /Verification code/i });
  boxes[0].focus();
  await userEvent.paste(code);
};

beforeEach(() => {
  localStorage.clear();
  contextCalls.length = 0;
  session = undefined;
  maskedError = null;
  unlockError = null;
  unlockedAnswer = fullOf();
  unlocks.clear();
  unlocks.add(`tok:${OWNER}`);
  navigate.mockReset().mockResolvedValue(undefined);
  requestCode.mockReset().mockResolvedValue(undefined);
  verifyCode.mockReset().mockImplementation(({ data }: { data: { phone: string } }) => Promise.resolve({ device_token: `tok:${data.phone}` }));
});

describe("OrderNowPage", () => {
  it("masked → verify → full: a stranger to this device sees a first name and four digits, proves the number, and lands in the flow", async () => {
    mount();
    expect(screen.getByRole("heading", { name: "Hi Sara, is this you?" })).toBeInTheDocument();
    expect(screen.getByText(/ending .*•••• 4567.* from Downtown/)).toBeInTheDocument();
    // Nothing of the full context is on the page, and the flow is not mounted.
    expect(screen.queryByTestId("ordering")).not.toBeInTheDocument();
    expect(screen.queryByText(/Sara Ali/)).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox", { name: "Your phone number" }), "01000004567");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await waitFor(() => expect(requestCode).toHaveBeenCalledWith({ data: { phone: OWNER } }));
    await typeCode("1234");

    const flow = await screen.findByTestId("ordering");
    expect(flow).toHaveAttribute("data-org", "org-1");
    expect(session?.memberToken).toBe("card-token");
    expect(session?.deviceToken).toBe(`tok:${OWNER}`);
    expect(session?.customer).toEqual({ id: "c-1", name: "Sara Ali", phone: OWNER });
    expect(session?.paymentHint).toBe("card");
    // Remembered for next time, under the shop and under the phone.
    expect(localStorage.getItem(`madar_delivery_device:${OWNER}`)).toBe(`tok:${OWNER}`);
    expect(localStorage.getItem("madar_guest_phone:org-1")).toBe(OWNER);
  });

  it("seeds the branch and channel they last used into the URL", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    mount();
    await screen.findByTestId("ordering");
    expect(navigate).toHaveBeenCalledTimes(1);
    const { search, replace } = navigate.mock.calls[0][0] as { search: (p: object) => object; replace: boolean };
    expect(replace).toBe(true);
    expect(search({ keep: 1 })).toEqual({ keep: 1, branch: "b-1", channel: "outside" });
  });

  it("a remembered proof goes straight through — found by the hint's last four digits, no form shown", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    mount();
    await screen.findByTestId("ordering");
    expect(requestCode).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("tries this shop's last phone first, and moves on when it does not unlock the card", async () => {
    localStorage.setItem("madar_guest_phone:org-1", STRANGER);
    localStorage.setItem(`madar_delivery_device:${STRANGER}`, `tok:${STRANGER}`);
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    mount();
    await screen.findByTestId("ordering");
    const tried = contextCalls.filter(Boolean);
    expect(tried[0]).toBe(`tok:${STRANGER}`);
    expect(tried[tried.length - 1]).toBe(`tok:${OWNER}`);
  });

  it("proving some other number leaves the card locked, and says which number it wants", async () => {
    mount();
    await userEvent.type(screen.getByRole("textbox", { name: "Your phone number" }), "01000009999");
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await typeCode("1234");
    expect(await screen.findByRole("alert")).toHaveTextContent(/isn’t the number on this card.*4567/);
    expect(screen.queryByTestId("ordering")).not.toBeInTheDocument();
    // …and the form is back, ready for the right one.
    expect(screen.getByRole("textbox", { name: "Your phone number" })).toBeInTheDocument();
  });

  it("rate limited before anything is known (429): asks for a moment, and does not call the card unknown", () => {
    maskedError = limited();
    mount();
    expect(screen.getByRole("heading", { name: "One moment" })).toBeInTheDocument();
    expect(screen.getByText("Too many attempts just now. Give it a moment and try again.")).toBeInTheDocument();
    expect(screen.queryByText("We couldn’t find that card")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("any other failure of the masked call is still the unknown card", () => {
    maskedError = new AxiosError("gone", "404", undefined, undefined, { status: 404, data: {} } as AxiosResponse);
    mount();
    expect(screen.getByRole("heading", { name: "We couldn’t find that card" })).toBeInTheDocument();
  });

  it("rate limited while unlocking (429): the form stays, with a wait-a-moment instead of the generic failure", () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    unlockError = limited();
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent("Too many attempts just now.");
    expect(screen.queryByText("We couldn’t open your details. Try again.")).not.toBeInTheDocument();
  });

  it("stale branch: nothing is seeded, the branch chooser asks — the rest of the session is kept", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    unlockedAnswer = fullOf({ last_branch: { id: "b-1", name: "Downtown", channel: "outside", stale: true, stale_reason: "branch_unavailable" } });
    mount();
    const flow = await screen.findByTestId("ordering");
    expect(navigate).not.toHaveBeenCalled();
    expect(flow).toHaveAttribute("data-branch", "");
    expect(session?.lastBranch?.stale).toBe(true);
    expect(session?.customer.name).toBe("Sara Ali");
  });

  it("a closed channel keeps the branch and asks only for the channel", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    unlockedAnswer = fullOf({ last_branch: { id: "b-1", name: "Downtown", channel: "outside", stale: true, stale_reason: "channel_closed" } });
    mount();
    await screen.findByTestId("ordering");
    const { search } = navigate.mock.calls[0][0] as { search: (p: object) => object };
    expect(search({})).toEqual({ branch: "b-1", channel: undefined });
  });

  it("a URL that already names a branch is left alone (a refresh mid-order)", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    mount({ branch: "b-7", channel: "pickup" });
    const flow = await screen.findByTestId("ordering");
    expect(navigate).not.toHaveBeenCalled();
    expect(flow).toHaveAttribute("data-branch", "b-7");
  });

  it("after a replace the session follows the new number and its proof", async () => {
    localStorage.setItem(`madar_delivery_device:${OWNER}`, `tok:${OWNER}`);
    mount();
    await screen.findByTestId("ordering");
    // The server now knows the customer by the new number: its proof unlocks the card.
    unlocks.add("tok-new");
    act(() => session?.onIdentityReplaced({ phone: STRANGER, deviceToken: "tok-new", name: "Sara A." }));
    await waitFor(() => expect(session?.deviceToken).toBe("tok-new"));
    expect(session?.customer).toEqual({ id: "c-1", name: "Sara A.", phone: STRANGER });
  });
});
