/* ============================================================
   H@rts — site-chrome.js
   Single source of truth for the HEADER and FOOTER on the pages
   that still use the hub layout (training, build log, legal, and
   the app pages). The homepage is the cinematic one-page site and
   carries its own nav and footer.
   Every hub page provides two placeholders:
     <header id="site-header"></header>
     <footer id="site-footer"></footer>
   The active nav item is chosen from <body data-page="…">.
   Requires hub.css (for .hub-nav / .hub-footer styling).
   Edit the markup here once → it changes on every page.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = '+237 622 341 343';
  var PHONE_E164 = '+237622341343';   // tel: / wa.me form (no spaces)
  var EMAIL = 'support@hartsdigitalhub.com';
  var FOUNDED = 2024;   // company start year — footer shows FOUNDED–present

  // Primary navigation. `key` matches <body data-page="…"> for active state.
  // Section links point at the one-page homepage (canonical root, no index.html,
  // so Vercel's clean-URL redirect never strips a hash or query).
  var NAV = [
    { label: 'Web apps',       href: '/#web-apps',       key: 'web-apps' },
    { label: 'Chatbots',       href: '/#chatbots',       key: 'chatbots' },
    { label: 'Work',           href: '/#work',           key: 'work' },
    { label: 'Pricing',        href: '/#pricing',        key: 'pricing' },
    { label: 'Build Log',      href: 'insights.html',    key: 'insights' }
  ];

  var FOOT_LINKS = [
    { label: 'Home',               href: '/' },
    { label: 'Web apps',           href: '/#web-apps' },
    { label: 'Chatbots',           href: '/#chatbots' },
    { label: 'Work',               href: '/#work' },
    { label: 'Pricing',            href: '/#pricing' },
    { label: 'Build Log',          href: 'insights.html' },
    { label: 'Training',           href: 'training.html' },
    { label: 'Get a quote',        href: '/#quote' },
    { label: 'Leave a review',     href: 'reviews.html' },
    { label: 'Privacy Policy',     href: 'privacy-policy.html' },
    { label: 'Terms of Service',   href: 'terms.html' }
  ];

  function navHTML(page) {
    var items = NAV.map(function (l) {
      var on = l.key === page;
      return '<li><a class="hub-nav-link' + (on ? ' active' : '') + '"' +
             (on ? ' aria-current="page"' : '') +
             ' href="' + l.href + '">' + l.label + '</a></li>';
    }).join('');
    return '' +
      '<div class="hub-nav-inner">' +
        '<a href="/" class="hub-brand" aria-label="H@rts home">H<b>@</b>rts</a>' +
        '<button class="hub-nav-toggle" id="hub-nav-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>' +
        '<ul class="hub-nav-links">' + items +
          '<li><a class="hub-cta" href="/#quote">Get a build quote</a></li>' +
        '</ul>' +
      '</div>';
  }

  function footHTML() {
    var now = new Date().getFullYear();
    var years = now > FOUNDED ? FOUNDED + '–' + now : '' + FOUNDED;
    var links = FOOT_LINKS.map(function (l) {
      return '<a href="' + l.href + '">' + l.label + '</a>';
    }).join('');
    return '' +
      '<div>' +
        '<a href="/" class="hub-brand" style="font-size:1.1rem">H<b>@</b>rts</a>' +
        '<p style="margin-top:.6rem;max-width:34ch">Web apps and AI chatbots, built to work together: the system your team runs on, and the bot that answers your customers from it. Bilingual EN / FR. Douala, Cameroon.</p>' +
      '</div>' +
      '<nav class="hub-footer-links" aria-label="Footer">' + links + '</nav>' +
      // Contact block — real, clickable ways to reach a human, not just the form.
      '<address class="hub-footer-contact" style="font-style:normal">' +
        '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>' +
        '<a href="tel:' + PHONE_E164 + '">' + PHONE + '</a>' +
        '<a href="https://wa.me/' + PHONE_E164.replace('+', '') + '" target="_blank" rel="noopener">WhatsApp us</a>' +
        '<span>Douala, Cameroon &middot; Fully virtual &middot; Meetings by appointment only</span>' +
      '</address>' +
      '<div>&copy; ' + years + ' H@rts &middot; All rights reserved.</div>';
  }

  function mount() {
    var page = (document.body.getAttribute('data-page') || '').toLowerCase();

    var header = document.getElementById('site-header');
    if (header) {
      header.className = 'hub-nav';
      header.innerHTML = navHTML(page);
    }

    var footer = document.getElementById('site-footer');
    if (footer) {
      footer.className = 'hub-footer';
      footer.innerHTML = footHTML();
    }

    // Mobile menu toggle (owned here so every page gets it)
    var toggle = document.getElementById('hub-nav-toggle');
    if (header && toggle) {
      toggle.addEventListener('click', function () {
        header.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', header.classList.contains('menu-open'));
      });
      header.querySelectorAll('.hub-nav-link, .hub-cta').forEach(function (a) {
        a.addEventListener('click', function () { header.classList.remove('menu-open'); });
      });
    }
  }

  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
