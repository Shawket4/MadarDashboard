/**
 * English copy. Arabic (ar.ts) must have the same shape: the type check enforces it.
 * Product claims follow the brochure v3 copy (checked against the code during the
 * brochure work) and LANDING_DECISIONS.md.
 */
export const en = {
  meta: {
    siteName: "Madar",
    locale: "en_US",
    home: {
      title: "Madar: the café POS that knows what every cup costs",
      description:
        "Madar is the café point of sale for owners who care about their numbers: recipe costing per cup, an inventory ledger, a till that counts blind and loyalty in the wallet. Arabic and English. First month free.",
    },
    features: {
      title: "Features · Madar café POS",
      description:
        "Everything Madar does from opening to close: the till, inventory and true cost, recipes at the counter, floor and kitchen, your own ordering, loyalty, menu engineering, Basira and HQ.",
    },
    pricing: {
      title: "Pricing · Madar café POS",
      description:
        "Two plans per branch with no per-seat fee: Essential Café at 3,000 EGP a month and Advanced Operation at 3,500. Your first month is on us.",
    },
    faq: {
      title: "Questions · Madar café POS",
      description:
        "Hardware, offline selling, the free month, billing, Arabic, branches and support: straight answers about running your café on Madar.",
    },
    about: {
      title: "About & support · Madar",
      description:
        "Madar is built in Cairo with the cafés that run on it: a direct line to the team, logic shaped to your operation, and setup done with you.",
    },
    notFound: {
      title: "Page not found · Madar",
      description: "This page isn't here.",
    },
  },

  nav: {
    features: "Features",
    pricing: "Pricing",
    faq: "Questions",
    about: "About",
    login: "Log in",
    talk: "Talk to us",
    menu: "Menu",
    close: "Close",
    langSwitch: "العربية",
    langSwitchAria: "اقرأ الصفحة دي بالعربي",
    skip: "Skip to content",
    home: "Madar, home",
    homeLabel: "Home",
    primary: "Main",
  },

  contact: {
    title: "Let's talk about your café.",
    subtitle: "Write to us and we reply the same day. An install slot is usually free within the week.",
    whatsapp: "Chat on WhatsApp",
    whatsappHint: "The fastest way to reach us",
    call: "Call us",
    email: "Email us",
    follow: "Follow Madar",
    close: "Close",
  },

  freeMonth: {
    badge: "First month free",
    line: "Your first month is on us: setup, menu build and staff training. No card, no lock-in.",
    short: "First month free · no card · no lock-in",
  },

  hero: {
    kicker: "The fixed point your operations orbit",
    title: "Know what every cup costs you.",
    sub: "The café POS for owners who care about their numbers.",
    body: "Recipes, stock, the till and loyalty on one ledger, in Arabic and English, online or off.",
    ctaPrimary: "Chat on WhatsApp",
    ctaSecondary: "See a café's day",
    chipItem: "Cappuccino · regular",
    chipCost: "Cost",
    chipMargin: "Margin",
    altRecipe:
      "Madar's menu studio: a cappuccino's recipe for each size, with its cost and margin worked out",
    altPos: "Madar's iPad till in Fast mode: an order of four lines beside the hot coffee menu",
  },

  pillars: {
    label: "Four commitments the category treats as optional",
    items: [
      {
        title: "Keeps selling when the internet doesn't.",
        body: "Every order, void and cash movement is written on the device first, then syncs exactly once.",
      },
      {
        title: "An accountant's ledger.",
        body: "Stock, cash and cost tie back to the same numbers. Every count reconciles, or it's flagged.",
      },
      {
        title: "A menu engineer, built in.",
        body: "Popularity and true margin side by side, with the price that restores the margin.",
      },
      {
        title: "A direct line to the team.",
        body: "Support from the people who build it, and logic shaped to how your café works.",
      },
    ],
  },

  day: {
    kicker: "A café's day",
    title: "From the first shot to the closing count.",
    body: "Follow a café's day through Madar: what happens at opening, through the rush, and after the doors close.",
    progress: "The day so far",
    stages: {
      opening: { time: "07:00", name: "Opening", line: "Count the float, receive the milk, know today's costs." },
      rush: { time: "13:00", name: "The rush", line: "The counter, the tables and the phones, all at once." },
      close: { time: "23:30", name: "After close", line: "The numbers, while the chairs go up." },
    },
  },

  rushTags: [
    "Pickup · Flat white",
    "Table 5 · 3× Espresso",
    "Delivery · Zamalek",
    "In-mall · Iced latte",
    "Umbrella · 2× Lemonade",
    "QR · Table 11",
    "Counter · Cappuccino",
    "Pickup · Spanish latte",
    "Table 2 · Croissant",
    "Delivery · Maadi",
  ],

  areas: {
    till: {
      kicker: "Till & control",
      title: "A till that counts blind.",
      body: "The till is a strict ledger. Every pay-in and pay-out is recorded with its reason and its person, so the expected drawer is a calculated number, not a guess. Tellers count first; the expected figures stay hidden until the till is closed.",
      points: [
        "Split one order across cash, card, wallets and your own methods, with the change worked out for you.",
        "Tips go on their own method, so a card tip never touches the cash drawer.",
        "Limits, not trust: above a teller's limit, a manager's PIN approves that one discount, void, refund or cash spot.",
      ],
      more: [
        "A till opens against the previous close, and any difference needs a reason.",
        "Done offline without permission? The sale stands and is flagged for a manager to clear.",
        "Full till histories, each one flagged balanced, short or over.",
      ],
      alts: {
        closeTill: "Closing the till on the iPad: the teller counts each note before the expected figures appear",
        charge: "The charge sheet: cash, card, wallet and partner methods, with split, discount and tip in one pane",
        managerPin: "A manager's PIN approving one cash spot on the teller's own screen",
        tillReport: "The till report after closing: expected and counted cash, and the difference",
      },
    },
    inventory: {
      kicker: "Inventory & true cost",
      title: "True cost, down to the gram.",
      body: "One ingredient catalogue for every branch. Reorder suggests what to buy from each supplier, receiving updates stock and cost together, and every recipe shows its cost and margin per size.",
      points: [
        "Weighted-average cost: each delivery re-weights what an ingredient really costs, and recipe costs follow.",
        "Sales, waste, transfers, purchases and counts each leave a signed entry. Nothing is overwritten.",
        "Stocktakes on their own schedule, with the variance worked out against the ledger.",
      ],
      more: [
        "Purchase orders from draft to received, with partial receipts and pack-size conversions.",
        "Every order line freezes its cost at the moment of sale: read history as it happened, or at today's costs.",
        "Log waste by reason, at the till or in the dashboard, and move stock between branches with both sides written at once.",
      ],
      alts: {
        ingredients: "Ingredients at the New Cairo branch: standard cost, supplier, stock on hand and reorder point",
        reorder: "Reorder suggestions, grouped by supplier",
        purchasing: "Purchase orders: open, ordered and received",
        waste: "The waste log at New Cairo, each entry with its reason",
      },
    },
    counter: {
      kicker: "Counter & barista",
      title: "Recipes that run the counter.",
      body: "Madar recipes don't just total a cost; they drive the workflow and the stock. Every sale deducts the exact ingredients it used, so training time drops and the signature drink tastes the same whoever is on shift.",
      points: [
        "Every choice priced at the till: the size, a milk swap, an extra shot.",
        "Swap whole milk for oat and the recipe replaces the ingredient instead of counting it twice.",
        "Prep steps for each drink, with an animation for every step, in Arabic and English.",
      ],
      more: [
        "Per-size recipes, shared recipe bases, and packaging rules that add the right cup, lid and straw.",
        "A Fast mode built for the queue, on an iPad or an Android tablet.",
        "Arabic and English receipts on Star and Epson printers, cash drawer included.",
      ],
      alts: {
        item: "The item sheet on the till: size, milk swap and extras, each with its price",
      },
      barista: {
        label: "A cappuccino, step by step",
        hint: "Scroll to make one",
      },
    },
    floor: {
      kicker: "Floor, kitchen & QR",
      title: "Every table and every station, live.",
      body: "Draw the floor once. Every till and every waiter's handheld shows it live: who's seated, who has waited long, which table needs clearing. In the kitchen, each station gets its own screen.",
      points: [
        "Every order lands on the station that makes it, with the minutes ticking.",
        "Guests order from the code on their table, and the round goes straight to the kitchen.",
        "Bookings by phone or online hold their tables, with WhatsApp messages for the guest.",
      ],
      more: [
        "Fire a round, move the party, charge the bill and mark the table cleared.",
        "Bump a line as it's done, or the whole ticket.",
        "On the shop's Wi-Fi, tills, handhelds and kitchen screens reach each other directly.",
      ],
      alts: {
        table: "A table on the till: its rounds, the bill, and moving the party",
        kds: "The kitchen display for the bar, each line tagged with its station",
        orderTable: "Ordering from a table's QR code: the basket before it's sent as a round",
        dashFloor: "The live floor plan in the dashboard, by section",
        dashQr: "QR codes for a branch: a spot in the mall and a code per table",
      },
    },
    ordering: {
      kicker: "Ordering & delivery",
      title: "From the first tap to the doorstep.",
      body: "Your own ordering page, in Arabic or English, with nothing to download. Guests order from your menu, the till works one queue, and every delivery closes into the same ledger as a counter sale.",
      points: [
        "Pickup, delivery, in-mall or to a beach umbrella, each switched on per branch with its own hours and fee.",
        "Delivery priced by real road distance, quoted live at checkout.",
        "Orders flow from received to delivered, and the guest follows every step.",
      ],
      more: [
        "Each channel can carry its own prices and availability.",
        "An optional WhatsApp code confirms the guest's number, and saved addresses come back next time.",
        "A links page for your Instagram bio: order, menu, rewards card and bookings in one place.",
      ],
      alts: {
        menu: "Your ordering page on a phone: the menu",
        channel: "Choosing how to receive it: pickup, delivery, in-mall or umbrella",
        track: "Live order tracking: on the way",
        customize: "The item sheet with a size, milk, extras and two shots picked",
        checkout: "Checkout for a delivery",
      },
    },
    loyalty: {
      kicker: "Loyalty",
      title: "In their wallet, not in a drawer.",
      body: "A rewards programme that belongs to your café, not to a marketplace. Points per pound or a stamp per order, carried in Apple Wallet and Google Wallet and updated the moment the balance changes.",
      points: [
        "Joining takes a name and a number, from a QR at the counter, a receipt or a link in your bio.",
        "The pass can surface on a guest's lock screen near one of your branches.",
        "Birthday and win-back messages reach the wallet card first, with WhatsApp only as a fallback.",
      ],
      more: [
        "Choose rewards from your menu, or open the whole menu at one price: collect five, get anything.",
        "Redemption happens at the till, priced by the server.",
        "Every member gets their own page: balance, progress, rewards and past orders.",
      ],
      alts: {
        pass: "The rewards card on the Add to Apple Wallet sheet",
        join: "Joining the rewards programme on a phone: a name and a number",
        card: "A member's own rewards page",
        wallet: "The rewards card in the Wallet app",
      },
    },
    menu: {
      kicker: "Menu profitability",
      title: "Your digital menu engineer.",
      body: "Madar watches popularity and true margin together. Every item lands as a Star, Workhorse, Challenge or Dog, and anything selling below cost or below your branch's target is flagged with a reason.",
      points: [
        "Suggested prices bring an item back to its target.",
        "Fix, dismiss or snooze a flag; the decision log measures whether the call paid off.",
        "Combos and deals built in, with each part costed and counted on its own.",
      ],
      more: [
        "Signals for a cost spike, a top seller under target, or no sales at all.",
        "Read-only: it never edits your menu behind your back.",
        "Margin targets set per branch.",
      ],
      alts: {
        quadrant: "Menu profitability at New Cairo: popularity against margin, with the branch target",
        repricing: "Repricing suggestions that bring items back to target",
        decisions: "The decision log: what changed, and whether it paid off",
      },
    },
    basira: {
      kicker: "Basira · ask your numbers",
      title: "Ask your numbers in plain language.",
      body: "Basira sits on the same ledger every other screen reads. It matches your question to a verified report, so the answer is your real number, never a guess, and it names the report behind it.",
      points: [
        "Read-only by design: it reports and recommends, and never edits your menu, prices or stock.",
        "Answers follow the asker's role and branch.",
        "Open the report behind any answer and export it in a tap.",
      ],
      more: [
        "Answers are computed from your orders, shifts, stock movements and costs.",
        "The same numbers your Excel exports carry.",
        "Charts and tables from the same verified reports.",
      ],
      demo: {
        question: "Which drinks lost margin this week?",
        answer: "Three drinks slipped under your 60% target at New Cairo.",
        report: "Report · Menu profitability · New Cairo",
        open: "Open the report",
        bars: ["Iced latte", "Mocha", "Spanish latte", "Flat white"],
        legendNow: "This week",
        legendTarget: "Target",
      },
    },
    hq: {
      kicker: "HQ & groups",
      title: "Headquarters in your browser.",
      body: "Today's revenue by branch, this week's margin by item, this month's tills by teller: everything filterable, exportable and live, on the web, the desktop app or a tablet.",
      points: [
        "One menu for the group: set a price or hide an item per branch, size and channel.",
        "Five roles (owner, branch manager, cashier, waiter, kitchen) plus your own, with any single permission per person.",
        "Excel exports with the totals row already in, scoped to whatever you've filtered.",
      ],
      more: [
        "Legal reports put VAT next to refunds, voids, discounts and overrides: who did what, and who approved it.",
        "Owners sign in with a password; staff use a 6-digit PIN on the till.",
        "A branch manager sees their branch, an owner sees the group, and organisations never mix.",
      ],
      alts: {
        overview: "The dashboard across all branches: revenue, orders, payment mix and branch performance",
        menuPricing: "Pricing and availability per branch and channel",
        access: "A cashier's access: role, branches, and each permission allowed or denied",
        export: "Export presets for the accountant and the till",
        ops: "Operations report: KPIs, payment mix and categories",
        orders: "The orders page: filters, KPIs and the order ledger",
        legal: "The legal report: VAT and the audit trail",
      },
    },
    dawam: {
      kicker: "Dawam",
      title: "Attendance that feeds payroll.",
      body: "Staff clock in on their own phones inside the branch zone, and the hours land on a timesheet that becomes the payslip.",
      points: [
        "Late arrivals, overtime and missing clock-outs flagged inline.",
        "Leave, overtime and corrections approved from one queue.",
        "A payroll run that can't be confirmed until every exception is cleared.",
      ],
    },
    setup: {
      kicker: "Setup & branding",
      title: "Tenders, channels and your own name.",
      body: "Payment methods, channels and partners you control, and with Advanced Operation, your café's own logo and colours on every page a guest sees.",
      points: [
        "Add a partner tender, an aggregator or a mall wallet, and set whether it counts as cash; reports follow.",
        "Retire a method without deleting it, and history still reconciles.",
        "Partners can get a read-only order feed for one branch.",
      ],
      alts: {
        payments: "Payment methods: cash or non-cash, active or inactive",
      },
    },
  },

  tiles: {
    title: "Also in the box",
    more: "See it in Features",
  },

  closing: {
    kicker: "Run your first month on us",
    title: "Every cup costed. Every shift counted.",
    body: "We install Madar in your branch, move your menu and recipes, and train the team on the till. You run a full month on real sales and real stock. If the numbers don't hold up, you owe us nothing.",
    cta: "Chat on WhatsApp",
    call: "Call",
    email: "Email",
    note: "No card · no lock-in",
  },

  footer: {
    tagline: "The fixed point your operations orbit",
    product: "Product",
    company: "Madar",
    contact: "Contact",
    legal: "Legal",
    terms: "Terms",
    privacy: "Privacy",
    rights: "Built in Cairo.",
    dashboard: "Merchant login",
  },

  features: {
    kicker: "Features",
    title: "Everything Madar does, from opening to close.",
    intro: "The till, the kitchen, the dashboard, ordering and loyalty: one system on one ledger, in Arabic and English.",
    wrongKicker: "The state of the art",
    wrongTitle: "What today's POS gets wrong.",
    wrong: [
      {
        title: "Treating offline as a failure.",
        body: "Most systems treat a dropped connection as a total failure. The shop in Maadi shouldn't stop making money because the cell tower went down.",
      },
      {
        title: "Poor local support by default.",
        body: "Arabic receipts, right-to-left screens and Star and Epson printing, cash drawer included, shouldn't be optional toggles. They need to be native.",
      },
      {
        title: "Hiding your own numbers.",
        body: "Yesterday's revenue by branch, your true ingredient cost, this month's shrinkage: most systems make you file a ticket or wait for a morning email.",
      },
      {
        title: "Selling without a ledger.",
        body: "A POS that rings sales without making stock and cash reconcile is an iPad calculator, not an operating system for a real business.",
      },
    ],
    ledger: {
      kicker: "Under everything",
      title: "One ledger.",
      body: "The till, online orders, stock and loyalty all write to the same ledger, and every dashboard, export and Basira answer reads from it. That's why the numbers agree.",
      labels: {
        till: "Till",
        ordering: "Online orders",
        inventory: "Stock",
        loyalty: "Loyalty",
        ledger: "One ledger",
        dashboard: "Dashboard",
        exports: "Excel exports",
        basira: "Basira",
      },
    },
    indexLabel: "Jump to",
    groups: {
      opening: "Opening",
      rush: "The rush",
      close: "After close",
      also: "Also in the box",
    },
    roadmap: {
      kicker: "The future",
      title: "On the roadmap.",
      body: "Madar ships every week. Here's what just landed and what's coming next. Coming items aren't live yet; ask us where each one stands.",
      items: [
        {
          status: "Just shipped",
          title: "Combos & deals",
          body: "Meal deals with choices, fixed bundles, “make it a meal” and cart-wide deals, on the till, the QR menu and online ordering.",
          live: true,
        },
        {
          status: "Just shipped",
          title: "Table bookings",
          body: "Bookings by phone or online that hold their tables, with WhatsApp messages and a link for the guest to manage theirs.",
          live: true,
        },
        {
          status: "In development",
          title: "Egyptian eInvoicing",
          body: "Direct integration with the Egyptian Tax Authority portal for invoice compliance, with no manual data entry.",
          live: false,
        },
        {
          status: "On the roadmap",
          title: "Talabat orders",
          body: "Talabat orders landing straight in the till's queue: no tablet on the side, no retyping.",
          live: false,
        },
        {
          status: "Coming",
          title: "Paymob card terminals",
          body: "Card payments on Paymob terminals, sent from the till, once Paymob opens the integration.",
          live: false,
        },
      ],
    },
  },

  pricing: {
    kicker: "Pricing",
    title: "Two plans, one price list.",
    sub: "Per branch, in Egyptian pounds. Every plan carries the full offline-first till, the ledger behind it and unlimited users. Commit for longer and the rate drops.",
    termLabel: "Billing term",
    terms: { monthly: "Monthly", three: "3 months", six: "6 months", year: "1 year" },
    termTotal: { monthly: "per month", three: "for 3 months", six: "for 6 months", year: "for 1 year" },
    perMonthEquiv: "a month",
    save: "Save",
    currency: "EGP",
    plans: [
      {
        key: "essential",
        tag: "Plan 01",
        name: "Essential Café",
        blurb: "The full till and the ledger behind it.",
        features: [
          "Offline-first iPad till with Star and Epson printing",
          "Recipe-linked inventory ledger",
          "Stocktakes, waste and branch transfers",
          "Till and cash reconciliation",
          "Branded, accountant-ready Excel exports",
        ],
        prices: { monthly: 3000, three: 8500, six: 16000, year: 30000 },
        featured: false,
      },
      {
        key: "advanced",
        tag: "Most operators",
        name: "Advanced Operation",
        blurb: "For operations that run deeper.",
        features: [
          "Everything in Essential Café",
          "Menu engineering, advisor and weighted-average costing",
          "Online ordering and delivery zones",
          "Your own branding on every customer-facing page",
        ],
        prices: { monthly: 3500, three: 10000, six: 19000, year: 35000 },
        featured: true,
      },
    ],
    notes: [
      { title: "Per branch", body: "Each branch carries its own subscription; the group reporting above them costs nothing extra." },
      { title: "No per-seat fee", body: "Tellers, managers and accountants are unlimited. Hire without checking the price list first." },
      { title: "Settled in person", body: "No card online. We agree the plan with you and settle it in person." },
    ],
    free: {
      kicker: "Start free",
      title: "Run your first month on us.",
      body: "We install Madar in your branch, move your menu and recipes, and train the team on the till. Real sales, real stock, real till closes. If the numbers don't hold up, you owe us nothing.",
      needTitle: "What we need from you",
      need: [
        "Your current menu and prices",
        "An iPad or Android tablet per till",
        "A thermal printer (Star or Epson) per station",
        "One afternoon with your shift leads",
      ],
      cta: "Book the free month on WhatsApp",
      note: "No card · no lock-in",
    },
  },

  faq: {
    kicker: "Questions",
    title: "Straight answers.",
    sub: "Something else on your mind? Ask us on WhatsApp; we reply the same day.",
    items: [
      {
        q: "What do we need to run Madar?",
        a: "An iPad or Android tablet for each till, a thermal printer (Star or Epson) for each station, and your current menu with its prices. The dashboard runs in a browser, the desktop app or on a tablet.",
      },
      {
        q: "What happens when the internet drops?",
        a: "The till keeps selling. Every order, void, cash movement and till event is saved on the device first and syncs exactly once when the connection returns: no double charges, no lost sales. On the shop's Wi-Fi, tills, handhelds and kitchen screens keep talking to each other.",
      },
      {
        q: "How does the free month work?",
        a: "We install Madar in your branch, move your menu and recipes, and train the team on the till. You run a full month on real sales, real stock and real till closes. If the numbers don't hold up, you owe us nothing.",
      },
      {
        q: "How is Madar billed?",
        a: "Per branch, monthly or for 3, 6 or 12 months, with no per-seat fee. We settle it with you in person: no card online, no lock-in.",
      },
      {
        q: "Can we move from our current POS?",
        a: "Yes. During setup we configure your menu, recipes, ingredients, branches, users and printers with you, so you don't start from a blank account.",
      },
      {
        q: "Is our data ours?",
        a: "Yes. Every report exports to Excel in a tap, and if you leave, your data goes with you in Excel workbooks.",
      },
      {
        q: "Does it work in Arabic?",
        a: "Arabic and English throughout: right-to-left screens, Arabic receipts, and guest pages and wallet passes in either language.",
      },
      {
        q: "We have several branches. Does it fit?",
        a: "Yes. One menu for the group, with prices and items set per branch, size and channel. Read one branch or roll up the whole group, and give each person access to the branches they work in.",
      },
      {
        q: "Do you integrate with Talabat, eInvoicing or card terminals?",
        a: "Not yet. Egyptian eInvoicing is in development, and Talabat orders and Paymob card terminals are on the roadmap. Today you can add Talabat, or any partner, as its own payment method, so the drawer and the reports stay right.",
      },
      {
        q: "What support do we get?",
        a: "A direct line to the team that builds Madar, on WhatsApp. If your café needs logic shaped to how it works, we build it on request.",
      },
    ],
  },

  about: {
    kicker: "About & support",
    title: "Built in Cairo, with the cafés that run on it.",
    lead: "Madar isn't software looking for a customer; it's an operational partnership. We set it up in your branches, shape the logic to how you work, and grow it with you.",
    sections: [
      {
        title: "A direct line, not a ticket queue.",
        body: "You talk to the team that builds Madar, on WhatsApp. We reply the same day, and an install slot is usually free within the week.",
      },
      {
        title: "Logic shaped to your operation.",
        body: "Need a rule that fits how your café works? It gets built on request, exactly as you need it, instead of waiting months for a generic feature that almost fits.",
      },
      {
        title: "Set up with you, not handed over.",
        body: "Menu, recipes, ingredients, branches, users and printers are configured with you, and your team is trained on the till before you go live.",
      },
      {
        title: "Built to be checked.",
        body: "Records carry their history: who created them, who changed them, when, and from what to what. Nothing is silently deleted, only voided and logged.",
      },
    ],
    partnerKicker: "Partnership",
    partnerTitle: "Looking forward to building together.",
    partnerBody: "Standard installs ship with everything on this site, and we build new screens, fields and integrations on request.",
  },

  notFound: {
    title: "This page wandered off.",
    body: "The page you're looking for isn't here. Head back home, or talk to us.",
    home: "Back to the home page",
  },

  common: {
    newTab: "(opens in a new tab)",
    learnMore: "Learn more",
    included: "Included",
  },
};

export type Copy = typeof en;
