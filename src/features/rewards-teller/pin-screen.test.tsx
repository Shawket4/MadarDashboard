import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

const login = vi.fn();
vi.mock("@/data/api/generated/api", () => ({ login: (...a: unknown[]) => login(...a) }));

const { PinScreen } = await import("./pin-screen");

const setup = { orgId: "o", branchId: "b", branchName: "Zamalek" };

describe("PinScreen", () => {
  it("says a wrong PIN out loud and starts over", async () => {
    const e = new AxiosError("x");
    e.response = { status: 401, data: { error: "Unauthorized: Wrong PIN" }, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
    login.mockRejectedValueOnce(e);
    render(<PinScreen setup={setup} onSignedIn={() => {}} onReset={() => {}} />);
    for (const d of "111111") fireEvent.click(screen.getByRole("button", { name: d }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Wrong PIN. Try again."));
    expect(screen.getByRole("button", { name: "Go" })).toHaveProperty("disabled", true);
  });

  it("signs in on the sixth digit, typed on a keyboard (Arabic digits too)", async () => {
    login.mockResolvedValueOnce({ token: "t", user: { name: "Salma" } });
    const onSignedIn = vi.fn();
    render(<PinScreen setup={setup} onSignedIn={onSignedIn} onReset={() => {}} />);
    for (const k of "12345٦") act(() => void fireEvent.keyDown(window, { key: k }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith({ token: "t", name: "Salma" }));
    expect(login.mock.lastCall?.[0]).toEqual({ pin: "123456", branch_id: "b" });
  });
});
