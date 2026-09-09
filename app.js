// ============================================================
// HARTS DIGITAL HUB — app.js
// Chat-first landing page (converted from marketing site)
// Knowledgeable assistant that can answer client questions +
// seamless handoff to WhatsApp with full context.
// ============================================================

const WA_NUMBER = '237622341343';

// ── i18n (kept + extended for chat UI) ───────────────────────
const I18N = {
  en: {
    'pricing.title': 'Digital Packages',
    'starter.title': 'Starter',
    'starter.setup': '$80 setup',
    'starter.price': '$50',
    'growth.title': 'Growth',
    'growth.setup': '$200 setup',
    'growth.price': '$600',
    'pro.title': 'Pro',
    'pro.setup': '$400 setup',
    'pro.price': '$1,400',
    'permonth': '/ year',
    'starter.f1': 'Landing page',
    'starter.f2': 'Google Business listing',
    'starter.f3': 'WhatsApp Business setup',
    'growth.f1': 'Full website (5 pages)',
    'growth.f2': 'Social media management (2 platforms)',
    'growth.f3': 'Basic SEO',
    'growth.f4': 'Monthly performance report',
    'pro.f1': 'E-commerce store',
    'pro.f2': 'Google/Facebook Ads management',
    'pro.f3': 'WhatsApp chatbot',
    'pro.f4': 'Monthly analytics dashboard',
    'pro.f5': 'Priority support',
    'cta': 'Get Started',
    'wa': 'Chat on WhatsApp',
    'popular': 'Most Popular',
    'chat.title': 'Chat with Harts',
    'chat.subtitle': 'Ask about websites, apps, branding, and other digital services.',
    'chat.placeholder': 'Type your message...',
    'chat.send': 'Send',
    'chat.human': 'Talk to a real person',
    'chat.suggestions': 'Quick questions',
    'chat.welcome': 'Hi — H@rts here.\n\nMost people land here with something specific in mind: customer messages going unanswered, a system held together by spreadsheets, or a business that\'s just hard to find online.\n\nWhat brings you in today?'
  },
  fr: {
    'pricing.title': 'Forfaits Numériques',
    'starter.title': 'Démarrage',
    'starter.setup': '$80 installation',
    'starter.price': '$50',
    'growth.title': 'Croissance',
    'growth.setup': '$200 installation',
    'growth.price': '$600',
    'pro.title': 'Pro',
    'pro.setup': '$400 installation',
    'pro.price': '$1,400',
    'permonth': '/ an',
    'starter.f1': 'Page d\'accueil',
    'starter.f2': 'Fiche Google Business',
    'starter.f3': 'Configuration WhatsApp Business',
    'growth.f1': 'Site web complet (5 pages)',
    'growth.f2': 'Gestion réseaux sociaux (2 plateformes)',
    'growth.f3': 'SEO de base',
    'growth.f4': 'Rapport mensuel',
    'pro.f1': 'Boutique en ligne',
    'pro.f2': 'Gestion Google/Facebook Ads',
    'pro.f3': 'Chatbot WhatsApp',
    'pro.f4': 'Tableau de bord analytique',
    'pro.f5': 'Support prioritaire',
    'cta': 'Commencer',
    'wa': 'Discuter sur WhatsApp',
    'popular': 'Le plus populaire',
    'chat.title': 'Discuter avec Harts',
    'chat.subtitle': 'Posez vos questions sur nos sites web, applications, logos, flyers et autres services numériques.',
    'chat.placeholder': 'Tapez votre message...',
    'chat.send': 'Envoyer',
    'chat.human': 'Parler à un vrai conseiller',
    'chat.suggestions': 'Questions rapides',
    'chat.welcome': 'Bonjour — ici H@rts.\n\nLa plupart des visiteurs arrivent avec un problème précis : des messages clients sans réponse, un système qui tient avec des tableurs, ou une activité difficile à trouver en ligne.\n\nQu\'est-ce qui vous amène aujourd\'hui ?'
  }
};

let currentLang = localStorage.getItem('lang') || 'en';
let messages = []; // { role: 'user' | 'bot', text: string }
let leadContext = {}; // accumulates details during lead collection
let awaitingLeadField = null; // 'name' | 'business' | 'phone' | 'city' | 'package' | 'payment_pref' | null
let lastTopic = null;
let currentStage = 'discovery'; // discovery | selection | details | payment | review
let selectedPackage = null;
// Did the visitor NAME a package, or did the router infer one from context?
// "I need a website" anchors on Growth so follow-up questions have something to
// resolve against — but an inferred pick must never turn into an order on its
// own. Anything that commits to a package (the lead flow) checks this first.
let packageInferred = false;
let selectedPayment = null; // 'full' | 'installments'
let awaitingMomoNumber = false; // true while we wait for the customer's MoMo number to charge the setup fee
let awaitingAddons = false; // true while we offer optional add-ons before payment
let selectedAddons = []; // keys of add-ons the client chose (e.g. ['logo'])
let currentLeadId = null; // Supabase id of the saved lead, so a payment can link back to it

// Server-authoritative setup fees (mirrors api/pay/_lib.js) — used only for display in chat
// Prices are in USD (canonical). We display USD; Campay charges the XAF equivalent.
// These FALLBACK_* constants are the resilience net for the knowledge-base hydration
// below (see hydrateCatalogFromKB) — kept permanently, not just during migration, so
// the chat is always usable even if /api/services is unreachable.
const FALLBACK_SETUP_FEES_USD = { starter: 80, essential: 125, growth: 200, pro: 400, build_only: 300 };
const USD_TO_XAF = 600; // display-only estimate for the "≈ XAF" note; server uses env USD_XAF_RATE

// One-time add-ons (mirrors ADDON_PRICES_USD in api/pay/_lib.js) — display only; server recomputes
const FALLBACK_ADDONS = {
  logo: { price: 40, label: { en: 'Logo', fr: 'Logo' } },
  full_branding: { price: 130, label: { en: 'Full branding (logo, colours, business card, templates)', fr: 'Branding complet (logo, couleurs, carte de visite, templates)' } }
};

// Enterprise service categories (custom software, cloud, managed IT, AI chatbots) — not
// sold as chat packages like PACKAGES below, but the chatbot needs to be able to answer
// about them (see the "chatbot intent" branch in getBotResponse). Hydrated from the same
// knowledge base; this fallback covers the one category the chat can be asked about
// directly ("I need a chatbot...").
const FALLBACK_ENTERPRISE = {
  ai_chatbots: {
    name: { en: 'AI Chatbots & Automation', fr: 'Chatbots IA & Automatisation' },
    tagline: {
      en: 'Chatbots for WhatsApp, your website or other channels — integrated into new or existing systems, not bolted on the side.',
      fr: 'Des chatbots pour WhatsApp, votre site web ou d\'autres canaux — intégrés à des systèmes nouveaux ou existants, pas ajoutés en périphérie.'
    },
    desc: {
      en: 'We build AI chatbots that answer customers, check your live database, engage leads and hand off to a human the moment it matters — on WhatsApp, your website, or wherever your customers already are, integrated into new or already-existing systems (CRM, ERP, POS).',
      fr: 'Nous concevons des chatbots IA qui répondent aux clients, vérifient votre base de données en direct, engagent les prospects et transfèrent à un humain au bon moment — sur WhatsApp, votre site web, ou tout autre canal utilisé par vos clients, intégrés à des systèmes nouveaux ou déjà existants (CRM, ERP, POS).'
    },
    tags: ['WhatsApp', 'Website Chat', 'CRM / ERP Sync']
  },
  custom_software: {
    name: { en: 'Custom Software & Web Systems', fr: 'Logiciels & Systèmes Web sur Mesure' },
    tagline: {
      en: 'The system your business actually runs on — built around how you work, not the other way round.',
      fr: 'Le système sur lequel votre entreprise tourne vraiment — conçu autour de votre façon de travailler, et non l\'inverse.'
    },
    desc: {
      en: 'When spreadsheets, WhatsApp groups and off-the-shelf tools stop holding things together, we build the system that replaces them: stock and inventory engines, ERPs, admin dashboards, booking and order platforms, internal tools. We start by mapping how your team works today, then build only what earns its place.',
      fr: 'Quand les tableurs, les groupes WhatsApp et les outils génériques ne suffisent plus, nous construisons le système qui les remplace : gestion de stock, ERP, tableaux de bord, plateformes de réservation ou de commandes, outils internes. Nous commençons par cartographier votre façon de travailler, puis nous construisons uniquement ce qui est utile.'
    },
    tags: ['ERP / Inventory', 'Admin Dashboards', 'Internal Tools', 'Booking & Orders']
  },
  cloud_database: {
    name: { en: 'Cloud & Database Architecture', fr: 'Architecture Cloud & Base de Données' },
    tagline: {
      en: 'For when the system works — until it gets busy.',
      fr: 'Pour quand le système fonctionne — jusqu\'à ce qu\'il y ait du monde.'
    },
    desc: {
      en: 'We diagnose why things are slow, falling over, or costing more than they should, then fix it properly: query and performance optimisation, database redesign, zero-downtime migrations off whatever you\'re on now, and infrastructure that scales with your traffic instead of against it.',
      fr: 'Nous diagnostiquons pourquoi c\'est lent, instable ou trop coûteux, puis nous corrigeons en profondeur : optimisation des requêtes et des performances, refonte de base de données, migrations sans interruption, et infrastructure qui évolue avec votre trafic.'
    },
    tags: ['Performance Tuning', 'Zero-Downtime Migration', 'Scalable Infrastructure']
  },
  managed_it: {
    name: { en: 'Managed IT & SLA Retainers', fr: 'Infogérance & Contrats SLA' },
    tagline: {
      en: 'Someone whose job it is to keep your systems running — so it stops being yours.',
      fr: 'Quelqu\'un dont le métier est de maintenir vos systèmes — pour que ce ne soit plus le vôtre.'
    },
    desc: {
      en: 'A monthly retainer covering monitoring, updates, backups, security patching and a real response-time commitment when something breaks. Three tiers: Standard ($125/mo), Priority ($400/mo) and Enterprise (scoped to you). Most clients move onto a retainer once we\'ve launched their build.',
      fr: 'Un forfait mensuel couvrant la supervision, les mises à jour, les sauvegardes, les correctifs de sécurité et un vrai engagement de délai de réponse en cas de panne. Trois niveaux : Standard (125$/mois), Priority (400$/mois) et Enterprise (sur mesure). La plupart de nos clients passent au forfait après le lancement.'
    },
    tags: ['Standard $125/mo', 'Priority $400/mo', 'Enterprise (custom)']
  }
};

// Simple dynamic user profile for more human-like, contextual responses
let userProfile = {
  businessType: null, // e.g. "restaurant", "shop", "service business"
  location: null,
  mainGoal: null, // e.g. "more customers", "online sales", "professional branding", "mobile app"
  mentionedBudget: null
};

// ── Core Knowledge Base (answers to "all" common client questions) ──
const FALLBACK_PACKAGES = {
  starter: {
    name: { en: 'Starter', fr: 'Démarrage' },
    setup: { en: '$80 setup', fr: '$80 installation' },
    price: { en: '$50 / year', fr: '$50 / an' },
    features: {
      en: ['Landing page', 'Google Business listing', 'WhatsApp Business setup'],
      fr: ['Page d\'accueil', 'Fiche Google Business', 'Configuration WhatsApp Business']
    },
    desc: {
      en: 'Perfect for getting your business online quickly and affordably.',
      fr: 'Idéal pour mettre votre entreprise en ligne rapidement et à petit prix.'
    },
    installment: { en: 'Pay the yearly fee in 2-3 interest-free MoMo installments', fr: 'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo' }
  },
  essential: {
    name: { en: 'Essential', fr: 'Essentiel' },
    setup: { en: '$125 setup', fr: '$125 installation' },
    price: { en: '$165 / year', fr: '$165 / an' },
    features: {
      en: ['3-page website', 'Google Business + WhatsApp setup', 'Social media (1 platform, light management)', 'Basic SEO'],
      fr: ['Site web 3 pages', 'Fiche Google Business + configuration WhatsApp', 'Réseaux sociaux (1 plateforme, gestion légère)', 'SEO de base']
    },
    desc: {
      en: 'A real multi-page website and a starter online presence — more than a landing page, without full social management.',
      fr: 'Un vrai site multi-pages et une présence en ligne de départ — plus qu\'une page d\'accueil, sans la gestion complète des réseaux sociaux.'
    },
    installment: { en: 'Pay the yearly fee in 2-3 interest-free MoMo installments', fr: 'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo' }
  },
  growth: {
    name: { en: 'Growth', fr: 'Croissance' },
    setup: { en: '$200 setup', fr: '$200 installation' },
    price: { en: '$600 / year', fr: '$600 / an' },
    features: {
      en: ['Full website (5 pages)', 'Social media management (2 platforms)', 'Basic SEO', 'Monthly performance report'],
      fr: ['Site web complet (5 pages)', 'Gestion réseaux sociaux (2 plateformes)', 'SEO de base', 'Rapport mensuel']
    },
    desc: {
      en: 'Our most popular package. Great for businesses ready to grow visibility and customers.',
      fr: 'Notre forfait le plus populaire. Parfait pour les entreprises qui veulent gagner en visibilité et en clients.'
    },
    popular: true,
    installment: { en: 'Pay the yearly fee in 2-3 interest-free MoMo installments', fr: 'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo' }
  },
  pro: {
    name: { en: 'Pro', fr: 'Pro' },
    setup: { en: '$400 setup', fr: '$400 installation' },
    price: { en: '$1,400 / year', fr: '$1,400 / an' },
    features: {
      en: ['E-commerce store', 'Google/Facebook Ads management', 'WhatsApp chatbot', 'Monthly analytics dashboard', 'Priority support'],
      fr: ['Boutique en ligne', 'Gestion Google/Facebook Ads', 'Chatbot WhatsApp', 'Tableau de bord analytique', 'Support prioritaire']
    },
    desc: {
      en: 'Full digital presence with advertising and automation for serious growth.',
      fr: 'Présence digitale complète avec publicité et automatisation pour une croissance sérieuse.'
    },
    installment: { en: 'Pay the yearly fee in 2-3 interest-free MoMo installments', fr: 'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo' }
  },
  build_only: {
    name: { en: 'Build & Launch (One-Time)', fr: 'Création & Mise en ligne (Paiement unique)' },
    setup: { en: '$300 one-time (Starter-level site + launch)', fr: '$300 paiement unique (site niveau Starter + lancement)' },
    price: { en: 'No recurring fee (management add-on available later)', fr: 'Aucun frais récurrent (option gestion disponible plus tard)' },
    features: {
      en: ['Professional 5-page website', 'Google Business + WhatsApp setup', 'Mobile-friendly design', 'Training on how to manage your new digital assets'],
      fr: ['Site web professionnel 5 pages', 'Fiche Google Business + configuration WhatsApp', 'Design adapté mobile', 'Formation sur la gestion de vos nouveaux actifs numériques']
    },
    desc: {
      en: 'Perfect if you want a complete digital project (website, app, or branding) delivered without ongoing commitment. You own everything.',
      fr: 'Idéal si vous voulez un projet numérique complet (site, application ou branding) livré sans engagement continu. Vous en êtes propriétaire.'
    }
  }
};

// Live bindings the chat actually reads. Seeded from the FALLBACK_* constants above
// so the chat is fully usable from the first keystroke, then silently upgraded by
// hydrateCatalogFromKB() once /api/services resolves (or left as-is if it doesn't —
// see the fallback chain there). `let` (not `const`) is required: getBotResponse and
// formatPackage read these via closure, so reassigning the binding later is enough —
// no other code needs to change when the KB replaces the fallback values.
let PACKAGES = FALLBACK_PACKAGES;
let SETUP_FEES_USD = FALLBACK_SETUP_FEES_USD;
let ADDONS = FALLBACK_ADDONS;
let ENTERPRISE = FALLBACK_ENTERPRISE;

const KB_CACHE_KEY = 'harts_kb_cache';
const KB_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Reshapes the /api/services response ({items, addons}) into the exact shapes
// PACKAGES/SETUP_FEES_USD/ADDONS/ENTERPRISE already have, so every consumer
// (formatPackage, formatEnterpriseService, providePaymentInstructions, etc.)
// works unchanged regardless of whether the data came from the KB or the fallback.
function normalizeCatalog(apiResponse) {
  const items = Array.isArray(apiResponse?.items) ? apiResponse.items : [];
  const addonRows = Array.isArray(apiResponse?.addons) ? apiResponse.addons : [];

  const packages = {};
  const setupFees = {};
  const enterprise = {};

  items.forEach(row => {
    const feats = row.features && typeof row.features === 'object' ? row.features : { en: [], fr: [] };
    if (row.kind === 'sme_package') {
      const priceLabel = row.price_unit === 'year'
        ? { en: `${usd(row.price_usd)} / year`, fr: `${usd(row.price_usd)} / an` }
        : row.price_unit === 'one_time'
          ? { en: 'No recurring fee (management add-on available later)', fr: 'Aucun frais récurrent (option gestion disponible plus tard)' }
          : { en: 'Custom', fr: 'Sur mesure' };
      packages[row.id] = {
        name: { en: row.name_en, fr: row.name_fr },
        setup: { en: `${usd(row.setup_fee_usd)} setup`, fr: `${usd(row.setup_fee_usd)} installation` },
        price: priceLabel,
        features: { en: feats.en || [], fr: feats.fr || [] },
        desc: { en: row.desc_en || '', fr: row.desc_fr || '' },
        popular: Boolean(row.popular),
        installment: (row.installment_note_en || row.installment_note_fr)
          ? { en: row.installment_note_en || '', fr: row.installment_note_fr || '' }
          : undefined
      };
      if (row.setup_fee_usd != null) setupFees[row.id] = Number(row.setup_fee_usd);
    } else if (row.kind === 'enterprise_category') {
      enterprise[row.id] = {
        name: { en: row.name_en, fr: row.name_fr },
        tagline: { en: row.tagline_en || '', fr: row.tagline_fr || '' },
        desc: { en: row.desc_en || '', fr: row.desc_fr || '' },
        tags: Array.isArray(row.tags) ? row.tags : []
      };
    }
    // 'sla_tier' rows aren't consumed by the chat today (they're a static section
    // on index.html) — intentionally not mapped here, see the plan's scope notes.
  });

  const addons = {};
  addonRows.forEach(row => {
    addons[row.id] = { price: Number(row.price_usd), label: { en: row.name_en, fr: row.name_fr } };
  });

  return {
    packages: Object.keys(packages).length ? packages : null,
    setupFees: Object.keys(setupFees).length ? setupFees : null,
    addons: Object.keys(addons).length ? addons : null,
    enterprise: Object.keys(enterprise).length ? enterprise : null
  };
}

// Non-blocking: the chat is already usable on FALLBACK_* the instant the script
// loads. This only upgrades PACKAGES/SETUP_FEES_USD/ADDONS/ENTERPRISE in place if
// and when the knowledge base answers — a slow or failed fetch never delays or
// breaks a conversation already in progress.
async function hydrateCatalogFromKB() {
  const applyIfPresent = (normalized) => {
    if (!normalized) return false;
    let applied = false;
    if (normalized.packages) { PACKAGES = normalized.packages; applied = true; }
    if (normalized.setupFees) { SETUP_FEES_USD = normalized.setupFees; applied = true; }
    if (normalized.addons) { ADDONS = normalized.addons; applied = true; }
    if (normalized.enterprise) { ENTERPRISE = normalized.enterprise; applied = true; }
    return applied;
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('/api/services', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const normalized = normalizeCatalog(data);
    // The same endpoint carries the FAQ rows — the Hobby plan caps this project
    // at 12 serverless functions and we are at exactly 12, so /api/services
    // serves both rather than there being a /api/faq.
    const gotFaq = mergeFAQFromKB(data.faqs);
    if (applyIfPresent(normalized) || gotFaq) {
      try { localStorage.setItem(KB_CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() })); } catch (e) { /* ignore */ }
    }
    return;
  } catch (e) {
    // Fall through to the cached copy, then to FALLBACK_* (already in effect).
  }

  try {
    const cached = JSON.parse(localStorage.getItem(KB_CACHE_KEY) || 'null');
    if (cached && (Date.now() - cached.fetchedAt) < KB_CACHE_MAX_AGE_MS) {
      applyIfPresent(normalizeCatalog(cached.data));
      mergeFAQFromKB(cached.data && cached.data.faqs);
    }
  } catch (e) { /* ignore — FALLBACK_* stays in effect */ }
}

