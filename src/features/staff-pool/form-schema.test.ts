import { describe, expect, it } from "vitest";

import type { StaffPoolSettings } from "@/data/api/generated/models";

import {
  fromWire,
  isOwnOverride,
  poolIsOff,
  staffPoolSchema,
  toWire,
} from "./form-schema";

const saved: StaffPoolSettings = {
  org_id: "org-1",
  branch_id: null,
  enabled: true,
  daily_allowance: 3,
  eligible_item_ids: ["item-a", "item-b"],
};

const scope = { orgId: "org-1", branchId: null };

describe("the staff pool form's wire mapping", () => {
  it("round-trips everything the form shows", () => {
    const out = toWire(fromWire(saved), scope, saved);
    expect(out.enabled).toBe(true);
    expect(out.daily_allowance).toBe(3);
    expect(out.eligible_item_ids).toEqual(["item-a", "item-b"]);
  });

  it("keeps an allowance above one instead of squashing it", () => {
    // The loyalty form once rewrote a shop's "3 per order" to 1 on every save.
    // Same shape of setting, same failure available here.
    expect(fromWire(saved).daily_allowance).toBe("3");
    expect(toWire(fromWire(saved), scope, saved).daily_allowance).toBe(3);
  });

  it("defaults the fields the server may leave out", () => {
    const bare = { org_id: "org-1" } as StaffPoolSettings;
    const v = fromWire(bare);
    expect(v.enabled).toBe(false);
    expect(v.daily_allowance).toBe("0");
    expect(v.eligible_item_ids).toEqual([]);
    // And they go back as real values, not `undefined`.
    const out = toWire(v, scope, bare);
    expect(out.daily_allowance).toBe(0);
    expect(out.eligible_item_ids).toEqual([]);
  });

  it("keeps a zero allowance as zero rather than treating it as 'unset'", () => {
    // Zero is a real setting: every staff drink becomes an overspend, which is
    // marked rather than blocked. Reading it as "no answer" would silently
    // restore whatever default the server picks.
    const zero = { ...saved, daily_allowance: 0 };
    expect(fromWire(zero).daily_allowance).toBe("0");
    expect(toWire(fromWire(zero), scope, zero).daily_allowance).toBe(0);
  });

  it("carries the scope it is saving to, not the scope that answered", () => {
    // A branch query answers with the settings IN FORCE, so echoing the
    // response's `branch_id` back would overwrite the ORG row while the screen
    // says "Zamalek".
    const inherited: StaffPoolSettings = { ...saved, branch_id: null };
    const out = toWire(fromWire(inherited), { orgId: "org-1", branchId: "b-9" }, inherited);
    expect(out.org_id).toBe("org-1");
    expect(out.branch_id).toBe("b-9");
  });

  it("does not hand the form's own array back to the wire", () => {
    const v = fromWire(saved);
    const out = toWire(v, scope, saved);
    out.eligible_item_ids!.push("item-c");
    expect(v.eligible_item_ids).toEqual(["item-a", "item-b"]);
  });

  it("de-duplicates the item list", () => {
    const v = { ...fromWire(saved), eligible_item_ids: ["item-a", "item-a", "item-b"] };
    expect(toWire(v, scope, saved).eligible_item_ids).toEqual(["item-a", "item-b"]);
  });

  it("keeps fields this form does not show", () => {
    const withExtra = { ...saved, future_field: "keep me" } as StaffPoolSettings;
    const out = toWire(fromWire(withExtra), scope, withExtra) as unknown as Record<string, unknown>;
    expect(out.future_field).toBe("keep me");
  });
});

describe("an empty item list means the pool is off", () => {
  it("is off with no eligible items, however the switch is set", () => {
    expect(poolIsOff({ enabled: true, eligible_item_ids: [] })).toBe(true);
    expect(poolIsOff({ enabled: false, eligible_item_ids: [] })).toBe(true);
  });

  it("is off when the switch is off, however many items are listed", () => {
    expect(poolIsOff({ enabled: false, eligible_item_ids: ["item-a"] })).toBe(true);
  });

  it("is on only when both are true", () => {
    expect(poolIsOff({ enabled: true, eligible_item_ids: ["item-a"] })).toBe(false);
  });
});

describe("the staff pool form's validation", () => {
  const valid = () => fromWire(saved);
  const errorsOf = (v: unknown) => {
    const r = staffPoolSchema.safeParse(v);
    return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  it("accepts what the server saved", () => {
    expect(staffPoolSchema.safeParse(valid()).success).toBe(true);
  });

  it("accepts zero", () => {
    expect(staffPoolSchema.safeParse({ ...valid(), daily_allowance: "0" }).success).toBe(true);
  });

  it.each(["", "-1", "2.5", "abc", "1e3", "99999"])("refuses %s as an allowance", (bad) => {
    expect(errorsOf({ ...valid(), daily_allowance: bad })).toHaveProperty("daily_allowance");
  });

  it("states its errors as translation keys, not English", () => {
    // The Zod rules and both locales stay one list this way.
    expect(errorsOf({ ...valid(), daily_allowance: "abc" }).daily_allowance).toBe(
      "staffPool.errors.allowance",
    );
  });
});

describe("telling an override from an inheritance", () => {
  it("is an override only when the branch id comes back matching", () => {
    expect(isOwnOverride({ ...saved, branch_id: "b-9" }, "b-9")).toBe(true);
    expect(isOwnOverride({ ...saved, branch_id: null }, "b-9")).toBe(false);
    expect(isOwnOverride({ ...saved, branch_id: "b-1" }, "b-9")).toBe(false);
  });

  it("is never an override at the organisation scope", () => {
    expect(isOwnOverride(saved, null)).toBe(false);
  });

  it("is not an override before anything has loaded", () => {
    expect(isOwnOverride(undefined, "b-9")).toBe(false);
  });
});
