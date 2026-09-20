/**
 * The guest's stored identity must survive the move to the shared phone rule:
 * a phone or device token written by an older build is still recognised.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { clearDeviceToken, getDeviceToken, getGuestPhone, setDeviceToken, setGuestPhone } from "./guest";

beforeEach(() => localStorage.clear());

describe("guest phone", () => {
  it.each([
    ["as typed by the ordering step", "0100 123 4567"],
    ["as stored by the booking site", "201001234567"],
    ["with a plus", "+20 100 123 4567"],
  ])("recognises a phone stored %s", (_, stored) => {
    localStorage.setItem("madar_guest_phone:org-1", stored);
    expect(getGuestPhone("org-1")).toBe("201001234567");
  });

  it("reads a stored non-phone as nothing", () => {
    localStorage.setItem("madar_guest_phone:org-1", "abc");
    expect(getGuestPhone("org-1")).toBeNull();
    expect(getGuestPhone("org-2")).toBeNull();
  });

  it("stores the canonical form under the same key", () => {
    setGuestPhone("org-1", "0100-123-4567");
    expect(localStorage.getItem("madar_guest_phone:org-1")).toBe("201001234567");
  });
});

describe("device token", () => {
  it("finds a token an older build stored under the 20… key, however the phone is typed", () => {
    localStorage.setItem("madar_delivery_device:201001234567", "tok");
    expect(getDeviceToken("01001234567")).toBe("tok");
    expect(getDeviceToken("+20 100 123 4567")).toBe("tok");
    expect(getDeviceToken("٠١٠٠١٢٣٤٥٦٧")).toBe("tok");
  });

  it("round-trips and forgets", () => {
    setDeviceToken("01001234567", "tok");
    expect(localStorage.getItem("madar_delivery_device:201001234567")).toBe("tok");
    clearDeviceToken("201001234567");
    expect(getDeviceToken("01001234567")).toBeNull();
  });
});