const KNOWLEDGE = {
  en: {
    welcome: I18N.en['chat.welcome'],
    services: 'We build custom websites, mobile apps, e-commerce stores, and other digital services for small businesses in Cameroon. This includes professional design for logos, flyers, business cards, branding materials, social media management, Google Business optimization, WhatsApp Business setup, and digital marketing. We handle everything from concept to launch and ongoing support — no technical skills required from you.',
    upgrade: 'Yes, you can upgrade your package or add services (like app development or extra design work) at any time. We make the transition smooth.',
    technical: 'No technical skills are required at all. We handle design, development, content, launch, and ongoing support. You just share your vision and approve the work.',
    timeline: 'Simple websites and branding projects (logos, flyers) are typically ready in 5–10 days. Full websites or apps usually take 2–4 weeks depending on complexity and how quickly you provide content.',
    payment: 'We accept MTN MoMo (*126# → Send to 622 341 343), Orange Money, and bank transfer. Managed packages are billed yearly — the yearly fee is due once at the start of your service year (and you can split it into 2-3 interest-free MoMo installments). For MoMo we will give you exact instructions.',
    momo: 'To pay with MTN MoMo:\n1. Dial *126#\n2. Select Transfer Money → Send to MTN Cameroon\n3. Enter 622 341 343\n4. Enter the exact amount for your project or package\n5. Confirm and keep your reference number.\nAfter payment, send us the reference on WhatsApp and we start or activate your services.',
    cities: 'We work with businesses across Cameroon — Yaoundé, Douala, Buea, and many other cities. Everything is handled remotely via WhatsApp, calls, and shared documents.',
    freeAudit: 'We can help you figure out the right services for your business right now. Just tell us a bit about what you do and what you need (more customers, online sales, new branding, etc.) and we\'ll recommend the best options.',
    who: 'Harts Digital Hub is a Cameroon-based digital agency that builds websites, mobile apps, and other digital products (logos, flyers, branding, social media assets) for SMEs. We focus on high-quality, affordable work with flexible payment plans.',
    contact: 'The fastest way to reach our team is WhatsApp: +237 622 341 343. We can prepare a detailed message with everything we\'ve discussed so they have full context.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Our packages and custom projects are full-service. We don\'t just deliver files and disappear — we handle design, development, revisions, launch, and support. Many clients see real results quickly (more visibility, new customers, professional brand presence).',
    installments: 'Yes! You can split the yearly fee (and the setup) into 2-3 interest-free MoMo installments. Spread the cost over 2 or 3 payments with no extra fees. Great for cash flow.',
    prepay: 'All managed packages are billed yearly (one payment covers the whole year). You can pay the yearly fee in full, or split it into 2-3 interest-free MoMo installments.',
    build_only: 'We offer one-time projects (website, app, logo + flyer package, full branding) with no recurring commitment. You own everything and can add ongoing management later if needed.',
    roi_example: 'Real results: "Our restaurant bookings tripled in 2 months after Harts built our website and social assets. Customers now find us easily on Google and Instagram." (Mama Ngozi, Yaoundé). Many clients recover their investment quickly through new business.',
    price_objection: 'We understand budget is important. Our packages are billed yearly and include flexible payment (you can split the yearly fee into 2-3 interest-free installments). We deliver real websites, apps, and professional design work. Would you like to see the installment options or discuss a custom quote for your project?'
  },
  fr: {
    welcome: I18N.fr['chat.welcome'],
    services: 'Nous créons des sites web personnalisés, des applications mobiles, des boutiques en ligne et d\'autres services numériques pour les petites entreprises au Cameroun. Cela inclut la conception professionnelle de logos, flyers, cartes de visite, supports de branding, gestion des réseaux sociaux, optimisation Google Business, configuration WhatsApp Business et marketing digital. Nous gérons tout du concept au lancement et au support continu — aucune compétence technique requise de votre part.',
    upgrade: 'Oui, vous pouvez passer à un forfait supérieur ou ajouter des services (comme le développement d\'applications ou du design supplémentaire) à tout moment. Nous assurons une transition fluide.',
    technical: 'Aucune compétence technique n\'est nécessaire. Nous nous occupons de la conception, du développement, du contenu, du lancement et du support continu. Vous partagez simplement votre vision et validez le travail.',
    timeline: 'Les sites simples et les projets de branding (logos, flyers) sont généralement prêts en 5 à 10 jours. Les sites complets ou les applications prennent généralement 2 à 4 semaines selon la complexité et la rapidité avec laquelle vous fournissez le contenu.',
    payment: 'Nous acceptons MTN MoMo (*126# → envoi vers 622 341 343), Orange Money et virement bancaire. Les forfaits gérés sont facturés à l\'année — le forfait annuel est dû une fois, au début de votre année de service (et vous pouvez l\'étaler en 2 ou 3 versements sans intérêts par MoMo). Pour MoMo nous vous donnerons les instructions précises.',
    momo: 'Pour payer par MTN MoMo :\n1. Composez *126#\n2. Choisissez Transfert d\'argent → Envoi vers MTN Cameroun\n3. Entrez 622 341 343\n4. Entrez le montant exact de votre projet ou forfait\n5. Confirmez et gardez votre référence.\nAprès paiement, envoyez-nous la référence sur WhatsApp et nous démarrons ou activons vos services.',
    cities: 'Nous travaillons avec des entreprises dans tout le Cameroun — Yaoundé, Douala, Buea et de nombreuses autres villes. Tout se fait à distance via WhatsApp, appels et documents partagés.',
    freeAudit: 'Nous pouvons vous aider à déterminer les bons services pour votre entreprise dès maintenant. Dites-nous simplement ce que vous faites et ce dont vous avez besoin (plus de clients, ventes en ligne, nouveau branding, etc.) et nous vous recommanderons les meilleures options.',
    who: 'Harts Digital Hub est une agence digitale basée au Cameroun qui crée des sites web, des applications mobiles et d\'autres produits numériques (logos, flyers, branding, visuels pour réseaux sociaux) pour les PME. Nous nous concentrons sur un travail de qualité à prix abordable avec des plans de paiement flexibles.',
    contact: 'Le moyen le plus rapide de joindre notre équipe est WhatsApp : +237 622 341 343. Nous pouvons préparer un message détaillé avec tout ce dont nous avons discuté pour qu\'ils aient le contexte complet.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Nos forfaits et projets sur mesure sont des services complets. Nous ne livrons pas simplement des fichiers et ne disparaissons pas — nous gérons la conception, le développement, les révisions, le lancement et le support. Beaucoup de clients voient de vrais résultats rapidement (plus de visibilité, de nouveaux clients, une présence de marque professionnelle).',
    installments: 'Oui ! Vous pouvez étaler le forfait annuel (et l\'installation) en 2 ou 3 versements sans intérêts par MTN MoMo, sans frais supplémentaires. Idéal pour la trésorerie.',
    prepay: 'Tous les forfaits gérés sont facturés à l\'année (un seul paiement couvre toute l\'année). Vous pouvez payer le forfait annuel en une fois, ou l\'étaler en 2 ou 3 versements sans intérêts par MoMo.',
    build_only: 'Nous proposons des projets ponctuels (site web, application, pack logo + flyers, branding complet) sans engagement récurrent. Vous êtes propriétaire de tout et pouvez ajouter une gestion continue plus tard si nécessaire.',
    roi_example: 'Résultats concrets : "Nos réservations de restaurant ont triplé en 2 mois après que Harts ait créé notre site web et nos visuels pour les réseaux sociaux. Les clients nous trouvent facilement sur Google et Instagram." (Mama Ngozi, Yaoundé). Beaucoup de clients récupèrent leur investissement rapidement grâce à de nouvelles affaires.',
    price_objection: 'Nous comprenons que le budget est important. Nos forfaits sont facturés à l\'année et incluent un paiement flexible (vous pouvez étaler le forfait annuel en 2 ou 3 versements sans intérêts). Nous livrons de vrais sites web, applications et designs professionnels. Voulez-vous voir les options de versements ou discuter d\'un devis personnalisé pour votre projet ?'
  }
};

// ── Memory ────────────────────────────────────────────────────
// Until now the assistant forgot everything the moment the tab closed: a visitor
// who came back the next day re-introduced themselves, re-explained their
// business, and got the opening greeting as though they were a stranger. That is
// the single biggest thing standing between "a chat box" and "a conversation".
//
// The layering follows the standard split for conversational agents:
//   working memory  — `messages`, this page view, already existed
//   episodic memory — `mem.episodes`, a bounded transcript with timestamps
//   semantic memory — `mem.profile`, extracted durable facts
// plus recursive summarisation (turns that fall out of the episodic window are
// folded into a rolling summary rather than dropped) and deliberate forgetting
// (memory expires, so we never greet someone with a half-year-old conversation).
//
// Everything lives in this visitor's own browser. Nothing here is sent anywhere
// except, in compressed form, to our own /api/chat to give the model continuity.
//
// PRIVACY, deliberately: name, business, city and interests are remembered;
// PHONE NUMBER AND EMAIL ARE NOT, even though we collect them in the lead flow
// and it would be convenient. A shared or café computer is a normal way to get
// online here, and a stranger recovering someone's name is a very different
// problem from recovering their phone number. Anyone can wipe all of it by
// typing "forget me".
const MEM_KEY = 'harts_memory_v1';
const MEM_TTL_MS = 45 * 24 * 60 * 60 * 1000;  // forget entirely after 45 quiet days
const MEM_RESUME_MS = 36 * 60 * 60 * 1000;    // replay the transcript only if recent
const MEM_MAX_EPISODES = 24;                  // bounded context growth
const MEM_SUMMARY_MAX = 700;                  // chars, hard cap on the rolling summary
const MEM_TURN_MAX = 400;                     // chars kept per remembered turn
const MEM_PENDING_MS = 7 * 24 * 60 * 60 * 1000;  // an unfinished order stays offerable a week

function blankMemory() {
  return {
    v: 1,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    visits: 0,
    profile: { name: null, business: null, city: null, businessType: null, mainGoal: null, packageInterest: null, lang: null },
    episodes: [],
    summary: '',
    // An order that was started and never finished. Someone who dropped at the
    // phone question and comes back should be offered the thread, not made to
    // walk the whole flow again — abandoning a form is usually an interruption,
    // not a decision.
    pending: null
  };
}

let mem = blankMemory();
let memIsReturning = false;   // had usable memory when this page view started
let memSaveTimer = null;
let memRestoring = false;   // true while replaying stored turns into the UI
let awaitingResume = false; // we offered to finish an abandoned order, awaiting a yes/no

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEM_KEY);
    if (!raw) return blankMemory();
    const parsed = JSON.parse(raw);
    // A version bump means the shape changed — start clean rather than trying to
    // migrate a structure we no longer understand.
    if (!parsed || parsed.v !== 1) return blankMemory();
    // Forgetting: a conversation from two months ago is not context, it is a
    // stranger quoting you back at yourself.
    if (!parsed.lastSeen || (Date.now() - parsed.lastSeen) > MEM_TTL_MS) return blankMemory();
    const fresh = blankMemory();
    return {
      v: 1,
      firstSeen: parsed.firstSeen || fresh.firstSeen,
      lastSeen: parsed.lastSeen,
      visits: Number(parsed.visits) || 0,
      profile: Object.assign(fresh.profile, parsed.profile || {}),
      episodes: Array.isArray(parsed.episodes) ? parsed.episodes.slice(-MEM_MAX_EPISODES) : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, MEM_SUMMARY_MAX) : '',
      pending: (parsed.pending && typeof parsed.pending === 'object') ? parsed.pending : null
    };
  } catch (e) {
    return blankMemory();   // corrupt or storage blocked — behave like a new visitor
  }
}

// Coalesced: a burst of turns writes once, and a browser with storage disabled
// (private mode, blocked cookies) degrades to a session with no memory rather
// than throwing on every message.
function saveMemory() {
  if (memSaveTimer) return;
  memSaveTimer = setTimeout(function () {
    memSaveTimer = null;
    try {
      mem.lastSeen = Date.now();
      localStorage.setItem(MEM_KEY, JSON.stringify(mem));
    } catch (e) { /* storage unavailable — memory stays in-page only */ }
  }, 400);
}

function forgetMemory() {
  mem = blankMemory();
  memIsReturning = false;
  try { localStorage.removeItem(MEM_KEY); } catch (e) { /* nothing to remove */ }
}

