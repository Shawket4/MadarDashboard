import { describe, expect, it } from "vitest";

import { parseSseFrames } from "./sse";

describe("parseSseFrames", () => {
  it("returns complete frames and carries the partial tail", () => {
    const { frames, rest } = parseSseFrames(
      "id: 7\nevent: booking.created\ndata: {\"id\":1}\n\nevent: table.status_changed\ndata: {\"t",
    );
    expect(frames).toEqual([{ id: "7", event: "booking.created", data: '{"id":1}' }]);
    expect(rest).toBe('event: table.status_changed\ndata: {"t');
  });

  it("skips keep-alive comments and tolerates CRLF", () => {
    const { frames, rest } = parseSseFrames(": ping\r\n\r\nevent: resync\r\ndata: {\"reason\":\"gap\"}\r\n\r\n");
    expect(frames).toEqual([{ id: null, event: "resync", data: '{"reason":"gap"}' }]);
    expect(rest).toBe("");
  });

  it("joins multi-line data and defaults the event name", () => {
    const { frames } = parseSseFrames("data: a\ndata: b\n\n");
    expect(frames).toEqual([{ id: null, event: "message", data: "a\nb" }]);
  });
});
