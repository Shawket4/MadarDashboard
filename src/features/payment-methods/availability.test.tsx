import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { allowListFor, type PaymentMethodAvailability } from "@/features/devices/api";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
await import("@/i18n");
const { AllowListEditor } = await import("./allow-list-editor");

const methods = [
  { id: "cash", name: "Cash" },
  { id: "cib", name: "CIB counter" },
];

describe("availability allow-lists", () => {
  it("restricts to ticked methods and sends them", async () => {
    const onSave = vi.fn();
    render(<AllowListEditor idPrefix="b" title="Branch" value={{ restricted: false, payment_method_ids: [] }} methods={methods} onSave={onSave} />);
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("checkbox", { name: "CIB counter" }));
    await userEvent.click(screen.getByRole("button", { name: /Save|حفظ/ }));
    expect(onSave).toHaveBeenCalledWith({ restricted: true, payment_method_ids: ["cib"] });
  });

  it("refuses an empty restricted list", async () => {
    const onSave = vi.fn();
    render(<AllowListEditor idPrefix="b" title="Teller" value={{ restricted: false, payment_method_ids: [] }} methods={methods} onSave={onSave} />);
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: /Save|حفظ/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("turning the restriction off clears the list", async () => {
    const onSave = vi.fn();
    render(<AllowListEditor idPrefix="d" title="36B" value={{ restricted: true, payment_method_ids: ["cash"] }} methods={methods} onSave={onSave} />);
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: /Save|حفظ/ }));
    expect(onSave).toHaveBeenCalledWith({ restricted: false, payment_method_ids: [] });
  });

  it("reads branch, teller and device rows from the availability payload", () => {
    const a: PaymentMethodAvailability = {
      branch_id: "b",
      branch: { restricted: true, payment_method_ids: ["cash", "cib"] },
      users: [{ user_id: "u1", payment_method_ids: ["cash"] }],
      devices: [{ device_id: "d1", payment_method_ids: ["cib"] }],
    };
    expect(allowListFor(a, "branches", "b")).toEqual(a.branch);
    expect(allowListFor(a, "users", "u1")).toEqual({ restricted: true, payment_method_ids: ["cash"] });
    expect(allowListFor(a, "users", "u2")).toEqual({ restricted: false, payment_method_ids: [] });
    expect(allowListFor(a, "devices", "d1").payment_method_ids).toEqual(["cib"]);
  });
});
