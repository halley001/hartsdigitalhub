// ============================================================
//  HARTS DIGITAL HUB — app.js
//  Chat-first landing page (converted from marketing site)
//  Knowledgeable assistant that can answer client questions +
//  seamless handoff to WhatsApp with full context.
// ============================================================

const WA_NUMBER = '237622341343';

// ── i18n (kept + extended for chat UI) ───────────────────────
const I18N = {
  en: {
    'pricing.title': 'Digital Packages',
    'starter.title': 'Starter',
    'starter.setup': 'XAF 50,000 setup',
    'starter.price': 'XAF 158,000',
    'growth.title': 'Growth',
    'growth.setup': 'XAF 120,000 setup',
    'growth.price': 'XAF 370,000',
    'pro.title': 'Pro',
    'pro.setup': 'XAF 250,000 setup',
    'pro.price': 'XAF 845,000',
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
    'chat.welcome': 'Hi! How can I help you today?\n\nI can help with custom websites, mobile apps, logos, flyers, branding, social media, and other digital services. Flexible payment options available.'
  },
  fr: {
    'pricing.title': 'Forfaits Numériques',
    'starter.title': 'Démarrage',
    'starter.setup': 'XAF 50 000 installation',
    'starter.price': 'XAF 158 000',
    'growth.title': 'Croissance',
    'growth.setup': 'XAF 120 000 installation',
    'growth.price': 'XAF 370 000',
    'pro.title': 'Pro',
    'pro.setup': 'XAF 250 000 installation',
    'pro.price': 'XAF 845 000',
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
    'chat.welcome': 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?\n\nJe peux vous aider pour des sites web personnalisés, des applications mobiles, des logos, des flyers, du branding, des réseaux sociaux et d\'autres services numériques. Options de paiement flexibles disponibles.'
  }
};

let currentLang = localStorage.getItem('lang') || 'en';
let messages = [];           // { role: 'user' | 'bot', text: string }
let leadContext = {};        // accumulates details during lead collection
let awaitingLeadField = null; // 'name' | 'business' | 'phone' | 'city' | 'package' | 'payment_pref' | null
let lastTopic = null;
let currentStage = 'discovery'; // discovery | selection | details | payment | review
let selectedPackage = null;
let selectedPayment = null; // 'full' | 'installments'
let awaitingMomoNumber = false; // true while we wait for the customer's MoMo number to charge the setup fee
let currentLeadId = null;       // Supabase id of the saved lead, so a payment can link back to it

// Server-authoritative setup fees (mirrors api/pay/_lib.js) — used only for display in chat
const SETUP_FEES_XAF = { starter: 50000, growth: 120000, pro: 250000, build_only: 180000 };

// Simple dynamic user profile for more human-like, contextual responses
let userProfile = {
  businessType: null,   // e.g. "restaurant", "shop", "service business"
  location: null,
  mainGoal: null,       // e.g. "more customers", "online sales", "professional branding", "mobile app"
  mentionedBudget: null
};

