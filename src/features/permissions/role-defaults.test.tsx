/**
 * Role defaults: `orders:waive_service` is on for managers and off for tellers,
 * shown per role, and changeable only by a super admin (defaults are global).
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertRolePermission = vi.fn();
let role = "org_admin";
vi.mock("@/data/api/generated/api", () => ({
  useGetRolePermissions: () => ({
    data: [
      { role: "branch_manager", resource: "orders", action: "read", granted: true },
      { role: "branch_manager", resource: "orders", action: "waive_service", granted: true },
      { role: "teller", resource: "orders", action: "read", granted: true },
      { role: "teller", resource: "orders", action: "waive_service", granted: false },
    ],
    isLoading: false,
  }),
  upsertRolePermission: (body: unknown) => upsertRolePermission(body),
  getGetRolePermissionsQueryKey: () => ["/permissions/roles"],
  getGetPermissionMatrixQueryKey: (id: string) => [`/permissions/matrix/${id}`],
}));
vi.mock("@/data/stores/auth.store", () => ({
  useAuthStore: (sel: (s: { user: { role: string } }) => unknown) => sel({ user: { role } }),
}));

const i18n = (await import("@/i18n")).default;
const { queryClient } = await import("@/data/api/query");
const { RoleDefaults } = await import("./role-defaults");

const ident = (x: string[]) => x;
const mount = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <RoleDefaults orderResources={ident} orderActions={ident} />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  upsertRolePermission.mockReset().mockResolvedValue({});
  await i18n.changeLanguage("en");
});

describe("RoleDefaults", () => {
  it("shows the waiver granted to managers and not to tellers, read-only for an org admin", async () => {
    role = "org_admin";
    mount();
    const cell = () => screen.getByRole("button", { name: /Orders · Waive service charge/ });
    expect(cell()).toHaveAttribute("aria-pressed", "true");
    expect(cell()).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /Teller/ }));
    expect(cell()).toHaveAttribute("aria-pressed", "false");
  });

  it("lets a super admin change a role's default", async () => {
    role = "super_admin";
    mount();
    await userEvent.click(screen.getByRole("radio", { name: /Teller/ }));
    await userEvent.click(screen.getByRole("button", { name: /Orders · Waive service charge/ }));
    await waitFor(() =>
      expect(upsertRolePermission).toHaveBeenCalledWith({ role: "teller", resource: "orders", action: "waive_service", granted: true }),
    );
  });
});