function memStrip(text) {
  return String(text == null ? '' : text)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Recursive summarisation, done locally and deterministically — no extra LLM
// call, so it also works offline and costs nothing. Only the visitor's own words
// are carried forward: our replies are reconstructable from the catalogue, but
// what they told us about their business is not.
function foldIntoSummary(dropped) {
  const salient = dropped
    .filter(e => e.role === 'user' && e.text && e.text.length > 12)
    .map(e => e.text.slice(0, 90));
  if (!salient.length) return;
  const merged = (mem.summary ? mem.summary + ' · ' : '') + salient.join(' · ');
  // Keep the most RECENT end when trimming: older context matters less, and a
  // summary that never lets go would grow without bound.
  mem.summary = merged.length > MEM_SUMMARY_MAX ? merged.slice(merged.length - MEM_SUMMARY_MAX) : merged;
}

function rememberTurn(role, text) {
  const clean = memStrip(text);
  if (!clean) return;
  mem.episodes.push({ t: Date.now(), role: role === 'user' ? 'user' : 'bot', text: clean.slice(0, MEM_TURN_MAX) });
  if (mem.episodes.length > MEM_MAX_EPISODES) {
    foldIntoSummary(mem.episodes.splice(0, mem.episodes.length - MEM_MAX_EPISODES));
  }
  saveMemory();
}

// Merge-only: a later empty value never erases something we already learned.
function rememberProfile(patch) {
  if (!patch) return;
  let changed = false;
  Object.keys(patch).forEach(function (k) {
    const v = patch[k];
    if (v == null || v === '') return;
    if (!(k in mem.profile)) return;         // phone/email are not fields here, by design
    if (mem.profile[k] === v) return;
    mem.profile[k] = typeof v === 'string' ? v.slice(0, 120) : v;
    changed = true;
  });
  if (changed) saveMemory();
}

// Compact context handed to the LLM. Deliberately small — a few lines of fact
// beats replaying a transcript, and it keeps per-message token cost flat however
// long the relationship gets.
function memoryContext(lang) {
  if (!mem.visits && !mem.episodes.length) return '';
  const p = mem.profile;
  const bits = [];
  if (p.name) bits.push('Name: ' + p.name);
  if (p.business) bits.push('Business: ' + p.business);
  if (p.businessType) bits.push('Type: ' + p.businessType);
  if (p.city) bits.push('City: ' + p.city);
  if (p.mainGoal) bits.push('Goal: ' + p.mainGoal);
  if (p.packageInterest) bits.push('Interested in: ' + p.packageInterest);

  const days = Math.floor((Date.now() - mem.lastSeen) / (24 * 60 * 60 * 1000));
  if (mem.visits > 1) {
    bits.push('Returning visitor (' + mem.visits + ' visits' + (days > 0 ? ', last one ' + days + ' day' + (days === 1 ? '' : 's') + ' ago' : '') + ')');
  }
  if (mem.summary) bits.push('Earlier they mentioned: ' + mem.summary);

  return bits.length ? bits.join('\n') : '';
}

function rememberPending(pkg) {
  mem.pending = { pkg: pkg || null, at: Date.now() };
  saveMemory();
}

function clearPending() {
  if (!mem.pending) return;
  mem.pending = null;
  saveMemory();
}

// An unfinished order is only worth raising while it is still plausibly live.
function pendingIsFresh() {
  return Boolean(mem.pending && mem.pending.at && (Date.now() - mem.pending.at) < MEM_PENDING_MS);
}

// How long since the last visit, in whole days. -1 when this is a first visit.
function memDaysSinceLastVisit() {
  if (!mem.visits || !mem.lastSeen) return -1;
  return Math.floor((Date.now() - mem.lastSeen) / (24 * 60 * 60 * 1000));
}

// ── FAQ knowledge base ────────────────────────────────────────
// The bundled tier of the same three-tier pattern the service catalog uses:
// live KB (/api/services → the `faq` table) → localStorage cache → this array.
// These are the questions that come up on almost every conversation, kept here
// so they are answerable on the first keystroke and with the network down.
//
// EVERY answer below is grounded in something this repo already states —
// services.html (process, ownership, what we build), training.html (Foundations
// is free, 10 modules, certificates, corporate cohorts), the service catalog, or
// marketing/faq-knowledge-base-100.md. Nothing here is invented policy. Questions
// we cannot answer from those sources are listed in marketing/faq-gaps.md instead
// of being guessed at, because a confident wrong answer about who owns a website
// or who pays a fee is worse than no answer at all.
//
// `kw` carries words the question phrasing itself doesn't contain but a visitor
// is likely to use. Matching is scored, not regex — see matchFAQ().
const FALLBACK_FAQ = [
  // ── Web building ──
  { id: 'own', cat: 'web', kw: ['own', 'ownership', 'owns', 'mine', 'code', 'files', 'source', 'propriétaire', 'appartient'],
    q: { en: 'Who owns the website once it is built?',
         fr: 'À qui appartient le site une fois terminé ?' },
    a: { en: 'You do. On a one-time Build & Launch project everything is yours outright — the site, the files, the accounts. On a managed package it is still your site; the difference is that we keep running it for you rather than handing you the keys and walking off.',
         fr: 'À vous. Sur un projet Création & Mise en ligne, tout vous appartient — le site, les fichiers, les comptes. Sur un forfait géré, le site reste le vôtre ; la différence est que nous continuons à le faire tourner pour vous au lieu de vous remettre les clés et de disparaître.' } },

  { id: 'process', cat: 'web', kw: ['process', 'steps', 'work', 'how', 'start', 'processus', 'étapes', 'déroule'],
    q: { en: 'How does the process work from start to launch?',
         fr: 'Comment se déroule un projet du début à la mise en ligne ?' },
    a: { en: 'Four steps, all remote over WhatsApp. First you tell us what you do and what you need, and we recommend a package. Then we confirm scope, price and payment plan in writing. Then we design and build, and you review and approve — in plain language, no jargon. Then we go live, and managed packages keep getting support after that.',
         fr: 'Quatre étapes, à distance sur WhatsApp. Vous nous dites ce que vous faites et ce dont vous avez besoin, et nous recommandons un forfait. Nous confirmons ensuite le périmètre, le prix et le plan de paiement par écrit. Nous concevons et développons, vous relisez et validez — en langage clair. Puis nous mettons en ligne, et les forfaits gérés continuent d\'être suivis ensuite.' } },

  { id: 'skills', cat: 'web', kw: ['technical', 'skills', 'know', 'complicated', 'difficult', 'technique', 'compétences', 'compliqué'],
    q: { en: 'Do I need any technical skills?',
         fr: 'Faut-il des compétences techniques ?' },
    a: { en: 'None. We handle design, development, content, launch and ongoing support. You share what your business does and approve the work — that is the whole of your side of it.',
         fr: 'Aucune. Nous gérons la conception, le développement, le contenu, la mise en ligne et le support. Vous nous expliquez votre activité et vous validez le travail — c\'est tout ce qui vous incombe.' } },

  { id: 'timeline', cat: 'web', kw: ['long', 'time', 'timeline', 'ready', 'fast', 'quickly', 'delay', 'temps', 'délai', 'prêt', 'rapidement'],
    q: { en: 'How long does a website take to build?',
         fr: 'Combien de temps prend la création d\'un site ?' },
    a: { en: 'A simple site or a branding job is usually ready in 5 to 10 days. A full website or a web app is more like 2 to 4 weeks, depending on how complex it is and how quickly you get us your content — that second part is genuinely the usual bottleneck.',
         fr: 'Un site simple ou un travail de branding est prêt en 5 à 10 jours en général. Un site complet ou une application web, plutôt 2 à 4 semaines, selon la complexité et la vitesse à laquelle vous nous fournissez le contenu — c\'est honnêtement ce qui ralentit le plus souvent.' } },

  { id: 'ecommerce', cat: 'web', kw: ['sell', 'shop', 'store', 'ecommerce', 'checkout', 'payment', 'online', 'vendre', 'boutique', 'paiement'],
    q: { en: 'Can I sell products online?',
         fr: 'Puis-je vendre mes produits en ligne ?' },
    a: { en: 'Yes — a store with a product catalogue and checkout, built for the local market. That sits in the Pro package, or as a scoped one-time build if you would rather not have a yearly fee.',
         fr: 'Oui — une boutique avec catalogue produits et paiement, pensée pour le marché local. C\'est dans le forfait Pro, ou en projet ponctuel chiffré si vous préférez éviter un abonnement annuel.' } },

  { id: 'mobile', cat: 'web', kw: ['mobile', 'phone', 'responsive', 'téléphone', 'portable'],
    q: { en: 'Will the site work properly on phones?',
         fr: 'Le site fonctionnera-t-il bien sur téléphone ?' },
    a: { en: 'Yes, and it is designed that way from the start rather than checked at the end. Most of your customers will arrive on a phone, so that is the version that gets the attention.',
         fr: 'Oui, et c\'est pensé ainsi dès le départ, pas vérifié à la fin. La plupart de vos clients arriveront depuis un téléphone : c\'est cette version qui reçoit le plus d\'attention.' } },

  { id: 'seo', cat: 'web', kw: ['seo', 'google', 'search', 'found', 'ranking', 'référencement', 'trouver', 'recherche'],
    q: { en: 'Will people be able to find us on Google?',
         fr: 'Est-ce que les clients nous trouveront sur Google ?' },
    a: { en: 'Basic SEO is included from the Essential package upward, and every package sets up your Google Business listing — which for most local businesses is what actually brings people in. We will not promise you a number one ranking; anyone who does is guessing.',
         fr: 'Le SEO de base est inclus à partir du forfait Essentiel, et tous les forfaits configurent votre fiche Google Business — ce qui, pour la plupart des commerces locaux, est ce qui amène réellement des clients. Nous ne promettons pas une première place : quiconque le fait devine.' } },

  { id: 'update', cat: 'web', kw: ['update', 'change', 'edit', 'myself', 'manage', 'maintain', 'modifier', 'mettre', 'jour', 'gérer'],
    q: { en: 'Can I update the website myself afterwards?',
         fr: 'Puis-je modifier le site moi-même ensuite ?' },
    a: { en: 'On a one-time build, yes — training on how to manage what we hand over is part of the project. On a managed package you can, but you do not have to: changes are part of what you are already paying for.',
         fr: 'Sur un projet ponctuel, oui — la formation à la gestion de ce que nous livrons fait partie du projet. Sur un forfait géré, vous pouvez, mais ce n\'est pas nécessaire : les modifications font partie de ce que vous payez déjà.' } },

  { id: 'existing_site', cat: 'web', kw: ['already', 'existing', 'have', 'redesign', 'rebuild', 'déjà', 'existant', 'refonte'],
    q: { en: 'We already have a website — can you work with it?',
         fr: 'Nous avons déjà un site — pouvez-vous travailler dessus ?' },
    a: { en: 'Usually yes. If it works and you just want something added — a chatbot, a booking flow, a store — we build onto what is there rather than starting again. If it is fighting you more than helping, we will say so plainly instead of quietly charging you to patch it.',
         fr: 'En général oui. S\'il fonctionne et que vous voulez seulement ajouter quelque chose — un chatbot, un système de réservation, une boutique — nous construisons dessus plutôt que de tout refaire. S\'il vous handicape plus qu\'il ne vous aide, nous vous le dirons franchement.' } },

  // ── AI chatbots & automation ──
  { id: 'bot_does', cat: 'ai', kw: ['chatbot', 'bot', 'does', 'capable', 'features', 'fait', 'capable'],
    q: { en: 'What can the chatbot actually do?',
         fr: 'Que peut réellement faire le chatbot ?' },
    a: { en: 'It answers customer questions in real time, checks your live prices or availability, qualifies leads, takes bookings, and hands the conversation to a person the moment it needs one. The chat window is just the surface — the value is that it is wired into your actual data.',
         fr: 'Il répond aux clients en temps réel, vérifie vos prix ou disponibilités en direct, qualifie les prospects, prend des réservations, et passe la main à un humain dès que c\'est nécessaire. La fenêtre de chat n\'est que la surface — la valeur vient du fait qu\'il est branché sur vos vraies données.' } },

  { id: 'bot_unknown', cat: 'ai', kw: ['wrong', 'mistake', 'know', 'unsure', 'hallucinate', 'made', 'faux', 'erreur', 'invente'],
    q: { en: 'What happens if the bot does not know the answer?',
         fr: 'Que se passe-t-il si le bot ne connaît pas la réponse ?' },
    a: { en: 'It says so and hands over to a person. We would rather it admit it does not know than give your customer bad information — that is a deliberate design choice, and it is grounded in your real business data rather than free-styling.',
         fr: 'Il le dit et passe la main à un humain. Nous préférons qu\'il admette ne pas savoir plutôt que de donner une mauvaise information à votre client — c\'est un choix délibéré, et il s\'appuie sur vos vraies données plutôt que d\'improviser.' } },

  { id: 'replace_staff', cat: 'ai', kw: ['replace', 'staff', 'job', 'employee', 'team', 'fire', 'remplacer', 'employé', 'équipe', 'personnel'],
    q: { en: 'Will it replace my staff?',
         fr: 'Est-ce que ça va remplacer mon personnel ?' },
    a: { en: 'No. It takes the repetitive first-contact work — the twentieth "what does it cost" of the day — so your team spends its time on the conversations that actually need a person. It is a floor under your response times, not a replacement for judgement.',
         fr: 'Non. Il prend en charge le premier contact répétitif — le vingtième « c\'est combien » de la journée — pour que votre équipe consacre son temps aux échanges qui exigent vraiment quelqu\'un. C\'est un filet sous vos délais de réponse, pas un remplacement du jugement humain.' } },

  { id: 'concurrent', cat: 'ai', kw: ['many', 'same', 'once', 'simultaneous', 'volume', 'busy', 'plusieurs', 'même', 'temps', 'simultané'],
    q: { en: 'Can it handle several conversations at the same time?',
         fr: 'Peut-il gérer plusieurs conversations en même temps ?' },
    a: { en: 'Yes, and that is one of the bigger wins. A person answers one customer at a time; the bot handles dozens at once without anyone sitting in a queue.',
         fr: 'Oui, et c\'est l\'un des gains les plus nets. Une personne répond à un client à la fois ; le bot en gère des dizaines simultanément sans que personne n\'attende.' } },

  { id: 'languages', cat: 'ai', kw: ['language', 'french', 'english', 'bilingual', 'langue', 'français', 'anglais', 'bilingue'],
    q: { en: 'Can the bot talk to customers in French and English?',
         fr: 'Le bot parle-t-il français et anglais ?' },
    a: { en: 'Both, out of the box — it replies in whichever language the customer writes in. Other languages can be added depending on who your customers are.',
         fr: 'Les deux, nativement — il répond dans la langue utilisée par le client. D\'autres langues peuvent être ajoutées selon votre clientèle.' } },

  { id: 'integrations', cat: 'ai', kw: ['crm', 'erp', 'pos', 'integrate', 'integration', 'connect', 'existing', 'intégrer', 'connecter'],
    q: { en: 'Can it connect to the CRM or system we already use?',
         fr: 'Peut-il se connecter au CRM ou au système que nous utilisons déjà ?' },
    a: { en: 'That is specifically how we build — into what you already run, not asking you to switch tools. Tell us the name of the system and we will tell you honestly whether it is straightforward or messy before you commit to anything.',
         fr: 'C\'est précisément notre façon de faire — dans ce que vous utilisez déjà, sans vous demander de changer d\'outil. Donnez-nous le nom du système et nous vous dirons franchement si c\'est simple ou compliqué avant tout engagement.' } },

  { id: 'review_before', cat: 'ai', kw: ['review', 'approve', 'control', 'before', 'live', 'test', 'valider', 'relire', 'avant'],
    q: { en: 'Can we see what the bot says before it goes live?',
         fr: 'Peut-on voir ce que dit le bot avant la mise en ligne ?' },
    a: { en: 'Yes — we walk through sample conversations with you before launch, and you can ask for changes to tone or wording at any point after it is running.',
         fr: 'Oui — nous parcourons des exemples de conversations avec vous avant le lancement, et vous pouvez demander des ajustements de ton ou de formulation à tout moment ensuite.' } },

  { id: 'after_hours', cat: 'ai', kw: ['night', 'hours', 'weekend', 'closed', 'sleep', 'nuit', 'weekend', 'fermé', 'heures'],
    q: { en: 'What about messages that come in at night or on weekends?',
         fr: 'Et les messages reçus la nuit ou le week-end ?' },
    a: { en: 'They get answered straight away instead of waiting until morning. That gap is where most businesses quietly lose people — someone who does not hear back within about ten minutes usually messages the next business on the list.',
         fr: 'Ils reçoivent une réponse immédiate au lieu d\'attendre le lendemain. C\'est dans ce vide que la plupart des entreprises perdent des clients sans s\'en rendre compte — quelqu\'un sans réponse en dix minutes écrit en général au concurrent suivant.' } },

  { id: 'data_safe', cat: 'ai', kw: ['data', 'safe', 'privacy', 'secure', 'sell', 'share', 'gdpr', 'données', 'sécurité', 'confidentialité', 'vendre'],
    q: { en: 'Is our customer data safe, and do you sell it?',
         fr: 'Nos données clients sont-elles en sécurité, et les vendez-vous ?' },
    a: { en: 'Your data is yours and we never sell or share it — we use it to run the system you are paying for, nothing else. It sits on secure cloud infrastructure with access locked down server-side; the chatbot never gets direct access to your database, and nothing is exposed publicly.',
         fr: 'Vos données vous appartiennent et nous ne les vendons ni ne les partageons jamais — elles servent uniquement à faire fonctionner le système que vous payez. Elles sont hébergées sur une infrastructure cloud sécurisée, avec les accès verrouillés côté serveur ; le chatbot n\'a jamais d\'accès direct à votre base, et rien n\'est exposé publiquement.' } },

  // ── Training ──
  { id: 'training_free', cat: 'training', kw: ['training', 'course', 'free', 'cost', 'learn', 'formation', 'cours', 'gratuit', 'apprendre'],
    q: { en: 'Is the AI training course really free?',
         fr: 'La formation IA est-elle vraiment gratuite ?' },
    a: { en: 'Completely free. All ten modules, the starter guide and your certificate cost nothing — no card, no hidden fee. It is called Foundations and it lives in the Training Hub at app.hartsdigitalhub.com/login.html.',
         fr: 'Entièrement gratuite. Les dix modules, le guide de démarrage et le certificat ne coûtent rien — pas de carte bancaire, pas de frais cachés. Elle s\'appelle Foundations et se trouve dans l\'espace de formation, sur app.hartsdigitalhub.com/login.html.' } },

  { id: 'training_length', cat: 'training', kw: ['modules', 'lessons', 'long', 'pace', 'schedule', 'modules', 'leçons', 'rythme', 'durée'],
    q: { en: 'How long is the course and how is it structured?',
         fr: 'Combien de temps dure le cours et comment est-il structuré ?' },
    a: { en: 'Ten plain-language modules, self-paced — you go at your own speed and pick up where you left off. No fixed start date and no deadline to miss.',
         fr: 'Dix modules en langage clair, à votre rythme — vous avancez comme vous voulez et reprenez où vous en étiez. Pas de date de début imposée ni d\'échéance à manquer.' } },

  { id: 'training_cert', cat: 'training', kw: ['certificate', 'certification', 'diploma', 'verify', 'proof', 'certificat', 'diplôme', 'vérifier', 'preuve'],
    q: { en: 'Do I get a certificate, and can an employer check it?',
         fr: 'Est-ce que je reçois un certificat, et un employeur peut-il le vérifier ?' },
    a: { en: 'Yes — finish all ten modules and a certificate is issued with an ID in the form HDH-AI-XXXXXXXX. Anyone can check that ID is genuine at app.hartsdigitalhub.com/verify.html, or by messaging it to us on WhatsApp, so an employer never has to take your word for it.',
         fr: 'Oui — terminez les dix modules et un certificat est délivré avec un identifiant de la forme HDH-AI-XXXXXXXX. N\'importe qui peut vérifier cet identifiant sur app.hartsdigitalhub.com/verify.html, ou en nous l\'envoyant sur WhatsApp : un employeur n\'a donc jamais à vous croire sur parole.' } },

  { id: 'training_background', cat: 'training', kw: ['background', 'beginner', 'experience', 'qualification', 'coding', 'niveau', 'débutant', 'expérience'],
    q: { en: 'Do I need a technical background to take the course?',
         fr: 'Faut-il un bagage technique pour suivre la formation ?' },
    a: { en: 'No. It is written in plain language for people with no technical background — that is the entire point of calling it Foundations.',
         fr: 'Non. Elle est rédigée en langage clair pour des personnes sans bagage technique — c\'est précisément le sens du nom Foundations.' } },

  { id: 'training_corporate', cat: 'training', kw: ['team', 'company', 'staff', 'corporate', 'cohort', 'upskill', 'équipe', 'entreprise', 'salariés'],
    q: { en: 'Do you train whole teams or companies?',
         fr: 'Formez-vous des équipes ou des entreprises entières ?' },
    a: { en: 'Yes — that is Corporate Upskilling: a cohort scoped to your team and the tools your business actually runs on. There is no published price because no two cohorts are the same; tell us the team size and what they need to be able to do, and we come back with a proposal.',
         fr: 'Oui — c\'est le programme Corporate Upskilling : une cohorte adaptée à votre équipe et aux outils que votre entreprise utilise réellement. Aucun prix n\'est publié car aucune cohorte ne se ressemble ; dites-nous la taille de l\'équipe et l\'objectif, et nous revenons avec une proposition.' } },

  { id: 'training_signin', cat: 'training', kw: ['login', 'signin', 'password', 'account', 'register', 'enrol', 'enroll', 'connexion', 'compte', 'inscrire', 'mot'],
    q: { en: 'How do I sign in to the Training Hub?',
         fr: 'Comment se connecter à l\'espace de formation ?' },
    a: { en: 'With your email address — there is no password to create or forget. You enter your email at app.hartsdigitalhub.com/login.html, we send a sign-in link, and opening it puts you straight into the course.',
         fr: 'Avec votre adresse e-mail — aucun mot de passe à créer ni à oublier. Vous saisissez votre e-mail sur app.hartsdigitalhub.com/login.html, nous envoyons un lien de connexion, et l\'ouvrir vous amène directement dans le cours.' } },

  { id: 'training_network', cat: 'training', kw: ['talent', 'network', 'job', 'hire', 'work', 'career', 'talents', 'réseau', 'emploi', 'recrut'],
    q: { en: 'What is the talent network?',
         fr: 'Qu\'est-ce que le réseau de talents ?' },
    a: { en: 'Finish a track and you can join the pool we draw on for client work. It is not a job guarantee and we will not pretend otherwise — it is a real list that real projects get staffed from.',
         fr: 'Terminez un parcours et vous pouvez rejoindre le vivier dans lequel nous puisons pour les projets clients. Ce n\'est pas une garantie d\'emploi et nous ne prétendrons pas le contraire — c\'est une vraie liste, utilisée pour de vrais projets.' } }
];

let FAQ = FALLBACK_FAQ;

// Words carrying no signal for matching. Kept small on purpose: an over-eager
// stopword list strips the very words that separate two similar questions.
const FAQ_STOPWORDS = new Set([
  'the','and','you','your','our','for','are','can','does','did','will','with','that','this','what','how','why','who','when',
  'have','has','was','were','from','they','them','there','their','about','would','could','should','into','than','then',
  'just','like','get','got','want','need','tell','know','some','any','all','not','but','its','it','is','a','i','we','us','do',
  'les','des','une','uns','vous','nous','votre','vos','notre','nos','pour','avec','que','qui','quoi','est','sont','dans',
  'sur','pas','plus','par','mais','ils','elle','elles','cela','ceci','ces','cette','ce','du','de','la','le','un','et','en'
]);

function faqTokens(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // accents never block a match: cafe === café
    .match(/[a-z0-9]+/g) || [];
}

// Vocabulary index, rebuilt whenever the FAQ array is replaced by the KB. `rare`
// counts how many entries each token appears in: a token belonging to exactly one
// question ("ownership", "certificate", "process") is a strong enough signal to
// match on its own, which a flat two-word minimum would throw away.
let faqIndex = null;
let faqIndexFor = null;

function buildFAQIndex() {
  const rare = new Map();
  const entries = FAQ.map(item => {
    // Per language, NOT merged. Merging them meant an English question was scored
    // for coverage against English + French vocabulary combined, so every English
    // match was diluted by French words it could never contain: "who owns the
    // website once you build it" scored 0.53 instead of 0.75 and lost its match.
    const qsOf = (s) => new Set(faqTokens(s || '').filter(t => t.length > 2 && !FAQ_STOPWORDS.has(t)));
    const qByLang = { en: qsOf(item.q && item.q.en), fr: qsOf(item.q && item.q.fr) };
    const qTokens = new Set([...qByLang.en, ...qByLang.fr]);
    const kwTokens = new Set(
      faqTokens((item.kw || []).join(' ')).filter(t => t.length > 2 && !FAQ_STOPWORDS.has(t))
    );
    const all = new Set([...qTokens, ...kwTokens]);
    all.forEach(t => rare.set(t, (rare.get(t) || 0) + 1));
    return { item, qTokens, qByLang, kwTokens, all };
  });
  faqIndex = { entries, rare };
  faqIndexFor = FAQ;
}

// Scored match rather than another 100 regex branches. Precision matters far more
// than recall: a wrong canned answer is worse than falling through to the LLM,
// which at least reads the whole conversation. Hence the two admission rules
// below — and the negative tests that go with them, which matter more than the
// positive ones.
function matchFAQ(text, lang) {
  if (!FAQ.length) return null;
  if (faqIndexFor !== FAQ || !faqIndex) buildFAQIndex();

  // One content word is enough when it is a unique authored keyword — "do i get
  // a certificate" reduces to a single token once stopwords go, and refusing to
  // match it would be absurd. The solo-keyword rule below still has to clear.
  const asked = faqTokens(text).filter(t => t.length > 2 && !FAQ_STOPWORDS.has(t));
  if (!asked.length) return null;
  const askedSet = new Set(asked);

  let best = null;
  let bestScore = 0;

  for (const entry of faqIndex.entries) {
    const item = entry.item;
    const answer = (item.a && item.a[lang]) || null;
    // No translation for this language → deliberately fall through to the LLM,
    // which answers in the visitor's language, rather than replying in English.
    if (!answer) continue;
    if (!entry.qTokens.size) continue;

    let hits = 0;
    let uniqueHit = false;
    entry.all.forEach(t => {
      if (!askedSet.has(t)) return;
      hits++;
      // A single word can carry a match on its own, but ONLY if it is a
      // hand-authored keyword that occurs nowhere else in the KB. Allowing any
      // unique word from the question sentence was too loose: "can you build us
      // an inventory system" matched the website-timeline entry on the stray
      // word "build", and "losing customers at night" matched the languages
      // entry on "customers". Keywords are deliberate; sentence words are not.
      if (t.length >= 5 && entry.kwTokens.has(t) && faqIndex.rare.get(t) === 1) uniqueHit = true;
    });
    // A lone keyword may carry the match only if it accounts for a real share of
    // what was typed. Without this, one stray word decided a long sentence:
    // "my restaurant is losing customers at night" matched the after-hours entry
    // on "night" alone, when the visitor was describing a problem, not asking a
    // question about opening hours.
    if (hits < 2 && !(uniqueHit && hits / askedSet.size >= 0.33)) continue;

    // Coverage is measured against the QUESTION's own words only. Counting the
    // keyword list in the denominator punished entries for carrying French
    // synonyms, which is backwards — extra keywords should widen what can match,
    // never dilute the score of an English hit.
    const qSet = (entry.qByLang && entry.qByLang[lang] && entry.qByLang[lang].size)
      ? entry.qByLang[lang]
      : entry.qByLang.en;
    const coverage = Math.min(1, hits / Math.max(1, qSet.size));
    let score = coverage * 0.6 + (hits / askedSet.size) * 0.4;
    if (uniqueHit) score += 0.15;

    if (score > bestScore) { bestScore = score; best = { item, answer }; }
  }

  if (!best || bestScore < 0.30) return null;
  return { text: best.answer, faq: true, faqId: best.item.id, faqCat: best.item.cat, score: bestScore };
}

// Fold KB rows into the bundled set: a row with the same id replaces the local
// copy, anything new is appended. Bundled entries therefore survive even a
// partial KB, and their hand-written French is not lost to an English-only row.
function mergeFAQFromKB(rows) {
  if (!Array.isArray(rows) || !rows.length) return false;
  const merged = FALLBACK_FAQ.slice();
  const indexById = new Map(merged.map((it, i) => [it.id, i]));

  rows.forEach(row => {
    if (!row || !row.id || !row.question_en || !row.answer_en) return;
    const entry = {
      id: row.id,
      cat: row.category || 'general',
      q: { en: row.question_en, fr: row.question_fr || null },
      a: { en: row.answer_en, fr: row.answer_fr || null }
    };
    const at = indexById.get(row.id);
    if (at != null) {
      // Keep the bundled French if the KB row has none.
      entry.q.fr = entry.q.fr || merged[at].q.fr;
      entry.a.fr = entry.a.fr || merged[at].a.fr;
      entry.kw = merged[at].kw;
      merged[at] = entry;
    } else {
      merged.push(entry);
    }
  });

  FAQ = merged;
  return true;
}

// ── Language detection ────────────────────────────────────────
// The chat widget has no language toggle, and currentLang stayed 'en' unless
// something had already written 'lang' to localStorage. So a French speaker
// typing French got every rule-based reply — package cards, the lead questions,
// FAQ answers, the handoff — in English, while the LLM path answered in French
// because its system prompt tells it to. The assistant appeared to switch
// language at random, in a market where French is the majority.
//
// Deliberately conservative: it moves only on a clear margin, so a name, a phone
// number, a business name or "ok" can never flip the conversation. Ambiguous
// input leaves things exactly where they are.
const FR_MARKERS = /\b(je|tu|vous|nous|votre|notre|mon|ma|mes|est|sont|etre|avoir|pour|avec|que|qui|quoi|dans|sur|pas|plus|une|des|les|aux|comment|combien|pourquoi|quel|quelle|bonjour|bonsoir|salut|merci|oui|non|besoin|veux|voulez|faire|entreprise|clients|prix|devis|coute|aide|aider|jai|cest|sil)\b/gi;
const EN_MARKERS = /\b(the|is|are|was|you|your|we|our|for|with|that|this|what|how|much|many|need|want|hello|thanks|thank|yes|can|does|did|please|business|website|customers|price|cost|help|would|should|about|from|have|has|there)\b/gi;
const FR_ACCENTS = /[àâçéèêëîïôûùüÿœæ]/i;

function detectLang(text) {
  const s = String(text || '');
  if (s.trim().length < 3) return null;
  // Apostrophes are stripped so "j'ai" and "c'est" register as single markers.
  const flat = s.replace(/['’]/g, '');
  const fr = (flat.match(FR_MARKERS) || []).length + (FR_ACCENTS.test(s) ? 2 : 0);
  const en = (flat.match(EN_MARKERS) || []).length;
  // A margin of two, not one: "no" is English, "non" is French, and a single
  // shared-looking word should never be enough to switch languages mid-order.
  if (fr >= en + 2) return 'fr';
  if (en >= fr + 2) return 'en';
  return null;
}

// ── Intent / Question Router ──────────────────────────────────
function getBotResponse(rawText, lang = currentLang) {
  const text = rawText.toLowerCase().trim();

  // Follow the visitor into whichever language they are actually writing in,
  // and keep it: this is what makes every canned reply below bilingual in
  // practice rather than just in principle.
  const detected = detectLang(rawText);
  if (detected) {
    if (detected !== currentLang) {
      currentLang = detected;
      try { localStorage.setItem('lang', detected); } catch (e) { /* storage blocked */ }
    }
    rememberProfile({ lang: detected });
    lang = detected;
  }

  const k = KNOWLEDGE[lang] || KNOWLEDGE.en;
  const p = PACKAGES;

  updateUserProfileFromText(rawText, lang);

  // ── Forget me ────────────────────────────────────────────────
  // Checked before the active flows: someone asking to be forgotten mid-form
  // means it, and should not be answered with "and your city?". Anything stored
  // about them is on their own device, so this genuinely erases it.
  if (/^(forget me|forget everything|forget about me|clear (my )?(memory|history|data|details)|delete my data|start over|oubli(e|ez)[- ]moi|efface[rz]?[\s\S]{0,20}(données|historique|mémoire)|recommencer à zéro)\b/i.test(text)) {
    forgetMemory();
    messages = [];
    leadContext = {};
    awaitingLeadField = null;
    awaitingAddons = false;
    awaitingMomoNumber = false;
    awaitingReviewField = null;
    selectedPackage = null;
    packageInferred = false;
    selectedPayment = null;
    lastTopic = null;
    currentStage = 'discovery';
    userProfile = { businessType: null, location: null, mainGoal: null, mentionedBudget: null };
    return {
      action: 'forget',
      text: lang === 'fr'
        ? 'C\'est fait — tout ce que nous avions retenu de vous sur cet appareil est effacé : votre nom, votre activité, notre historique. On repart de zéro.\n\nQu\'est-ce qui vous amène ?'
        : 'Done — everything we had remembered about you on this device is gone: your name, your business, our history. Clean slate.\n\nWhat brings you in?'
    };
  }

  // ── Resuming an abandoned order ──────────────────────────────
  if (awaitingResume) {
    awaitingResume = false;
    if (/^(yes|yep|yeah|yup|sure|ok|okay|please|finish|continue|carry on|let'?s|oui|d'accord|on continue|terminons|volontiers)\b/i.test(text)) {
      const pkgKey = mem.pending && mem.pending.pkg;
      if (pkgKey && PACKAGES[pkgKey]) {
        selectedPackage = pkgKey;
        packageInferred = false;
        leadContext.package = pkgKey;
      }
      return beginLeadCollection(lang, lang === 'fr' ? 'Très bien — on reprend.' : 'Good — picking it back up.');
    }
    // Not a yes. Drop the stale order and fall through, so "actually I need a
    // chatbot" is answered properly instead of being swallowed by a dead-end
    // acknowledgement.
    clearPending();
  }

  // ── Active flows ─────────────────────────────────────────────
  if (currentStage === 'review' || awaitingReviewField) {
    return handleReviewCollection(rawText, lang);
  }
  if (awaitingAddons) {
    return handleAddonSelection(rawText, lang);
  }
  if (awaitingMomoNumber) {
    return handleMomoPayment(rawText, lang);
  }
  if (awaitingLeadField) {
    return handleLeadCollection(rawText, lang);
  }

  // ── Greetings (typo-tolerant, time-aware) ───────────────────
  if (/^(h[ae]l+[oa]*|h[iy]+|hey+|yo+|salut|bonjour|bonsoir|bonswa|good\s*(morning|afternoon|evening|day)|morning|evening|howdy|sup|ola)\b/i.test(text)) {
    const hour = new Date().getHours();
    const timeGreet = hour < 12
      ? (lang === 'fr' ? 'Bonjour' : 'Good morning')
      : hour < 18
        ? (lang === 'fr' ? 'Bonjour' : 'Hello')
        : (lang === 'fr' ? 'Bonsoir' : 'Good evening');
    return {
      text: lang === 'fr'
        ? `${timeGreet} — ici H@rts. Qu'est-ce qui vous amène : un projet en tête, ou vous explorez encore ?`
        : `${timeGreet} — H@rts here. What brings you in: a project you're planning, or still just looking around?`
    };
  }

  // ── Farewells ────────────────────────────────────────────────
  if (/^(bye+|goodbye|see you|au revoir|à bientôt|ciao|bonne journée|bonne soirée|tchao|take care|later)\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Bonne journée ! Ce fil reste ouvert si vous voulez reprendre — et l\'équipe est sur WhatsApp au +237 622 341 343 si vous préférez parler à quelqu\'un.'
        : 'Take care! This thread stays here if you want to pick it back up — and the team\'s on WhatsApp at +237 622 341 343 if you\'d rather talk to a person.'
    };
  }

  // ── Thank you ────────────────────────────────────────────────
  if (/\b(thank(s| you)?|merci|thx|ty|much appreciated|grand merci|super merci)\b/i.test(text) && !/^no\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Avec plaisir. Autre chose à clarifier, ou on passe à la suite ?'
        : 'Anytime. Anything else you want to dig into, or shall we talk next steps?'
    };
  }

  // ── Positive short replies (OK / Yes / Sure) — context-aware ─
  if (/^(yes+|yep|yup|sure+|ok+|okay|alright|agree|correct|oui|d'accord|bien sûr|absolument|affirmative|go ahead|let\'s go|allons-y)\b/i.test(text)) {
    if (selectedPackage && currentStage === 'selection') {
      const pkgName = p[selectedPackage].name[lang] || p[selectedPackage].name.en;

      // A bare "yes" on top of an INFERRED package is not a purchase decision —
      // it is usually answering whatever question was last on screen, which may
      // well have come from the LLM rather than from us. Say the package name out
      // loud and let them agree to it; the next yes commits.
      if (packageInferred) {
        packageInferred = false;
        return {
          text: lang === 'fr'
            ? `Pour être sûrs de parler de la même chose : c'est le ${pkgName} qui correspond en général à ce que vous décrivez.\n\nOn part là-dessus, ou vous préférez d'abord voir les autres options ?`
            : `Just so we're talking about the same thing: ${pkgName} is the one that usually fits what you've described.\n\nGo with that, or would you rather see the other options first?`
        };
      }

      return beginLeadCollection(lang, lang === 'fr'
        ? `On part sur le ${pkgName}, donc.`
        : `${pkgName} it is.`);
    }
    if (currentStage === 'discovery') {
      return {
        text: lang === 'fr'
          ? 'Alors dites-nous ce que fait votre activité, et ce qui coince en ce moment. C\'est en général assez pour vous orienter.'
          : 'Then tell us what the business does, and what\'s not working right now. That\'s usually enough to point you somewhere useful.'
      };
    }
    return { text: lang === 'fr' ? 'Allez-y — qu\'est-ce que vous aviez en tête ?' : 'Go ahead — what did you have in mind?' };
  }

  // ── Negative / cancel ────────────────────────────────────────
  // A leading "no" is only a refusal when that is all it is. "No thanks" ends the
  // conversation; "no, I need a chatbot for my website" REDIRECTS it, and
  // cancelling on that threw away a live request and replied with a goodbye — the
  // most expensive possible misread. If real content follows the negation, fall
  // through and let the rest of the router answer what they actually asked for.
  if (/^(no+|nope|nah|non|pas intéressé|cancel|annuler|never ?mind|pas maintenant|not now|stop|leave me|laisse[z]?[\s-]moi)\b/i.test(text) &&
      text.replace(/^(no+|nope|nah|non|pas intéressé|cancel|annuler|never ?mind|pas maintenant|not now|stop|leave me|laisse[z]?[\s-]moi)\b[\s,.:;!-]*/i, '')
          .trim().split(/\s+/).filter(Boolean).length < 3) {
    selectedPackage = null;
    packageInferred = false;
    awaitingLeadField = null;
    currentStage = 'discovery';
    leadContext = {};
    return {
      text: lang === 'fr'
        ? 'Pas de souci. Le fil reste ouvert si vous voulez y revenir, et l\'équipe est sur WhatsApp au +237 622 341 343 en attendant.'
        : 'No problem. This thread stays open if you want to come back to it, and the team\'s on WhatsApp at +237 622 341 343 in the meantime.'
    };
  }

  // ── Chatbot intent (checked before "Bot identity" below, since that branch's
  // own pattern includes the bare word "chatbot" for "are you a chatbot?"-style
  // questions — this one requires an intent verb nearby so a genuine "I need a
  // chatbot for my website" isn't misread as an identity question) ───────────
  if (/\b(need|want|get a|build|looking for|interested in)\b[\s\S]{0,25}\b(chatbot|chat[\s-]?bot|bot for)\b|\b(chatbot|chat[\s-]?bot)\b[\s\S]{0,25}\b(for (my|our)|pour (mon|notre))\b|\b(j'ai besoin|je veux|je cherche|nous voulons)\b[\s\S]{0,25}\b(chatbot|chat[\s-]?bot)\b/i.test(text)) {
    return enterpriseReply('ai_chatbots', lang);
  }

  // ── Chatbot pricing ─────────────────────────────────────────
  // "How much for a chatbot?" is a buying question, and chatbots are scoped work,
  // not an SME package. Anchoring the topic here routes it into the enterprise
  // pricing answer further down ("here's what moves the number") instead of the
  // package list or, as it used to, the bot-identity reply.
  if (/\b(chat ?bot|bot)\b/i.test(text) && /(price|prix|cost|combien|how much|tarif|budget|quote|devis)/i.test(text)) {
    lastTopic = 'ai_chatbots';
  }

  // ── Custom software / internal systems ──────────────────────
  // Kept above the generic "website" branch so "custom system to manage stock"
  // isn't answered with a $80 landing-page package.
  if (/\b(custom (software|system|platform|solution|build)|bespoke|internal (tool|system)|erp\b|inventory|stock (management|system)|admin (panel|dashboard)|management system|logiciel sur mesure|système sur mesure|gestion de stock|outil interne)\b/i.test(text)) {
    lastTopic = 'custom_software'; currentStage = 'selection';
    return enterpriseReply('custom_software', lang);
  }

  // ── Cloud / database / performance ──────────────────────────
  if (/\b(cloud|database|db\b|server|hosting (issue|problem)|slow (site|system|app|database)|scal(e|ing|ability)|migrat(e|ion)|downtime|performance (issue|problem)|optimi[sz]ation|base de données|serveur|lenteur|migration)\b/i.test(text)) {
    lastTopic = 'cloud_database'; currentStage = 'selection';
    return enterpriseReply('cloud_database', lang);
  }

  // ── Managed IT / SLA / support retainer ─────────────────────
  if (/\b(managed it|manage my it|sla\b|retainer|maintenance|support contract|monitoring|keep it running|ongoing support|infogérance|contrat de maintenance|supervision)\b/i.test(text)) {
    lastTopic = 'managed_it'; currentStage = 'selection';
    return enterpriseReply('managed_it', lang);
  }

  // ── Integration with an existing system ─────────────────────
  // MUST stay above "Bot identity" — that branch matches the bare word "chatbot",
  // so "can a chatbot connect to our system?" would otherwise be answered as if
  // the visitor had asked whether they're talking to a robot.
  if (/\b(connect|integrat|plug|sync|work with|talk to|hook (it )?up|link)\w*\b[\s\S]{0,40}\b(system|crm|erp|pos|software|database|tool|platform|what we (already )?(use|have)|existing)\b|\b(crm|erp|pos)\b[\s\S]{0,30}\b(integration|connect)\b|\b(intégr|connect)\w*\b[\s\S]{0,40}\b(système|logiciel|existant|base de données)\b/i.test(text)) {
    lastTopic = 'ai_chatbots'; currentStage = 'selection';
    return {
      isHTML: true,
      text: lang === 'fr'
        ? `Oui — et c'est justement là que la plupart des chatbots échouent.<br><br>Un bot qui ne fait que répondre à des questions est vite inutile. L'intérêt vient quand il <strong>lit vos vraies données</strong> : stock disponible, statut d'une commande, créneaux libres. C'est ce que nous construisons — connecté à ce que vous utilisez déjà (CRM, ERP, POS, base de données), sans le remplacer.<br><br>Le détail est ici si vous voulez creuser : <a href="insights-connect-existing-systems.html">Un chatbot ne vaut que les données derrière lui</a>.<br><br>Avec quel système devrait-il se connecter ? Si vous nous donnez le nom, nous vous dirons franchement si c'est simple ou compliqué.`
        : `Yes — and that's exactly where most chatbots fall down.<br><br>A bot that only answers scripted questions gets useless fast. It earns its keep when it can <strong>read your actual data</strong>: what's in stock, where an order is, which slots are free. That's what we build — wired into what you already run (CRM, ERP, POS, database), not replacing it.<br><br>There's a fuller write-up here if you want the detail: <a href="insights-connect-existing-systems.html">A chatbot is only as good as the data behind it</a>.<br><br>What system would it need to talk to? Give us the name and we'll tell you honestly whether that's straightforward or messy.`
    };
  }

  // ── Slow / missed customer responses (the core chatbot pain) ─
  if (/\b(losing (customers?|leads?|sales?|clients?)|miss(ing|ed)? (messages?|leads?|customers?|enquir)|no ?(one|body) (answers?|replies)|too slow to (reply|respond)|slow (to )?(reply|respond|response)|leads? go(ing)? cold|can'?t keep up with (messages?|whatsapp)|répondre (assez )?vite|perdons des clients|messages sans réponse)\b/i.test(text)) {
    lastTopic = 'ai_chatbots'; currentStage = 'selection';
    return {
      isHTML: true,
      text: lang === 'fr'
        ? `C'est le problème le plus courant qu'on nous apporte — et il coûte plus cher qu'il n'y paraît. Un client qui n'a pas de réponse en 10 minutes écrit souvent au concurrent suivant.<br><br>Un chatbot IA répond instantanément, 24h/24, à un nombre illimité de conversations en même temps — puis transfère à un humain dès qu'il faut un vrai jugement. Vos soirées et vos week-ends redeviennent les vôtres.<br><br>On a écrit là-dessus en détail, si vous préférez lire avant de parler : <a href="insights-response-time.html">Pourquoi les leads refroidissent sur WhatsApp</a>.<br><br>Pour bien cadrer : sur quel canal vos clients vous écrivent-ils le plus — WhatsApp, votre site, ou les réseaux sociaux ?`
        : `That's the single most common thing people bring us — and it costs more than it looks. A customer who doesn't hear back within about ten minutes usually just messages the next business on the list.<br><br>An AI chatbot answers instantly, around the clock, across unlimited conversations at once — then hands off to a human the moment something needs real judgement. Your evenings and weekends go back to being yours.<br><br>We wrote the long version if you'd rather read before you talk to anyone: <a href="insights-response-time.html">Why leads go cold on WhatsApp</a>.<br><br>So we point you at the right thing: where do most of your customers message you — WhatsApp, your website, or social?`
    };
  }

  // ── Bot identity ─────────────────────────────────────────────
  // Every alternative here has to be identity-framed. The old pattern matched the
  // bare words "chatbot", "robot" and "automated", so "how much does a chatbot
  // cost?" and "can this be automated?" — both real buying questions — were
  // answered with "yes, I'm an AI", which is the single most robotic thing the
  // assistant could do. The branches above no longer need to be ordered defensively
  // around it.
  if (/(are you (a |an |real )?(bot|robot|human|person|ai)\b|is this (a |an |real )?(human|person|bot|robot|chat ?bot)\b|am i (talking|speaking) (to|with) (a |an )?(bot|robot|human|person|machine)|who am i talking to|assistant virtuel|(es-tu|t'es|tu es) (un(e)? )?(robot|humain|bot|ia|machine)|(êtes-vous|vous êtes|c'est) (un(e)? )?(robot|humain|bot|ia|machine)|je parle à (un(e)? )?(robot|humain|machine|ia))/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'H@rts, l\'assistant IA de Harts Digital Hub — pas un humain, autant le dire franchement.\n\nOn répond bien sur ce qu\'on fait et ce que ça coûte. Dès qu\'il faut un vrai jugement — un devis sur mesure, une date ferme — on passe la main : dites "équipe" et on vous met en relation sur WhatsApp.'
        : 'H@rts, the Harts Digital Hub AI assistant — not a person, and there\'s no point pretending otherwise.\n\nWe\'re solid on what we do and what it costs. Anything needing real judgement — a scoped quote, a firm date — goes to a human: say "team" and we\'ll put you through on WhatsApp.'
    };
  }

  // ── Build Log / reading before contact ───────────────────────
  // Some visitors want to read, not talk. Sending them away to an article is a
  // better outcome than a hard CTA they bounce off — they come back warmer.
  if (/\b(build ?log|blog(ue)?|article[s]?|insight[s]?|newsletter|something to read|anything to read|do you (write|publish)|case stud(y|ies)|à lire|actualités)\b/i.test(text)) {
    return {
      isHTML: true,
      text: lang === 'fr'
        ? 'Oui — notre <a href="insights.html">Build Log</a> : des notes sur ce que l\'automatisation règle vraiment, ce qu\'elle ne règle pas, et ce que ça coûte à faire tourner.<br><br>Les trois plus utiles pour commencer :<br>· <a href="insights-response-time.html">Pourquoi les leads refroidissent sur WhatsApp</a><br>· <a href="insights-connect-existing-systems.html">Un chatbot ne vaut que les données derrière lui</a><br>· <a href="insights-what-automation-costs.html">Ce que coûte vraiment une automatisation</a><br><br>Lisez tranquillement — on est là quand vous voulez en parler.'
        : 'Yes — our <a href="insights.html">Build Log</a>: notes on what automation actually fixes, what it doesn\'t, and what it costs to keep running.<br><br>The three worth starting with:<br>· <a href="insights-response-time.html">Why leads go cold on WhatsApp</a><br>· <a href="insights-connect-existing-systems.html">A chatbot is only as good as the data behind it</a><br>· <a href="insights-what-automation-costs.html">What an automation build actually costs to run</a><br><br>Read at your own pace — we\'re here whenever you want to talk.'
    };
  }

  // ── Portfolio / examples ─────────────────────────────────────
  if (/\b(portfolio|example[s]?|past work|show me.*work|previous client|sample[s]?|réalisation[s]?|travaux?|exemple[s]?|référence[s]?|vos travaux)\b/i.test(text)) {
    return {
      isHTML: true,
      text: lang === 'fr'
        ? 'Il y a une section <a href="/#production">études de cas</a> sur la page d\'accueil. On est en train d\'y publier les vraies, à mesure que les clients autorisent la publication — en attendant, le <a href="insights.html">Build Log</a> montre bien mieux comment on travaille.<br><br>Si vous avez quelque chose de précis en tête, dites-nous quel type de build et on vous dira franchement si on a déjà livré l\'équivalent.'
        : 'There\'s a <a href="/#production">case studies</a> section on the homepage. We\'re publishing the real ones as clients approve them — in the meantime the <a href="insights.html">Build Log</a> is a better look at how we actually work.<br><br>If you have something specific in mind, tell us the kind of build and we\'ll say plainly whether we\'ve shipped something close to it.'
    };
  }

  // ── Office / visit ────────────────────────────────────────────
  if (/\b(office|visit|come in|physical|en personne|bureau|adresse|address|can i visit|venir vous voir|où êtes-vous)\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Nous sommes basés à Douala et travaillons avec des clients partout au Cameroun, essentiellement à distance — WhatsApp, appels, documents partagés. Si une rencontre en personne compte pour votre projet, l\'équipe peut s\'organiser (lundi au samedi, 8h–18h).'
        : 'We\'re based in Douala and work with clients across Cameroon, mostly remotely — WhatsApp, calls, shared documents. If meeting in person matters for your project, the team can arrange it (Mon–Sat, 8am–6pm).'
    };
  }

  // ── "I want / I need / I'm interested" ───────────────────────
  if (/\b(i want|i need|i'?d like|i'?m interested|looking for|je veux|j'aimerais|je cherche|je voudrais|je suis intéressé|interested in)\b/i.test(text)) {
    const pkgMatch = text.match(/\b(starter|essential|essentiel|growth|pro|build ?(&|and) ?launch|démarrage|croissance)\b/i);
    if (pkgMatch) {
      const suggested = normalizePackage(pkgMatch[0]);
      leadContext = { package: suggested };
      selectedPackage = suggested;
      packageInferred = false;   // they named it
      // Naming a package outright is the strongest interest signal there is, and
      // this path was the one place it wasn't being written to memory — so a
      // returning visitor who had asked for Growth by name was welcomed back with
      // nothing more specific than their business type.
      rememberProfile({ packageInterest: (PACKAGES[suggested] && PACKAGES[suggested].name.en) || suggested });
      const pkgName = p[suggested].name[lang] || p[suggested].name.en;
      return beginLeadCollection(lang, lang === 'fr'
        ? `Le ${pkgName}, entendu. On pourra toujours vous déplacer si, en discutant, ce n'est pas le bon niveau.`
        : `${pkgName}, noted. We can still move you if it turns out that's not the right level once we talk.`);
    }
    if (/\b(web\s*sit[e]?|site\s*web?|online|en ligne)\b/i.test(text)) {
      lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection';
      packageInferred = true;    // we guessed — they only said "website"
      return { text: websiteOptions(lang) };
    }
    if (/\b(app(?:lication)?|mobile)\b/i.test(text)) {
      return { text: appIntentReply(lang) };
    }
    if (/\b(logo|flyer|brand|design|carte de visite|business card)\b/i.test(text)) {
      return { text: designOptions(lang) };
    }
    if (/\b(social media|réseaux sociaux|instagram|facebook|marketing)\b/i.test(text)) {
      return { text: socialReply(lang) };
    }
    return {
      text: lang === 'fr'
        ? 'Dites-nous ce que fait votre activité et ce que vous cherchez à régler — c\'est en général assez pour vous orienter vers la bonne chose.'
        : 'Tell us what the business does and what you\'re trying to fix — that\'s usually enough for us to point you at the right thing.'
    };
  }

  // ── Get started / book / proceed ─────────────────────────────
  if (/\b(get started|book|reserve|commencer|démarrer|s'inscrire|passer commande|start now|commencer maintenant|let'?s do it|procéd|proceed|ready|je suis prêt)\b/i.test(text)) {
    if (selectedPackage) {
      const pkgName = p[selectedPackage].name[lang] || p[selectedPackage].name.en;

      // "Let's get started" is real intent, but if we only inferred the package
      // we still don't know which one they mean. One short question is cheaper
      // than starting the wrong order and unwinding it on WhatsApp later.
      if (packageInferred) {
        packageInferred = false;
        return {
          text: lang === 'fr'
            ? `Avec plaisir. On part sur lequel — ${pkgName}, ou vous voulez d'abord comparer avec les autres ?`
            : `Let's do it. Which one are we setting up — ${pkgName}, or do you want to compare with the others first?`
        };
      }

      return beginLeadCollection(lang, lang === 'fr' ? `Entendu — ${pkgName}.` : `Right — ${pkgName}.`);
    }
    return {
      text: lang === 'fr'
        ? 'Avec plaisir. Avant de vous envoyer quelque part — qu\'est-ce que vous cherchez à régler en priorité ?'
        : 'Happy to. Before we point you anywhere — what\'s the thing you\'re trying to fix first?'
    };
  }

  // ── Package details ──────────────────────────────────────────
  if (/\b(starter|démarrage)\b/i.test(text)) {
    lastTopic = 'starter'; selectedPackage = 'starter'; currentStage = 'selection'; packageInferred = false;
    rememberProfile({ packageInterest: 'Starter' });
    return { packageHTML: formatPackage('starter', lang) };
  }
  if (/\b(essential|essentiel)\b/i.test(text)) {
    lastTopic = 'essential'; selectedPackage = 'essential'; currentStage = 'selection'; packageInferred = false;
    return { packageHTML: formatPackage('essential', lang) };
  }
  if (/\b(growth|croissance)\b/i.test(text)) {
    lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection'; packageInferred = false;
    rememberProfile({ packageInterest: 'Growth' });
    return { packageHTML: formatPackage('growth', lang) };
  }
  if (/\b(pro)\b/i.test(text) && /(package|forfait|price|prix|details?|info|tell me|montrez|donnez)/i.test(text)) {
    lastTopic = 'pro'; selectedPackage = 'pro'; currentStage = 'selection'; packageInferred = false;
    rememberProfile({ packageInterest: 'Pro' });
    return { packageHTML: formatPackage('pro', lang) };
  }

  // ── Price question with enterprise context ──────────────────
  // If the visitor has been talking about a custom-scoped service, a bare "how
  // much?" must NOT dump the SME package list at them — those prices belong to a
  // different track and quoting $80 against an ERP conversation reads as a bait.
  if (/(price|prix|cost|combien|how much|tarif|budget|quote|devis)/i.test(text) &&
      ENTERPRISE[lastTopic] && !/\b(starter|essential|growth|pro|package|forfait)\b/i.test(text)) {
    const svcName = ENTERPRISE[lastTopic].name[lang] || ENTERPRISE[lastTopic].name.en;
    return {
      isHTML: true,
      text: lang === 'fr'
        ? `Honnêtement, ce serait malhonnête de vous donner un chiffre maintenant — <strong>${svcName}</strong> est un projet sur mesure, et le prix dépend entièrement de ce qu'il doit faire.<br><br>Ce qui fait vraiment bouger le chiffre :<br>• le nombre de personnes qui vont l'utiliser<br>• s'il doit se connecter à des systèmes que vous avez déjà<br>• si vous partez de zéro ou remplacez quelque chose<br><br>Dites-nous en deux phrases ce que le système doit faire, et notre équipe vous revient avec une fourchette réelle — pas un chiffre inventé.<br><br>Pour situer : nos contrats d'infogérance démarrent à 125$/mois, et les projets de développement sont chiffrés individuellement.`
        : `Honestly, it'd be a disservice to throw a number at you right now — <strong>${svcName}</strong> is scoped per project, and the price depends entirely on what it has to do.<br><br>What actually moves the number:<br>• how many people will use it<br>• whether it has to talk to systems you already run<br>• whether you're starting fresh or replacing something<br><br>Tell us in a sentence or two what the system needs to do, and our team comes back with a real range — not a made-up figure.<br><br>For a rough anchor: managed IT retainers start at $125/mo, and build projects are quoted individually.`
    };
  }

  // ── Cold price question, no context yet ─────────────────────
  // "How much does it cost?" as an opener is unanswerable — we sell a $50/year
  // landing page and six-figure-scope custom systems. One short question here
  // beats a wall of package cards that may be aimed at the wrong track entirely.
  if (/(price|prix|cost|combien|how much|tarif|budget)/i.test(text) &&
      !lastTopic && !selectedPackage &&
      !/(packages?|forfaits?|website|site web|logo|social|réseaux)/i.test(text)) {
    return {
      isHTML: true,
      text: lang === 'fr'
        ? `Bonne question — et la vraie réponse est « ça dépend », alors précisons rapidement.<br><br>Nous travaillons sur deux voies :<br><br>• <strong>Forfaits PME</strong> — prix publics, à partir de 80$ d'installation + 50$/an pour une présence en ligne (site, Google Business, WhatsApp, réseaux sociaux).<br><br>• <strong>Projets sur mesure</strong> — logiciels, chatbots IA, cloud, infogérance. Chiffrés individuellement ; les contrats de maintenance démarrent à 125$/mois.<br><br>Laquelle correspond à votre situation ? Ou décrivez simplement votre besoin et nous vous orientons.`
        : `Fair question — and the honest answer is "it depends", so let's narrow it fast.<br><br>We work on two tracks:<br><br>• <strong>SME packages</strong> — published prices, from $80 setup + $50/year for getting a business found online (site, Google Business, WhatsApp, social).<br><br>• <strong>Custom projects</strong> — software, AI chatbots, cloud, managed IT. Quoted per project; support retainers start at $125/mo.<br><br>Which sounds closer to you? Or just describe what you're trying to fix and we'll point you at the right one.`
    };
  }

  // ── High-confidence FAQ pre-pass ─────────────────────────────
  // Placement is the whole design here. The main FAQ pass runs last so nothing
  // can regress, but a policy question usually CONTAINS the word that trips a
  // generic branch: "will the website work on mobile" was answered with the
  // website price list, because that branch saw "website" and never read the
  // rest of the sentence.
  //
  // So a confident match is allowed to pre-empt the GENERIC product branches
  // below (website / app / branding / social / package lists) — but it sits
  // BELOW the specific intent and pricing branches above, which are better
  // answers than any FAQ row. Measured before choosing this spot: "how much does
  // a chatbot cost" scores 0.58 against the wrong entry, and "connect a bot to
  // our CRM" 0.66 — both would have been hijacked had this run any earlier.
  const strongFaq = matchFAQ(rawText, lang);
  if (strongFaq && strongFaq.score >= 0.50) return strongFaq;

  // ── All packages ─────────────────────────────────────────────
  // A price question that already names what they want ("how much for a
  // website?") must fall through to the specific branch below — answering it with
  // all four package cards at once is the brochure dump we're trying to avoid.
  if (/(packages?|forfaits?|show.*package|see.*package|all package|what.*package|your package|pricing|tarif[s]?|how much|combien.*coût|cost[s]?|prix)/i.test(text) &&
      !/\b(starter|essential|growth|pro)\b/i.test(text) &&
      !/\b(web\s*sit[e]?s?|websit[e]?|site\s*web?|online presence|présence en ligne|logo|flyer|brand(?:ing)?|social media|réseaux sociaux|instagram|facebook|tiktok|app(?:lication)?s?|mobile)\b/i.test(text)) {
    lastTopic = 'growth';
    return { text: lang === 'fr' ? 'Voici nos forfaits :' : 'Here are our packages:', multiPackage: true };
  }

  // ── Pricing / cost ───────────────────────────────────────────
  // Same rule as the block above: only answer with the whole price list when the
  // question is actually about the whole price list. "How much for a logo?" gets
  // the logo answer, not five packages.
  if (/(price|prix|cost|combien|how much|tarif|setup fee|frais|installation fee)/i.test(text) &&
      !/\b(web\s*sit[e]?s?|websit[e]?|site\s*web?|online presence|présence en ligne|logo|flyer|brand(?:ing)?|social media|réseaux sociaux|instagram|facebook|tiktok|app(?:lication)?s?|mobile)\b/i.test(text)) {
    lastTopic = 'pricing';
    const growthCalc = calculatePaymentDetails('growth', 'installments', lang);
    return {
      text: lang === 'fr'
        ? `Voici nos tarifs (en USD). Exemple concret pour le Growth :\n\n${growthCalc}\n\n• Starter : ${p.starter.setup.fr} + ${p.starter.price.fr}\n• Essentiel : ${p.essential.setup.fr} + ${p.essential.price.fr}\n• Growth : ${p.growth.setup.fr} + ${p.growth.price.fr}\n• Pro : ${p.pro.setup.fr} + ${p.pro.price.fr}\n• Build & Launch (unique) : ${p.build_only.setup.fr}\n\nFacturation annuelle — payez en une fois ou en 2-3 versements sans intérêts par MoMo.\n\nQuel forfait ou service vous intéresse ?`
        : `Here are our prices (in USD). Concrete example for Growth:\n\n${growthCalc}\n\n• Starter: ${p.starter.setup.en} + ${p.starter.price.en}\n• Essential: ${p.essential.setup.en} + ${p.essential.price.en}\n• Growth: ${p.growth.setup.en} + ${p.growth.price.en}\n• Pro: ${p.pro.setup.en} + ${p.pro.price.en}\n• Build & Launch (one-time): ${p.build_only.setup.en}\n\nBilled yearly — pay in full or in 2-3 interest-free MoMo installments.\n\nWhich package or service interests you?`
    };
  }

  // ── What's included ──────────────────────────────────────────
  if (/(what'?s? included|include[sd]?|inclus|what.*get|ce qui est|features?|fonctionnalit|contient)/i.test(text)) {
    if (lastTopic && p[lastTopic]) return { packageHTML: formatPackage(lastTopic, lang) };
    return { text: lang === 'fr'
      ? 'On peut détailler n\'importe lequel — dites simplement "Starter", "Essentiel", "Growth" ou "Pro".'
      : 'We can break down any of them — just say "Starter", "Essential", "Growth" or "Pro".'
    };
  }

  // ── Installments / payment plans ─────────────────────────────
  if (/(installment|versement[s]?|échelon|paiement en plusieurs|2 mois|3 mois|sans intérêt|pay in parts|split payment)/i.test(text)) {
    return { text: lang === 'fr'
      ? `${k.installments} C'est souvent l'option qui arrange le mieux nos clients. Quel service ou forfait vous intéresse ?`
      : `${k.installments} It's often what works best for our clients. Which service or package interests you most?`
    };
  }

  // ── Annual discount ──────────────────────────────────────────
  if (/(prepay|annuel|yearly|12 mois|annual discount|réduction annuelle|économie|save.*year)/i.test(text)) {
    return { text: lang === 'fr'
      ? `${k.prepay} Ça simplifie la gestion. Nous pouvons détailler pour un forfait en particulier ?`
      : `${k.prepay} It simplifies management a lot. Want us to break it down for a specific package?`
    };
  }

  // ── One-time / no monthly ────────────────────────────────────
  if (/(build only|one.?time|paiement unique|juste le site|build.*launch|sans abonnement|no monthly|without subscription)/i.test(text)) {
    lastTopic = 'build_only'; selectedPackage = 'build_only'; currentStage = 'selection'; packageInferred = false;
    return { packageHTML: formatPackage('build_only', lang) };
  }

  // ── Price objection ──────────────────────────────────────────
  if (/(too expensive|cher|trop cher|c'est beaucoup|can.*lower|reduce.*price|less expensive|moins cher|affordable|budget limit|budget serré)/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'C\'est une objection légitime, et on préfère y répondre franchement plutôt que d\'insister.\n\nDeux choses concrètes : le forfait annuel se règle en 2 ou 3 versements MoMo sans intérêts, et si le budget est vraiment serré, le Starter existe exactement pour ça — on monte plus tard si ça marche.\n\nVous avez un chiffre en tête ? On vous dira honnêtement ce qui rentre dedans.'
        : 'Fair objection, and we\'d rather answer it straight than push.\n\nTwo concrete things: the yearly fee splits into 2-3 interest-free MoMo instalments, and if budget is genuinely tight, Starter exists for exactly that — you move up later if it works.\n\nDo you have a number in mind? We\'ll tell you honestly what fits inside it.'
    };
  }

  // ── Website (typo-tolerant) ───────────────────────────────────
  if (/\b(web\s*sit[e]?s?|websit[e]?|site\s*web?|webs?it|online presence|présence en ligne|w[ae]bsite)\b/i.test(text)) {
    lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection';
    packageInferred = true;      // "website" is a need, not a package choice
    return { text: websiteOptions(lang) };
  }

  // ── "I need an app" ───────────────────────────────────────────
  // We do NOT build native app-store apps — api/chat.js's system prompt says so
  // too. This branch used to promise custom Android/iOS builds "from around $500",
  // a service and a price that exist in no catalog, contradicting the LLM half of
  // the same conversation.
  if (/\b(app(?:lication)?s?|mobile app|android|ios|play store|application mobile)\b/i.test(text)) {
    return { text: appIntentReply(lang) };
  }

  // ── Logo / flyer / branding ───────────────────────────────────
  if (/\b(logo[s]?|flyer[s]?|brand(?:ing)?|design graphique|carte[s]? de visite|business card[s]?|identité visuelle|visual identity)\b/i.test(text)) {
    return { text: designOptions(lang) };
  }

  // ── Social media ──────────────────────────────────────────────
  if (/\b(social media|réseaux sociaux|instagram|facebook|tiktok|manage.*social|gestion.*réseaux)\b/i.test(text)) {
    return { text: socialReply(lang) };
  }

  // ── Follow-up on last topic ───────────────────────────────────
  if (/(that one|celui-là|tell me more|plus d'infos?|the other|autre|plus de détails?)/i.test(text) && lastTopic && p[lastTopic]) {
    return { packageHTML: formatPackage(lastTopic, lang) };
  }

  // ── Upgrade ───────────────────────────────────────────────────
  if (/\b(upgrade|changer de forfait|passer au|augmenter|later|plus tard)\b/i.test(text)) {
    return { text: k.upgrade };
  }

  // ── Technical skills ──────────────────────────────────────────
  if (/\b(technical|compétence|skill|knowledge|difficile|compliqué|je ne sais pas|do i need|faut-il savoir)\b/i.test(text)) {
    return { text: k.technical };
  }

  // ── Timeline ──────────────────────────────────────────────────
  if (/\b(timeline|délai|how long|combien de temps|when.*ready|quand.*prêt|weeks?|days?|jours?)\b/i.test(text)) {
    return { text: k.timeline };
  }

  // ── Payment / MoMo ───────────────────────────────────────────
  if (/(payment|paiement|momo|orange money|bank transfer|how.*pay|comment.*payer|how do i pay|moyen de paiement)/i.test(text)) {
    // If they've already picked a package and shared details, connect them to the
    // team to finish + confirm payment (Campay sandbox = human verification).
    if (selectedPackage && leadContext.name) return doHandoff(lang, true);
    if (/momo/i.test(text)) return { text: k.momo };
    return { text: k.payment };
  }

  // ── Free audit / which package ───────────────────────────────
  if (/(not sure|which.*package|which.*service|what.*recommend|conseil|audit|help me choose|aide.*choisir)/i.test(text)) {
    return { text: k.freeAudit };
  }

  // ── Location ─────────────────────────────────────────────────
  if (/\b(yaoundé|douala|buea|bamenda|kribi|limbe|cameroon|cameroun|where.*you|où.*vous|which city|quelle ville)\b/i.test(text)) {
    return { text: k.cities };
  }

  // ── Who are you / about Harts ─────────────────────────────────
  if (/(who are you|qui êtes.?vous|à propos|about harts|what is harts|c'est quoi harts|your company)\b/i.test(text)) {
    return { text: k.who };
  }

  // ── Contact / human / WhatsApp ───────────────────────────────
  if (/(speak.*human|talk.*person|real person|vraie personne|conseiller|équipe|whatsapp number|numéro whatsapp|contact|call you|appeler)/i.test(text)) {
    return { text: k.contact, action: 'handoff' };
  }

  // ── Services general ─────────────────────────────────────────
  if (/\b(service[s]?|what do you do|que faite|offre|proposez|can you help|vous faites quoi)\b/i.test(text)) {
    return { text: k.services };
  }

  // ── Payment confirmation ──────────────────────────────────────
  if (/(paid|j'?ai payé|money sent|référence|confirm.*payment|paiement effectué|j'?ai envoyé|sent.*payment)/i.test(text) && (currentStage === 'payment' || currentStage === 'handoff')) {
    // We don't auto-confirm — a human verifies the payment. Point them to the team.
    return {
      text: lang === 'fr'
        ? 'Noté. L\'équipe vérifie le paiement de son côté et vous confirme sur WhatsApp (+237 622 341 343) avant de démarrer — nous ne confirmons jamais un paiement ici. Si vous ne l\'avez pas déjà fait, envoyez-leur votre référence de paiement.'
        : 'Noted. The team verifies the payment on their side and confirms on WhatsApp (+237 622 341 343) before starting — we never confirm a payment here. If you haven\'t already, send them your payment reference.',
      action: 'handoff'
    };
  }

  // ── Summary request ───────────────────────────────────────────
  if (/(summarize|résumé|recap|so far|jusqu'ici|what.*discussed|summary|résume)/i.test(text)) {
    const summary = generateConversationSummary(lang);
    return {
      text: lang === 'fr'
        ? `Voici un résumé de notre échange : ${summary}\n\nVoulez-vous avancer ou que nous préparions le message pour l'équipe WhatsApp ?`
        : `Here's a summary of our conversation: ${summary}\n\nWant to move forward, or shall we prepare the WhatsApp message for the team?`
    };
  }

  // ── Knowledge-base FAQ ────────────────────────────────────────
  // Deliberately the last thing tried. Every hand-tuned branch above keeps
  // priority, so this can only catch what would otherwise have reached the
  // generic "we didn't follow that" — meaning questions can be added to the KB
  // without any risk of regressing an answer that already worked.
  //
  // A hit is authoritative and blocks the LLM (see the gate in sendMessage):
  // these are policy and product facts — who owns the site, whether the training
  // is free, whether we sell your data — and those are precisely the answers a
  // model invents when it doesn't know.
  const faqHit = matchFAQ(rawText, lang);
  if (faqHit) return faqHit;

  // ── Fallback — nothing above matched ──────────────────────────
  // `fallback: true` marks these two exits as "the rules had nothing". It is
  // the ONLY signal sendMessage uses to decide whether the AI layer may answer,
  // so every branch above this point keeps its reply verbatim — a matched rule
  // is never overwritten by a model. The text below is still what a visitor
  // sees whenever the AI layer is switched off or unreachable.
  const summary = generateConversationSummary(lang);
  if (currentStage === 'discovery' || !selectedPackage) {
    return {
      fallback: true,
      text: lang === 'fr'
        ? `On n'a pas bien saisi celle-là.\n\nDites-nous ce que fait votre activité et ce qui ne tourne pas rond en ce moment — on prend le relais à partir de là.`
        : `We didn't quite follow that one.\n\nTell us what the business does and what's going wrong at the moment — we can take it from there.`
    };
  }
  return {
    fallback: true,
    text: lang === 'fr'
      ? `${summary} Où voulez-vous aller à partir de là — le détail du forfait, les versements, ou on prépare le message pour l'équipe ?`
      : `${summary} Where do you want to take it from here — the package detail, instalments, or shall we get the message ready for the team?`
  };
}

function normalizePackage(str) {
  const s = str.toLowerCase();
  if (s.includes('starter') || s.includes('démarrage')) return 'starter';
  if (s.includes('essential') || s.includes('essentiel')) return 'essential';
  if (s.includes('growth') || s.includes('croissance')) return 'growth';
  if (s.includes('pro')) return 'pro';
  if (s.includes('build') || s.includes('one.time') || s.includes('unique')) return 'build_only';
  return 'growth';
}

function formatPackage(key, lang) {
  const pkg = PACKAGES[key];
  if (!pkg) return 'We can tell you about Starter, Growth, Pro, or our one-time Build & Launch option.';
  
  const name = pkg.name[lang] || pkg.name.en;
  const setup = pkg.setup[lang] || pkg.setup.en;
  const price = pkg.price[lang] || pkg.price.en;
  const feats = pkg.features[lang] || pkg.features.en;
  const desc = pkg.desc[lang] || pkg.desc.en;

  // Return as HTML for beautiful formatted bubbles (Priority #2)
  let html = `<strong>${name}</strong><br>`;
  html += `${setup} + ${price}<br><br>`;
  html += `${desc}<br><br>`;
  html += `<strong>Included:</strong><br>`;
  feats.forEach(f => html += `• ${f}<br>`);

  // Dynamic payment summary
  const paymentSummary = calculatePaymentDetails(key, 'full', lang);
  html += `<br>${paymentSummary}<br>`;

  if (pkg.installment) {
    html += `→ You can split the yearly fee into 2-3 interest-free MoMo installments.<br>`;
  }

  if (key === 'growth') html += `<br><strong>Most popular package</strong><br>`;
  if (key === 'build_only') html += `<br>Great lower-commitment option — one-time payment, no recurring fees.<br>`;

  html += `<br>Ready to move forward, or want to compare / see exact payment options?`;
  
  return html; // Will be rendered as HTML in the bubble
}

// Formats an enterprise service category (custom software, cloud, managed IT, AI
// chatbots) — these are custom-scoped projects, not fixed chat packages, so unlike
// formatPackage() there's no price to show; it ends by inviting a WhatsApp handoff.
function formatEnterpriseService(key, lang) {
  const svc = ENTERPRISE[key];
  if (!svc) return null;

  const name = svc.name[lang] || svc.name.en;
  const tagline = svc.tagline[lang] || svc.tagline.en;
  const desc = svc.desc[lang] || svc.desc.en;
  const tags = svc.tags || [];

  let html = `<strong>${name}</strong><br>`;
  if (tagline) html += `${tagline}<br><br>`;
  if (desc) html += `${desc}<br>`;
  if (tags.length) {
    html += `<br><strong>${lang === 'fr' ? 'Exemples' : 'Includes'}:</strong> ${tags.join(' · ')}<br>`;
  }
  html += `<br>${lang === 'fr'
    ? 'C\'est un projet sur mesure — voulez-vous en discuter avec notre équipe sur WhatsApp ?'
    : 'This is a custom-scoped project — want to talk it through with our team on WhatsApp?'}`;

  return html;
}

// Enterprise cards render from the live catalog, so a key the knowledge base
// doesn't carry (a renamed row, a partial hydration) must never produce an empty
// bubble — sendMessage would otherwise call .replace() on an undefined reply.text
// and take the whole conversation down. Fall back to a plain answer that still
// moves things forward.
function enterpriseReply(key, lang) {
  const html = formatEnterpriseService(key, lang);
  if (html) return { packageHTML: html };
  return {
    text: lang === 'fr'
      ? 'C\'est du sur-mesure, chiffré au cas par cas. Dites-nous en une ou deux phrases ce que le système doit faire et l\'équipe revient avec une vraie fourchette.'
      : 'That\'s custom-scoped work, quoted per project. Tell us in a sentence or two what it needs to do and the team comes back with a real range.'
  };
}

// Website tiers priced from the live catalog instead of hardcoded strings, so a
// price edit in Supabase reaches the chat without a code change. These numbers
// used to be typed inline in two places and would silently go stale.
function websiteOptions(lang) {
  const line = (key) => {
    const pkg = PACKAGES[key];
    if (!pkg) return null;
    const name = pkg.name[lang] || pkg.name.en;
    const setup = pkg.setup[lang] || pkg.setup.en;
    if (key === 'build_only') return '• ' + name + ' — ' + setup;
    const price = pkg.price[lang] || pkg.price.en;
    return '• ' + name + ' — ' + setup + ' + ' + price;
  };
  const lines = ['starter', 'growth', 'build_only'].map(line).filter(Boolean).join('\n');
  return lang === 'fr'
    ? 'Trois façons d\'aborder ça, selon ce que le site doit vraiment faire :\n\n' + lines +
      '\n\nCe qui tranche en général : le site doit surtout vous rendre trouvable, ou il doit vendre et prendre des commandes ?'
    : 'Three ways to approach it, depending on what the site actually has to do:\n\n' + lines +
      '\n\nThe thing that usually decides it: does the site mainly need to make you findable, or does it need to sell and take orders?';
}

// "I need an app" almost always means a website, a web app, or a WhatsApp bot in
// disguise. We don't build native app-store apps, so say that plainly and find
// out what they actually need instead of quoting a number for work we don't do.
function appIntentReply(lang) {
  return lang === 'fr'
    ? 'Soyons clairs d\'entrée : nous ne construisons pas d\'applications natives pour les stores. Dans la plupart des cas ce n\'est d\'ailleurs pas ce qu\'il faut — demander à ses clients d\'installer quelque chose est un vrai obstacle.\n\nCe que nous construisons, c\'est ce qui rend le même service sans installation : un site, une application web, ou un bot WhatsApp.\n\nVos clients y feraient quoi, concrètement ?'
    : 'Straight away: we don\'t build native app-store apps. In most cases that isn\'t what\'s needed anyway — asking customers to install something is a real barrier.\n\nWhat we do build is whatever delivers the same thing without an install: a website, a web app, or a WhatsApp bot.\n\nWhat would customers actually be doing in it?';
}

// Social management, with the Growth price read from the catalog rather than
// typed inline (it was hardcoded as "$600/year" in two places).
function socialReply(lang) {
  const growth = PACKAGES.growth;
  const named = growth
    ? (growth.name[lang] || growth.name.en) + ' (' + (growth.price[lang] || growth.price.en) + ')'
    : (lang === 'fr' ? 'le forfait Croissance' : 'the Growth package');
  return lang === 'fr'
    ? 'Nous gérons Facebook, Instagram et TikTok — contenu, publications régulières, rapport mensuel. C\'est compris dans ' + named + ', ou disponible en option sur un autre forfait.\n\nVous publiez déjà quelque part, ou on part de zéro ?'
    : 'We run Facebook, Instagram and TikTok — content, regular posting, a monthly report. It\'s included in ' + named + ', or available as an add-on to another package.\n\nAre you posting anywhere already, or starting from nothing?';
}

// Same idea for design work — the add-on catalog is the source of truth. The old
// copy advertised a "$75 Logo + Flyer pack" that exists in no catalog anywhere.
function designOptions(lang) {
  const rows = Object.keys(ADDONS).map(function (key) {
    const a = ADDONS[key];
    const label = (a.label && (a.label[lang] || a.label.en)) || key;
    return '• ' + label + ' — ' + usd(a.price);
  }).join('\n');
  return lang === 'fr'
    ? 'Voici ce qu\'on fait côté identité visuelle :\n\n' + rows +
      '\n\nC\'est pour une activité qui démarre, ou pour remettre à plat quelque chose qui existe déjà ?'
    : 'Here\'s what we do on the visual identity side:\n\n' + rows +
      '\n\nIs this for something just starting up, or a rework of a brand that already exists?';
}

// Entering the details step. Someone who gave us their name last week must not be
// asked for it again — a bot that says "welcome back, Ngassa" and then asks
// "what's your full name?" is worse than one that never claimed to remember,
// because it advertises the memory and then visibly fails to use it.
//
// The phone number is asked for every single time, by design: memory never
// stores it (see the privacy note in the memory block above), so we genuinely
// don't have it.
function beginLeadCollection(lang, leadIn) {
  currentStage = 'details';
  const p = mem.profile;
  const held = [];
  if (p.name) { leadContext.name = p.name; held.push(p.name); }
  if (p.business) { leadContext.business = p.business; held.push(p.business); }
  if (p.city) { leadContext.city = p.city; held.push(p.city); }

  const prefix = leadIn ? leadIn + '\n\n' : '';

  // Mark the order as started. Cleared the moment it completes, so only a
  // genuinely abandoned one survives to the next visit.
  rememberPending(selectedPackage || leadContext.package || null);

  // Confirm rather than assume — the same rule the inferred-package path follows.
  // Details can go stale: people change business, move city, get married.
  if (leadContext.name) {
    awaitingLeadField = 'confirm_known';
    return {
      text: prefix + (lang === 'fr'
        ? `On a encore vos infos : ${held.join(' · ')}. Toujours bon ?`
        : `We still have you as: ${held.join(' · ')}. Still right?`)
    };
  }

  awaitingLeadField = 'name';
  return {
    text: prefix + (lang === 'fr' ? 'Quel est votre nom complet ?' : 'What\'s your full name?')
  };
}

// Ask for whatever is still missing, in order, and hand off once the set is
// complete. This replaces a hardcoded name→business→phone→city chain, where each
// step named its own successor — which meant a prefilled field was asked for
// anyway, because nothing ever checked whether it was already answered.
function advanceLeadField(lang) {
  if (!leadContext.name) {
    awaitingLeadField = 'name';
    return { text: lang === 'fr' ? 'Quel est votre nom complet ?' : 'What\'s your full name?' };
  }

  if (!leadContext.business) {
    awaitingLeadField = 'business';
    const firstName = String(leadContext.name).split(/\s+/)[0];
    return {
      text: lang === 'fr'
        ? `Merci ${firstName}. Et l'activité, elle s'appelle comment ?`
        : `Thanks ${firstName}. And what's the business called?`
    };
  }

  if (!leadContext.phone) {
    awaitingLeadField = 'phone';
    return {
      text: lang === 'fr'
        ? 'Votre numéro WhatsApp (avec l\'indicatif, ex : +237 6XX XXX XXX) pour qu\'on puisse vous joindre ?'
        : 'Your WhatsApp number (with country code, e.g. +237 6XX XXX XXX) so we can reach you?'
    };
  }

  if (!leadContext.city) {
    awaitingLeadField = 'city';
    return { text: lang === 'fr' ? 'Et vous êtes dans quelle ville ?' : 'And which city are you in?' };
  }

  // Complete → hand the whole payment to a human on WhatsApp. (Campay is in
  // sandbox; a real person verifies + confirms payment.)
  awaitingLeadField = null;
  currentStage = 'payment';
  clearPending();
  return doHandoff(lang, true);
}

// ── Conversational Lead Collection ────────────────────────────
function handleLeadCollection(rawText, lang) {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();
  updateUserProfileFromText(rawText, lang);

  // Skip / jump to WhatsApp
  if (/^(skip|passer|plus tard|connect|whatsapp|human|équipe|team|speak.*person|parler.*personne)\b/i.test(trimmed)) {
    awaitingLeadField = null;
    currentStage = 'payment';
    return doHandoff(lang);
  }

  // Correction mid-flow ("actually", "wait", "no", "I meant").
  // Skipped while confirming remembered details: "no, it's Chez Marie now" is a
  // correction the confirm_known handler answers properly, whereas this one would
  // reply "let's redo that one: ?" with an empty field label.
  if (awaitingLeadField !== 'confirm_known' &&
      /^(actually|wait|no|correction|oops|i meant|je voulais dire|en fait|pardon)\b/i.test(lower)) {
    const field = awaitingLeadField;
    const fieldLabel = {
      name: lang === 'fr' ? 'votre nom' : 'your name',
      business: lang === 'fr' ? 'le nom de votre activité' : 'your business name',
      phone: lang === 'fr' ? 'votre numéro WhatsApp' : 'your WhatsApp number',
      city: lang === 'fr' ? 'votre ville' : 'your city',
      payment_pref: lang === 'fr' ? 'votre préférence de paiement' : 'your payment preference'
    }[field] || '';
    return {
      text: lang === 'fr'
        ? `Aucun souci — reprenons : ${fieldLabel} ?`
        : `No problem — let's redo that one: ${fieldLabel}?`
    };
  }

  // Off-topic question mid-flow — answer it, then remind where we are
  if (/^(how|what|which|can you|do you|price|cost|how much|combien|quel|est-ce que|avez-vous|show me)\b/i.test(lower)) {
    const field = awaitingLeadField;
    const savedField = awaitingLeadField;
    awaitingLeadField = null;
    const response = getBotResponse(rawText, lang);
    awaitingLeadField = savedField;
    const resumePrompt = {
      name: lang === 'fr' ? '\n\nCela dit, pour continuer votre inscription, quel est votre nom complet ?' : '\n\nThat said, to continue setting things up — what\'s your full name?',
      business: lang === 'fr' ? '\n\nEt pour continuer, quel est le nom de votre activité ?' : '\n\nAnd to continue — what\'s the name of your business?',
      phone: lang === 'fr' ? '\n\nEt votre numéro WhatsApp ?' : '\n\nAnd your WhatsApp number?',
      city: lang === 'fr' ? '\n\nEt quelle est votre ville ?' : '\n\nAnd which city are you in?',
      confirm_known: lang === 'fr' ? '\n\nCela dit — les infos qu\'on a de vous sont toujours bonnes ?' : '\n\nThat said — are the details we have for you still right?',
      payment_pref: lang === 'fr' ? '\n\nEt pour le paiement du forfait annuel, vous préférez en une fois ou en 2-3 versements sans intérêts ?' : '\n\nAnd for the yearly fee — pay in full or in 2-3 interest-free installments?'
    }[field] || '';
    return { text: (response.text || '') + resumePrompt };
  }

  // Confirming details we already held from a previous conversation.
  if (awaitingLeadField === 'confirm_known') {
    if (/^(yes|yep|yeah|yup|correct|right|still|same|sure|ok|okay|oui|exact|toujours|c'est (ça|bien)|pareil)\b/i.test(lower)) {
      return advanceLeadField(lang);
    }
    // Anything that isn't a yes is a correction. Rather than guess which field
    // changed, drop what we prefilled and walk the questions again — keeping what
    // they typed ONLY when it is plausibly just a name. "no, it is Marie Ateba
    // now" is a sentence, not a name, and storing it verbatim produced the lead
    // "it is Marie Ateba now" and the greeting "Thanks it."
    const corrected = trimmed.replace(/^(no|nope|non|actually|en fait|pas tout à fait|not quite)[,.\s-]*/i, '').trim();
    leadContext = {};
    const words = corrected.split(/\s+/).filter(Boolean);
    const FILLER = /^(it|its|it's|is|was|now|my|the|a|an|name|called|changed|c'est|est|mon|ma|nom|maintenant|plutôt)$/i;
    const looksLikeName = words.length >= 1 && words.length <= 4 &&
      corrected.length < 60 && !/\d/.test(corrected) && !words.some(w => FILLER.test(w));
    if (looksLikeName) {
      leadContext.name = corrected;
      rememberProfile({ name: corrected });
      return advanceLeadField(lang);
    }
    awaitingLeadField = 'name';
    return {
      text: lang === 'fr'
        ? 'Pas de souci — reprenons. Quel est votre nom complet ?'
        : 'No problem — let\'s redo it. What\'s your full name?'
    };
  }

  if (awaitingLeadField === 'name') {
    // Reject suspiciously short or all-number names
    if (trimmed.length < 2 || /^\d+$/.test(trimmed)) {
      return { text: lang === 'fr' ? 'Nous n\'avons pas bien compris. Pouvez-vous donner votre nom complet ?' : 'We didn\'t catch that. Could you give your full name?' };
    }
    leadContext.name = trimmed;
    rememberProfile({ name: trimmed });
    return advanceLeadField(lang);
  }

  if (awaitingLeadField === 'business') {
    leadContext.business = trimmed;
    rememberProfile({ business: trimmed });
    return advanceLeadField(lang);
  }

  if (awaitingLeadField === 'phone') {
    // Loose validation: must have at least 8 digits
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 8) {
      return {
        text: lang === 'fr'
          ? 'Ce numéro ne semble pas complet. Essayez par exemple : +237 622 341 343 ou 622341343.'
          : 'That number doesn\'t look complete. Try something like: +237 622 341 343 or 622341343.'
      };
    }
    leadContext.phone = trimmed;
    return advanceLeadField(lang);
  }

  if (awaitingLeadField === 'city') {
    leadContext.city = trimmed;
    rememberProfile({ city: trimmed });
    return advanceLeadField(lang);
  }

  // Legacy step — no longer reached (we finish the order at 'city' and hand off).
  // Kept defensive: if anything sets payment_pref, still route to a human.
  if (awaitingLeadField === 'payment_pref') {
    leadContext.payment_pref = trimmed;
    awaitingLeadField = null;
    currentStage = 'payment';
    return doHandoff(lang, true);
  }

  return { text: lang === 'fr' ? 'Pouvez-vous nous communiquer cette information ?' : 'Could you share that with us?' };
}

// Format an XAF amount with the right thousands separator per language.
function fmtXAF(n, lang) {
  return lang === 'fr'
    ? n.toLocaleString('fr-FR').replace(/[  ,]/g, ' ')
    : n.toLocaleString('en-US');
}

// Money formatters: usd() shows the billed USD price; xaf() shows the ≈ XAF charged on MoMo.
function usd(n) { return '$' + Number(n).toLocaleString('en-US'); }
function xaf(n) { return Number(n).toLocaleString('en-US') + ' XAF'; }

function providePaymentInstructions(lang) {
  const pkg = PACKAGES[selectedPackage] || PACKAGES.growth;
  const name = pkg.name[lang] || pkg.name.en;
  const setupFee = SETUP_FEES_USD[selectedPackage] || SETUP_FEES_USD.growth;

  // Offer optional one-time add-ons before charging.
  selectedAddons = [];
  awaitingAddons = true;

  const fee = usd(setupFee);
  const logo = usd(ADDONS.logo.price);
  const brand = usd(ADDONS.full_branding.price);

  const msg = lang === 'fr'
    ? `Parfait. Pour démarrer votre ${name}, les frais d'installation sont de ${fee} (une seule fois).\n\nSouhaitez-vous ajouter un extra design ?\n• Logo — ${logo}\n• Branding complet — ${brand}\n\nRépondez « logo », « branding », « les deux », ou « non » pour continuer.`
    : `Perfect. To start your ${name}, the one-time setup fee is ${fee}.\n\nWant to add a design extra?\n• Logo — ${logo}\n• Full branding — ${brand}\n\nReply "logo", "branding", "both", or "no" to continue.`;

  return { text: msg };
}

// Handles the reply while we're offering optional add-ons.
function handleAddonSelection(rawText, lang) {
  const lower = rawText.trim().toLowerCase();

  // Escape straight to the team
  if (/(whatsapp|team|équipe|equipe|conseiller|humain|human)/i.test(lower)) {
    awaitingAddons = false;
    currentStage = 'payment';
    return doHandoff(lang, true);
  }

  const wantsBoth = /(both|les deux|deux|tout|tous)/i.test(lower);
  const wantsLogo = wantsBoth || /\blogos?\b/i.test(lower);
  const wantsBrand = wantsBoth || /(brand|branding|identit)/i.test(lower);
  const skip = /^(no|non|nope|skip|aucun|rien|pas|continue|continuer)\b/i.test(lower) || /(no thanks|non merci|just the|juste)/i.test(lower);

  if (!wantsLogo && !wantsBrand && !skip) {
    return {
      text: lang === 'fr'
        ? 'Dites-nous simplement « logo », « branding », « les deux », ou « non » pour continuer.'
        : 'Just reply "logo", "branding", "both", or "no" to continue.'
    };
  }

  selectedAddons = [];
  if (wantsLogo) selectedAddons.push('logo');
  if (wantsBrand) selectedAddons.push('full_branding');

  awaitingAddons = false;
  awaitingMomoNumber = true;
  return { text: buildPaymentPrompt(lang) };
}

// Builds the "here's your total, send your MoMo number" message (setup + any add-ons).
function buildPaymentPrompt(lang) {
  const setupFee = SETUP_FEES_USD[selectedPackage] || SETUP_FEES_USD.growth;
  const addonTotal = selectedAddons.reduce((s, k) => s + (ADDONS[k]?.price || 0), 0);
  const total = setupFee + addonTotal;
  const xafApprox = xaf(total * USD_TO_XAF); // MoMo prompt is in XAF, so show the equivalent

  let breakdown;
  if (selectedAddons.length) {
    const addonList = selectedAddons
      .map(k => `• ${ADDONS[k].label[lang] || ADDONS[k].label.en} — ${usd(ADDONS[k].price)}`)
      .join('\n');
    breakdown = lang === 'fr'
      ? `Total à régler : ${usd(total)} (≈ ${xafApprox})\n• Installation — ${usd(setupFee)}\n${addonList}`
      : `Total to pay: ${usd(total)} (≈ ${xafApprox})\n• Setup — ${usd(setupFee)}\n${addonList}`;
  } else {
    breakdown = lang === 'fr'
      ? `Total à régler : ${usd(total)} (≈ ${xafApprox}) pour l'installation.`
      : `Total to pay: ${usd(total)} (≈ ${xafApprox}) for setup.`;
  }

  return lang === 'fr'
    ? `${breakdown}\n\nEnvoyez votre numéro MoMo (MTN ou Orange, ex : 6XX XXX XXX) et nous lançons le paiement — vous validez le montant en XAF avec votre code secret. Ou tapez « WhatsApp » pour l'équipe.`
    : `${breakdown}\n\nSend your MoMo number (MTN or Orange, e.g. 6XX XXX XXX) and we'll start the payment — you approve the XAF amount with your secret code. Or type "WhatsApp" for the team.`;
}

// Handles the customer's reply while we're waiting for a MoMo number to charge the setup fee.
function handleMomoPayment(rawText, lang) {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // Escape hatches
  if (/(whatsapp|team|équipe|equipe|conseiller|humain|human)/i.test(lower)) {
    awaitingMomoNumber = false;
    currentStage = 'payment';
    return doHandoff(lang, true);
  }
  if (/(paid|payé|paye|déjà|deja|already|manual|\*126)/i.test(lower)) {
    awaitingMomoNumber = false;
    currentStage = 'review';
    setTimeout(() => promptForReview(lang), 900);
    return {
      text: lang === 'fr'
        ? 'Merci ! Dès réception nous confirmons et démarrons votre projet. '
        : 'Thank you! As soon as we receive it we\'ll confirm and start your project. '
    };
  }

  // Otherwise treat the message as a phone number
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9) {
    return {
      text: lang === 'fr'
        ? 'Il me faut un numéro MoMo valide (ex : 6XX XXX XXX). Ou tapez « WhatsApp » pour passer par l\'équipe.'
        : 'We need a valid MoMo number (e.g. 6XX XXX XXX). Or type "WhatsApp" to go through the team.'
    };
  }

  awaitingMomoNumber = false;
  initiatePayment(selectedPackage, trimmed, lang); // async — updates the chat as it progresses
  return {
    text: lang === 'fr'
      ? 'Nous lançons le paiement Mobile Money…'
      : 'Starting your Mobile Money payment…'
  };
}

// Calls our serverless endpoint to start a Campay collection, then polls for the result.
async function initiatePayment(pkg, phone, lang) {
  try {
    const res = await fetch('/api/pay/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg, phone, lead_id: currentLeadId, add_ons: selectedAddons })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.external_reference) {
      throw new Error(data.error || 'init failed');
    }

    addMessage('bot', lang === 'fr'
      ? `Une demande de paiement de ${xaf(data.amount_xaf)} (${usd(data.amount_usd)}) a été envoyée à votre téléphone. Ouvrez la notification Mobile Money et validez avec votre code secret.`
      : `A payment request for ${xaf(data.amount_xaf)} (${usd(data.amount_usd)}) has been sent to your phone. Open the Mobile Money prompt and approve it with your secret code.`);

    pollPaymentStatus(data.external_reference, lang, 0);
  } catch (e) {
    console.error('initiatePayment failed:', e);
    awaitingMomoNumber = false;
    currentStage = 'payment';
    addMessage('bot', lang === 'fr'
      ? 'Nous n\'avons pas pu lancer le paiement automatique. Pas de souci — tapez « WhatsApp » et l\'équipe finalise le paiement avec vous.'
      : 'We couldn\'t start the automatic payment. No worries — type "WhatsApp" and the team will complete the payment with you.');
  }
}

// Polls /api/pay/collect (GET) until the payment clears, fails, or times out.
async function pollPaymentStatus(ref, lang, attempt) {
  const MAX_ATTEMPTS = 24; // ~2 minutes at 5s intervals
  const INTERVAL_MS = 5000;

  try {
    const res = await fetch(`/api/pay/collect?ref=${encodeURIComponent(ref)}`);
    const data = await res.json().catch(() => ({}));
    const status = (data.status || 'PENDING').toUpperCase();

    if (status === 'SUCCESSFUL') {
      const pkgName = (PACKAGES[selectedPackage]?.name[lang]) || 'your package';
      addMessage('bot', lang === 'fr'
        ? `Paiement reçu ! Vos frais d'installation pour le ${pkgName} sont confirmés. Bienvenue chez Harts — on démarre votre projet. `
        : `Payment received! Your setup fee for ${pkgName} is confirmed. Welcome to Harts — we're starting your project. `);
      currentStage = 'review';
      setTimeout(() => {
        const handoff = doHandoff(lang, true);
        addMessage('bot', handoff.text);
        setTimeout(() => promptForReview(lang), 1200);
      }, 900);
      return;
    }

    if (status === 'FAILED') {
      awaitingMomoNumber = true;
      addMessage('bot', lang === 'fr'
        ? 'Le paiement n\'a pas abouti (annulé ou expiré). Renvoyez votre numéro MoMo pour réessayer, ou tapez « WhatsApp » pour l\'équipe.'
        : 'The payment didn\'t go through (cancelled or timed out). Send your MoMo number again to retry, or type "WhatsApp" for the team.');
      return;
    }

    // Still pending
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => pollPaymentStatus(ref, lang, attempt + 1), INTERVAL_MS);
    } else {
      awaitingMomoNumber = true;
      addMessage('bot', lang === 'fr'
        ? 'Nous n\'avons pas encore vu la confirmation. Si vous avez validé, elle arrivera bientôt. Sinon, renvoyez votre numéro pour réessayer ou tapez « WhatsApp ».'
        : 'We haven\'t seen the confirmation yet. If you approved it, it should arrive shortly. Otherwise, resend your number to retry or type "WhatsApp".');
    }
  } catch (e) {
    console.error('pollPaymentStatus failed:', e);
    awaitingMomoNumber = true;
    addMessage('bot', lang === 'fr'
      ? 'Problème de connexion en vérifiant le paiement. Tapez « WhatsApp » pour finaliser avec l\'équipe.'
      : 'Connection issue while checking the payment. Type "WhatsApp" to finish with the team.');
  }
}

// Shared review prompt (used after a confirmed payment or manual "paid").
function promptForReview(lang) {
  const summary = generateConversationSummary(lang);
  addMessage('bot', lang === 'fr'
    ? `Un retour rapide nous aiderait beaucoup (note sur 5 + un mot). ${summary}`
    : `A quick bit of feedback would help us a lot (rating out of 5 + a word). ${summary}`);
}

// Prevents the same lead being persisted twice within one flow
// (e.g. saved on completion, then again during the WhatsApp handoff).
let lastLeadSignature = null;

function saveLeadToStorage(lead) {
  const pkg = lead.package || selectedPackage || 'Not specified';
  const payment = lead.payment_pref || selectedPayment || 'Not specified';

  // De-dupe on name+phone+package so we don't double-save the same person
  const signature = `${lead.name || ''}|${lead.phone || ''}|${pkg}`;
  if (signature === lastLeadSignature) return;
  lastLeadSignature = signature;

  // 1) Local fallback — never lose a lead even if the network/API fails
  try {
    const leads = JSON.parse(localStorage.getItem('harts_leads') || '[]');
    leads.push({
      ...lead,
      pkg,
      payment,
      timestamp: new Date().toISOString(),
      source: 'chat'
    });
    localStorage.setItem('harts_leads', JSON.stringify(leads));
  } catch (e) { /* ignore */ }

  // 2) Persist to the database. The UI never blocks on this, but a failure must
  //    not be swallowed — an undelivered lead goes into the same retry queue the
  //    website form uses, which hub.js flushes on the next page load.
  const payload = {
    name: lead.name || null,
    business: lead.business || null,
    phone: lead.phone || null,
    city: lead.city || null,
    package: pkg,
    payment_pref: payment,
    summary: generateConversationSummary(currentLang),
    lang: currentLang,
    source: 'chat'
  };

  try {
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) { queuePendingLead(payload); return null; }
        return r.json();
      })
      .then(d => { if (d && d.id) currentLeadId = d.id; })
      .catch(() => { queuePendingLead(payload); });
  } catch (e) { queuePendingLead(payload); }
}

// Holds an undelivered lead for retry. Shares the `harts_pending_leads` key with
// hub.js, which owns the flush (it loads on every page, app.js only on the home
// page). Separate from `harts_leads`, which archives every lead the chat took.
function queuePendingLead(payload) {
  try {
    const list = JSON.parse(localStorage.getItem('harts_pending_leads') || '[]');
    list.push({ payload, queued_at: new Date().toISOString() });
    localStorage.setItem('harts_pending_leads', JSON.stringify(list.slice(-20)));
  } catch (e) { /* private mode / quota */ }
}

function saveReview(rating, comment) {
  try {
    const reviews = JSON.parse(localStorage.getItem('harts_reviews') || '[]');
    reviews.push({
      name: leadContext.name || 'Anonymous',
      pkg: selectedPackage || 'Unknown',
      rating: parseInt(rating) || 0,
      comment: comment || '',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('harts_reviews', JSON.stringify(reviews));
  } catch (e) { /* ignore */ }
}

let awaitingReviewField = null; // 'rating' | 'comment' | null

function handleReviewCollection(rawText, lang) {
  const trimmed = rawText.trim();

  if (awaitingReviewField === 'rating') {
    const rating = parseInt(trimmed);
    if (rating >= 1 && rating <= 5) {
      leadContext.reviewRating = rating;
      awaitingReviewField = 'comment';
      return {
        text: lang === 'fr' 
          ? 'Merci ! Un court commentaire sur votre expérience (facultatif, tapez "skip" si rien) ?' 
          : 'Thank you! A short comment about your experience (optional, type "skip" if none)?'
      };
    } else {
      return { text: lang === 'fr' ? 'Veuillez donner une note entre 1 et 5.' : 'Please give a rating between 1 and 5.' };
    }
  }

  if (awaitingReviewField === 'comment') {
    const comment = trimmed.toLowerCase() === 'skip' ? '' : trimmed;
    saveReview(leadContext.reviewRating, comment);
    awaitingReviewField = null;
    currentStage = 'complete';
    return {
      text: lang === 'fr'
        ? 'Merci beaucoup pour votre avis ! Nous apprécions vraiment. Si vous avez des questions supplémentaires ou une fois le paiement effectué, n\'hésitez pas à nous recontacter. À très bientôt !'
        : 'Thank you very much for your review! We truly appreciate it. If you have any more questions or once payment is complete, feel free to reach out again. Talk soon!'
    };
  }

  return { text: lang === 'fr' ? 'Pouvez-vous me donner cette information ?' : 'Could you please provide that information?' };
}

// --- Dynamic helpers for more human-like responses ---
function updateUserProfileFromText(text, lang) {
  const lower = text.toLowerCase();

  // Anything learned here is durable — it describes the visitor, not this page
  // view — so it goes straight into semantic memory as well as the live profile.
  const beforeProfile = JSON.stringify(userProfile);

  // Business type
  if (!userProfile.businessType) {
    if (lower.includes('restaurant') || lower.includes('restaurant')) userProfile.businessType = 'restaurant';
    else if (lower.includes('shop') || lower.includes('boutique') || lower.includes('magasin')) userProfile.businessType = 'shop';
    else if (lower.includes('service') || lower.includes('consult') || lower.includes('agence')) userProfile.businessType = 'service business';
    else if (lower.includes('salon') || lower.includes('beauty') || lower.includes('coiffeur')) userProfile.businessType = 'salon/beauty';
  }

  // Location
  if (!userProfile.location) {
    const cities = ['yaoundé', 'douala', 'buea', 'yaounde', 'bamenda', 'kribi', 'limbe'];
    for (let city of cities) {
      if (lower.includes(city)) {
        userProfile.location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
  }

  // Goals
  if (!userProfile.mainGoal) {
    if (lower.includes('client') || lower.includes('customers') || lower.includes('visibilité')) userProfile.mainGoal = 'more customers';
    else if (lower.includes('vendre') || lower.includes('sell') || lower.includes('e-commerce') || lower.includes('online sales')) userProfile.mainGoal = 'online sales';
    else if (lower.includes('logo') || lower.includes('flyer') || lower.includes('branding') || lower.includes('marque')) userProfile.mainGoal = 'professional branding';
    else if (lower.includes('app') || lower.includes('application') || lower.includes('mobile')) userProfile.mainGoal = 'mobile app';
  }

  if (JSON.stringify(userProfile) !== beforeProfile) {
    rememberProfile({
      businessType: userProfile.businessType,
      city: userProfile.location,
      mainGoal: userProfile.mainGoal
    });
  }
}

function contextualize(text, lang) {
  let result = text;

  if (userProfile.businessType) {
    const biz = userProfile.businessType;
    result = result.replace(/your business|entreprises comme la vôtre|your activity/gi, 
      lang === 'fr' ? `votre ${biz}` : `your ${biz}`);
  }
  if (userProfile.location) {
    result = result.replace(/in Douala|à Douala|in Yaoundé|à Yaoundé/gi, 
      lang === 'fr' ? `à ${userProfile.location}` : `in ${userProfile.location}`);
  }
  if (userProfile.mainGoal) {
    result = result.replace(/more customers|plus de clients|online sales|vendre en ligne/gi, userProfile.mainGoal);
  }

  return result;
}

// Simple response variation for dynamism (pick one randomly)
function varyResponse(variations, lang = currentLang) {
  if (!Array.isArray(variations)) return variations;
  return variations[Math.floor(Math.random() * variations.length)];
}

// --- Conversation Summary (Priority #4) ---
function generateConversationSummary(lang = currentLang) {
  let parts = [];

  if (userProfile.businessType || userProfile.location || userProfile.mainGoal) {
    let bizStr = '';
    if (userProfile.businessType) bizStr += userProfile.businessType;
    if (userProfile.location) bizStr += (bizStr ? ' à ' : '') + userProfile.location;
    if (userProfile.mainGoal) bizStr += (bizStr ? ' — ' : '') + userProfile.mainGoal;
    parts.push(lang === 'fr' ? `Votre activité : ${bizStr}.` : `Your business: ${bizStr}.`);
  }

  if (selectedPackage) {
    const pkg = PACKAGES[selectedPackage];
    const pkgName = pkg.name[lang] || pkg.name.en;
    let pkgStr = pkgName;
    if (selectedPayment) {
      pkgStr += ` (${selectedPayment === 'installments' ? 'versements' : 'complet'})`;
    }
    parts.push(lang === 'fr' ? `Intérêt principal : ${pkgStr}.` : `Main interest: ${pkgStr}.`);
  }

  if (leadContext.name || leadContext.business) {
    let contact = leadContext.name || '';
    if (leadContext.business) contact += (contact ? ' — ' : '') + leadContext.business;
    parts.push(lang === 'fr' ? `Contact : ${contact}.` : `Contact: ${contact}.`);
  }

  if (parts.length === 0) {
    return lang === 'fr' ? "Nous n'avons pas encore beaucoup discuté, mais nous sommes prêts à vous aider !" : "We haven't discussed much yet, but we're ready to help!";
  }

  return parts.join(' ');
}
// --- End dynamic helpers ---

// --- Live dynamic calculations (Priority #1) ---
function calculatePaymentDetails(pkgKey, paymentType, lang = currentLang) {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) return '';

  // Extract USD numbers from the price strings (e.g. "$1,400" -> 1400).
  const setupMatch = (pkg.setup[lang] || pkg.setup.en || '').match(/\d[\d\s,]*/);
  const yearlyMatch = (pkg.price[lang] || pkg.price.en || '').match(/\d[\d\s,]*/);

  const setup = setupMatch ? parseInt(setupMatch[0].replace(/[\s,]/g, '')) : 0;
  const yearly = yearlyMatch ? parseInt(yearlyMatch[0].replace(/[\s,]/g, '')) : 0;
  const firstYearTotal = setup + yearly;
  const d = (n) => '$' + n.toLocaleString('en-US'); // USD formatter

  if (paymentType === 'installments') {
    const parts = 3;
    const perPart = Math.round(yearly / parts);
    return lang === 'fr'
      ? `Installation ${d(setup)}, puis le forfait annuel (${d(yearly)}) en ${parts} versements sans intérêts par MoMo : ~${d(perPart)} × ${parts}.`
      : `${d(setup)} setup, then the yearly fee (${d(yearly)}) in ${parts} interest-free MoMo installments: ~${d(perPart)} × ${parts}.`;
  }
  else {
    return lang === 'fr'
      ? `Paiement complet : ${d(setup)} d'installation + ${d(yearly)} pour l'année (total ${d(firstYearTotal)} la première année, puis ${d(yearly)}/an).`
      : `Full payment: ${d(setup)} setup + ${d(yearly)} for the year (total ${d(firstYearTotal)} first year, then ${d(yearly)}/year).`;
  }
}
// --- End dynamic helpers ---

function doHandoff(lang, withDetails = false) {
  const pkgKey = leadContext.package || selectedPackage || 'growth';
  const pkg = PACKAGES[pkgKey];
  const pkgName = pkg ? (pkg.name[lang] || pkg.name.en) : 'a package';
  let msg = lang === 'fr'
    ? `Bonjour Harts ! Je viens de discuter avec votre assistant et je souhaite démarrer avec le forfait ${pkgName}.`
    : `Hello Harts! I was just chatting with your assistant and I'd like to get started with the ${pkgName} package.`;

  if (withDetails) {
    msg += lang === 'fr'
      ? `\n\nNom: ${leadContext.name}\nEntreprise: ${leadContext.business}\nWhatsApp: ${leadContext.phone}\nVille: ${leadContext.city}`
      : `\n\nName: ${leadContext.name}\nBusiness: ${leadContext.business}\nWhatsApp: ${leadContext.phone}\nCity: ${leadContext.city}`;
    const setupFee = SETUP_FEES_USD[pkgKey];
    if (setupFee) {
      msg += lang === 'fr'
        ? `\n\nJe souhaite régler les frais d'installation (${usd(setupFee)}) — merci de me confirmer comment procéder.`
        : `\n\nI'd like to pay the setup fee (${usd(setupFee)}) — please let me know how to complete it.`;
    }
  }

  // Use the nice dynamic summary for the WhatsApp message
  const summary = generateConversationSummary(lang);
  msg += lang === 'fr' ? `\n\nRésumé de notre conversation : ${summary}` : `\n\nSummary of our conversation: ${summary}`;

  // Capture the lead before opening WhatsApp — covers the "skip" path where
  // the full flow wasn't completed. De-duped inside saveLeadToStorage.
  if (leadContext.name || leadContext.phone || leadContext.business) {
    saveLeadToStorage(leadContext);
  }

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // Order handed to a human. Payment is verified + confirmed by the team on
  // WhatsApp (Campay is in sandbox) — the bot never auto-confirms payment.
  if (currentStage === 'payment') {
    currentStage = 'handoff';
    setTimeout(() => {
      addMessage('bot', lang === 'fr'
        ? 'Message envoyé. Notre équipe va confirmer le montant et finaliser le paiement avec vous sur WhatsApp, puis démarrer votre projet.'
        : 'Message sent. Our team will confirm the amount and complete the payment with you on WhatsApp, then start your project.');
    }, 1400);
  }

  leadContext = {};
  awaitingLeadField = null;
  awaitingAddons = false;
  awaitingMomoNumber = false;
  selectedAddons = [];

  // `action` is what stops sendMessage's LLM gate from discarding this. Without
  // it, the confirmation at the end of a completed lead flow was replaced by a
  // generic LLM reply — the visitor got a WhatsApp popup, no explanation of it,
  // and then a "Message sent" follow-up 1.4s later referring to a message they
  // were never told about. Note that currentStage is 'handoff' by this point, so
  // the gate's currentStage !== 'payment' check does not cover it.
  return {
    action: 'handoff',
    text: withDetails
      ? (lang === 'fr'
          ? 'C\'est parti — WhatsApp s\'est ouvert avec le récapitulatif de votre commande. L\'équipe confirme le montant et finalise le paiement avec vous, généralement sous 2 heures ouvrées.'
          : 'That\'s away — WhatsApp is open with your order summary. The team confirms the amount and completes the payment with you, usually within 2 business hours.')
      : (lang === 'fr'
          ? 'WhatsApp s\'est ouvert avec le contexte de notre échange. L\'équipe vous répond généralement sous 2 heures ouvrées.'
          : 'WhatsApp is open with the context of our chat. The team usually replies within 2 business hours.')
  };
}

// ── Language handling ─────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('active', active);
  });

  // Update dynamic labels
  const titleEl = document.getElementById('chat-title');
  const subEl = document.getElementById('chat-subtitle');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const humanBtn = document.getElementById('chat-human-btn');

  if (titleEl) titleEl.textContent = I18N[lang]['chat.title'];
  if (subEl) subEl.textContent = I18N[lang]['chat.subtitle'];
  if (inputEl) inputEl.placeholder = I18N[lang]['chat.placeholder'];
  if (sendBtn) sendBtn.textContent = I18N[lang]['chat.send'];
  if (humanBtn) humanBtn.textContent = I18N[lang]['chat.human'];

  // Re-render last bot message in new language if possible (simple approach: add a note)
  const chatEl = document.getElementById('chat-messages');
  if (chatEl && messages.length > 0) {
    const note = document.createElement('div');
    note.className = 'chat-note';
    note.textContent = lang === 'fr' ? 'Langue changée. Les prochaines réponses seront en français.' : 'Language changed. Future replies will be in English.';
    chatEl.appendChild(note);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

function initLangToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      if (newLang !== currentLang) {
        setLang(newLang);
      }
    });
  });

  // Apply initial active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === currentLang;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('active', active);
  });
}

