import { Checkbox } from "@/components/ui/checkbox";

/**
 * Where someone works: a tick per branch (an employee may work at several).
 * Controlled; a form field wraps it.
 */
export function BranchChecklist({
  branches,
  value,
  onChange,
  invalid,
}: {
  branches: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...value.filter((v) => v !== id), id] : value.filter((v) => v !== id));
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {branches.map((b) => (
        <label key={b.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(b.id)}
            onCheckedChange={(c) => toggle(b.id, c === true)}
            aria-invalid={invalid || undefined}
          />
          {b.name}
        </label>
      ))}
    </div>
  );
}
