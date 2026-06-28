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
    'starter.price': 'XAF 15,000',
    'growth.title': 'Growth',
    'growth.setup': 'XAF 120,000 setup',
    'growth.price': 'XAF 35,000',
    'pro.title': 'Pro',
    'pro.setup': 'XAF 250,000 setup',
    'pro.price': 'XAF 80,000',
    'permonth': '/ month',
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
    'starter.price': 'XAF 15 000',
    'growth.title': 'Croissance',
    'growth.setup': 'XAF 120 000 installation',
    'growth.price': 'XAF 35 000',
    'pro.title': 'Pro',
    'pro.setup': 'XAF 250 000 installation',
    'pro.price': 'XAF 80 000',
    'permonth': '/ mois',
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
let selectedPayment = null; // 'full' | 'installments' | 'annual'

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
    price: { en: 'XAF 15,000 / month', fr: 'XAF 15 000 / mois' },
    features: {
      en: ['Landing page', 'Google Business listing', 'WhatsApp Business setup'],
      fr: ['Page d\'accueil', 'Fiche Google Business', 'Configuration WhatsApp Business']
    },
    desc: {
      en: 'Perfect for getting your business online quickly and affordably.',
      fr: 'Idéal pour mettre votre entreprise en ligne rapidement et à petit prix.'
    },
    installment: { en: 'Pay setup in 2-3 interest-free MoMo installments', fr: 'Payez l\'installation en 2 ou 3 versements sans intérêts par MoMo' },
    annual: { en: 'XAF 158,000/year (save ~12%)', fr: 'XAF 158 000 / an (économisez ~12 %)' },
    installmentCalc: { en: 'e.g. 3 × XAF 16,667 or 2 × XAF 25,000', fr: 'ex: 3 × 16 667 XAF ou 2 × 25 000 XAF' }
  },
  growth: {
    name: { en: 'Growth', fr: 'Croissance' },
    setup: { en: 'XAF 120,000 setup', fr: 'XAF 120 000 installation' },
    price: { en: 'XAF 35,000 / month', fr: 'XAF 35 000 / mois' },
    features: {
      en: ['Full website (5 pages)', 'Social media management (2 platforms)', 'Basic SEO', 'Monthly performance report'],
      fr: ['Site web complet (5 pages)', 'Gestion réseaux sociaux (2 plateformes)', 'SEO de base', 'Rapport mensuel']
    },
    desc: {
      en: 'Our most popular package. Great for businesses ready to grow visibility and customers.',
      fr: 'Notre forfait le plus populaire. Parfait pour les entreprises qui veulent gagner en visibilité et en clients.'
    },
    popular: true,
    installment: { en: 'Pay setup in 2-3 interest-free MoMo installments', fr: 'Payez l\'installation en 2 ou 3 versements sans intérêts par MoMo' },
    annual: { en: 'XAF 370,000/year (save ~12%)', fr: 'XAF 370 000 / an (économisez ~12 %)' },
    installmentCalc: { en: 'e.g. 3 × XAF 40,000 or 2 × XAF 60,000', fr: 'ex: 3 × 40 000 XAF ou 2 × 60 000 XAF' }
  },
  pro: {
    name: { en: 'Pro', fr: 'Pro' },
    setup: { en: 'XAF 250,000 setup', fr: 'XAF 250 000 installation' },
    price: { en: 'XAF 80,000 / month', fr: 'XAF 80 000 / mois' },
    features: {
      en: ['E-commerce store', 'Google/Facebook Ads management', 'WhatsApp chatbot', 'Monthly analytics dashboard', 'Priority support'],
      fr: ['Boutique en ligne', 'Gestion Google/Facebook Ads', 'Chatbot WhatsApp', 'Tableau de bord analytique', 'Support prioritaire']
    },
    desc: {
      en: 'Full digital presence with advertising and automation for serious growth.',
      fr: 'Présence digitale complète avec publicité et automatisation pour une croissance sérieuse.'
    },
    installment: { en: 'Pay setup in 2-3 interest-free MoMo installments', fr: 'Payez l\'installation en 2 ou 3 versements sans intérêts par MoMo' },
    annual: { en: 'XAF 845,000/year (save ~12%)', fr: 'XAF 845 000 / an (économisez ~12 %)' },
    installmentCalc: { en: 'e.g. 3 × XAF 83,333 or 2 × XAF 125,000', fr: 'ex: 3 × 83 333 XAF ou 2 × 125 000 XAF' }
  },
  build_only: {
    name: { en: 'Build & Launch (One-Time)', fr: 'Création & Mise en ligne (Paiement unique)' },
    setup: { en: 'XAF 180,000 one-time (Starter-level site + launch)', fr: 'XAF 180 000 paiement unique (site niveau Starter + lancement)' },
    price: { en: 'No monthly fee (management add-on available later)', fr: 'Aucun frais mensuel (option gestion disponible plus tard)' },
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
    payment: 'We accept MTN MoMo (*126# → Send to 622 341 343), Orange Money, and bank transfer. Monthly fees (for managed services) are due at the beginning of each month. For MoMo we will give you exact instructions.',
    momo: 'To pay with MTN MoMo:\n1. Dial *126#\n2. Select Transfer Money → Send to MTN Cameroon\n3. Enter 622 341 343\n4. Enter the exact amount for your project or package\n5. Confirm and keep your reference number.\nAfter payment, send us the reference on WhatsApp and we start or activate your services.',
    cities: 'We work with businesses across Cameroon — Yaoundé, Douala, Buea, and many other cities. Everything is handled remotely via WhatsApp, calls, and shared documents.',
    freeAudit: 'I can help you figure out the right services for your business right now. Just tell me a bit about what you do and what you need (more customers, online sales, new branding, etc.) and I\'ll recommend the best options.',
    who: 'Harts Digital Hub is a Cameroon-based digital agency that builds websites, mobile apps, and other digital products (logos, flyers, branding, social media assets) for SMEs. We focus on high-quality, affordable work with flexible payment plans.',
    contact: 'The fastest way to reach our team is WhatsApp: +237 622 341 343. I can prepare a detailed message with everything we\'ve discussed so they have full context.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Our packages and custom projects are full-service. We don\'t just deliver files and disappear — we handle design, development, revisions, launch, and support. Many clients see real results quickly (more visibility, new customers, professional brand presence).',
    installments: 'Yes! We offer interest-free installments for the setup or project fee on most services. You can spread the cost over 2 or 3 months via MTN MoMo with no extra fees. Great for cash flow.',
    prepay: 'We offer around 12% discount if you pay for a full year of managed services upfront.',
    build_only: 'We offer one-time projects (website, app, logo + flyer package, full branding) with no monthly commitment. You own everything and can add ongoing management later if needed.',
    roi_example: 'Real results: "Our restaurant bookings tripled in 2 months after Harts built our website and social assets. Customers now find us easily on Google and Instagram." (Mama Ngozi, Yaoundé). Many clients recover their investment quickly through new business.',
    price_objection: 'I understand budget is important. Our packages start affordably and include flexible payment plans (installments or annual discount). We deliver real websites, apps, and professional design work. Would you like to see the installment options, annual savings, or discuss a custom quote for your project?'
  },
  fr: {
    welcome: I18N.fr['chat.welcome'],
    services: 'Nous créons des sites web personnalisés, des applications mobiles, des boutiques en ligne et d\'autres services numériques pour les petites entreprises au Cameroun. Cela inclut la conception professionnelle de logos, flyers, cartes de visite, supports de branding, gestion des réseaux sociaux, optimisation Google Business, configuration WhatsApp Business et marketing digital. Nous gérons tout du concept au lancement et au support continu — aucune compétence technique requise de votre part.',
    upgrade: 'Oui, vous pouvez passer à un forfait supérieur ou ajouter des services (comme le développement d\'applications ou du design supplémentaire) à tout moment. Nous assurons une transition fluide.',
    technical: 'Aucune compétence technique n\'est nécessaire. Nous nous occupons de la conception, du développement, du contenu, du lancement et du support continu. Vous partagez simplement votre vision et validez le travail.',
    timeline: 'Les sites simples et les projets de branding (logos, flyers) sont généralement prêts en 5 à 10 jours. Les sites complets ou les applications prennent généralement 2 à 4 semaines selon la complexité et la rapidité avec laquelle vous fournissez le contenu.',
    payment: 'Nous acceptons MTN MoMo (*126# → envoi vers 622 341 343), Orange Money et virement bancaire. Les frais mensuels (pour les services gérés) sont dus en début de mois. Pour MoMo nous vous donnerons les instructions précises.',
    momo: 'Pour payer par MTN MoMo :\n1. Composez *126#\n2. Choisissez Transfert d\'argent → Envoi vers MTN Cameroun\n3. Entrez 622 341 343\n4. Entrez le montant exact de votre projet ou forfait\n5. Confirmez et gardez votre référence.\nAprès paiement, envoyez-nous la référence sur WhatsApp et nous démarrons ou activons vos services.',
    cities: 'Nous travaillons avec des entreprises dans tout le Cameroun — Yaoundé, Douala, Buea et de nombreuses autres villes. Tout se fait à distance via WhatsApp, appels et documents partagés.',
    freeAudit: 'Je peux vous aider à déterminer les bons services pour votre entreprise dès maintenant. Dites-moi simplement ce que vous faites et ce dont vous avez besoin (plus de clients, ventes en ligne, nouveau branding, etc.) et je vous recommanderai les meilleures options.',
    who: 'Harts Digital Hub est une agence digitale basée au Cameroun qui crée des sites web, des applications mobiles et d\'autres produits numériques (logos, flyers, branding, visuels pour réseaux sociaux) pour les PME. Nous nous concentrons sur un travail de qualité à prix abordable avec des plans de paiement flexibles.',
    contact: 'Le moyen le plus rapide de joindre notre équipe est WhatsApp : +237 622 341 343. Je peux préparer un message détaillé avec tout ce dont nous avons discuté pour qu\'ils aient le contexte complet.',
    // Pricing flexibility & value (updated for new services)
    pricing_value: 'Nos forfaits et projets sur mesure sont des services complets. Nous ne livrons pas simplement des fichiers et ne disparaissons pas — nous gérons la conception, le développement, les révisions, le lancement et le support. Beaucoup de clients voient de vrais résultats rapidement (plus de visibilité, de nouveaux clients, une présence de marque professionnelle).',
    installments: 'Oui ! Nous proposons des versements sans intérêts pour les frais de projet ou d\'installation sur la plupart des services. Vous pouvez étaler le coût sur 2 ou 3 mois via MTN MoMo sans frais supplémentaires. Idéal pour la trésorerie.',
    prepay: 'Nous offrons environ 12 % de réduction si vous payez une année complète de services gérés à l\'avance.',
    build_only: 'Nous proposons des projets ponctuels (site web, application, pack logo + flyers, branding complet) sans engagement mensuel. Vous êtes propriétaire de tout et pouvez ajouter une gestion continue plus tard si nécessaire.',
    roi_example: 'Résultats concrets : "Nos réservations de restaurant ont triplé en 2 mois après que Harts ait créé notre site web et nos visuels pour les réseaux sociaux. Les clients nous trouvent facilement sur Google et Instagram." (Mama Ngozi, Yaoundé). Beaucoup de clients récupèrent leur investissement rapidement grâce à de nouvelles affaires.',
    price_objection: 'Je comprends que le budget est important. Nos forfaits commencent à des prix abordables et incluent des plans de paiement flexibles (versements ou réduction annuelle). Nous livrons de vrais sites web, applications et designs professionnels. Voulez-vous voir les options de versements, les économies annuelles, ou discuter d\'un devis personnalisé pour votre projet ?'
  }
};

