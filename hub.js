/* ============================================================
   H@RTS — hub.js
   Interactive layer for the enterprise "Digital Hub" site.
   Vanilla JS. No external libraries. Pairs with hub.css.
   Features:
     1. Hero node-network canvas (mouse-reactive) + fallback
     2. 3D tilt-on-hover for .tilt-card
     3. WhatsApp chat simulator (scripted)
     4. Pop-up chat bubble that hosts the existing app.js chat
     5. Lead form: POST /api/lead + "Send via WhatsApp"
     6. Mobile menu, scroll reveal
   All heavy effects are gated behind capability checks so the
   site degrades to a clean 2D layout on low-powered devices.
   ============================================================ */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '237622341343'; // H@rts business line (no +, for wa.me)

  // ── Capability detection ────────────────────────────────
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var smallScreen = window.matchMedia('(max-width: 760px)').matches;
  var lowCores = (navigator.hardwareConcurrency || 4) <= 2;
  var deviceMem = navigator.deviceMemory || 4;
  // Disable expensive 3D on touch/small/low-power/reduced-motion devices.
  var enable3D = !reduceMotion && !coarse && !smallScreen && !lowCores && deviceMem >= 4;

  if (!enable3D) document.documentElement.classList.add('no-3d');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ── 1. Hero node-network canvas ─────────────────────────
  function initHeroCanvas() {
    if (!enable3D) return;
    var canvas = document.getElementById('hub-hero-canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var w = 0, h = 0;
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    function resize() {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.min(70, Math.round((w * h) / 16000));
      nodes = [];
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          z: Math.random() * 0.7 + 0.3 // depth → size/parallax
        });
      }
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // gentle attraction to mouse for the "reacts to movement" feel
        var dxm = mouse.x - n.x, dym = mouse.y - n.y;
        var dm2 = dxm * dxm + dym * dym;
        if (dm2 < 26000) {
          n.x += dxm * 0.0009;
          n.y += dym * 0.0009;
        }

        // links
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 15000) {
            var a = (1 - d2 / 15000) * 0.28;
            ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
        // node
        var r = n.z * 1.9;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + n.z * 0.45).toFixed(2) + ')';
        ctx.fill();
      }
      requestAnimationFrame(step);
    }

    var hero = canvas.closest('.hub-hero') || canvas;
    hero.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    // Pause when off-screen to save battery/CPU
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var wasRunning = running;
          running = en.isIntersecting;
          if (running && !wasRunning) step();
        });
      }, { threshold: 0.01 }).observe(canvas);
    }

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    resize();
    step();
  }

  // ── 2. 3D tilt-on-hover ─────────────────────────────────
  function initTilt() {
    if (!enable3D) return;
    var cards = document.querySelectorAll('.tilt-card');
    cards.forEach(function (card) {
      var max = 9; // degrees
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * max * 2;
        var ry = (px - 0.5) * max * 2;
        card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  // ── 3. WhatsApp chat simulator ──────────────────────────
  function initChatSim() {
    var feed = document.getElementById('sim-feed');
    if (!feed) return;
    var script = [
      { who: 'user', text: 'Hi, do you have the 50" TV in stock?' },
      { who: 'typing' },
      { who: 'bot', text: 'Yes! 3 units in stock at the Douala branch — 285,000 XAF. Want me to reserve one? 📦' },
      { who: 'user', text: 'Yes please, reserve 1' },
      { who: 'typing' },
      { who: 'bot', text: 'Done ✅ Order #4821 created. Pay via MoMo or pick up in-store. A human agent can confirm delivery — type "agent" anytime.' }
    ];
    if (reduceMotion) {
      // Render statically, no animation loop
      script.forEach(function (s) { if (s.who !== 'typing') feed.appendChild(bubble(s)); });
      return;
    }
    var i = 0;
    function bubble(s) {
      var el = document.createElement('div');
      if (s.who === 'typing') {
        el.className = 'sim-typing';
        el.innerHTML = '<span></span><span></span><span></span>';
      } else {
        el.className = 'sim-msg ' + s.who;
        el.innerHTML = s.text + (s.who === 'user' ? ' <span class="tick">✓✓</span>' : '');
      }
      return el;
    }
    function next() {
      if (i >= script.length) {
        // loop after a pause
        setTimeout(function () { feed.innerHTML = ''; i = 0; next(); }, 3500);
        return;
      }
      var s = script[i++];
      var el = bubble(s);
      feed.appendChild(el);
      feed.scrollTop = feed.scrollHeight;
      var delay = s.who === 'typing' ? 900 : (s.who === 'bot' ? 1500 : 1100);
      if (s.who === 'typing') {
        setTimeout(function () { if (el.parentNode) feed.removeChild(el); next(); }, delay);
      } else {
        setTimeout(next, delay);
      }
    }
    // Start only when scrolled into view
    if ('IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting && !started) { started = true; next(); obs.disconnect(); }
      }, { threshold: 0.3 }).observe(feed);
    } else { next(); }

    // expose for static-render helper above
    function bubbleWrap(s){ return bubble(s); }
    window.__simBubble = bubbleWrap;
  }

  // ── 4. Pop-up chat bubble hosting the existing app.js chat ─
  function initChatWidget() {
    var widget = document.getElementById('harts-chat-widget');
    var openBtn = document.getElementById('fab-chat');
    var closeBtn = document.getElementById('chat-widget-close');
    if (!widget || !openBtn) return;

    function open() {
      widget.classList.add('open');
      openBtn.setAttribute('aria-expanded', 'true');
      var input = document.getElementById('chat-input');
      if (input) setTimeout(function () { input.focus(); }, 250);
    }
    function close() {
      widget.classList.remove('open');
      openBtn.setAttribute('aria-expanded', 'false');
    }
    function toggle() { widget.classList.contains('open') ? close() : open(); }

    openBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && widget.classList.contains('open')) close();
    });

    // Auto pop-up on landing (once per browser session), respecting reduced motion timing
    try {
      if (!sessionStorage.getItem('harts_chat_greeted')) {
        setTimeout(open, reduceMotion ? 400 : 1600);
        sessionStorage.setItem('harts_chat_greeted', '1');
      }
    } catch (e) { /* sessionStorage blocked — skip auto-open */ }
  }

  // ── 5. Lead form: dual submit ───────────────────────────
  function buildWaMessage(data) {
    var lines = [
      'Hello H@rts! I would like a project quote.',
      '',
      'Name: ' + (data.name || '—'),
      'Email: ' + (data.email || '—'),
      'WhatsApp: ' + (data.phone || '—'),
      'Service: ' + (data.service || '—'),
      'Budget: ' + (data.budget || '—'),
      '',
      'Details: ' + (data.description || '—')
    ];
    return lines.join('\n');
  }

  function readForm(form) {
    return {
      name: (form.name && form.name.value || '').trim(),
      email: (form.email && form.email.value || '').trim(),
      phone: (form.phone && form.phone.value || '').trim(),
      service: (form.service && form.service.value || '').trim(),
      budget: (form.budget && form.budget.value || '').trim(),
      description: (form.description && form.description.value || '').trim()
    };
  }

  function saveLead(data, cb) {
    // Fire-and-forget POST to the existing /api/lead endpoint.
    // Email + budget are folded into `summary` (no dedicated columns).
    var payload = {
      name: data.name,
      phone: data.phone,
      package: data.service,
      summary: 'Service: ' + data.service + ' | Budget: ' + data.budget +
               ' | Email: ' + data.email + ' | ' + data.description,
      lang: (document.documentElement.lang || 'en'),
      source: 'website-lead'
    };
    if (!('fetch' in window)) { cb && cb(); return; }
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function () { cb && cb(true); })
      .catch(function () { cb && cb(false); });
  }

  function initLeadForm() {
    var form = document.getElementById('lead-form');
    if (!form) return;
    var status = document.getElementById('lead-status');
    var waBtn = document.getElementById('lead-wa-btn');

    function validate(data) {
      if (!data.name) return 'Please add your name.';
      if (!data.phone && !data.email) return 'Add a WhatsApp number or email so we can reach you.';
      return null;
    }

    function toWhatsApp() {
      var data = readForm(form);
      var err = validate(data);
      if (err) { if (status) status.textContent = err; return; }
      saveLead(data); // persist in the background too
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWaMessage(data));
      window.open(url, '_blank', 'noopener');
      if (status) status.textContent = 'Opening WhatsApp… you can also submit the form.';
    }

    if (waBtn) waBtn.addEventListener('click', toWhatsApp);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = readForm(form);
      var err = validate(data);
      if (err) { if (status) status.textContent = err; return; }
      if (status) status.textContent = 'Sending…';
      saveLead(data, function (ok) {
        if (status) {
          status.textContent = ok === false
            ? 'Saved locally — tap "Send via WhatsApp" to reach us directly.'
            : 'Thanks! Your request is in — we\'ll reply within one business day.';
        }
        if (ok !== false) form.reset();
      });
    });
  }

  // ── 6. Mobile menu + scroll reveal ──────────────────────
  function initNav() {
    var nav = document.querySelector('.hub-nav');
    var toggle = document.getElementById('hub-nav-toggle');
    if (!nav || !toggle) return;
    toggle.addEventListener('click', function () {
      nav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('menu-open'));
    });
    nav.querySelectorAll('.hub-nav-link, .hub-cta').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('menu-open'); });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ── Boot ────────────────────────────────────────────────
  ready(function () {
    initHeroCanvas();
    initTilt();
    initChatSim();
    initChatWidget();
    initLeadForm();
    initNav();
    initReveal();
  });
})();
