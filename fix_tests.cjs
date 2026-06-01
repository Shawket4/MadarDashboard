const fs = require('fs');

// Fix tests
let testCode = fs.readFileSync('src/pages/analytics/__tests__/analytics.test.tsx', 'utf8');
testCode = testCode.replace(
  /category_name: "Mock Category",/g,
  'category_name: "Mock Category", category_name_translations: {},'
);
testCode = testCode.replace(
  /addon_name: "Extra Cheese",/g,
  'addon_name: "Extra Cheese", addon_name_translations: {},'
);

fs.writeFileSync('src/pages/analytics/__tests__/analytics.test.tsx', testCode);

// Fix analytics.tsx unused vars
let code = fs.readFileSync('src/pages/analytics/analytics.tsx', 'utf8');
code = code.replace(/const _lang = i18n\.language;/g, 'void i18n.language;');
fs.writeFileSync('src/pages/analytics/analytics.tsx', code);

console.log("Fixed!");
