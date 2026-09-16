/**
 * A PIN and an email + password are INDEPENDENT credentials, not alternatives.
 * The dialog used to pick one by role, so an owner or a branch manager could
 * never be given a PIN — which is why two people in production cannot sign in
 * on a tablet even though architecture E says they may work a till
 * (POS_SIGNIN_OVERHAUL.md §5.4). Both fields must be offered to every role, and
 * both must reach the API when they are filled in.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const createUser = vi.fn().mockResolvedValue({});
const updateUser = vi.fn().mockResolvedValue({});
vi.mock("@/data/api/generated/api", () => ({
  createUser: (...a: unknown[]) => createUser(...a),
  updateUser: (...a: unknown[]) => updateUser(...a),
  useListOrgs: () => ({ data: [] }),
}));
vi.mock("./util", () => ({ invalidateUsers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/data/stores/auth.store", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { role: "org_admin" } }),
}));

await import("@/i18n");
const { UserDialog } = await import("./user-dialog");

const open = () =>
  render(<UserDialog orgId="org-1" user={null} open onOpenChange={() => {}} />);

describe("user dialog credentials", () => {
  it("offers a PIN to an owner, not only to till roles", () => {
    // A till role sees the dashboard pair as well as the PIN...
    open();
    expect(screen.getByLabelText(/PIN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("offers a PIN when editing an owner", () => {
    // ...and an owner sees the PIN as well as the dashboard pair.
    render(
      <UserDialog
        orgId="org-1"
        open
        onOpenChange={() => {}}
        user={
          {
            id: "u1",
            name: "Tasbeeh",
            role: "org_admin",
            is_active: true,
            org_id: "org-1",
          } as never
        }
      />,
    );
    expect(screen.getByLabelText(/PIN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("sends both credentials when both are filled in", async () => {
    const user = userEvent.setup();
    open();
    await user.type(screen.getByLabelText(/Full Name/i), "Tasbeeh");
    await user.type(screen.getByLabelText(/PIN/i), "123456");
    await user.type(screen.getByLabelText(/Email/i), "t@example.com");
    await user.type(screen.getByLabelText(/^Password/i), "hunter2hunter2");
    await user.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(createUser).toHaveBeenCalled());
    const body = createUser.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(body.pin).toBe("123456");
    expect(body.password).toBe("hunter2hunter2");
    expect(body.email).toBe("t@example.com");
  });
});
