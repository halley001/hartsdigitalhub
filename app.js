// ============================================================
//  HARTS DIGITAL HUB — app.js
//  All interactive logic for Phase 1
// ============================================================

const WA_NUMBER = '237622341343';

// ── i18n Translations ────────────────────────────────────────
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
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'What is included in the Starter package?',
    'faq.a1': 'The Starter package includes a landing page, Google Business listing, and WhatsApp Business setup to get your business online quickly and affordably.',
    'faq.q2': 'Can I upgrade my package later?',
    'faq.a2': 'Yes, you can upgrade at any time. Just contact us via WhatsApp and we\'ll handle the transition for you.',
    'faq.q3': 'How does payment work?',
    'faq.a3': 'You can pay via MTN MoMo, Orange Money, or bank transfer. Monthly fees are due at the start of each month.',
    'faq.q4': 'Do I need technical skills?',
    'faq.a4': 'No technical skills are required. We handle everything for you, from setup to ongoing support.'
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
    'faq.title': 'Questions Fréquemment Posées',
    'faq.q1': 'Que comprend le forfait Démarrage ?',
    'faq.a1': 'Le forfait Démarrage inclut une page d\'accueil, une fiche Google Business et la configuration WhatsApp Business pour lancer votre activité en ligne.',
    'faq.q2': 'Puis-je changer de forfait plus tard ?',
    'faq.a2': 'Oui, vous pouvez changer à tout moment. Contactez-nous sur WhatsApp et nous nous occupons de tout.',
    'faq.q3': 'Comment fonctionne le paiement ?',
    'faq.a3': 'Vous pouvez payer par MTN MoMo, Orange Money ou virement bancaire. Les frais mensuels sont dus en début de mois.',
    'faq.q4': 'Ai-je besoin de compétences techniques ?',
    'faq.a4': 'Aucune compétence technique requise. Nous nous occupons de tout, de l\'installation au support continu.'
  }
};

function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('active', active);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
  });
}

function initLangToggle() {
  const saved = localStorage.getItem('lang') || 'en';
  setLang(saved);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

// ── Stats Counter Animation ───────────────────────────────────
function animateStat(el, target, duration) {
  duration = duration || 1400;
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    if (el.dataset.count === '98') {
      el.textContent = value + '%';
    } else if (target === 50) {
      el.textContent = value + '+';
    } else {
      el.textContent = value;
    }
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Set final value
      if (el.dataset.count === '98') el.textContent = target + '%';
      else if (target === 50) el.textContent = target + '+';
      else el.textContent = target;
    }
  }
  requestAnimationFrame(step);
}

function initStats() {
  const statsBar = document.getElementById('stats-bar');
  if (!statsBar) return;
  let animated = false;
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        document.querySelectorAll('.stat-number').forEach(function(el) {
          animateStat(el, parseInt(el.dataset.count, 10));
        });
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(statsBar);
  } else {
    document.querySelectorAll('.stat-number').forEach(function(el) {
      animateStat(el, parseInt(el.dataset.count, 10));
    });
  }
}

// ── Free Audit Banner ─────────────────────────────────────────
function initAuditBanner() {
  const auditForm    = document.getElementById('free-audit-form');
  const auditContact = document.getElementById('audit-contact');
  const auditSuccess = document.getElementById('free-audit-success');
  if (!auditForm) return;

  auditForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const val = auditContact.value.trim();
    if (!val || val.length < 5) {
      auditContact.style.outline = '2px solid #c00';
      auditContact.focus();
      return;
    }
    auditContact.style.outline = '';
    const msg = encodeURIComponent('Hi Harts! I\'d like a free digital audit for my business. Contact: ' + val);
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
    auditSuccess.style.display = 'block';
    auditForm.style.display = 'none';
    setTimeout(function() {
      auditForm.style.display = '';
      auditSuccess.style.display = 'none';
      auditContact.value = '';
    }, 6000);
  });

  auditContact.addEventListener('input', function() {
    auditContact.style.outline = '';
  });
}

