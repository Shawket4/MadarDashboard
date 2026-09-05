/**
 * Server-Sent Events framing, kept pure so the parser is testable without a
 * socket. A frame is a blank-line-terminated block of `field: value` lines;
 * `data:` lines concatenate with newlines, `id:` sets the resume cursor, and a
 * line starting with `:` is a comment (the server's `: ping` keep-alive).
 */
export interface SseFrame {
  event: string;
  data: string;
  id: string | null;
}

/**
 * Split `buffer` into complete frames and the trailing partial frame. A chunk
 * boundary lands mid-frame routinely, so the remainder must be carried over.
 */
export function parseSseFrames(buffer: string): { frames: SseFrame[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const frames: SseFrame[] = [];
  for (const block of blocks) {
    const frame = parseBlock(block);
    if (frame) frames.push(frame);
  }
  return { frames, rest };
}

function parseBlock(block: string): SseFrame | null {
  let event = "message";
  let id: string | null = null;
  const data: string[] = [];
  let sawField = false;
  for (const raw of block.split("\n")) {
    if (raw === "" || raw.startsWith(":")) continue;
    const colon = raw.indexOf(":");
    const field = colon === -1 ? raw : raw.slice(0, colon);
    let value = colon === -1 ? "" : raw.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    sawField = true;
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
  }
  if (!sawField) return null;
  return { event, data: data.join("\n"), id };
}
