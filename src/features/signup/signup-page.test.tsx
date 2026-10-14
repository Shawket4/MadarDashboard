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
vi.mock("./signup-shell", () => ({
  SignupShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
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
  await user.type(screen.getByLabelText("Mobile number"), "01001234567");
  await user.click(screen.getByRole("button", { name: "Send the code" }));
  await screen.findByRole("group", { name: "Verification code" });
}

/** Types a code box by box, the way a person would. */
const typeCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.click(screen.getByLabelText("Digit 1 of 6"));
  await user.keyboard(code);
};

async function toDetailsStep(user: ReturnType<typeof userEvent.setup>) {
  await toCodeStep(user);
  await typeCode(user, "483920");
  await screen.findByLabelText("Shop name");
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Shop name"), "The Rue");
  await user.type(screen.getByLabelText("Your name"), "Mona");
  await user.type(screen.getByLabelText("Email address"), "mona@therue.com");
  await user.type(screen.getByLabelText("Password"), "correct horse");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Create my shop" }));
}

beforeEach(() => {
  otpCall.mockReset().mockResolvedValue({ sent: true, expires_in_seconds: 300, resend_after_seconds: 60 });
  signupCall.mockReset().mockResolvedValue(SESSION);
  navigate.mockReset();
  useAuthStore.setState({ user: null, token: null, plan: null });
});
afterEach(() => vi.useRealTimers());

describe("SignupPage", () => {
  it("labels the three steps and marks where the person is", async () => {
    const user = userEvent.setup();
    page();
    const steps = screen.getByRole("list", { name: "Sign-up progress" });
    expect(steps).toHaveTextContent(/Phone.*Code.*Your shop/);
    expect(screen.getByRole("heading", { level: 1, name: "Create your free account" })).toBeInTheDocument();
    await toCodeStep(user);
    expect(screen.getByRole("heading", { level: 1, name: "Check your WhatsApp" })).toBeInTheDocument();
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent("Code");
  });

  it("sends the canonical phone, then asks for the code", async () => {
    const user = userEvent.setup();
    page();
    expect(screen.getByRole("button", { name: "Send the code" })).toBeDisabled();
    await toCodeStep(user);
    expect(otpCall).toHaveBeenCalledWith({ phone: "201001234567" });
    expect(screen.getByText("+20 100 123 4567")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: /Resend the code in \d:\d\d/ })).toBeDisabled();
  });

  it("takes the phone however it is pasted, and shows it grouped after the fixed +20", async () => {
    const user = userEvent.setup();
    page();
    const field = screen.getByLabelText("Mobile number");
    await user.click(field);
    await user.paste("+20 100 123 4567");
    expect(field).toHaveValue("100 123 4567");
    await user.clear(field);
    await user.paste("٠١٠٠١٢٣٤٥٦٧");
    expect(field).toHaveValue("100 123 4567");
    expect(field).toHaveAttribute("inputmode", "tel");
    expect(screen.getByRole("button", { name: "Send the code" })).toBeEnabled();
  });

  it("calls out a wrong prefix as it is typed, and a short number once the field is left", async () => {
    const user = userEvent.setup();
    page();
    const field = screen.getByLabelText("Mobile number");
    await user.type(field, "0551");
    expect(screen.getByText("Egyptian mobile numbers start with 10, 11, 12 or 15.")).toBeInTheDocument();
    expect(field).toBeInvalid();
    await user.clear(field);
    await user.type(field, "10012");
    expect(screen.queryByText(/Enter all 10 digits/)).toBeNull();
    await user.tab();
    expect(screen.getByText(/Enter all 10 digits after \+20/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send the code" })).toBeDisabled();
  });

  it("a phone that already has a shop says so, with a way to sign in", async () => {
    otpCall.mockRejectedValue(refusal(409, { code: "SIGNUP_PHONE_TAKEN", error: "A shop already uses this phone number. Sign in instead." }));
    const user = userEvent.setup();
    page();
    await user.type(screen.getByLabelText("Mobile number"), "01001234567");
    await user.click(screen.getByRole("button", { name: "Send the code" }));
    expect(await screen.findByText("A shop already uses this phone number.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("group", { name: "Verification code" })).toBeNull();
  });

  it("too many requests says so in place and stays on the phone step", async () => {
    otpCall.mockRejectedValue(refusal(429, { error: "slow down" }));
    const user = userEvent.setup();
    page();
    await user.type(screen.getByLabelText("Mobile number"), "01001234567");
    await user.click(screen.getByRole("button", { name: "Send the code" }));
    expect(await screen.findByText("Too many attempts just now. Wait a moment and try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send the code" })).toBeEnabled();
  });

  it("a cooldown moves on to the code step: the code is already on its way", async () => {
    otpCall.mockRejectedValue(refusal(429, { code: "SIGNUP_OTP_COOLDOWN", error: "A code was just sent." }));
    const user = userEvent.setup();
    page();
    await toCodeStep(user);
    expect(screen.getByText(/A code was sent a moment ago/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend the code in/ })).toBeDisabled();
  });

  it("the resend button comes back when the timer runs out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    page();
    await toCodeStep(user);
    await act(async () => { vi.advanceTimersByTime(61_000); });
    expect(screen.getByRole("button", { name: "Send the code again" })).toBeEnabled();
  });

  it("Change goes back to the phone step with the number kept", async () => {
    const user = userEvent.setup();
    page();
    await toCodeStep(user);
    await user.click(screen.getByRole("button", { name: "Change the phone number" }));
    expect(screen.getByLabelText("Mobile number")).toHaveValue("100 123 4567");
  });

  it("goes on to the shop step by itself on the sixth digit, taking Arabic digits", async () => {
    const user = userEvent.setup();
    page();
    await toCodeStep(user);
    await typeCode(user, "٤٨٣٩٢");
    expect(screen.queryByLabelText("Shop name")).toBeNull();
    await user.keyboard("٠");
    expect(await screen.findByLabelText("Shop name")).toBeInTheDocument();
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

  it("hints how strong the password is", async () => {
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    const pw = screen.getByLabelText("Password");
    await user.type(pw, "short");
    expect(screen.getByText("Too short")).toBeInTheDocument();
    await user.clear(pw);
    await user.type(pw, "correct horse battery 7");
    expect(screen.getByText("Strong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(pw).toHaveAttribute("type", "text");
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

  it("a wrong code sends the person back to the code step, inline, and the right one finishes the job", async () => {
    signupCall.mockRejectedValueOnce(refusal(400, { error: "Bad request: Incorrect code." }));
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await fillAndSubmit(user);
    expect(await screen.findByText(/That code is wrong or has expired/)).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveValue("");
    expect(screen.getByLabelText("Digit 1 of 6")).toBeInvalid();
    expect(navigate).not.toHaveBeenCalled();
    // The details were kept: the corrected code creates the shop with no second form.
    await typeCode(user, "111222");
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/onboarding" }));
    expect(signupCall).toHaveBeenLastCalledWith(expect.objectContaining({ code: "111222", shop_name: "The Rue", email: "mona@therue.com" }));
  });

  it("an email that already has an account offers to sign in, and keeps the form", async () => {
    signupCall.mockRejectedValue(refusal(409, { code: "SIGNUP_EMAIL_TAKEN", error: "An account with this email already exists. Sign in instead." }));
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await fillAndSubmit(user);
    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Shop name")).toHaveValue("The Rue");
  });

  it("a phone taken at the last step offers sign in and a way to change the number", async () => {
    signupCall.mockRejectedValue(refusal(409, { code: "SIGNUP_PHONE_TAKEN", error: "x" }));
    const user = userEvent.setup();
    page();
    await toDetailsStep(user);
    await fillAndSubmit(user);
    expect(await screen.findByText("A shop already uses this phone number.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/login");
    await user.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument();
  });
});
