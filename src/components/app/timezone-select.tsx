import { useTranslation } from "react-i18next";

import { Combobox } from "@/components/app/combobox";
import { useListTimezones } from "@/data/api/generated/api";

interface Props {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Searchable, select-only timezone picker. Options come from GET /timezones —
 * the labels of the backend `timezone_name` enum — so the form can never submit
 * a value the backend/DB would reject (single source of truth across DB,
 * backend, and this control).
 */
export function TimezoneSelect({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { data: zones } = useListTimezones();

  const list = zones ?? [];
  const options = list.map((z) => ({
    value: z,
    label: z,
    // Let "new york" match "America/New_York".
    keywords: z.replace(/[/_]/g, " "),
  }));
  // Defensive: keep an already-set value visible even if the list hasn't loaded.
  if (value && !list.includes(value)) {
    options.unshift({ value, label: value, keywords: value.replace(/[/_]/g, " ") });
  }

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={t("common.selectTimezone", "Select timezone…")}
      searchPlaceholder={t("common.searchTimezone", "Search timezones…")}
    />
  );
}
