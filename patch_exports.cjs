const fs = require('fs');

// 1. Update export-drawer.tsx
let code = fs.readFileSync('src/features/orders-export/ui/export-drawer.tsx', 'utf8');
code = code.replace(
  'const { t } = useTranslation();',
  'const { t, i18n } = useTranslation();'
);
code = code.replace(
  'const sheets = buildSheets(res.data, grains, t);',
  'const sheets = buildSheets(res.data, grains, t, i18n.language);'
);
fs.writeFileSync('src/features/orders-export/ui/export-drawer.tsx', code);

// 2. Update build-sheets.ts
let sheetCode = fs.readFileSync('src/features/orders-export/lib/build-sheets.ts', 'utf8');

if (!sheetCode.includes('getTranslatedName')) {
  sheetCode = sheetCode.replace(
    'import type { TFunction } from "i18next";',
    'import type { TFunction } from "i18next";\nimport { getTranslatedName } from "@/shared/lib/translation";'
  );
}

sheetCode = sheetCode.replace(
  't: TFunction\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\n): ExcelSheetConfig<any>[] {',
  't: TFunction,\n  lang: string\n// eslint-disable-next-line @typescript-eslint/no-explicit-any\n): ExcelSheetConfig<any>[] {'
);

// item_name: it.item_name -> item_name: getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang)
sheetCode = sheetCode.replace(
  'item_name: it.item_name,',
  'item_name: getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang),'
);

// addon_name: a.addon_name -> a.addon_name is in a template literal string
sheetCode = sheetCode.replace(
  /a\.addon_name/g,
  'getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, lang)'
);

// optional field_name -> opt.field_name
sheetCode = sheetCode.replace(
  /opt\.field_name/g,
  'getTranslatedName({ name: opt.field_name, name_translations: opt.name_translations }, lang)'
);

// deductionsRaw: it.item_name (we already replaced the first item_name, but there's another in deductionRaw)
sheetCode = sheetCode.replace(
  /item_name: it\.item_name,/g,
  'item_name: getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, lang),'
);

fs.writeFileSync('src/features/orders-export/lib/build-sheets.ts', sheetCode);

console.log("Exports patched!");