// ── Core Knowledge Base (answers to "all" common client questions) ──
const PACKAGES = {
  starter: {
    name: { en: 'Starter', fr: 'Démarrage' },
    setup: { en: 'XAF 50,000 setup', fr: 'XAF 50 000 installation' },
    price: { en: 'XAF 158,000 / year', fr: 'XAF 158 000 / an' },
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
  growth: {
    name: { en: 'Growth', fr: 'Croissance' },
    setup: { en: 'XAF 120,000 setup', fr: 'XAF 120 000 installation' },
    price: { en: 'XAF 370,000 / year', fr: 'XAF 370 000 / an' },
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
    setup: { en: 'XAF 250,000 setup', fr: 'XAF 250 000 installation' },
    price: { en: 'XAF 845,000 / year', fr: 'XAF 845 000 / an' },
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
    setup: { en: 'XAF 180,000 one-time (Starter-level site + launch)', fr: 'XAF 180 000 paiement unique (site niveau Starter + lancement)' },
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
    freeAudit: 'I can help you figure out the right services for your business right now. Just tell me a bit about what you do and what you need (more customers, online sales, new branding, etc.) and I\'ll recommend the best options.',
    who: 'Harts Digital Hub is a Cameroon-based digital agency that builds websites, mobile apps, and other digital products (logos, flyers, branding, social media assets) for SMEs. We focus on high-quality, affordable work with flexible payment plans.',
    contact: 'The fastest way to reach our team is WhatsApp: +237 622 341 343. I can prepare a detailed message with everything we\'ve discussed so they have full context.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Our packages and custom projects are full-service. We don\'t just deliver files and disappear — we handle design, development, revisions, launch, and support. Many clients see real results quickly (more visibility, new customers, professional brand presence).',
    installments: 'Yes! You can split the yearly fee (and the setup) into 2-3 interest-free MoMo installments. Spread the cost over 2 or 3 payments with no extra fees. Great for cash flow.',
    prepay: 'All managed packages are billed yearly (one payment covers the whole year). You can pay the yearly fee in full, or split it into 2-3 interest-free MoMo installments.',
    build_only: 'We offer one-time projects (website, app, logo + flyer package, full branding) with no recurring commitment. You own everything and can add ongoing management later if needed.',
    roi_example: 'Real results: "Our restaurant bookings tripled in 2 months after Harts built our website and social assets. Customers now find us easily on Google and Instagram." (Mama Ngozi, Yaoundé). Many clients recover their investment quickly through new business.',
    price_objection: 'I understand budget is important. Our packages are billed yearly and include flexible payment (you can split the yearly fee into 2-3 interest-free installments). We deliver real websites, apps, and professional design work. Would you like to see the installment options or discuss a custom quote for your project?'
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
    freeAudit: 'Je peux vous aider à déterminer les bons services pour votre entreprise dès maintenant. Dites-moi simplement ce que vous faites et ce dont vous avez besoin (plus de clients, ventes en ligne, nouveau branding, etc.) et je vous recommanderai les meilleures options.',
    who: 'Harts Digital Hub est une agence digitale basée au Cameroun qui crée des sites web, des applications mobiles et d\'autres produits numériques (logos, flyers, branding, visuels pour réseaux sociaux) pour les PME. Nous nous concentrons sur un travail de qualité à prix abordable avec des plans de paiement flexibles.',
    contact: 'Le moyen le plus rapide de joindre notre équipe est WhatsApp : +237 622 341 343. Je peux préparer un message détaillé avec tout ce dont nous avons discuté pour qu\'ils aient le contexte complet.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Nos forfaits et projets sur mesure sont des services complets. Nous ne livrons pas simplement des fichiers et ne disparaissons pas — nous gérons la conception, le développement, les révisions, le lancement et le support. Beaucoup de clients voient de vrais résultats rapidement (plus de visibilité, de nouveaux clients, une présence de marque professionnelle).',
    installments: 'Oui ! Vous pouvez étaler le forfait annuel (et l\'installation) en 2 ou 3 versements sans intérêts par MTN MoMo, sans frais supplémentaires. Idéal pour la trésorerie.',
    prepay: 'Tous les forfaits gérés sont facturés à l\'année (un seul paiement couvre toute l\'année). Vous pouvez payer le forfait annuel en une fois, ou l\'étaler en 2 ou 3 versements sans intérêts par MoMo.',
    build_only: 'Nous proposons des projets ponctuels (site web, application, pack logo + flyers, branding complet) sans engagement récurrent. Vous êtes propriétaire de tout et pouvez ajouter une gestion continue plus tard si nécessaire.',
    roi_example: 'Résultats concrets : "Nos réservations de restaurant ont triplé en 2 mois après que Harts ait créé notre site web et nos visuels pour les réseaux sociaux. Les clients nous trouvent facilement sur Google et Instagram." (Mama Ngozi, Yaoundé). Beaucoup de clients récupèrent leur investissement rapidement grâce à de nouvelles affaires.',
    price_objection: 'Je comprends que le budget est important. Nos forfaits sont facturés à l\'année et incluent un paiement flexible (vous pouvez étaler le forfait annuel en 2 ou 3 versements sans intérêts). Nous livrons de vrais sites web, applications et designs professionnels. Voulez-vous voir les options de versements ou discuter d\'un devis personnalisé pour votre projet ?'
  }
};

// ── Intent / Question Router ──────────────────────────────────
function getBotResponse(rawText, lang = currentLang) {
  const text = rawText.toLowerCase().trim();
  const k = KNOWLEDGE[lang] || KNOWLEDGE.en;
  const p = PACKAGES;

  updateUserProfileFromText(rawText, lang);

  // ── Active flows ─────────────────────────────────────────────
  if (currentStage === 'review' || awaitingReviewField) {
    return handleReviewCollection(rawText, lang);
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
        ? `${timeGreet} ! Je suis l'assistant de Harts Digital Hub. Je peux vous aider à obtenir un site web, une application mobile, un logo, des flyers, ou à gérer vos réseaux sociaux et votre marketing au Cameroun. Par quoi puis-je vous aider ?`
        : `${timeGreet}! I'm the Harts Digital Hub assistant. I can help you get a website, mobile app, logo, flyers, or manage your social media and digital marketing in Cameroon. What can I help you with?`
    };
  }

  // ── Farewells ────────────────────────────────────────────────
  if (/^(bye+|goodbye|see you|au revoir|à bientôt|ciao|bonne journée|bonne soirée|tchao|take care|later)\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Au revoir ! N\'hésitez pas à revenir si vous avez des questions. Bonne journée !'
        : 'Goodbye! Feel free to come back anytime. Have a great day!'
    };
  }

  // ── Thank you ────────────────────────────────────────────────
  if (/\b(thank(s| you)?|merci|thx|ty|much appreciated|grand merci|super merci)\b/i.test(text) && !/^no\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions ou si vous souhaitez démarrer avec un de nos services.'
        : 'You\'re very welcome! Feel free to ask anything else, or let me know when you\'re ready to get started.'
    };
  }

  // ── Positive short replies (OK / Yes / Sure) — context-aware ─
  if (/^(yes+|yep|yup|sure+|ok+|okay|alright|agree|correct|oui|d'accord|bien sûr|absolument|affirmative|go ahead|let\'s go|allons-y)\b/i.test(text)) {
    if (selectedPackage && currentStage === 'selection') {
      awaitingLeadField = 'name';
      currentStage = 'details';
      const pkgName = p[selectedPackage].name[lang] || p[selectedPackage].name.en;
      return {
        text: lang === 'fr'
          ? `Super ! On part sur le ${pkgName}. Pour préparer votre dossier, quel est votre nom complet ?`
          : `Great! Let's go with ${pkgName}. To set things up, what's your full name?`
      };
    }
    if (currentStage === 'discovery') {
      return {
        text: lang === 'fr'
          ? 'Avec plaisir ! Dites-moi ce dont vous avez besoin — site web, application, logo, flyers, marketing digital... Et quel type d\'activité avez-vous ?'
          : 'Great! Tell me what you need — website, mobile app, logo, flyers, digital marketing... And what type of business do you have?'
      };
    }
    return { text: lang === 'fr' ? 'Je suis là ! Que souhaitez-vous faire ?' : 'I\'m here! What would you like to do?' };
  }

  // ── Negative / cancel ────────────────────────────────────────
  if (/^(no+|nope|nah|non|pas intéressé|cancel|annuler|never ?mind|pas maintenant|not now|stop|leave me|laisse[z]?[\s-]moi)\b/i.test(text)) {
    selectedPackage = null;
    awaitingLeadField = null;
    currentStage = 'discovery';
    leadContext = {};
    return {
      text: lang === 'fr'
        ? 'Pas de problème ! Je reste disponible si vous avez des questions ou souhaitez reprendre plus tard. Y a-t-il autre chose que je peux faire pour vous ?'
        : 'No problem at all! I\'m here if you have questions or want to come back later. Is there anything else I can help you with?'
    };
  }

  // ── Bot identity ─────────────────────────────────────────────
  if (/(are you (a |an |real )?bot|are you (an? )?ai|is this (a |an |real )?human|robot|automated|chatbot|assistant virtuel|qui (êtes|es)-?tu|parle[rz]*.*machine|who am i talking)/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Je suis un assistant virtuel de Harts Digital Hub — pas un humain, mais je connais bien nos services ! Pour parler directement à un membre de notre équipe, dites "équipe" ou "WhatsApp" et je vous connecte immédiatement.'
        : 'I\'m a virtual assistant for Harts Digital Hub — not a human, but I know our services well! To speak directly to a team member, just say "team" or "WhatsApp" and I\'ll connect you right away.'
    };
  }

  // ── Portfolio / examples ─────────────────────────────────────
  if (/\b(portfolio|example[s]?|past work|show me.*work|previous client|sample[s]?|réalisation[s]?|travaux?|exemple[s]?|référence[s]?|vos travaux)\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Nous avons aidé des restaurants, boutiques, salons et consultants à travers le Cameroun. Pour voir des exemples concrets (captures d\'écran, liens de projets), contactez notre équipe sur WhatsApp : +237 622 341 343. Ils répondent rapidement !'
        : 'We\'ve helped restaurants, shops, salons, and consultants across Cameroon. To see concrete examples (screenshots, project links), reach our team on WhatsApp: +237 622 341 343. They respond quickly!'
    };
  }

  // ── Office / visit ────────────────────────────────────────────
  if (/\b(office|visit|come in|physical|en personne|bureau|adresse|address|can i visit|venir vous voir|où êtes-vous)\b/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Nous travaillons entièrement à distance — WhatsApp, appels et documents partagés. Ça marche pour toutes les villes du Cameroun. Pas besoin de se déplacer, c\'est l\'un des avantages de travailler avec nous !'
        : 'We work fully remotely — WhatsApp, calls, and shared documents. That works for every city in Cameroon. No need to travel in — that\'s one of the advantages of working with us!'
    };
  }

  // ── "I want / I need / I'm interested" ───────────────────────
  if (/\b(i want|i need|i'?d like|i'?m interested|looking for|je veux|j'aimerais|je cherche|je voudrais|je suis intéressé|interested in)\b/i.test(text)) {
    const pkgMatch = text.match(/\b(starter|growth|pro|démarrage|croissance)\b/i);
    if (pkgMatch) {
      const suggested = normalizePackage(pkgMatch[0]);
      leadContext = { package: suggested };
      selectedPackage = suggested;
      awaitingLeadField = 'name';
      currentStage = 'details';
      const pkgName = p[suggested].name[lang] || p[suggested].name.en;
      return {
        text: lang === 'fr'
          ? `Excellent ! Le ${pkgName} est un très bon choix. Pour préparer votre dossier, quel est votre nom complet ?`
          : `Excellent choice! The ${pkgName} is a great fit. To get things set up, what's your full name?`
      };
    }
    if (/\b(web\s*sit[e]?|site\s*web?|online|en ligne)\b/i.test(text)) {
      lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection';
      return { text: lang === 'fr'
        ? `Pour un site web professionnel nous avons 3 options :\n\n• Starter (50 000 XAF installation + 158 000/an) — page de présentation\n• Growth (120 000 XAF installation + 370 000/an) — site 5 pages + réseaux sociaux ⭐ le plus populaire\n• Build & Launch (180 000 XAF unique) — site complet, aucun frais récurrent\n\nLequel vous correspond le mieux ?`
        : `For a professional website we have 3 options:\n\n• Starter (XAF 50,000 setup + 158,000/year) — single landing page\n• Growth (XAF 120,000 setup + 370,000/year) — 5-page site + social media ⭐ most popular\n• Build & Launch (XAF 180,000 one-time) — full site, no recurring fees\n\nWhich one fits your situation?`
      };
    }
    if (/\b(app(?:lication)?|mobile)\b/i.test(text)) {
      return { text: lang === 'fr'
        ? 'Nous développons des applications mobiles sur mesure (Android et iOS) pour les entreprises au Cameroun. Le prix dépend des fonctionnalités — une appli simple commence autour de 300 000 XAF, avec des versements disponibles.\n\nPouvez-vous décrire ce que vous souhaitez que l\'appli fasse ?'
        : 'We develop custom mobile apps (Android & iOS) for businesses in Cameroon. The cost depends on features — a basic app starts around XAF 300,000, with installment options.\n\nCan you describe what you\'d like the app to do?'
      };
    }
    if (/\b(logo|flyer|brand|design|carte de visite|business card)\b/i.test(text)) {
      return { text: lang === 'fr'
        ? 'Pour le design graphique, voici ce que nous proposons :\n\n• Logo professionnel : à partir de 25 000 XAF\n• Pack Logo + Flyer : à partir de 45 000 XAF\n• Branding complet (logo, couleurs, templates) : à partir de 80 000 XAF\n\nPour quel type d\'activité ?'
        : 'For graphic design, here\'s what we offer:\n\n• Professional logo: from XAF 25,000\n• Logo + Flyer pack: from XAF 45,000\n• Full branding (logo, colors, templates): from XAF 80,000\n\nWhat type of business is this for?'
      };
    }
    if (/\b(social media|réseaux sociaux|instagram|facebook|marketing)\b/i.test(text)) {
      return { text: lang === 'fr'
        ? 'Nous gérons vos réseaux sociaux (Facebook, Instagram, TikTok) — création de contenu, publications régulières et rapport mensuel. C\'est inclus dans le forfait Growth (370 000 XAF/an) ou disponible en option.\n\nCombien de plateformes avez-vous en tête ?'
        : 'We manage your social media (Facebook, Instagram, TikTok) — content creation, regular posts, and monthly reports. It\'s included in the Growth package (XAF 370,000/year) or available as an add-on.\n\nHow many platforms are you thinking about?'
      };
    }
    return {
      text: lang === 'fr'
        ? 'Je suis là pour vous aider ! Dites-moi exactement ce dont vous avez besoin (site web, appli mobile, logo, flyers, marketing digital...) et votre type d\'activité — je vous guiderai vers la meilleure option.'
        : 'I\'m here to help! Tell me exactly what you need (website, mobile app, logo, flyers, digital marketing...) and what type of business you have — I\'ll guide you to the best option.'
    };
  }

  // ── Get started / book / proceed ─────────────────────────────
  if (/\b(get started|book|reserve|commencer|démarrer|s'inscrire|passer commande|start now|commencer maintenant|let'?s do it|procéd|proceed|ready|je suis prêt)\b/i.test(text)) {
    if (selectedPackage) {
      awaitingLeadField = 'name';
      currentStage = 'details';
      const pkgName = p[selectedPackage].name[lang] || p[selectedPackage].name.en;
      return {
        text: lang === 'fr'
          ? `Parfait ! On part sur le ${pkgName}. Pour commencer, quel est votre nom complet ?`
          : `Perfect! Let's go with ${pkgName}. To get started, what's your full name?`
      };
    }
    return {
      text: lang === 'fr'
        ? 'Super ! Pour vous orienter vers la meilleure option, dites-moi : quel type de service vous intéresse (site web, application, logo, marketing) et quel est votre type d\'activité ?'
        : 'Let\'s do it! To point you to the best option, tell me: what service are you interested in (website, app, logo, marketing) and what type of business do you have?'
    };
  }

  // ── Package details ──────────────────────────────────────────
  if (/\b(starter|démarrage)\b/i.test(text)) {
    lastTopic = 'starter'; selectedPackage = 'starter'; currentStage = 'selection';
    return { packageHTML: formatPackage('starter', lang) };
  }
  if (/\b(growth|croissance)\b/i.test(text)) {
    lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection';
    return { packageHTML: formatPackage('growth', lang) };
  }
  if (/\b(pro)\b/i.test(text) && /(package|forfait|price|prix|details?|info|tell me|montrez|donnez)/i.test(text)) {
    lastTopic = 'pro'; selectedPackage = 'pro'; currentStage = 'selection';
    return { packageHTML: formatPackage('pro', lang) };
  }

  // ── All packages ─────────────────────────────────────────────
  if (/(packages?|forfaits?|show.*package|see.*package|all package|what.*package|your package|pricing|tarif[s]?|how much|combien.*coût|cost[s]?|prix)/i.test(text) && !/\b(starter|growth|pro)\b/i.test(text)) {
    lastTopic = 'growth';
    return { text: lang === 'fr' ? 'Voici nos 3 forfaits :' : 'Here are our 3 packages:', multiPackage: true };
  }

  // ── Pricing / cost ───────────────────────────────────────────
  if (/(price|prix|cost|combien|how much|tarif|setup fee|frais|installation fee)/i.test(text)) {
    lastTopic = 'pricing';
    const growthCalc = calculatePaymentDetails('growth', 'installments', lang);
    return {
      text: lang === 'fr'
        ? `Voici nos tarifs (en XAF). Exemple concret pour le Growth :\n\n${growthCalc}\n\n• Starter : ${p.starter.setup.fr} + ${p.starter.price.fr}\n• Growth : ${p.growth.setup.fr} + ${p.growth.price.fr}\n• Pro : ${p.pro.setup.fr} + ${p.pro.price.fr}\n• Build & Launch (unique) : ${p.build_only.setup.fr}\n\n💳 Facturation annuelle — payez en une fois ou en 2-3 versements sans intérêts par MoMo.\n\nQuel forfait ou service vous intéresse ?`
        : `Here are our prices (in XAF). Concrete example for Growth:\n\n${growthCalc}\n\n• Starter: ${p.starter.setup.en} + ${p.starter.price.en}\n• Growth: ${p.growth.setup.en} + ${p.growth.price.en}\n• Pro: ${p.pro.setup.en} + ${p.pro.price.en}\n• Build & Launch (one-time): ${p.build_only.setup.en}\n\n💳 Billed yearly — pay in full or in 2-3 interest-free MoMo installments.\n\nWhich package or service interests you?`
    };
  }

  // ── What's included ──────────────────────────────────────────
  if (/(what'?s? included|include[sd]?|inclus|what.*get|ce qui est|features?|fonctionnalit|contient)/i.test(text)) {
    if (lastTopic && p[lastTopic]) return { packageHTML: formatPackage(lastTopic, lang) };
    return { text: lang === 'fr'
      ? 'Je peux vous détailler chaque forfait. Dites-moi simplement "Starter", "Growth" ou "Pro".'
      : 'I can break down any package for you. Just say "Starter", "Growth", or "Pro".'
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
      ? `${k.prepay} Ça simplifie la gestion. Je peux détailler pour un forfait en particulier ?`
      : `${k.prepay} It simplifies management a lot. Want me to break it down for a specific package?`
    };
  }

  // ── One-time / no monthly ────────────────────────────────────
  if (/(build only|one.?time|paiement unique|juste le site|build.*launch|sans abonnement|no monthly|without subscription)/i.test(text)) {
    lastTopic = 'build_only'; selectedPackage = 'build_only'; currentStage = 'selection';
    return { packageHTML: formatPackage('build_only', lang) };
  }

  // ── Price objection ──────────────────────────────────────────
  if (/(too expensive|cher|trop cher|c'est beaucoup|can.*lower|reduce.*price|less expensive|moins cher|affordable|budget limit|budget serré)/i.test(text)) {
    return {
      text: lang === 'fr'
        ? 'Je comprends — le budget est important. Nos services commencent à des prix accessibles et on propose des versements sans intérêts pour répartir le coût. Le forfait Growth, par exemple, est souvent rentabilisé rapidement grâce aux nouveaux clients qu\'il attire. Voulez-vous qu\'on regarde ensemble les options concrètes pour votre situation ?'
        : 'I completely understand — budget matters. Our services start at accessible prices and we offer interest-free installments to spread the cost. The Growth package, for example, often pays for itself quickly through new customers. Want me to walk you through the concrete options for your situation?'
    };
  }

  // ── Website (typo-tolerant) ───────────────────────────────────
  if (/\b(web\s*sit[e]?s?|websit[e]?|site\s*web?|webs?it|online presence|présence en ligne|w[ae]bsite)\b/i.test(text)) {
    lastTopic = 'growth'; selectedPackage = 'growth'; currentStage = 'selection';
    return { text: lang === 'fr'
      ? 'Pour un site web professionnel, nous avons 3 options :\n\n• Starter (50 000 XAF installation + 158 000/an) — page de présentation\n• Growth (120 000 XAF installation + 370 000/an) — site 5 pages + réseaux sociaux ⭐\n• Build & Launch (180 000 XAF unique) — site complet, aucun frais récurrent\n\nQuel profil correspond à votre situation ?'
      : 'For a professional website, we have 3 options:\n\n• Starter (XAF 50,000 setup + 158,000/year) — landing page\n• Growth (XAF 120,000 setup + 370,000/year) — 5-page site + social media ⭐\n• Build & Launch (XAF 180,000 one-time) — full site, no recurring fees\n\nWhich one fits your situation?'
    };
  }

  // ── Mobile app ────────────────────────────────────────────────
  if (/\b(app(?:lication)?s?|mobile app|android|ios|play store|application mobile)\b/i.test(text)) {
    return { text: lang === 'fr'
      ? 'Nous développons des applications mobiles sur mesure (Android et iOS) pour les entreprises au Cameroun. Une appli simple commence autour de 300 000 XAF, avec des versements disponibles.\n\nPouvez-vous décrire ce que vous souhaitez que l\'appli fasse ?'
      : 'We develop custom mobile apps (Android & iOS) for businesses in Cameroon. A basic app starts around XAF 300,000, with installment options.\n\nCan you describe what you\'d like the app to do?'
    };
  }

  // ── Logo / flyer / branding ───────────────────────────────────
  if (/\b(logo[s]?|flyer[s]?|brand(?:ing)?|design graphique|carte[s]? de visite|business card[s]?|identité visuelle|visual identity)\b/i.test(text)) {
    return { text: lang === 'fr'
      ? 'Pour le design graphique :\n\n• Logo professionnel : à partir de 25 000 XAF\n• Pack Logo + Flyer : à partir de 45 000 XAF\n• Branding complet (logo, couleurs, templates) : à partir de 80 000 XAF\n\nPour quel type d\'activité ?'
      : 'For graphic design:\n\n• Professional logo: from XAF 25,000\n• Logo + Flyer pack: from XAF 45,000\n• Full branding (logo, colors, templates): from XAF 80,000\n\nWhat type of business is this for?'
    };
  }

  // ── Social media ──────────────────────────────────────────────
  if (/\b(social media|réseaux sociaux|instagram|facebook|tiktok|manage.*social|gestion.*réseaux)\b/i.test(text)) {
    return { text: lang === 'fr'
      ? 'Nous gérons vos réseaux sociaux (Facebook, Instagram, TikTok) — création de contenu, publications régulières et rapport mensuel. C\'est inclus dans le forfait Growth (370 000 XAF/an) ou disponible en option.\n\nCombien de plateformes souhaitez-vous gérer ?'
      : 'We manage your social media (Facebook, Instagram, TikTok) — content creation, regular posts, monthly reports. It\'s included in the Growth package (XAF 370,000/year) or available as an add-on.\n\nHow many platforms do you have in mind?'
    };
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
    if (currentStage === 'payment' && selectedPackage) return providePaymentInstructions(lang);
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
  if (/(paid|j'?ai payé|money sent|référence|confirm.*payment|paiement effectué|j'?ai envoyé|sent.*payment)/i.test(text) && currentStage === 'payment') {
    currentStage = 'review';
    awaitingReviewField = 'rating';
    return {
      text: lang === 'fr'
        ? 'Excellent ! Paiement bien noté, merci. Pour nous aider à améliorer notre service, pourriez-vous nous donner une note de 1 à 5 ?'
        : 'Excellent! Payment noted, thank you. To help us improve our service, could you give us a rating from 1 to 5?'
    };
  }

  // ── Summary request ───────────────────────────────────────────
  if (/(summarize|résumé|recap|so far|jusqu'ici|what.*discussed|summary|résume)/i.test(text)) {
    const summary = generateConversationSummary(lang);
    return {
      text: lang === 'fr'
        ? `Voici un résumé de notre échange : ${summary}\n\nVoulez-vous avancer ou que je prépare le message pour l'équipe WhatsApp ?`
        : `Here's a summary of our conversation: ${summary}\n\nWant to move forward, or shall I prepare the WhatsApp message for the team?`
    };
  }

  // ── Fallback — contextual and helpful ─────────────────────────
  const summary = generateConversationSummary(lang);
  if (currentStage === 'discovery' || !selectedPackage) {
    return {
      text: lang === 'fr'
        ? `Je ne suis pas sûr de comprendre complètement, mais je suis là pour vous aider ! Nous créons des sites web, applications, logos, flyers et gérons le marketing digital pour les entreprises au Cameroun.\n\nPour mieux vous orienter, pouvez-vous me dire ce que vous faites et ce que vous cherchez en priorité (site web, logo, appli, plus de clients...) ?`
        : `I'm not sure I fully understood that, but I'm here to help! We build websites, apps, logos, flyers, and handle digital marketing for businesses in Cameroon.\n\nTo point you in the right direction, can you tell me what you do and what you're looking for most (website, logo, app, more customers...)?`
    };
  }
  return {
    text: lang === 'fr'
      ? `Je suis là ! ${summary} Dites-moi ce dont vous avez besoin — je peux vous aider avec les détails, les versements, ou préparer le message pour l'équipe WhatsApp.`
      : `I'm here! ${summary} Tell me what you need — I can help with details, payment options, or get the WhatsApp message ready for the team.`
  };
}

function normalizePackage(str) {
  const s = str.toLowerCase();
  if (s.includes('starter') || s.includes('démarrage')) return 'starter';
  if (s.includes('growth') || s.includes('croissance')) return 'growth';
  if (s.includes('pro')) return 'pro';
  if (s.includes('build') || s.includes('one.time') || s.includes('unique')) return 'build_only';
  return 'growth';
}

function formatPackage(key, lang) {
  const pkg = PACKAGES[key];
  if (!pkg) return 'I can tell you about Starter, Growth, Pro, or our one-time Build & Launch option.';
  
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
  html += `<br>💳 ${paymentSummary}<br>`;

  if (pkg.installment) {
    html += `→ You can split the yearly fee into 2-3 interest-free MoMo installments.<br>`;
  }

  if (key === 'growth') html += `<br><strong>★ Most popular package</strong><br>`;
  if (key === 'build_only') html += `<br>Great lower-commitment option — one-time payment, no recurring fees.<br>`;

  html += `<br>Ready to move forward, or want to compare / see exact payment options?`;
  
  return html;  // Will be rendered as HTML in the bubble
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

  // Correction mid-flow ("actually", "wait", "no", "I meant")
  if (/^(actually|wait|no|correction|oops|i meant|je voulais dire|en fait|pardon)\b/i.test(lower)) {
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
        ? `Pas de problème ! Donnez-moi ${fieldLabel} et on continue.`
        : `No problem! Just give me ${fieldLabel} and we'll continue.`
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
      payment_pref: lang === 'fr' ? '\n\nEt pour le paiement du forfait annuel, vous préférez en une fois ou en 2-3 versements sans intérêts ?' : '\n\nAnd for the yearly fee — pay in full or in 2-3 interest-free installments?'
    }[field] || '';
    return { text: (response.text || '') + resumePrompt };
  }

  if (awaitingLeadField === 'name') {
    // Reject suspiciously short or all-number names
    if (trimmed.length < 2 || /^\d+$/.test(trimmed)) {
      return { text: lang === 'fr' ? 'Je n\'ai pas bien compris. Pouvez-vous donner votre nom complet ?' : 'I didn\'t catch that. Could you give your full name?' };
    }
    leadContext.name = trimmed;
    awaitingLeadField = 'business';
    const firstName = trimmed.split(/\s+/)[0];
    return {
      text: lang === 'fr'
        ? `Merci ${firstName} ! Et le nom de votre entreprise ou activité ?`
        : `Thanks ${firstName}! What's the name of your business or activity?`
    };
  }

  if (awaitingLeadField === 'business') {
    leadContext.business = trimmed;
    awaitingLeadField = 'phone';
    return {
      text: lang === 'fr'
        ? 'Parfait. Votre numéro WhatsApp (avec l\'indicatif, ex : +237 6XX XXX XXX) pour qu\'on puisse vous joindre facilement ?'
        : 'Got it. Your WhatsApp number (with country code, e.g. +237 6XX XXX XXX) so we can reach you easily?'
    };
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
    awaitingLeadField = 'city';
    return {
      text: lang === 'fr'
        ? 'Noté ! Dans quelle ville êtes-vous (Yaoundé, Douala, Buea...) ?'
        : 'Got it! Which city are you based in (Yaoundé, Douala, Buea...)?'
    };
  }

  if (awaitingLeadField === 'city') {
    leadContext.city = trimmed;
    awaitingLeadField = 'payment_pref';
    return {
      text: lang === 'fr'
        ? 'Super. Pour le paiement (installation + forfait annuel), qu\'est-ce qui vous arrange le mieux ?\n\n1️⃣ En une fois\n2️⃣ En 2-3 versements sans intérêts (MoMo)'
        : 'Great. For payment (setup + yearly fee), what works best for you?\n\n1️⃣ Pay in full\n2️⃣ 2-3 interest-free installments (MoMo)'
    };
  }

  if (awaitingLeadField === 'payment_pref') {
    leadContext.payment_pref = trimmed;
    selectedPayment = /install|versement|2|3/i.test(lower) ? 'installments'
                    : 'full';
    awaitingLeadField = null;
    currentStage = 'payment';
    saveLeadToStorage(leadContext);
    return providePaymentInstructions(lang);
  }

  return { text: lang === 'fr' ? 'Pouvez-vous me donner cette information ?' : 'Could you give me that information?' };
}

function providePaymentInstructions(lang) {
  const pkg = PACKAGES[selectedPackage] || PACKAGES.growth;
  const name = pkg.name[lang] || pkg.name.en;
  const setupFee = SETUP_FEES_XAF[selectedPackage] || SETUP_FEES_XAF.growth;

  // We charge the one-time SETUP fee now to start the project.
  awaitingMomoNumber = true;

  const msg = lang === 'fr'
    ? `Parfait. Pour démarrer votre ${name}, on encaisse d'abord les frais d'installation : ${setupFee.toLocaleString('fr-FR').replace(/,/g, ' ')} XAF (une seule fois).\n\n📲 Le plus simple : payez directement par Mobile Money ici. Envoyez-moi votre numéro MoMo (MTN ou Orange, ex : 6XX XXX XXX) et je lance le paiement — vous validez avec votre code secret sur votre téléphone.\n\nOu tapez « WhatsApp » pour finaliser avec l'équipe, ou « payé » si vous avez déjà payé autrement.`
    : `Perfect. To start your ${name}, we first collect the one-time setup fee: ${setupFee.toLocaleString('en-US')} XAF.\n\n📲 Easiest way: pay by Mobile Money right here. Send me your MoMo number (MTN or Orange, e.g. 6XX XXX XXX) and I'll start the payment — you approve it with your secret code on your phone.\n\nOr type "WhatsApp" to finish with the team, or "paid" if you've already paid another way.`;

  return { text: msg };
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
        ? 'Merci ! Dès réception nous confirmons et démarrons votre projet. 🙏'
        : 'Thank you! As soon as we receive it we\'ll confirm and start your project. 🙏'
    };
  }

  // Otherwise treat the message as a phone number
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9) {
    return {
      text: lang === 'fr'
        ? 'Il me faut un numéro MoMo valide (ex : 6XX XXX XXX). Ou tapez « WhatsApp » pour passer par l\'équipe.'
        : 'I need a valid MoMo number (e.g. 6XX XXX XXX). Or type "WhatsApp" to go through the team.'
    };
  }

  awaitingMomoNumber = false;
  initiatePayment(selectedPackage, trimmed, lang); // async — updates the chat as it progresses
  return {
    text: lang === 'fr'
      ? '⏳ Je lance le paiement Mobile Money…'
      : '⏳ Starting your Mobile Money payment…'
  };
}

