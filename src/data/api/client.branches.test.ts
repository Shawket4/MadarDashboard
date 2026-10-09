// GET /branches lists warehouses only when asked (so released POS builds never
// see one); the dashboard asks on every read of the list.
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { askForWarehouses } from "./client";

const req = (over: Partial<InternalAxiosRequestConfig>) =>
  askForWarehouses({ headers: new AxiosHeaders(), ...over } as InternalAxiosRequestConfig);

describe("askForWarehouses", () => {
  it("asks for warehouses on the branch list", () => {
    expect(req({ url: "/branches", method: "GET", params: { org_id: "o" } }).params).toEqual({ org_id: "o", include_warehouses: true });
  });
  it("leaves an explicit choice and every other request alone", () => {
    expect(req({ url: "/branches", method: "get", params: { org_id: "o", include_warehouses: false } }).params.include_warehouses).toBe(false);
    expect(req({ url: "/branches", method: "POST", params: undefined }).params).toBeUndefined();
    expect(req({ url: "/branches/b1", method: "GET", params: undefined }).params).toBeUndefined();
  });
});