// ── Chat UI Core ──────────────────────────────────────────────
function addMessage(role, text, isHTML = false) {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (isHTML) {
    bubble.innerHTML = text;
  } else {
    // Preserve line breaks for clean multi-line user inputs (e.g. business details, review comments)
    bubble.innerHTML = text.replace(/\n/g, '<br>');
  }

  // Add subtle timestamp (useful for the payment instructions + review stages)
  const time = document.createElement('div');
  time.className = 'chat-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'chat-content-wrapper';
  contentWrapper.appendChild(bubble);
  contentWrapper.appendChild(time);

  // Avatar for visual balance (bot left, user right)
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  if (role === 'bot') {
    avatar.textContent = '✦'; // Harts AI sparkle (Gemini-inspired but on-brand)
  } else {
    avatar.textContent = 'U'; // Clean user indicator
  }

  if (role === 'bot') {
    div.appendChild(avatar);
    div.appendChild(contentWrapper);
  } else {
    div.appendChild(contentWrapper);
    div.appendChild(avatar);
  }

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  // The opening greeting lands here before the visitor types, so the "was the
  // list empty?" check in the submit handlers never fires. The first thing the
  // visitor sends is what flips the panel from the welcome screen to the log.
  if (role === 'user') {
    const main = document.getElementById('chat-main');
    if (main) main.classList.add('chatting');
  }

  messages.push({ role, text });
  // Replaying stored turns must not re-store them, or every reload would
  // duplicate the transcript and push real history out of the window.
  if (!memRestoring) rememberTurn(role, text);
}

