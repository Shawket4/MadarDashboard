import { AxiosError, AxiosHeaders } from "axios";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  conflictTarget,
  emptyProvisionForm,
  provisionSchemas,
  toProvisionRequest,
  type ProvisionFormValues,
} from "./provision";

const t = ((_k: string, d?: unknown) => (typeof d === "string" ? d : _k)) as unknown as TFunction;
const s = provisionSchemas(t);

const valid: ProvisionFormValues = {
  business: { name: "Drops", slug: "drops", template: "cafe", currency_code: "egp", timezone: "Africa/Cairo", tax_rate: 14 },
  branch: { name: "Zamalek", address: "", phone: "  " },
  owner: { name: "Mona", email: "mona@example.com", password: "secret123", pin: "" },
};

const conflict = (message: string) =>
  new AxiosError("conflict", "ERR", undefined, undefined, {
    status: 409, statusText: "Conflict", data: { error: message }, headers: {}, config: { headers: new AxiosHeaders() },
  });

describe("step validation", () => {
  it("blocks step 1 when empty and without a template", () => {
    const r = s.business.safeParse(emptyProvisionForm().business);
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["name", "slug", "template"]));
  });

  it("rejects a tax rate over 100%", () => {
    expect(s.business.safeParse({ ...valid.business, tax_rate: 140 }).success).toBe(false);
  });

  it("blocks step 2 without a branch name", () => {
    expect(s.branch.safeParse({ name: "" }).success).toBe(false);
    expect(s.branch.safeParse(valid.branch).success).toBe(true);
  });

  it("blocks step 3 on a short password, bad email or non-6-digit PIN", () => {
    expect(s.owner.safeParse({ ...valid.owner, password: "short" }).success).toBe(false);
    expect(s.owner.safeParse({ ...valid.owner, email: "nope" }).success).toBe(false);
    expect(s.owner.safeParse({ ...valid.owner, pin: "12345" }).success).toBe(false);
    expect(s.owner.safeParse({ ...valid.owner, pin: "123456" }).success).toBe(true);
    expect(s.owner.safeParse(valid.owner).success).toBe(true);
  });
});

describe("toProvisionRequest", () => {
  it("converts percent to fraction and omits empty optionals", () => {
    expect(toProvisionRequest(valid)).toEqual({
      name: "Drops",
      slug: "drops",
      template: "cafe",
      currency_code: "EGP",
      timezone: "Africa/Cairo",
      tax_rate: 0.14,
      branch: { name: "Zamalek" },
      owner: { name: "Mona", email: "mona@example.com", password: "secret123" },
    });
  });

  it("includes optionals when set", () => {
    const body = toProvisionRequest({
      ...valid,
      branch: { name: "Z", address: "26 July St", phone: "0100" },
      owner: { ...valid.owner, pin: "123456" },
    });
    expect(body.branch).toEqual({ name: "Z", address: "26 July St", phone: "0100" });
    expect(body.owner.pin).toBe("123456");
  });
});

describe("conflictTarget", () => {
  it("sends a slug 409 back to step 1", () => {
    expect(conflictTarget(conflict("Slug 'drops' is already taken"))).toMatchObject({ step: 0, field: "business.slug" });
  });
  it("sends an email 409 back to step 3", () => {
    expect(conflictTarget(conflict("Email already in use"))).toMatchObject({ step: 2, field: "owner.email" });
  });
  it("ignores other errors", () => {
    expect(conflictTarget(new Error("x"))).toBeNull();
  });
});