// Calls our serverless endpoint to start a Campay collection, then polls for the result.
async function initiatePayment(pkg, phone, lang) {
  try {
    const res = await fetch('/api/pay/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkg, phone, lead_id: currentLeadId })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.external_reference) {
      throw new Error(data.error || 'init failed');
    }

    addMessage('bot', lang === 'fr'
      ? `📲 Une demande de paiement de ${Number(data.amount).toLocaleString('fr-FR').replace(/,/g, ' ')} XAF a été envoyée à votre téléphone. Ouvrez la notification Mobile Money et validez avec votre code secret.`
      : `📲 A payment request for ${Number(data.amount).toLocaleString('en-US')} XAF has been sent to your phone. Open the Mobile Money prompt and approve it with your secret code.`);

    pollPaymentStatus(data.external_reference, lang, 0);
  } catch (e) {
    console.error('initiatePayment failed:', e);
    awaitingMomoNumber = false;
    currentStage = 'payment';
    addMessage('bot', lang === 'fr'
      ? 'Je n\'ai pas pu lancer le paiement automatique. Pas de souci — tapez « WhatsApp » et l\'équipe finalise le paiement avec vous.'
      : 'I couldn\'t start the automatic payment. No worries — type "WhatsApp" and the team will complete the payment with you.');
  }
}