function showTyping() {
  const chat = document.getElementById('chat-messages');
  if (!chat) return;
  // Idempotent. The indicator is addressed by a single element id, so a second
  // one would leave an orphan that hideTyping() can never find — a set of dots
  // spinning forever under a finished conversation.
  if (document.getElementById('typing-indicator')) return;
  const typing = document.createElement('div');
  typing.id = 'typing-indicator';
  typing.className = 'chat-msg bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '✦';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  typing.appendChild(avatar);
  typing.appendChild(bubble);
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

// Locks the composer while a reply is in flight. Two messages sent before the
// first lands used to interleave: two typing indicators sharing one element id,
// two concurrent LLM calls, and — mid lead-flow — the second answer consumed as
// the reply to a question the visitor had not been asked yet.
let isReplying = false;

function setComposing(on) {
  isReplying = on;
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  if (input) input.disabled = on;
  if (send) send.disabled = on;
  if (!on && input) { try { input.focus(); } catch (e) { /* not focusable yet */ } }
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  if (isReplying) return;
  const val = input.value.trim();
  if (!val) return;

  addMessage('user', val);
  input.value = '';

  setComposing(true);
  showTyping();
  const startedAt = Date.now();

  (async () => {
    let reply = getBotResponse(val, currentLang);

    // The AI layer speaks only when the hand-written rules had nothing to say.
    //
    // `reply.fallback` is set by exactly two returns at the bottom of
    // getBotResponse — the "we didn't follow that" exits. Every other branch is
    // a genuine match and is shown verbatim, so a rule answer can never be
    // overwritten by a model arriving after it. The remaining conditions guard
    // the stateful flows (lead capture, add-ons, payment, review), where a free
    // -text reply landing mid-form would derail the sequence.
    //
    // To go back to the older blended behaviour — where the model also rephrased
    // plain-text rule answers for variety — widen this to the previous test:
    //   !reply.packageHTML && !reply.multiPackage && !reply.action &&
    //   !reply.isHTML && !reply.faq && …
    const useLLM = reply.fallback === true &&
                   !awaitingLeadField && !awaitingAddons && !awaitingMomoNumber &&
                   currentStage !== 'review' && currentStage !== 'payment' && currentStage !== 'handoff';

    if (useLLM) {
      try {
        // Build conversation history for context (last 8 messages)
        const history = messages.slice(-8).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

        // Keep the typing indicator visible during the network call
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            lang: currentLang,
            // A few lines of durable fact rather than a replayed transcript, so
            // per-message cost stays flat however long the relationship runs.
            memory: memoryContext(currentLang)
          })
        });

        const data = await res.json().catch(function () { return {}; });

        if (res.ok) {
          reply = applyAIReply(reply, data, currentLang);
        } else if (data.reason === 'provider-failed') {
          // A model was configured and genuinely failed or timed out. The
          // visitor gets a person rather than the generic "we didn't follow
          // that" — which, on a question the rules already missed, would be the
          // second unhelpful answer in a row.
          reply = aiHandoffReply(currentLang);
        }
        // res.status 503 ('not-configured') deliberately does nothing: the AI
        // layer is simply switched off, so the rule-based fallback text above
        // stands exactly as it did before this layer existed.
      } catch (e) {
        // Network error, offline, request blocked. Same reasoning as above.
        console.warn('AI layer unreachable, handing to a human:', e && e.message);
        reply = aiHandoffReply(currentLang);
      }
    }

    // Reply is ready (rule-based or LLM). Hold the typing indicator until the
    // message has plausibly been typed — time the LLM already spent on the wire
    // counts toward that rather than being added on top of it, so a slow model
    // doesn't read as a stalled conversation and a fast one doesn't fire back a
    // paragraph in 200ms.
    const remaining = Math.max(0, typingDelayFor(reply) - (Date.now() - startedAt));
    await new Promise(resolve => setTimeout(resolve, remaining));

    hideTyping();

    // The packages arrive one after another instead of in a single tick — four
    // price cards landing simultaneously reads as a brochure being dumped on the
    // table, not someone talking you through the options.
    if (reply.multiPackage) {
      if (reply.text) addMessage('bot', reply.text);
      ['starter', 'essential', 'growth', 'pro'].forEach(function (key, i) {
        setTimeout(function () {
          addMessage('bot', formatPackage(key, currentLang), true);
        }, 430 * (i + 1));
      });
    } else if (reply.packageHTML) {
      if (reply.text) addMessage('bot', reply.text);
      addMessage('bot', reply.packageHTML, true);
    } else {
      addMessage('bot', reply.text, reply.isHTML || false);
    }

    if (reply.action === 'handoff' || reply.action === 'handoff-offer') {
      // The doHandoff already opened the window in some paths.
    }
  })().catch(function (err) {
    // Nothing above is expected to throw, but if it does the composer must not
    // stay locked — a visitor unable to type is a worse failure than a bad reply.
    console.warn('Reply failed:', err);
    addMessage('bot', currentLang === 'fr'
      ? 'Désolé — quelque chose a coincé de notre côté. Reformulez, ou écrivez-nous directement sur WhatsApp au +237 622 341 343.'
      : 'Sorry — something went wrong on our end. Try that again, or message us directly on WhatsApp at +237 622 341 343.');
  }).then(function () {
    hideTyping();
    setComposing(false);
  });
}