// ── Intent / Question Router (covers "all client questions" in this domain) ──
function getBotResponse(rawText, lang = currentLang) {
  const text = rawText.toLowerCase().trim();
  const k = KNOWLEDGE[lang] || KNOWLEDGE.en;
  const p = PACKAGES;

  // Update dynamic profile from every user message (makes responses feel personal)
  updateUserProfileFromText(rawText, lang);

  // Review collection flow
  if (currentStage === 'review' || awaitingReviewField) {
    return handleReviewCollection(rawText, lang);
  }

  // Lead collection flow (conversational form)
  if (awaitingLeadField) {
    return handleLeadCollection(rawText, lang);
  }

  // Strong purchase / "get started" intent → enter lead flow, conversational
  if (/(get started|je veux|je souhaite|commencer|sign up|enroll|prendre|acheter|je prends|growth|pro|starter|forfait|site|app|logo|flyer)/i.test(text) &&
      /(package|forfait|growth|pro|starter|commencer|site|app|logo|flyer)/i.test(text)) {
    const pkgMatch = text.match(/starter|growth|pro|démarrage|croissance|build|one.time|unique/i);
    let suggested = pkgMatch ? normalizePackage(pkgMatch[0]) : 'growth';
    if (/build|one.time|unique/i.test(text)) suggested = 'build_only';
    leadContext = { package: suggested };
    selectedPackage = suggested;
    awaitingLeadField = 'name';
    lastTopic = suggested;
    currentStage = 'details';

    const pkgName = p[suggested].name[lang] || p[suggested].name.en;
    return {
      text: lang === 'fr'
        ? `Parfait, le ${pkgName} marche très bien pour beaucoup d'entreprises. On va y aller tranquillement avec les options de paiement. Pour commencer, c'est quoi votre nom complet ?`
        : `Perfect, the ${pkgName} works really well for a lot of businesses. We'll go through it step by step, including payment options. To get started, what's your full name? We'll go through it step by step, including payment options. To get started, what's your full name? To get you set up quickly I\'ll prepare a detailed message for our team on WhatsApp (I\'ll note your preferred payment option).\n\nFirst, what is your full name?`,
    };
  }

  // Direct package questions - human touch + dynamic + HTML formatted
  if (text.includes('starter') || text.includes('démarrage')) {
    lastTopic = 'starter';
    return { text: contextualize(`Le Starter est idéal pour démarrer simplement.`, lang), isHTML: false, packageHTML: formatPackage('starter', lang) };
  }
  if (text.includes('growth') || text.includes('croissance')) {
    lastTopic = 'growth';
    return { text: contextualize(`Le Growth est notre plus populaire, et pour de bonnes raisons.`, lang), isHTML: false, packageHTML: formatPackage('growth', lang) };
  }
  if (text.includes('pro') && (text.includes('package') || text.includes('forfait') || text.includes('price') || text.includes('prix'))) {
    lastTopic = 'pro';
    return { text: contextualize(`Le Pro est pour ceux qui veulent aller plus loin avec une présence complète.`, lang), isHTML: false, packageHTML: formatPackage('pro', lang) };
  }

  // Pricing / cost questions - now with live dynamic examples
  if (/(price|prix|cost|combien|how much|tarif|setup|installation|combien)/i.test(text)) {
    lastTopic = 'pricing';
    
    // Show dynamic example for Growth (most popular)
    const growthCalc = calculatePaymentDetails('growth', 'installments', lang);
    
    return {
      text: lang === 'fr'
        ? `Voici nos tarifs (tout est en XAF). Exemple concret pour le Growth (notre plus populaire) :\n\n${growthCalc}\n\nNous avons aussi des options flexibles :\n• Starter : ${p.starter.setup.fr} + ${p.starter.price.fr}\n• Growth : ${p.growth.setup.fr} + ${p.growth.price.fr}\n• Pro : ${p.pro.setup.fr} + ${p.pro.price.fr}\n• Build & Launch (paiement unique) : ${p.build_only.setup.fr}\n\n💳 Versements sans intérêts ou ~12% de réduction annuelle disponibles.\n\nQuel forfait ou service vous intéresse ? Je peux vous donner les calculs exacts.`
        : `Here are our current prices (all in XAF). Concrete example for Growth (our most popular):\n\n${growthCalc}\n\nWe also have flexible options:\n• Starter: ${p.starter.setup.en} + ${p.starter.price.en}\n• Growth: ${p.growth.setup.en} + ${p.growth.price.en}\n• Pro: ${p.pro.setup.en} + ${p.pro.price.en}\n• Build & Launch (one-time): ${p.build_only.setup.en}\n\n💳 Interest-free installments or ~12% annual discount available.\n\nWhich package or service interests you? I can give you the exact numbers.`
    };
  }

  // What's included / features - rich HTML when possible
  if (/(include|inclus|what.*get|ce qui est|features|fonctionnalités|contient)/i.test(text)) {
    if (lastTopic && p[lastTopic]) {
      return { 
        text: '', 
        packageHTML: formatPackage(lastTopic, lang) 
      };
    }
    return {
      text: lang === 'fr'
        ? 'Je peux vous détailler chaque forfait. Dites-moi simplement "Starter", "Growth" ou "Pro" (ou "Croissance").'
        : 'I can give you the full breakdown of any package. Just say "Starter", "Growth", or "Pro".'
    };
  }

  // New: Installments / payment plans - natural
  if (/(installment|versement|échelon|plan|paiement en plusieurs fois|2 mois|3 mois|sans intérêt)/i.test(text)) {
    return { text: lang === 'fr' 
      ? `${k.installments} C'est souvent ce qui arrange le plus nos clients. Quel service ou forfait vous parle le plus ?` 
      : `${k.installments} It's often what works best for our clients. Which service or package interests you most?` };
  }

  // New: Prepay / annual discount - natural
  if (/(prepay|annuel|yearly|12 mois|discount|réduction|économie|annual)/i.test(text)) {
    return { text: lang === 'fr' 
      ? `${k.prepay} Ça simplifie la vie. Vous voulez que je vous détaille ça pour un forfait en particulier ?` 
      : `${k.prepay} It simplifies life a lot. Want me to break it down for a specific package?` };
  }

  // New: Build only / one-time option
  if (/(build only|one time|one-time|paiement unique|juste le site|build & launch|sans abonnement|no monthly)/i.test(text)) {
    lastTopic = 'build_only';
    selectedPackage = 'build_only';
    currentStage = 'selection';
    return { 
      text: contextualize(`Le Build & Launch est parfait si vous voulez un projet complet sans engagement mensuel.`, lang), 
      packageHTML: formatPackage('build_only', lang) 
    };
  }

  // New: Price objection / too expensive / budget - human, empathetic
  if (/(expensive|cher|trop cher|budget|réduire|moins cher|affordable|can you lower|discount|réduction)/i.test(text)) {
    return {
      text: lang === 'fr'
        ? `Je comprends tout à fait que le budget est important. Nos services commencent à des prix accessibles et on a les versements sans intérêts ou la réduction annuelle pour arranger. Le Growth par exemple est souvent rentabilisé rapidement grâce aux nouveaux clients. Vous voulez qu'on regarde ensemble les options concrètes pour votre cas ?`
        : `I completely understand that budget is important. Our services start at accessible prices and we have interest-free installments or the annual discount to make it work. The Growth one, for example, often pays for itself quickly with new customers. Want to look at the concrete options for your situation together?`
    };
  }

  // Upgrade question
  if (/(upgrade|changer|passer|augmenter|plus tard)/i.test(text)) {
    return { text: k.upgrade };
  }

  // Technical skills
  if (/(technical|compétence|skill|connaissance|difficile|compliqué|je ne sais pas)/i.test(text)) {
    return { text: k.technical };
  }

  // Payment / MoMo / Orange - enhanced for journey
  if (/(payment|paiement|momo|orange|bank|transfert|how.*pay|comment.*payer|versement|installment)/i.test(text)) {
    if (currentStage === 'payment' && selectedPackage) {
      return providePaymentInstructions(lang);
    }
    if (/momo/i.test(text)) return { text: k.momo };
    return { text: k.payment };
  }

  // Timeline / delay / how long
  if (/(timeline|délai|long|combien de temps|when.*live|quand.*en ligne|weeks|jours)/i.test(text)) {
    return { text: k.timeline };
  }

  // Digital design services (logos, flyers, branding)
  if (/(logo|flyer|branding|design graphique|carte de visite|flyers|logos)/i.test(text)) {
    return { text: lang === 'fr' 
      ? 'Nous créons des logos professionnels, des flyers, des cartes de visite et des supports de branding complets. Dites-moi ce dont vous avez besoin et je vous donnerai les options et tarifs.' 
      : 'We create professional logos, flyers, business cards, and full branding packages. Tell me what you need and I\'ll give you the options and pricing.' };
  }

  // Free audit
  if (/(audit|free audit|audit gratuit|not sure|recommand|conseil|which package)/i.test(text)) {
    return { text: k.freeAudit };
  }

  // Locations / cities
  if (/(city|ville|yaoundé|douala|buea|where|où|cameroon|cameroun|local)/i.test(text)) {
    return { text: k.cities };
  }

  // Who are you / about
  if (/(who are you|qui êtes|à propos|about harts|entreprise)/i.test(text)) {
    return { text: k.who };
  }

  // Contact / human / speak to someone
  if (/(human|person|conseiller|parler|contact|whatsapp|real person|vraie personne|équipe)/i.test(text)) {
    return {
      text: k.contact,
      action: 'handoff'
    };
  }

  // FAQ-style or general services
  if (/(service|what do you do|que faites|offre|proposez)/i.test(text)) {
    return { text: k.services };
  }

  // Follow-up on previous topic
  if (/(that one|celui-là|the other|autre|lui|elle|plus d'info|tell me more|détails)/i.test(text) && lastTopic) {
    if (PACKAGES[lastTopic]) return { text: formatPackage(lastTopic, lang) };
  }

  // Polite / small talk + qualification prompts
  if (/^(hi|hello|bonjour|salut|hey|good morning|good afternoon)/i.test(text)) {
    const greetings = lang === 'fr'
      ? ['Bonjour ! Comment puis-je vous aider avec nos services (sites web, applications, branding) aujourd\'hui ?', 
         'Salut ! Dites-moi ce dont vous avez besoin pour votre business, je suis là pour vous guider.']
      : ['Hello! How can I help you with our services (websites, apps, branding) today?',
         'Hi there! Tell me what you need for your business and I\'ll guide you.'];
    return { text: varyResponse(greetings, lang) };
  }
  if (/(thank|merci|thanks|cool|super|parfait)/i.test(text)) {
    return { text: lang === 'fr' ? 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.' : 'You\'re very welcome! Feel free to ask anything else.' };
  }

  // User indicates readiness to proceed (qualification or move to details/payment)
  if (/(ready|proceed|let\'s do it|go ahead|je suis prêt|allons-y|procédons|commençons)/i.test(text)) {
    if (!selectedPackage) {
      return {
        text: lang === 'fr'
          ? `Super ! Pour vous recommander le bon service, dites-moi rapidement : quel est votre type d'activité et votre principal besoin (site web, application, logos/flyers, marketing digital, etc.) ?`
          : `Great! To recommend the right service, quickly tell me your type of business and main need (website, mobile app, logos/flyers, digital marketing, etc.)?`
      };
    } else {
      // Move to lead collection if package is known
      if (!leadContext.name) {
        awaitingLeadField = 'name';
        currentStage = 'details';
        return {
          text: lang === 'fr'
            ? `Parfait, passons au forfait ${p[selectedPackage].name.fr}. Commençons par votre nom complet :`
            : `Perfect, let's proceed with the ${p[selectedPackage].name.en} package. First, your full name?`
        };
      }
    }
  }

  // Simulate payment confirmation in chat (key for "pay for their website" in the interface)
  if (/(paid|j'ai payé|money sent|référence|confirm payment|paiement effectué|j'ai envoyé)/i.test(text) && currentStage === 'payment') {
    currentStage = 'review';
    let base = lang === 'fr'
      ? `Excellent ! Paiement noté. Merci. Pour nous aider à nous améliorer avant que l'équipe ne vous contacte, pourriez-vous donner une note sur 5 et un petit commentaire sur l'expérience ?`
      : `Excellent! Payment noted. Thank you. To help us improve before the team reaches out, could you give a rating out of 5 and a short comment on the experience?`;
    return { text: contextualize(base, lang) };
  }

  // Human-like fallback: acknowledge what they said, stay helpful, guide forward naturally + summary
  const shortAck = lang === 'fr' ? "Compris." : "Understood.";
  const summary = generateConversationSummary(lang);

  if (currentStage === 'discovery' || !selectedPackage) {
    // Early stage: be curious and helpful, like a real consultant
    return {
      text: lang === 'fr'
        ? `${shortAck} On crée des sites web, des applications mobiles, des logos, des flyers, du branding et du marketing digital pour les entreprises comme la vôtre. ${summary} Pour vous proposer quelque chose qui colle vraiment, pouvez-vous me dire en quelques mots ce que vous faites et ce que vous cherchez en priorité (plus de clients, un site pro, une appli, un nouveau logo...) ?`
        : `${shortAck} We build websites, mobile apps, logos, flyers, branding, and digital marketing for businesses like yours. ${summary} To suggest something that actually fits, can you tell me in a few words what you do and what you're looking for most right now (more customers, a professional site, an app, new branding...)?`
    };
  }

  // Mid/late stage: be practical and offer clear next step (stay in chat), with summary
  if (currentStage === 'selection' || currentStage === 'details' || currentStage === 'payment') {
    return {
      text: lang === 'fr'
        ? `${shortAck} ${summary} Dites-moi exactement ce dont vous avez besoin maintenant (le forfait Growth ? des infos sur les versements ? un devis pour un logo + site ?), et je vous aide étape par étape. Si vous préférez qu'on passe directement à l'équipe, dites-le moi et je prépare le message WhatsApp avec ce résumé.`
        : `${shortAck} ${summary} Tell me exactly what you need right now (the Growth package? details on installments? a quote for logo + website?), and I'll walk you through it step by step. If you'd rather we loop in the team directly, just say so and I'll prepare a WhatsApp message with this summary.`
    };
  }

  // Explicit summary request
  if (/(summarize|résumé|recap|so far|jusqu'ici|ce qu'on a dit|what have we discussed|summary|résume)/i.test(text)) {
    return {
      text: lang === 'fr' 
        ? `Voici un résumé de notre conversation : ${summary}\n\nVoulez-vous avancer avec ça ou que je prépare le message pour l'équipe ?`
        : `Here's a summary of our conversation so far: ${summary}\n\nWant to move forward with this or shall I prepare the message for the team?`
    };
  }

  // Very late stage
  return {
    text: lang === 'fr'
      ? `${shortAck} ${summary} Je suis là pour vous. Dites-moi ce qu'il vous faut (paiement, suite du projet, ou autre), ou si vous voulez qu'on transmette tout à l'équipe sur WhatsApp.`
      : `${shortAck} ${summary} I'm here for you. Tell me what you need (payment details, next steps on the project, or anything else), or if you'd like us to pass everything to the team on WhatsApp.`
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
    html += `→ Also available in 2-3 interest-free installments.<br>`;
  }
  if (pkg.annual) {
    html += `→ ~12% discount if you prepay the year.<br>`;
  }

  if (key === 'growth') html += `<br><strong>★ Most popular package</strong><br>`;
  if (key === 'build_only') html += `<br>Great lower-commitment option — no monthly fees.<br>`;

  html += `<br>Ready to move forward, or want to compare / see exact payment options?`;
  
  return html;  // Will be rendered as HTML in the bubble
}

// ── Conversational Lead Collection ────────────────────────────
function handleLeadCollection(rawText, lang) {
  const trimmed = rawText.trim();
  updateUserProfileFromText(rawText, lang); // capture any extra details

  if (/^(skip|passer|plus tard|connect|whatsapp|human)/i.test(trimmed)) {
    awaitingLeadField = null;
    currentStage = 'payment';
    return doHandoff(lang);
  }

  if (awaitingLeadField === 'name') {
    leadContext.name = trimmed;
    awaitingLeadField = 'business';
    return {
      text: lang === 'fr' ? `Merci ${trimmed.split(' ')[0]}. Et le nom de votre entreprise ou activité ?` : `Thanks ${trimmed.split(' ')[0]}. What's the name of your business or activity?`
    };
  }
  if (awaitingLeadField === 'business') {
    leadContext.business = trimmed;
    awaitingLeadField = 'phone';
    return {
      text: lang === 'fr' ? 'Parfait. Votre numéro WhatsApp (avec indicatif, ex: +237 6XX XXX XXX) pour qu\'on puisse vous contacter facilement ?' : 'Got it. Your WhatsApp number (with country code, e.g. +237 6XX XXX XXX) so we can reach you easily?'
    };
  }
  if (awaitingLeadField === 'phone') {
    leadContext.phone = trimmed;
    awaitingLeadField = 'city';
    return {
      text: lang === 'fr' ? 'Dernière info : dans quelle ville vous êtes (Yaoundé, Douala, Buea...) ?' : 'Last detail: Which city are you based in (Yaoundé, Douala, Buea...)?'
    };
  }
  if (awaitingLeadField === 'city') {
    leadContext.city = trimmed;
    awaitingLeadField = 'payment_pref';
    return {
      text: lang === 'fr'
        ? 'Super. Pour le paiement de l\'installation, vous préférez tout de suite, en 2-3 versements sans intérêts, ou avec la réduction pour l\'année complète ?'
        : 'Great. For the setup payment, do you prefer paying in full now, in 2-3 interest-free installments, or the annual discount option?'
    };
  }

  if (awaitingLeadField === 'payment_pref') {
    leadContext.payment_pref = trimmed;
    selectedPayment = trimmed.toLowerCase().includes('install') ? 'installments' : 
                     trimmed.toLowerCase().includes('annual') || trimmed.toLowerCase().includes('an') ? 'annual' : 'full';
    awaitingLeadField = null;
    currentStage = 'payment';
    saveLeadToStorage(leadContext);
    return providePaymentInstructions(lang);
  }

  return { text: lang === 'fr' ? 'Pouvez-vous me donner cette information ?' : 'Could you please provide that information?' };
}

function providePaymentInstructions(lang) {
  const pkg = PACKAGES[selectedPackage] || PACKAGES.growth;
  const name = pkg.name[lang] || pkg.name.en;

  let msg = lang === 'fr' 
    ? `Parfait. Pour le ${name}, voici comment ça se passe concrètement pour le paiement.\n\n`
    : `Perfect. For the ${name}, here's exactly how the payment works in practice.\n\n`;

  // Use live dynamic calculation
  const calc = calculatePaymentDetails(selectedPackage, selectedPayment, lang);
  msg += calc + '\n\n';

  msg += lang === 'fr'
    ? `Le plus simple : MTN MoMo.\n1. *126#\n2. Transfert → Envoi MTN Cameroun\n3. 622 341 343\n4. Le montant exact\n5. Gardez la référence.\n\nUne fois que c'est envoyé, dites-moi "payé" ici ou contactez l'équipe sur WhatsApp avec la référence. Je prépare tout de suite le message complet avec votre contexte.`
    : `The easiest is MTN MoMo.\n1. *126#\n2. Transfer Money → Send to MTN Cameroon\n3. 622 341 343\n4. The exact amount\n5. Keep the reference.\n\nOnce it's sent, just say "paid" here or message the team on WhatsApp with the reference. I'll prepare the full summary message with your context right away.`;

  // Move to handoff + review prompt
  setTimeout(() => {
    const handoff = doHandoff(lang, true);
    addMessage('bot', handoff.text);
    setTimeout(() => {
      currentStage = 'review';
      const summary = generateConversationSummary(lang);
      addMessage('bot', lang === 'fr' 
        ? `Merci ! Voici un petit résumé de ce qu'on a discuté : ${summary}\n\nAvant que l'équipe ne vous recontacte, un retour rapide (note sur 5 et un commentaire) nous aiderait beaucoup. Qu'en pensez-vous ?` 
        : `Thank you! Here's a quick summary of what we discussed: ${summary}\n\nBefore the team reaches out, a quick bit of feedback (rating out of 5 and a short comment) would help us a lot. What do you think?`);
    }, 1200);
  }, 800);

  return { text: msg };
}

function saveLeadToStorage(lead) {
  try {
    const leads = JSON.parse(localStorage.getItem('harts_leads') || '[]');
    leads.push({
      ...lead,
      pkg: lead.package || selectedPackage || 'Not specified',
      payment: lead.payment_pref || selectedPayment || 'Not specified',
      timestamp: new Date().toISOString(),
      source: 'chat'
    });
    localStorage.setItem('harts_leads', JSON.stringify(leads));
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
      pkgStr += ` (${selectedPayment === 'installments' ? 'versements' : selectedPayment === 'annual' ? 'annuel' : 'complet'})`;
    }
    parts.push(lang === 'fr' ? `Intérêt principal : ${pkgStr}.` : `Main interest: ${pkgStr}.`);
  }

  if (leadContext.name || leadContext.business) {
    let contact = leadContext.name || '';
    if (leadContext.business) contact += (contact ? ' — ' : '') + leadContext.business;
    parts.push(lang === 'fr' ? `Contact : ${contact}.` : `Contact: ${contact}.`);
  }

  // Recent user points for freshness
  const recentUser = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.text.substring(0, 80))
    .join(' ; ');
  if (recentUser) {
    parts.push(lang === 'fr' ? `Points récents : ${recentUser}.` : `Recent points: ${recentUser}.`);
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

  // Extract numbers
  const setupMatch = (pkg.setup[lang] || pkg.setup.en || '').match(/\d[\d\s]*/);
  const monthlyMatch = (pkg.price[lang] || pkg.price.en || '').match(/\d[\d\s]*/);
  
  const setup = setupMatch ? parseInt(setupMatch[0].replace(/\s/g, '')) : 0;
  const monthly = monthlyMatch ? parseInt(monthlyMatch[0].replace(/\s/g, '')) : 0;

  if (paymentType === 'installments') {
    const months = 3;
    const perMonth = Math.round(setup / months);
    return lang === 'fr'
      ? `Installation en ${months} versements sans intérêts : ~${perMonth.toLocaleString()} XAF/mois pendant ${months} mois (total installation ${setup.toLocaleString()} XAF).`
      : `Setup in ${months} interest-free installments: ~${perMonth.toLocaleString()} XAF/month for ${months} months (total setup ${setup.toLocaleString()} XAF).`;
  } 
  else if (paymentType === 'annual') {
    const discount = 0.12;
    const discountedSetup = Math.round(setup * (1 - discount));
    const annualTotal = discountedSetup + (monthly * 12);
    return lang === 'fr'
      ? `Paiement annuel avec ~12% de réduction : ${discountedSetup.toLocaleString()} XAF pour l'installation + ${ (monthly * 12).toLocaleString()} XAF pour l'année (total ~${annualTotal.toLocaleString()} XAF).`
      : `Annual prepay with ~12% savings: ${discountedSetup.toLocaleString()} XAF setup + ${(monthly * 12).toLocaleString()} XAF for the year (total ~${annualTotal.toLocaleString()} XAF).`;
  } 
  else {
    return lang === 'fr'
      ? `Paiement complet : ${setup.toLocaleString()} XAF d'installation + ${monthly.toLocaleString()} XAF le premier mois.`
      : `Full payment: ${setup.toLocaleString()} XAF setup + ${monthly.toLocaleString()} XAF first month.`;
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
    hideTyping();

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

    // Handle rich package HTML (Priority #2)
    if (reply.packageHTML) {
      addMessage('bot', reply.text);
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

  // No automatic welcome — the static h1 in HTML is the only message on first load

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

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initChat();

  // Optional: expose for debugging
  window.HartsChat = { getBotResponse, messages };
});
