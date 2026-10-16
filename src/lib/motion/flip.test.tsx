import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { getFlip, loadFlip } from "./gsap";
import { useFlip } from "./hooks";

function List({ ids }: { ids: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  useFlip(ref, ids.join());
  return (
    <div ref={ref}>
      {ids.map((id) => (
        <div key={id}>
          {id}
          <input aria-label={id} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      ))}
    </div>
  );
}

describe("useFlip", () => {
  beforeAll(async () => {
    await loadFlip();
  });

  it("measures only when the key changes, never while someone types in a row", async () => {
    const spy = vi.spyOn(getFlip()!, "getState");
    const { rerender } = render(<List ids={["a", "b"]} />);
    const input = screen.getByLabelText("a");
    await userEvent.type(input, "90");
    expect(input).toHaveValue("90");
    expect(input).toHaveFocus();
    expect(spy).not.toHaveBeenCalled();

    rerender(<List ids={["b", "a"]} />);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
