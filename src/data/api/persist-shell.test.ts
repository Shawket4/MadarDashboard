import { describe, expect, it } from "vitest";

import { holdsSecret, isShellQuery, shouldPersist } from "./persist-shell";

const ok = (queryKey: unknown[], data: unknown) => ({ queryKey, state: { status: "success", data } }) as never;

describe("what the shell keeps between visits", () => {
  it("the shell's slow-changing reads", () => {
    for (const key of [["/auth/me"], ["/authz/me"], ["/orgs/org_1"], ["/orgs/org_1/modules"], ["/branches", { include_warehouses: true }], ["/public/orgs/brand", { org_id: "o" }]]) {
      expect(isShellQuery(key)).toBe(true);
    }
  });

  it("never business data, nor a per-branch permission read", () => {
    for (const key of [["/orders", {}], ["/reports/orgs/o/comparison", {}], ["/authz/me", { branch_id: "b" }], ["/orgs/o/onboarding"], ["/staff/employees"], ["/orgs/o/payment-methods"], [42]]) {
      expect(isShellQuery(key)).toBe(false);
    }
  });

  it("never anything credential-like, however deep", () => {
    expect(holdsSecret({ user: { id: "u", name: "A" } })).toBe(false);
    expect(holdsSecret({ user: { id: "u" }, token: "x" })).toBe(true);
    expect(holdsSecret([{ device: { api_key: "k" } }])).toBe(true);
    expect(shouldPersist(ok(["/auth/me"], { user: { id: "u" }, access_token: "t" }))).toBe(false);
    expect(shouldPersist(ok(["/auth/me"], { user: { id: "u" } }))).toBe(true);
  });

  it("only answers, never errors or pending reads", () => {
    expect(shouldPersist({ queryKey: ["/auth/me"], state: { status: "error", data: undefined } } as never)).toBe(false);
  });
});
