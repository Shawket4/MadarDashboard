/**
 * The Select wrapper never reports "" as a pick. Radix's hidden native select
 * reads "" when a controlled value changes after mount to an option the closed
 * list hasn't registered (a form.reset from loaded data), and Radix passes that
 * on to onValueChange: the combo editor lost its category that way (live T3).
 */
import { render } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const Picker = ({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) => (
  <form>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Category">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No category</SelectItem>
        <SelectItem value="drinks">Drinks</SelectItem>
      </SelectContent>
    </Select>
  </form>
);

// Loads its value in the first effect, as a form.reset from fetched data does.
const Loaded = ({ onValueChange }: { onValueChange: (v: string) => void }) => {
  const [value, setValue] = useState("none");
  useEffect(() => setValue("drinks"), []);
  return (
    <Picker
      value={value}
      onValueChange={(v) => {
        onValueChange(v);
        setValue(v);
      }}
    />
  );
};

describe("Select", () => {
  it("doesn't report a pick when its value is set from outside right after mount", async () => {
    const onValueChange = vi.fn();
    const view = render(<Loaded onValueChange={onValueChange} />);
    expect(await view.findByRole("combobox", { name: "Category" })).toHaveTextContent("Drinks");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