// Polls /api/pay/status until the payment clears, fails, or times out.
async function pollPaymentStatus(ref, lang, attempt) {
  const MAX_ATTEMPTS = 24;   // ~2 minutes at 5s intervals
  const INTERVAL_MS = 5000;

  try {
    const res = await fetch(`/api/pay/status?ref=${encodeURIComponent(ref)}`);
    const data = await res.json().catch(() => ({}));
    const status = (data.status || 'PENDING').toUpperCase();

    if (status === 'SUCCESSFUL') {
      const pkgName = (PACKAGES[selectedPackage]?.name[lang]) || 'your package';
      addMessage('bot', lang === 'fr'
        ? `✅ Paiement reçu ! Vos frais d'installation pour le ${pkgName} sont confirmés. Bienvenue chez Harts — on démarre votre projet. 🎉`
        : `✅ Payment received! Your setup fee for ${pkgName} is confirmed. Welcome to Harts — we're starting your project. 🎉`);
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
        ? '❌ Le paiement n\'a pas abouti (annulé ou expiré). Renvoyez votre numéro MoMo pour réessayer, ou tapez « WhatsApp » pour l\'équipe.'
        : '❌ The payment didn\'t go through (cancelled or timed out). Send your MoMo number again to retry, or type "WhatsApp" for the team.');
      return;
    }

    // Still pending
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => pollPaymentStatus(ref, lang, attempt + 1), INTERVAL_MS);
    } else {
      awaitingMomoNumber = true;
      addMessage('bot', lang === 'fr'
        ? '⌛ Je n\'ai pas encore vu la confirmation. Si vous avez validé, elle arrivera bientôt. Sinon, renvoyez votre numéro pour réessayer ou tapez « WhatsApp ».'
        : '⌛ I haven\'t seen the confirmation yet. If you approved it, it should arrive shortly. Otherwise, resend your number to retry or type "WhatsApp".');
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

  // 2) Persist to the database (fire-and-forget; UI never blocks on this)
  try {
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name || null,
        business: lead.business || null,
        phone: lead.phone || null,
        city: lead.city || null,
        package: pkg,
        payment_pref: payment,
        summary: generateConversationSummary(currentLang),
        lang: currentLang,
        source: 'chat'
      })
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.id) currentLeadId = d.id; })
      .catch(() => { /* offline / not deployed yet — localStorage still has it */ });
  } catch (e) { /* ignore */ }
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
    return lang === 'fr' ? "Nous n'avons pas encore beaucoup discuté, mais je suis prêt à vous aider !" : "We haven't discussed much yet, but I'm ready to help!";
  }

  return parts.join(' ');
}
// --- End dynamic helpers ---

