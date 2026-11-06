/**
 * The output switches as data: what each one sends to the server, and how the
 * choice is remembered (per shop, on this device, defensively read).
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let orgId: string | null = "o-1";
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => orgId }));

const { safeStorage } = await import("@/lib/safe-storage");
const {
  DEFAULT_QR_OUTPUT,
  qrOutputKey,
  qrRenderParams,
  qrShape,
  readQrOutput,
  resetQrOutputMemory,
  useQrOutput,
} = await import("./output");

beforeEach(() => {
  for (const o of ["o-1", "o-2"]) safeStorage.removeItem(qrOutputKey(o));
  resetQrOutputMemory();
  orgId = "o-1";
});

describe("qrRenderParams", () => {
  it("branded mode sends exactly what the page always sent", () => {
    expect(qrRenderParams(DEFAULT_QR_OUTPUT)).toEqual({ card: true, dpi: 600 });
    expect(qrRenderParams({ ...DEFAULT_QR_OUTPUT, card: false, dpi: 300 })).toEqual({ card: false, dpi: 300 });
  });

  it("unbranded sends the plain code's switches and nothing of the card's", () => {
    expect(qrRenderParams({ ...DEFAULT_QR_OUTPUT, unbranded: true })).toEqual({
      unbranded: true,
      centre_logo: true,
      dpi: 600,
    });
    expect(qrRenderParams({ ...DEFAULT_QR_OUTPUT, unbranded: true, centreLogo: false, card: false })).toEqual({
      unbranded: true,
      centre_logo: false,
      dpi: 600,
    });
  });

  it("names the image's shape, for printing it true", () => {
    expect(qrShape(DEFAULT_QR_OUTPUT)).toBe("card");
    expect(qrShape({ ...DEFAULT_QR_OUTPUT, card: false })).toBe("receipt");
    expect(qrShape({ ...DEFAULT_QR_OUTPUT, unbranded: true, card: false })).toBe("plain");
  });
});

describe("readQrOutput", () => {
  it("defaults to today's branded card", () => {
    expect(readQrOutput("o-1")).toEqual(DEFAULT_QR_OUTPUT);
    expect(readQrOutput(null)).toEqual(DEFAULT_QR_OUTPUT);
  });

  it("survives anything stored, field by field", () => {
    safeStorage.setItem(qrOutputKey("o-1"), "{not json");
    expect(readQrOutput("o-1")).toEqual(DEFAULT_QR_OUTPUT);
    safeStorage.setItem(qrOutputKey("o-1"), JSON.stringify({ unbranded: "yes", centreLogo: false, dpi: 999 }));
    expect(readQrOutput("o-1")).toEqual({ ...DEFAULT_QR_OUTPUT, centreLogo: false });
  });
});

describe("useQrOutput", () => {
  it("remembers the choice per shop, on this device", () => {
    const { result, rerender } = renderHook(() => useQrOutput());
    act(() => result.current[1]({ unbranded: true }));
    expect(result.current[0].unbranded).toBe(true);
    expect(JSON.parse(safeStorage.getItem(qrOutputKey("o-1"))!)).toMatchObject({ unbranded: true, centreLogo: true });

    act(() => result.current[1]({ centreLogo: false }));
    expect(result.current[0]).toMatchObject({ unbranded: true, centreLogo: false });

    // Another shop on the same device has its own.
    orgId = "o-2";
    rerender();
    expect(result.current[0]).toEqual(DEFAULT_QR_OUTPUT);

    // And a fresh page load reads the first shop's back.
    resetQrOutputMemory();
    orgId = "o-1";
    rerender();
    expect(result.current[0]).toMatchObject({ unbranded: true, centreLogo: false });
  });

  it("two controls are one switch", () => {
    const a = renderHook(() => useQrOutput());
    const b = renderHook(() => useQrOutput());
    act(() => a.result.current[1]({ unbranded: true }));
    expect(b.result.current[0].unbranded).toBe(true);
  });
});
