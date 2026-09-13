import { describe, expect, it } from "vitest";

import { orderRewards } from "./reward-lines";

describe("an order's reward lines", () => {
  it("reads the covered lines, units and member", () => {
    const r = orderRewards({
      loyalty_customer_id: "m-1",
      loyalty_member_name: "Sara",
      items: [
        { id: "l-1", is_reward: true, reward_units: 1, reward_covered: 4500 },
        { id: "l-2", is_reward: false, reward_covered: 0 },
        { id: "l-3", reward_covered: 3000 },
      ],
    });
    expect(r.memberName).toBe("Sara");
    expect(r.memberId).toBe("m-1");
    expect([...r.lines.keys()]).toEqual(["l-1", "l-3"]);
    expect(r.lines.get("l-3")?.units).toBeNull();
    expect(r.totalCovered).toBe(7500);
  });

  it("is empty for an order without rewards, or none at all", () => {
    expect(orderRewards({ items: [{ id: "x" }] }).lines.size).toBe(0);
    expect(orderRewards(undefined).totalCovered).toBe(0);
  });
});