// --- Live dynamic calculations (Priority #1) ---
function calculatePaymentDetails(pkgKey, paymentType, lang = currentLang) {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) return '';

  // Extract numbers (recurring price is now billed yearly).
  // Amounts use commas (en: 120,000) or spaces (fr: 120 000) as separators — strip both.
  const setupMatch = (pkg.setup[lang] || pkg.setup.en || '').match(/\d[\d\s,]*/);
  const yearlyMatch = (pkg.price[lang] || pkg.price.en || '').match(/\d[\d\s,]*/);

  const setup = setupMatch ? parseInt(setupMatch[0].replace(/[\s,]/g, '')) : 0;
  const yearly = yearlyMatch ? parseInt(yearlyMatch[0].replace(/[\s,]/g, '')) : 0;
  const firstYearTotal = setup + yearly;

  if (paymentType === 'installments') {
    const parts = 3;
    const perPart = Math.round(yearly / parts);
    return lang === 'fr'
      ? `Installation ${setup.toLocaleString()} XAF, puis le forfait annuel (${yearly.toLocaleString()} XAF) en ${parts} versements sans intérêts par MoMo : ~${perPart.toLocaleString()} XAF × ${parts}.`
      : `${setup.toLocaleString()} XAF setup, then the yearly fee (${yearly.toLocaleString()} XAF) in ${parts} interest-free MoMo installments: ~${perPart.toLocaleString()} XAF × ${parts}.`;
  }
  else {
    return lang === 'fr'
      ? `Paiement complet : ${setup.toLocaleString()} XAF d'installation + ${yearly.toLocaleString()} XAF pour l'année (total ${firstYearTotal.toLocaleString()} XAF la première année, puis ${yearly.toLocaleString()} XAF/an).`
      : `Full payment: ${setup.toLocaleString()} XAF setup + ${yearly.toLocaleString()} XAF for the year (total ${firstYearTotal.toLocaleString()} XAF first year, then ${yearly.toLocaleString()} XAF/year).`;
  }
}
// --- End dynamic helpers ---

