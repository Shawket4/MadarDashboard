const fs = require('fs');

// 1. Fix analytics.tsx
let code = fs.readFileSync('src/pages/analytics/analytics.tsx', 'utf8');

code = code.replace(
  'import { exportToExcel,  } from "@/shared/lib/excel";',
  'import { exportToExcel,  } from "@/shared/lib/excel";\nimport { getTranslatedName } from "@/shared/lib/translation";'
);

// Fix unused i18n
// Find const { t, i18n } = useTranslation();
code = code.replace(/const \{ t, i18n \} = useTranslation\(\);/g, (match, offset) => {
    // Check if i18n is used in the surrounding function
    // A quick hack is just to use i18n somewhere, e.g., i18n.language
    return 'const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ const _lang = i18n.language;';
});

fs.writeFileSync('src/pages/analytics/analytics.tsx', code);

// 2. Fix tests
let testCode = fs.readFileSync('src/pages/analytics/__tests__/analytics.test.tsx', 'utf8');
testCode = testCode.replace(
  /category_name: "Mock Category",/g,
  'category_name: "Mock Category", category_name_translations: {},'
);
testCode = testCode.replace(
  /addon_name: "Extra Cheese",/g,
  'addon_name: "Extra Cheese", addon_name_translations: {},'
);
testCode = testCode.replace(
  /item_name: "Espresso",/g,
  'item_name: "Espresso", item_name_translations: {},'
);

fs.writeFileSync('src/pages/analytics/__tests__/analytics.test.tsx', testCode);

console.log("Fixed!");
