import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";
import type { ComboboxOption } from "@/components/app/combobox";
import type { OrgIngredient } from "@/data/api/generated/models";
import type { GridBlock } from "../recipe/grid-model";
import { LabelGridEditor } from "../recipe/label-grid-editor";
import {
  ALL_SIZES,
  addLabelColumn,
  fromLabelBlocks,
  removeLabelColumn,
  toLabelBlocks,
  type LabelledLine,
} from "../recipe/label-model";

/** An option recipe line as the group editor holds it, plus the per-size label. */
export interface OptionSizeLine {
  ingredient_id: string;
  quantity: string | number;
  unit: string;
  /** `null`/absent = every size; else only sizes with this exact label (wins over `null`). */
  size_label?: string | null;
}

interface Props {
  /** The option's current lines (from the form). */
  lines: OptionSizeLine[];
  /** Size labels of the items the group is attached to (Cup, Can, Single, Double…), offered as columns. */
  sizeLabels: string[];
  /** Receives the full replace-set, blank cells dropped, `size_label` set per column. */
  onChange: (lines: OptionSizeLine[]) => void;
  catalogById: Map<string, OrgIngredient>;
  ingredientOptions: ComboboxOption[];
  /** Unique per option, for keyboard navigation (e.g. `opt-3`). */
  gridId: string;
  /** The editor's plain "Adds ingredients" list, shown while the toggle is off. */
  children: ReactNode;
}

/**
 * "Different amounts per size" for an *Adds ingredients* option (e.g. Mojito flavour
 * syrup 15 g in a Cup, 20 g in a Can). Off: the editor's own line list. On: a grid
 * with an "All sizes" column (unlabelled lines) plus one column per size label.
 *
 * Self-contained so the group editor (stream D1) hooks it up by wrapping its list;
 * see the modeling F-dash report for the one-line hookup.
 */
export function OptionSizeGrid({ lines, sizeLabels, onChange, catalogById, ingredientOptions, gridId, children }: Props) {
  const { t } = useTranslation();
  const allLabel = t("modeling.grid.allSizes", "All sizes");
  const [perSize, setPerSize] = useState(() => lines.some((l) => !!l.size_label));
  const [blocks, setBlocks] = useState<GridBlock[] | null>(null);

  const seed = () => toLabelBlocks(lines as LabelledLine[], sizeLabels, allLabel);
  const current = blocks ?? (perSize ? seed() : []);

  const update = (next: GridBlock[]) => {
    setBlocks(next);
    onChange(fromLabelBlocks(next));
  };

  const toggle = (on: boolean) => {
    setPerSize(on);
    if (on) {
      setBlocks(seed());
    } else {
      // Back to one amount for every size: keep only the unlabelled lines.
      setBlocks(null);
      onChange(lines.filter((l) => !l.size_label));
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={perSize} onCheckedChange={toggle} />
        {t("modeling.options.perSize", "Different amounts per size")}
      </label>
      {perSize ? (
        <>
          <LabelGridEditor
            gridId={gridId}
            blocks={current}
            onChange={update}
            catalogById={catalogById}
            ingredientOptions={ingredientOptions}
            onAddColumn={(label) => update(addLabelColumn(current, label))}
            removableKeys={new Set(current.filter((b) => b.key !== ALL_SIZES).map((b) => b.key))}
            onRemoveColumn={(key) => update(removeLabelColumn(current, key))}
          />
          <p className="text-xs text-muted-foreground">
            {t(
              "modeling.options.perSizeHint",
              "A size column replaces the All sizes amount for that size. Tills that predate per-size amounts use All sizes.",
            )}
          </p>
        </>
      ) : (
        children
      )}
    </div>
  );
}