// The existing human handover, reached from the AI layer. Deliberately the
// same wording and the same `action: 'handoff'` marker as the "talk to a
// person" rule branch in getBotResponse — this is a route into the handover we
// already had, not a second one. Note it does NOT call doHandoff(): that opens
// a WhatsApp window, which is right when someone asked for a human and wrong as
// the answer to a question the model merely found hard.
function aiHandoffReply(lang) {
  const k = KNOWLEDGE[lang] || KNOWLEDGE.en;
  return { text: k.contact, action: 'handoff' };
}

// Turns the /api/chat payload into a reply object.
//
// The server strips the model's control markers and reports them as
// `escalate`. Two cases matter:
//
//   'human'    The model hit something it must not answer — live data it cannot
//              see, an account or payment question, a complaint, or simply not
//              knowing. Its own sentence is shown, then the handover contact
//              line, so the visitor gets an acknowledgement and a real route
//              rather than a dead end.
//
//   'catalog'  It was asked what a package costs. Rather than let a model type
//              out prices from memory, we render the real cards from the
//              catalog app.js already hydrated from /api/services — the same
//              formatPackage() path the rule router uses. This is the "route to
//              the existing lookup" case: the model defers, the lookup answers.
//
// Anything else is shown as written.
function applyAIReply(ruleReply, data, lang) {
  const text = typeof data.reply === 'string' ? data.reply.trim() : '';

  if (data.escalate === 'catalog') {
    return {
      text: text || (lang === 'fr'
        ? 'Voici ce que couvre chaque formule :'
        : 'Here is what each package covers:'),
      multiPackage: true
    };
  }

  if (data.escalate === 'human') {
    const k = KNOWLEDGE[lang] || KNOWLEDGE.en;
    return {
      text: text ? text + '\n\n' + k.contact : k.contact,
      action: 'handoff'
    };
  }

  // No escalation: the model answered. An empty body would mean it sent nothing
  // usable, in which case the rule-based fallback we already have is better than
  // a blank bubble.
  return text ? { text: text } : ruleReply;
}