function doHandoff(lang, withDetails = false) {
  const pkgKey = leadContext.package || selectedPackage || 'growth';
  const pkg = PACKAGES[pkgKey];
  const pkgName = pkg ? (pkg.name[lang] || pkg.name.en) : 'a package';
  let msg = lang === 'fr'
    ? `Bonjour Harts ! Je viens de discuter avec votre assistant et je suis intéressé(e) par le forfait ${pkgName}.`
    : `Hello Harts! I was just chatting with your assistant and I'm interested in the ${pkgName} package.`;

  if (withDetails) {
    msg += lang === 'fr'
      ? `\n\nNom: ${leadContext.name}\nEntreprise: ${leadContext.business}\nWhatsApp: ${leadContext.phone}\nVille: ${leadContext.city}`
      : `\n\nName: ${leadContext.name}\nBusiness: ${leadContext.business}\nWhatsApp: ${leadContext.phone}\nCity: ${leadContext.city}`;
    if (leadContext.payment_pref) {
      msg += lang === 'fr'
        ? `\nPréférence de paiement: ${leadContext.payment_pref}`
        : `\nPayment preference: ${leadContext.payment_pref}`;
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

  // Simulate payment step completed
  if (currentStage === 'payment') {
    currentStage = 'review';
    setTimeout(() => {
      addMessage('bot', lang === 'fr' 
        ? 'Message envoyé ! Une fois le paiement effectué via les instructions, n\'hésitez pas. En attendant, aimeriez-vous laisser un court avis (note 1-5 et commentaire) pour nous aider à nous améliorer ?' 
        : 'Message sent! Once payment is complete via the instructions, feel free to reach out. In the meantime, would you like to leave a quick review (1-5 rating and comment) to help us improve?');
    }, 1500);
  }

  leadContext = {};
  awaitingLeadField = null;

  return {
    text: lang === 'fr'
      ? 'Parfait ! J\'ai ouvert WhatsApp avec un message pré-rempli contenant tout le contexte et les instructions de paiement. L\'équipe vous répondra très rapidement (généralement sous 2 heures).'
      : 'Perfect! I\'ve opened WhatsApp with a pre-filled message that includes all the context and payment instructions. Our team usually replies within 2 business hours.'
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
    avatar.textContent = '✦';   // Harts AI sparkle (Gemini-inspired but on-brand)
  } else {
    avatar.textContent = 'U';   // Clean user indicator
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

  messages.push({ role, text });
}

function showTyping() {
  const chat = document.getElementById('chat-messages');
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

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  addMessage('user', val);
  input.value = '';

  showTyping();

  // Natural delay + LLM for dynamic responses where appropriate
  setTimeout(async () => {
    let reply = getBotResponse(val, currentLang);

    // For general/open responses (not in strict collection/payment/review), use LLM for dynamism
    const useLLM = !awaitingLeadField && currentStage !== 'review' && currentStage !== 'payment' &&
                   !/(get started|je veux|commencer|paid|payé|installment|versement|price|prix|growth|pro|starter)/i.test(val);

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
            lang: currentLang
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            reply = { text: data.reply };
          }
        }
      } catch (e) {
        console.warn('LLM call failed, using rule-based fallback');
      }
    }

    // Reply is ready (rule-based or LLM) — now remove the typing indicator
    hideTyping();

    // Show all three packages side by side
    if (reply.multiPackage) {
      if (reply.text) addMessage('bot', reply.text);
      setTimeout(() => addMessage('bot', formatPackage('starter', currentLang), true), 100);
      setTimeout(() => addMessage('bot', formatPackage('growth', currentLang), true), 200);
      setTimeout(() => addMessage('bot', formatPackage('pro', currentLang), true), 300);
    } else if (reply.packageHTML) {
      if (reply.text) addMessage('bot', reply.text);
      addMessage('bot', reply.packageHTML, true);
    } else {
      addMessage('bot', reply.text, reply.isHTML || false);
    }

    if (reply.action === 'handoff' || reply.action === 'handoff-offer') {
      // The doHandoff already opened the window in some paths.
    }
  }, 650 + Math.random() * 450);
}

// useQuickReply removed (no suggestions in simplified interface)

// Quick suggestions removed for a simpler interface.
// Users type their questions directly.

function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-main');

  if (!form || !input) return;

  // Auto-greeting after a short delay
  setTimeout(() => {
    addMessage('bot', lang === 'fr'
      ? 'Bonjour ! Je suis l\'assistant Harts. Je peux vous aider avec un site web, une application, un logo, des flyers, ou la gestion de vos réseaux sociaux. Qu\'est-ce que vous cherchez ?'
      : 'Hi! I\'m the Harts assistant. I can help you get a website, mobile app, logo, flyers, social media management, or digital marketing for your business in Cameroon. What are you looking for today?');
  }, 600);

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

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initChat();

  // Optional: expose for debugging
  window.HartsChat = { getBotResponse, messages };
});
