/* ============================================================
   H@rts — site-chrome.js
   Single source of truth for the site-wide HEADER and FOOTER.
   Every page includes this script and provides two placeholders:
     <header id="site-header"></header>
     <footer id="site-footer"></footer>
   The active nav item is chosen from <body data-page="…">.
   Requires hub.css (for .hub-nav / .hub-footer styling).
   Edit the markup here once → it changes on every page.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = '+237 622 341 343';
  var FOUNDED = 2024;   // company start year — footer shows FOUNDED–present

  // Primary navigation. `key` matches <body data-page="…"> for active state.
  var NAV = [
    { label: 'Services',            href: 'index.html#capabilities',   key: 'services' },
    { label: 'WhatsApp Automation', href: 'whatsapp-automation.html',  key: 'whatsapp' },
    { label: 'Portfolio',           href: 'index.html#portfolio',      key: 'portfolio' },
    { label: 'Pricing & SLAs',      href: 'index.html#pricing',        key: 'pricing' },
    { label: 'About Us',            href: 'about.html',                key: 'about' }
  ];

  // Footer link columns (carries both tracks: enterprise + SME/training).
  var FOOT_LINKS = [
    { label: 'Services',            href: 'index.html#capabilities' },
    { label: 'WhatsApp Automation', href: 'whatsapp-automation.html' },
    { label: 'Portfolio',           href: 'index.html#portfolio' },
    { label: 'Pricing & SLAs',      href: 'index.html#pricing' },
    { label: 'About',               href: 'about.html' },
    { label: 'SME Packages',        href: 'services.html' },
    { label: 'AI Training',         href: 'training.html' }
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
        '<a href="index.html" class="hub-brand" aria-label="H@rts home">H<b>@</b>rts</a>' +
        '<button class="hub-nav-toggle" id="hub-nav-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>' +
        '<ul class="hub-nav-links">' + items +
          '<li><a class="hub-cta" href="index.html#quote">Get a Project Quote</a></li>' +
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
        '<a href="index.html" class="hub-brand" style="font-size:1.1rem">H<b>@</b>rts</a>' +
        '<p style="margin-top:.6rem;max-width:34ch">Intelligent software &amp; next-gen digital hubs. Bilingual EN / FR. Cameroon &amp; beyond.</p>' +
      '</div>' +
      '<nav class="hub-footer-links" aria-label="Footer">' + links + '</nav>' +
      '<div>&copy; ' + years + ' H@rts &middot; ' + PHONE + '</div>';
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