// How long the assistant should appear to be typing. A person's reply time
// scales with what they're writing — a one-line answer comes back almost at
// once, a package breakdown takes a beat. Capped so nobody sits watching dots,
// and jittered so the rhythm never feels metronomic. Previously every reply,
// long or short, waited the same fixed 650-1100ms, which is one of the clearest
// tells that you're talking to a script.
function typingDelayFor(reply) {
  const chars = ((reply && reply.text) || '').length +
    (reply && reply.packageHTML ? 220 : 0) +
    (reply && reply.multiPackage ? 320 : 0);
  return Math.min(2400, 420 + chars * 7) + Math.random() * 260;
}

// useQuickReply removed (no suggestions in simplified interface)

// Quick suggestions removed for a simpler interface.
// Users type their questions directly.

function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-main');

  if (!form || !input) return;

  // Fire-and-forget: upgrades PACKAGES/ENTERPRISE from the knowledge base once it
  // resolves. Never awaited — the chat below is already usable on FALLBACK_* data.
  hydrateCatalogFromKB();

  // Memory is read before anything is painted, so the opening line already knows
  // whether it is talking to a stranger or to someone it has met.
  mem = loadMemory();
  memIsReturning = mem.visits > 0 && Boolean(mem.episodes.length || mem.profile.name || mem.profile.business);
  // Greet a returning visitor in the language they used last time, before they
  // have typed anything for detection to work on.
  if (mem.profile.lang === 'fr' || mem.profile.lang === 'en') currentLang = mem.profile.lang;
  const quietMs = mem.visits ? (Date.now() - mem.lastSeen) : Infinity;
  mem.visits += 1;
  saveMemory();

  openingMove(chatContainer, quietMs);


  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const wasEmpty = messages.length === 0;
    sendMessage();
    if (wasEmpty && chatContainer) {
      chatContainer.classList.add('chatting');
    }
  });

  // Enter sends, Shift+Enter = newline
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const wasEmpty = messages.length === 0;
      sendMessage();
      if (wasEmpty && chatContainer) {
        chatContainer.classList.add('chatting');
      }
    }
  });

  // No top bar / human button in this ultra-minimal version.
  // The bot will offer WhatsApp handoff naturally during the conversation when appropriate.
}

