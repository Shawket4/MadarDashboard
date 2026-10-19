/**
 * Rewards by Madar: the page's copy in both languages (rendered by kit/Page.astro; the
 * shape is src/types/page.ts). The product's name and host come from src/lib/rewards.ts,
 * never typed here. Claims match the product (the owner's brief of
 * 2026-10-19): a stamp card in the customer's wallet, a web app at the counter, no link to
 * other point-of-sale systems. The prices come from REWARDS_PRICES; there is no self-serve
 * purchase (the owner switches the add-on on), so every button goes to WhatsApp.
 */
import type { PageModule } from "@/types/page";
import { REWARDS, REWARDS_URL, REWARDS_PRICES as P, fmtEgp } from "../../lib/rewards.ts";

const EN = REWARDS.name.en;
const AR = REWARDS.name.ar;
const [three, six, year] = [P.three, P.six, P.year].map(fmtEgp);

export const en: PageModule["en"] = {
  meta: {
    title: `${EN}: a wallet stamp card for your café, with or without Madar POS`,
    description: `${EN} is a stamp card in your customers' Apple Wallet or Google Wallet. Your cashier adds stamps from a web app on any phone. No Madar POS needed.`,
  },
  label: EN,
  hero: {
    kicker: EN,
    title: "A stamp card your regulars never lose.",
    lead: `${EN} puts your shop's stamp card in your customers' Apple Wallet or Google Wallet. Your cashier adds stamps from a web app on any phone or tablet. It works on its own, with no Madar POS, and inside Madar POS when you have it.`,
    action: { label: "Talk to us on WhatsApp", href: { to: "whatsapp", text: `Hi Madar, I'd like to hear about ${EN} for my shop.` } },
  },
  sections: [
    {
      kind: "grid",
      kicker: "What it is",
      title: "Loyalty without the paper card.",
      columns: 2,
      items: [
        { title: "A card in their wallet", body: "Customers carry your card in Apple Wallet or Google Wallet. There's no app for them to download, and the card updates the moment a stamp is added." },
        { title: "A web app at the counter", body: `The cashier opens ${EN} in the browser on any phone or tablet. Nothing to install from a store.` },
        { title: "Your card, your look", body: "Set the card's colour, put your logo on it, and choose how many stamps fill a card." },
        { title: "WhatsApp messages included", body: "Birthday and win-back messages, and notices about the card, reach your customers on WhatsApp. They come with it." },
      ],
    },
    {
      kind: "steps",
      kicker: "How it works",
      title: "Three steps, at the counter.",
      items: [
        { title: "The customer adds the card", body: "They scan your shop's QR code, enter a name and a mobile number, and add the card to Apple Wallet or Google Wallet." },
        { title: "The cashier adds stamps", body: "Scan the card's code with the camera or a USB scanner, or find the customer by phone number. One stamp for each item on the order." },
        { title: "A full card is a free reward", body: "When the card is full, the cashier redeems the reward and the stamps come off the card." },
      ],
    },
    {
      kind: "checks",
      tone: "surface",
      kicker: "Who it's for",
      title: "A shop with no Madar yet, or any café.",
      lead: "If people come back for your coffee, a stamp card brings them back more often.",
      items: [
        "A café, bakery or juice bar that wants a loyalty card, whatever it uses to ring up sales",
        "A shop with no point of sale at all",
        "A café already on Madar POS: the same loyalty is built into the till",
        "Owners who'd rather not print, stamp and lose paper cards",
      ],
      action: { label: "Talk to us on WhatsApp", href: { to: "whatsapp", text: `Hi Madar, I'd like to hear about ${EN} for my shop.` } },
    },
    {
      kind: "grid",
      kicker: "Alone or with Madar",
      title: "Start with the card. Add the till when you're ready.",
      columns: 3,
      numbered: true,
      items: [
        { title: "On its own", body: `${EN} is a paid add-on to the free Madar plan. You don't need a Madar till or a paid plan.` },
        { title: "With Madar POS", body: "On a paid Madar plan, loyalty is included and runs at the till: stamps or points earned from every sale, and rewards added to the order as lines." },
        { title: "Moving up keeps everything", body: `Move from ${EN} to Madar POS and you keep your customers, their stamps, their wallet cards and their history. It's a change of plan, not a migration.` },
      ],
    },
    {
      kind: "faq",
      title: "Questions",
      items: [
        { q: "Do I need Madar POS?", a: `No. ${EN} works on its own: your cashier adds stamps from a web app on any phone or tablet, whatever you use to take payments. If you run Madar POS, loyalty is already part of it.` },
        { q: "What do my customers need?", a: "A phone with Apple Wallet or Google Wallet, and a mobile number. They don't download an app." },
        { q: "What does my cashier need?", a: "Any phone or tablet with a browser. They scan the customer's card with the camera or a USB scanner, or look the customer up by phone number." },
        { q: `Can I start with ${EN} and move to Madar POS later?`, a: "Yes. Moving to Madar POS is a change of plan on the same account. Your customers, their stamps, their wallet cards and their history stay as they are." },
        { q: "Does it connect to the point of sale I use now?", a: `No. ${EN} doesn't connect to other point-of-sale systems, and it has no API or webhooks. The cashier adds stamps in ${EN} itself.` },
        { q: "How much does it cost?", a: `${EN} is an add-on to the free Madar plan: ${three} EGP for 3 months, ${six} EGP for 6 months or ${year} EGP for a year, per shop, with no per-seat fee. Contact us on WhatsApp to start. On a paid Madar plan, loyalty is included at no extra charge.` },
      ],
    },
    {
      kind: "band",
      title: "Bring your regulars back.",
      body: "Per shop, with no per-seat fee. Contact us on WhatsApp to start, and we'll set up your card with you.",
      price: { amount: `${three} EGP`, per: "for 3 months" },
      action: { label: "Talk to us on WhatsApp", href: { to: "whatsapp", text: `Hi Madar, I'd like to hear about ${EN} for my shop.` } },
      more: { label: `Open ${EN}`, href: { url: REWARDS_URL } },
      crew: ["joy"],
    },
  ],
};

