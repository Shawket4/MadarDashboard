/**
 * The sign-up flow: phone -> code -> shop details, with the server's refusals
 * (phone/email taken, a wrong code, cooldown) handled in place.
 */
import { TERMS_VERSION } from "@/config/legal";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const otpCall = vi.fn();
const signupCall = vi.fn();
const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => <a href={to} {...rest}>{children}</a>,
  useNavigate: () => navigate,
}));
vi.mock("@/data/api/generated/api", () => ({
  useSignupOtp: (o: { mutation: object }) =>
    useMutation({ mutationFn: (v: { data: unknown }) => otpCall(v.data), ...(o.mutation as object) }),
  useSignup: (o: { mutation: object }) =>
    useMutation({ mutationFn: (v: { data: unknown }) => signupCall(v.data), ...(o.mutation as object) }),
}));
vi.mock("@/features/auth/auth-shell", () => ({
  AuthShell: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <main><h1>{title}</h1>{children}</main>
  ),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { SignupPage } = await import("./signup-page");

const refusal = (status: number, data: Record<string, unknown>) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data,
  });

const page = () =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><SignupPage /></QueryClientProvider>);

const SESSION = {
  token: "tok", user: { id: "u1", role: "org_admin", org_id: "o1", name: "Mona" }, plan: "free",
  org_id: "o1", branch_id: "b1",
};

async function toCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Your mobile number"), "01001234567");
  await user.click(screen.getByRole("button", { name: "Send the code" }));
  await screen.findByLabelText("Code");
}

async function toDetailsStep(user: ReturnType<typeof userEvent.setup>) {
  await toCodeStep(user);
  await user.type(screen.getByLabelText("Code"), "483920");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByLabelText("Shop name");
}

beforeEach(() => {
  otpCall.mockReset().mockResolvedValue({ sent: true, expires_in_seconds: 300, resend_after_seconds: 60 });
  signupCall.mockReset().mockResolvedValue(SESSION);
  navigate.mockReset();
  useAuthStore.setState({ user: null, token: null, plan: null });
});
afterEach(() => vi.useRealTimers());

describe("SignupPage", () => {
  it("sends the canonical phone, then asks for the code", async () => {
    const user = userEvent.setup();
    page();
    expect(screen.getByRole("button", { name: "Send the code" })).toBeDisabled();
    await toCodeStep(user);
    expect(otpCall).toHaveBeenCalledWith({ phone: "201001234567" });
    expect(screen.getByRole("button", { name: /Send again in \d+ s/ })).toBeDisabled();
  });

  it("a phone that already has a shop says so, with a way to sign in", async () => {
    otpCall.mockRejectedValue(refusal(409, { code: "SIGNUP_PHONE_TAKEN", error: "A shop already uses this phone number. Sign in instead." }));
    const user = userEvent.setup();
    page();
    await user.type(screen.getByLabelText("Your mobile number"), "01001234567");
    await user.click(screen.getByRole("button", { name: "Send the code" }));
    expect(await screen.findByText("A shop already uses this phone number.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in instead" })[0]).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText("Code")).toBeNull();
  });

  it("a cooldown moves on to the code step: the code is already on its way", async () => {
    otpCall.mockRejectedValue(refusal(429, { code: "SIGNUP_OTP_COOLDOWN", error: "A code was just sent." }));
    const user = userEvent.setup();
    page();
    await toCodeStep(user);
    expect(screen.getByRole("button", { name: /Send again in/ })).toBeDisabled();
  });

  it("the resend button comes back when the timer runs out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    page();
    await toCodeStep(user);
    await act(async () => { vi.advanceTimersByTime(61_000); });
    expect(screen.getByRole("button", { name: "Send the code again" })).toBeEnabled();
  });

  it("needs a six-digit code, taking Arabic digits", async () => {
    const user = userEvent.setup();
    page();
    await toCodeStep(user);
    const next = screen.getByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText("Code"), "٤٨٣٩٢٠");
    expect(screen.getByLabelText("Code")).toHaveValue("483920");
    expect(next).toBeEnabled();
  });

  it("validates the details before anything is sent", async () => {
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await user.click(screen.getByRole("button", { name: "Create my shop" }));
    expect(await screen.findByText("Enter your shop's name (at least 2 letters).")).toBeInTheDocument();
    expect(screen.getByText("Accept the terms to continue.")).toBeInTheDocument();
    expect(signupCall).not.toHaveBeenCalled();
  });

  it("creates the shop, stores the session as sign-in does, and lands in onboarding", async () => {
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await user.type(screen.getByLabelText("Shop name"), "The Rue");
    await user.click(screen.getByRole("radio", { name: /Restaurant/ }));
    await user.type(screen.getByLabelText("Your name"), "Mona");
    await user.type(screen.getByLabelText("Email address"), "mona@therue.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create my shop" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/onboarding" }));
    expect(signupCall).toHaveBeenCalledWith({
      phone: "201001234567", code: "483920", shop_name: "The Rue", owner_name: "Mona",
      email: "mona@therue.com", password: "correct horse", template: "restaurant", terms_version: TERMS_VERSION,
    });
    expect(useAuthStore.getState()).toMatchObject({ token: "tok", plan: "free" });
  });

  it("a wrong code sends the person back to the code step", async () => {
    signupCall.mockRejectedValue(refusal(400, { error: "Bad request: Incorrect code." }));
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await user.type(screen.getByLabelText("Shop name"), "The Rue");
    await user.type(screen.getByLabelText("Your name"), "Mona");
    await user.type(screen.getByLabelText("Email address"), "mona@therue.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create my shop" }));
    expect(await screen.findByText(/That code is wrong or has expired/)).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toHaveValue("");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("an email that already has an account offers to sign in, and keeps the form", async () => {
    signupCall.mockRejectedValue(refusal(409, { code: "SIGNUP_EMAIL_TAKEN", error: "An account with this email already exists. Sign in instead." }));
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await user.type(screen.getByLabelText("Shop name"), "The Rue");
    await user.type(screen.getByLabelText("Your name"), "Mona");
    await user.type(screen.getByLabelText("Email address"), "mona@therue.com");
    await user.type(screen.getByLabelText("Password"), "correct horse");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create my shop" }));
    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in instead" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Shop name")).toHaveValue("The Rue");
  });
});
