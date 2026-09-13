import { describe, expect, it } from "vitest";

import type { MemberView, RewardItem } from "@/data/api/generated/models";

import { summarise } from "./summary";

const member = (balance: number, rewards_ready: number) => ({ balance, rewards_ready }) as MemberView;
const reward = (base_price: number, cost_amount: number) => ({ base_price, cost_amount }) as RewardItem;

describe("programme liability", () => {
  it("adds up balances and earned rewards, ignoring overdrawn members", () => {
    const s = summarise([member(12, 2), member(3, 0), member(-4, 0)], [reward(4000, 5), reward(10000, 10)]);
    expect(s.members).toBe(3);
    expect(s.outstanding).toBe(15);
    expect(s.rewardsOwed).toBe(2);
    expect(s.membersWithReward).toBe(1);
    // Average menu price 7000 per reward; average 900 piastres per unit.
    expect(s.rewardsOwedValue).toBe(14000);
    expect(s.outstandingValue).toBe(13500);
  });

  it("does not invent a value without a catalogue", () => {
    const s = summarise([member(10, 1)], []);
    expect(s.outstandingValue).toBeNull();
    expect(s.rewardsOwedValue).toBeNull();
  });
});