// ── Floating WhatsApp Button ──────────────────────────────────
function initWAFloat() {
  const waFloat = document.getElementById('wa-float');
  if (!waFloat) return;

  function updateWAVisibility() {
    if (window.scrollY > 300) {
      waFloat.classList.add('visible');
    } else {
      waFloat.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateWAVisibility, { passive: true });
  updateWAVisibility();

  waFloat.addEventListener('click', function() {
    const msg = encodeURIComponent('Hi! I found you on your website.');
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
  });
}

// ── Pricing Modal ─────────────────────────────────────────────
function initPricingModal() {
  const backdrop         = document.getElementById('pricing-modal-backdrop');
  if (!backdrop) return;
  const modal            = backdrop.querySelector('.pricing-modal');
  const modalClose       = document.getElementById('modal-close');
  const modalForm        = document.getElementById('modal-form');
  const modalSuccess     = document.getElementById('modal-success');
  const modalPackageName = document.getElementById('modal-package-name');
  let lastFocused        = null;
  let focusTrapHandler   = null;

  // Open modal
  document.querySelectorAll('.pricing-cta').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const pkg = btn.getAttribute('data-package');
      if (modalPackageName) modalPackageName.textContent = pkg;
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
      lastFocused = btn;
      setTimeout(function() {
        const first = modal.querySelector('input, select, button');
        if (first) first.focus();
      }, 120);
      trapFocus(backdrop);
    });
  });

  function closeModal() {
    backdrop.classList.remove('active');
    backdrop.setAttribute('aria-hidden', 'true');
    if (modalSuccess) modalSuccess.style.display = 'none';
    if (modalForm) { modalForm.style.display = ''; modalForm.reset(); }
    clearErrors();
    untrapFocus();
    if (lastFocused) lastFocused.focus();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (backdrop.classList.contains('active') && e.key === 'Escape') closeModal();
  });

  // Focus trap
  function trapFocus(container) {
    const focusable = container.querySelectorAll(
      'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    focusTrapHandler = function(e) {
      if (!container.classList.contains('active') || e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
  }
  function untrapFocus() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  // Validation helpers
  function clearErrors() {
    ['fullname', 'business', 'phone', 'city', 'payment'].forEach(function(f) {
      const el = document.getElementById('error-' + f);
      if (el) el.textContent = '';
    });
  }
  function setError(field, msg) {
    const el = document.getElementById('error-' + field);
    if (el) el.textContent = msg;
  }

  // Form submit
  if (modalForm) {
    modalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      clearErrors();

      const name     = modalForm.fullname.value.trim();
      const business = modalForm.business.value.trim();
      const phone    = modalForm.phone.value.trim();
      const city     = modalForm.city.value.trim();
      const payment  = modalForm.payment ? modalForm.payment.value : '';
      let valid      = true;

      if (!name)              { setError('fullname', 'Required'); valid = false; }
      if (!business)          { setError('business', 'Required'); valid = false; }
      if (!/[0-9]{7,}/.test(phone)) { setError('phone', 'Enter a valid phone number'); valid = false; }
      if (!city)              { setError('city', 'Required'); valid = false; }
      if (!payment)           { setError('payment', 'Select a payment method'); valid = false; }
      if (!valid) return;

      const pkg = modalPackageName ? modalPackageName.textContent : '';

      // Save lead to localStorage
      try {
        const leads = JSON.parse(localStorage.getItem('harts_leads') || '[]');
        leads.push({
          name, business, phone, city, pkg, payment,
          timestamp: new Date().toISOString(),
          status: 'pending'
        });
        localStorage.setItem('harts_leads', JSON.stringify(leads));
      } catch (err) {
        console.warn('Could not save lead:', err);
      }

      if (payment === 'MTN MoMo') {
        // Show MoMo modal, hide pricing modal
        backdrop.classList.remove('active');
        backdrop.setAttribute('aria-hidden', 'true');
        untrapFocus();
        const momoBackdrop = document.getElementById('momo-modal-backdrop');
        if (momoBackdrop) {
          momoBackdrop.classList.add('active');
          momoBackdrop.setAttribute('aria-hidden', 'false');
          const closeBtn = document.getElementById('momo-modal-close');
          if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 120);
        }
        setTimeout(function() { if (modalForm) modalForm.reset(); }, 400);
      } else {
        const msg = encodeURIComponent(
          'Hello! I want the ' + pkg + ' package.' +
          ' My name is ' + name +
          ', business: ' + business +
          ', city: ' + city + '.'
        );
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
        if (modalForm) modalForm.style.display = 'none';
        if (modalSuccess) modalSuccess.style.display = 'block';
      }
    });
  }
}

// ── MoMo Modal ────────────────────────────────────────────────
function initMomoModal() {
  const backdrop = document.getElementById('momo-modal-backdrop');
  if (!backdrop) return;
  const closeBtn = document.getElementById('momo-modal-close');

  function closeMomo() {
    backdrop.classList.remove('active');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMomo);
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) closeMomo();
  });
  document.addEventListener('keydown', function(e) {
    if (backdrop.classList.contains('active') && e.key === 'Escape') closeMomo();
  });
}

// ── FAQ Accordion ─────────────────────────────────────────────
function initFAQ() {
  // Hide all answers on load
  document.querySelectorAll('.faq-answer').forEach(function(ans) {
    ans.hidden = true;
  });

  document.querySelectorAll('.faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Collapse all
      document.querySelectorAll('.faq-question').forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
        const ans = document.getElementById(b.getAttribute('aria-controls'));
        if (ans) ans.hidden = true;
      });

      // Expand clicked if it was closed
      if (!isExpanded) {
        btn.setAttribute('aria-expanded', 'true');
        const ans = document.getElementById(btn.getAttribute('aria-controls'));
        if (ans) ans.hidden = false;
      }
    });

    // Keyboard navigation
    btn.addEventListener('keydown', function(e) {
      const items = Array.from(document.querySelectorAll('.faq-question'));
      const idx   = items.indexOf(btn);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault(); items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault(); items[items.length - 1].focus();
      }
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initLangToggle();
  initStats();
  initAuditBanner();
  initWAFloat();
  initPricingModal();
  initMomoModal();
  initFAQ();
});