export const ar: PageModule["ar"] = {
  meta: {
    title: `${AR}: كارت أختام في المحفظة لكافيهك، بمدار أو من غيره`,
    description: `${AR} كارت أختام في Apple Wallet أو Google Wallet عند زباينك. الكاشير بيضيف الأختام من تطبيق ويب على أي موبايل. مش محتاج كاشير مدار.`,
  },
  label: AR,
  hero: {
    kicker: AR,
    title: "كارت أختام زباينك مش هيضيّعوه.",
    lead: `${AR} بيحط كارت الأختام بتاع محلك في Apple Wallet أو Google Wallet عند زباينك. والكاشير بيضيف الأختام من تطبيق ويب على أي موبايل أو تابلت. بيشتغل لوحده من غير كاشير مدار، وجوه مدار لما يكون عندك.`,
    action: { label: "كلّمنا على واتساب", href: { to: "whatsapp", text: `أهلًا مدار، حابب أعرف أكتر عن ${AR} لمحلي.` } },
  },
  sections: [
    {
      kind: "grid",
      kicker: "يعني إيه",
      title: "ولاء من غير كارت ورق.",
      columns: 2,
      items: [
        { title: "كارت في محفظته", body: "الزبون شايل الكارت بتاعك في Apple Wallet أو Google Wallet. مفيش تطبيق ينزّله، والكارت بيتحدّث أول ما الختم يتضاف." },
        { title: "تطبيق ويب على الكاونتر", body: `الكاشير بيفتح ${AR} من المتصفح على أي موبايل أو تابلت. مفيش حاجة تتنزّل من متجر.` },
        { title: "كارتك بشكلك", body: "اختار لون الكارت، وحط اللوجو بتاعك، وحدد كام ختم يكمّل الكارت." },
        { title: "رسايل واتساب معاه", body: "رسايل عيد الميلاد و«وحشتنا»، وتنبيهات الكارت، بتوصل لزباينك على واتساب. وده جاي معاه." },
      ],
    },
    {
      kind: "steps",
      kicker: "بيشتغل إزاي",
      title: "تلات خطوات، على الكاونتر.",
      items: [
        { title: "الزبون بيضيف الكارت", body: "بيعمل سكان لكود QR بتاع محلك، ويكتب اسمه ورقم موبايله، ويضيف الكارت لـApple Wallet أو Google Wallet." },
        { title: "الكاشير بيضيف الأختام", body: "سكان لكود الكارت بالكاميرا أو بسكانر USB، أو دوّر على الزبون برقم موبايله. ختم لكل صنف في الأوردر." },
        { title: "الكارت الكامل مكافأة مجانية", body: "لما الكارت يكمل، الكاشير بيصرف المكافأة والأختام بتتخصم من الكارت." },
      ],
    },
    {
      kind: "checks",
      tone: "surface",
      kicker: "مناسب لمين",
      title: "محل لسه معندوش مدار، أو أي كافيه.",
      lead: "لو الناس بترجع عشان قهوتك، كارت الأختام بيرجّعهم أكتر.",
      items: [
        "كافيه أو مخبز أو محل عصير عايز كارت ولاء، أيًا كان بيحاسب بإيه",
        "محل معندوش نظام كاشير خالص",
        "كافيه شغّال على مدار أصلًا: نفس الولاء جوه الكاشير",
        "أصحاب المحلات اللي زهقوا من طباعة كروت الورق وختمها وضياعها",
      ],
      action: { label: "كلّمنا على واتساب", href: { to: "whatsapp", text: `أهلًا مدار، حابب أعرف أكتر عن ${AR} لمحلي.` } },
    },
    {
      kind: "grid",
      kicker: "لوحده أو مع مدار",
      title: "ابدأ بالكارت. وضيف الكاشير لما تكون جاهز.",
      columns: 3,
      numbered: true,
      items: [
        { title: "لوحده", body: `${AR} إضافة مدفوعة على باقة مدار المجانية. مش محتاج كاشير مدار ولا باقة مدفوعة.` },
        { title: "مع كاشير مدار", body: "على باقة مدار المدفوعة، الولاء جاي معاها وشغّال على الكاشير: أختام أو نقاط من كل بيعة، والمكافآت بتتضاف للأوردر كسطور." },
        { title: "لما تكبر، مفيش حاجة بتضيع", body: `انقل من ${AR} لكاشير مدار، وزباينك وأختامهم وكروت محافظهم وتاريخهم كله معاك. ده تغيير باقة، مش نقل بيانات.` },
      ],
    },
    {
      kind: "faq",
      title: "أسئلة",
      items: [
        { q: "لازم يكون عندي كاشير مدار؟", a: `لأ. ${AR} بيشتغل لوحده: الكاشير بيضيف الأختام من تطبيق ويب على أي موبايل أو تابلت، أيًا كان بتحاسب بإيه. ولو شغّال على كاشير مدار، الولاء جزء منه أصلًا.` },
        { q: "زباينّي محتاجين إيه؟", a: "موبايل عليه Apple Wallet أو Google Wallet، ورقم موبايل. مش هينزّلوا أي تطبيق." },
        { q: "الكاشير محتاج إيه؟", a: "أي موبايل أو تابلت عليه متصفح. بيعمل سكان لكارت الزبون بالكاميرا أو بسكانر USB، أو بيدوّر عليه برقم موبايله." },
        { q: `ينفع أبدأ بـ${AR} وأنقل لكاشير مدار بعدين؟`, a: "أيوه. النقل لكاشير مدار تغيير باقة على نفس الحساب. زباينك وأختامهم وكروت محافظهم وتاريخهم بيفضلوا زي ما هم." },
        { q: "بيتربط بنظام الكاشير اللي عندي دلوقتي؟", a: `لأ. ${AR} مش بيتربط بأنظمة كاشير تانية، ومعندوش API ولا webhooks. الكاشير بيضيف الأختام من ${AR} نفسه.` },
        { q: "بكام؟", a: `${AR} إضافة على باقة مدار المجانية: ${three} جنيه لـ3 شهور، أو ${six} جنيه لـ6 شهور، أو ${year} جنيه للسنة، لكل محل، من غير رسوم لكل مستخدم. كلّمنا على واتساب عشان تبدأ. وعلى باقة مدار المدفوعة، الولاء جاي معاها من غير أي زيادة.` },
      ],
    },
    {
      kind: "band",
      title: "رجّع زباينك الدايمين.",
      body: "لكل محل، من غير رسوم لكل مستخدم. كلّمنا على واتساب عشان تبدأ، وهنجهّز الكارت بتاعك معاك.",
      price: { amount: `${three} جنيه`, per: "لـ3 شهور" },
      action: { label: "كلّمنا على واتساب", href: { to: "whatsapp", text: `أهلًا مدار، حابب أعرف أكتر عن ${AR} لمحلي.` } },
      more: { label: `افتح ${AR}`, href: { url: REWARDS_URL } },
      crew: ["joy"],
    },
  ],
};