// What the assistant says first. Three cases, because greeting a returning
// customer with "Hi, what brings you in today?" is precisely the thing that makes
// a bot feel like a form: they already told us, and being asked again reads as
// not having listened.
// Offer to finish an order that was started and abandoned. Sets awaitingResume so
// the next message is read as an answer to THIS question rather than routed
// normally — otherwise "yes" would be interpreted as agreeing to whatever package
// happened to be selected.
function resumeOffer(lang) {
  awaitingResume = true;
  const pkgKey = mem.pending && mem.pending.pkg;
  const pkg = pkgKey && PACKAGES[pkgKey];
  const name = pkg ? (pkg.name[lang] || pkg.name.en) : null;
  return lang === 'fr'
    ? (name
        ? `On était en train de mettre en place le ${name} et ça n'a pas été jusqu'au bout.`
        : 'On avait commencé une demande sans la terminer.') +
      '\n\nOn la termine — il ne manque presque rien — ou vous venez pour autre chose aujourd\'hui ?'
    : (name
        ? `We were partway through setting up ${name} and never finished.`
        : 'We\'d started a request together and never finished it.') +
      '\n\nWant to finish it off — there\'s barely anything left — or is today something else?';
}

function openingMove(chatContainer, quietMs) {
  const lang = currentLang;
  const p = mem.profile;
  const firstName = p.name ? String(p.name).split(/\s+/)[0] : null;
  const resumable = pendingIsFresh();

  // 1. Same conversation, interrupted — a reload, a closed tab, coming back after
  //    lunch. Replay it instead of making them remember where they got to.
  if (memIsReturning && quietMs < MEM_RESUME_MS && mem.episodes.length) {
    memRestoring = true;
    mem.episodes.slice(-8).forEach(function (e) { addMessage(e.role, e.text); });
    memRestoring = false;
    if (chatContainer) chatContainer.classList.add('chatting');
    setTimeout(function () {
      // A reload mid-flow loses awaitingLeadField, which lives only in the page.
      // Without this the replayed transcript would end on "what's your WhatsApp
      // number?" and the bot would no longer be listening for the answer.
      addMessage('bot', resumable
        ? resumeOffer(lang)
        : (lang === 'fr'
            ? 'On reprend où on s\'était arrêtés. Vous vouliez continuer là-dessus, ou autre chose ?'
            : 'Picking up where we left off. Carry on with that, or something else today?'));
    }, 550);
    return;
  }

  // 2. A real return visit. Name the thing they cared about last time — that is
  //    the whole payoff of remembering — but ask, never assume it still applies.
  if (memIsReturning) {
    const topic = p.packageInterest
      || (p.mainGoal ? (lang === 'fr' ? 'votre objectif : ' + p.mainGoal : p.mainGoal) : null)
      || p.businessType
      || null;
    const hello = firstName
      ? (lang === 'fr' ? 'Re-bonjour ' + firstName + '.' : 'Welcome back, ' + firstName + '.')
      : (lang === 'fr' ? 'Re-bonjour.' : 'Welcome back.');
    const line = resumable ? resumeOffer(lang) : topic
      ? (lang === 'fr'
          ? hello + ' La dernière fois, il était question de ' + topic + '.\n\nOn continue là-dessus, ou vous venez pour autre chose aujourd\'hui ?'
          : hello + ' Last time we were talking about ' + topic + '.\n\nPick that back up, or is today about something else?')
      : (lang === 'fr'
          ? hello + '\n\nQu\'est-ce qu\'on peut faire pour vous aujourd\'hui ?'
          : hello + '\n\nWhat can we do for you today?');
    setTimeout(function () { addMessage('bot', line); }, 600);
    return;
  }

  // 3. Genuinely new.
  setTimeout(function () {
    addMessage('bot', lang === 'fr'
      ? 'Bonjour — ici H@rts.\n\nLa plupart des visiteurs arrivent avec un problème précis : des messages clients sans réponse, un système qui tient avec des tableurs, ou une activité difficile à trouver en ligne.\n\nQu\'est-ce qui vous amène aujourd\'hui ?'
      : 'Hi — H@rts here.\n\nMost people land here with something specific in mind: customer messages going unanswered, a system held together by spreadsheets, or a business that\'s just hard to find online.\n\nWhat brings you in today?');
  }, 600);
}

function initChatLang() {
  // No dynamic title/subtitle in the minimal interface.
  // Just ensure input placeholder is set if needed.
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const humanBtn = document.getElementById('chat-human-btn');

  const lang = currentLang;
  if (inputEl) inputEl.placeholder = I18N[lang]['chat.placeholder'] || 'Type your message...';
  if (sendBtn) sendBtn.textContent = I18N[lang]['chat.send'] || 'Send';
  if (humanBtn) humanBtn.textContent = I18N[lang]['chat.human'] || 'WhatsApp';
}

// Glance cards removed for simpler interface.
// Users interact directly via the chat input. The bot handles all pricing and package questions.

// ── Chip quick-replies ────────────────────────────────────────
function useChip(text) {
  const input = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-main');
  if (!input) return;
  input.value = text;
  const wasEmpty = messages.length === 0;
  sendMessage();
  if (wasEmpty && chatContainer) chatContainer.classList.add('chatting');
}

// Chips carry their full sentence in data-chip while the label stays short, so the
// bot receives a real, specific message instead of a two-word product name.
function initChips() {
  document.querySelectorAll('.chat-chip[data-chip]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      useChip(btn.getAttribute('data-chip'));
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initChat();
  initChips();

  // Optional: expose for debugging
  window.HartsChat = { getBotResponse, messages };
});
