import { useTranslation } from "react-i18next";

import { Combobox } from "@/components/app/combobox";

export interface PickerItem {
  id: string;
  name: string;
  /** A quiet second line: a role, a branch. */
  hint?: string;
}

interface PickerProps {
  items: PickerItem[];
  value: string | null | undefined;
  onChange: (id: string) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/** Pick one person by typing part of their name; long teams stay usable. */
export function EmployeePicker({ items, value, onChange, placeholder, ...rest }: PickerProps) {
  const { t } = useTranslation();
  return (
    <Combobox
      {...rest}
      options={items.map((p) => ({ value: p.id, label: p.name, hint: p.hint, keywords: p.hint }))}
      value={value ?? null}
      onChange={onChange}
      placeholder={placeholder ?? t("inputs.pickEmployee", "Pick an employee")}
      searchPlaceholder={t("inputs.searchName", "Type a name")}
      emptyText={t("inputs.noOneMatches", "No one by that name")}
    />
  );
}

/** Pick one branch; with `everyBranch`, the first choice is the whole business. */
export function BranchPicker({
  items, value, onChange, placeholder, everyBranch, ...rest
}: PickerProps & { everyBranch?: { value: string; label?: string } }) {
  const { t } = useTranslation();
  const options = [
    ...(everyBranch ? [{ value: everyBranch.value, label: everyBranch.label ?? t("inputs.everyBranch", "Every branch") }] : []),
    ...items.map((b) => ({ value: b.id, label: b.name, hint: b.hint })),
  ];
  return (
    <Combobox
      {...rest}
      options={options}
      value={value ?? null}
      onChange={onChange}
      placeholder={placeholder ?? t("inputs.pickBranch", "Pick a branch")}
      searchPlaceholder={t("inputs.searchBranch", "Type a branch name")}
      emptyText={t("inputs.noBranchMatches", "No branch by that name")}
    />
  );
}
