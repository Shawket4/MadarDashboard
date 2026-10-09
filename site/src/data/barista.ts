/**
 * The cappuccino walkthrough uses Madar's own prep-step library
 * (MadarRust/static/step-animations): the same Lottie files and the same EN/AR
 * names and notes the product shows. Copied into src/assets/lottie/.
 */
export const BARISTA_STEPS = [
  { key: "grind", en: { name: "Grind coffee", note: "Grind fresh for every shot" }, ar: { name: "طحن القهوة", note: "اطحن طازجًا لكل شوت" } },
  { key: "tamp", en: { name: "Tamp", note: "Level it, then one firm press" }, ar: { name: "كبس البن", note: "سوِّ السطح ثم اكبس بثبات" } },
  { key: "pull_shot", en: { name: "Pull espresso shot", note: "Check the time and the grams" }, ar: { name: "سحب شوت إسبريسو", note: "راجع الوقت والجرامات" } },
  { key: "steam_milk", en: { name: "Steam milk", note: "Heat and texture to the drink's spec" }, ar: { name: "تبخير الحليب", note: "سخّن واضبط قوام الرغوة حسب المشروب" } },
  { key: "latte_art", en: { name: "Latte art", note: "Pour steadily and finish with the pattern" }, ar: { name: "رسم اللاتيه", note: "صب بثبات وأنهِ بالرسمة" } },
  { key: "lid", en: { name: "Put the lid on", note: "Press until it seats all the way round" }, ar: { name: "تركيب الغطاء", note: "اضغط حتى يثبت من كل الجهات" } },
  { key: "hand_over", en: { name: "Hand it over", note: "Call the name and hand it over" }, ar: { name: "تسليم الطلب", note: "نادِ الاسم وسلّم الطلب" } },
] as const;
