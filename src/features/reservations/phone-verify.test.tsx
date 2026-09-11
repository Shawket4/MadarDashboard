import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PhoneVerify } from "./phone-verify";

function mount(props: { busy?: boolean; disabled?: boolean }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PhoneVerify otpRequired={false} onVerified={() => {}} submitLabel="Join" {...props} />
    </QueryClientProvider>,
  );
}

const submit = () => screen.getByRole("button", { name: /join/i });
const spinner = (c: ReturnType<typeof mount>) => c.container.querySelector(".animate-spin");

/**
 * `busy` means a request is in flight; `disabled` means the form behind this
 * one is not ready. They were ONE prop, and the sign-up page passed
 * `busy={join.isPending || !name.trim()}` — so an untouched form spun as though
 * something were being worked on, and stopped the moment a letter was typed.
 */
describe("the submit button", () => {
  it("is idle when there is nothing to do", () => {
    const c = mount({});
    expect(submit()).toBeEnabled();
    expect(spinner(c)).toBeNull();
  });

  it("greys without spinning when the form is not ready", () => {
    const c = mount({ disabled: true });
    expect(submit()).toBeDisabled();
    expect(spinner(c)).toBeNull();
  });

  it("spins while a request is in flight", () => {
    const c = mount({ busy: true });
    expect(submit()).toBeDisabled();
    expect(spinner(c)).not.toBeNull();
  });
});
