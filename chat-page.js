/* ============================================================
   H@rts · chat-page.js
   The full-page assistant at app.hartsdigitalhub.com. app.js runs
   the conversation; this file only handles the page around it:
   the ?chat= deep link, the dust behind it, and keeping the
   message box in view on phones.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ?chat=<package|open>: the same deep links the homepage bubble honours */
  var chatParam = null;
  try { chatParam = new URLSearchParams(window.location.search).get('chat'); } catch (e) { chatParam = null; }
  if (chatParam) {
    var PKG_LABELS = { starter: 'Starter', essential: 'Essential', growth: 'Growth', pro: 'Pro', build: 'One-Time Build' };
    var label = PKG_LABELS[chatParam.toLowerCase()];
    var input = document.getElementById('chat-input');
    if (label && input) {
      input.value = "I'm interested in the " + label + ' package.';
      setTimeout(function () {
        input.focus({ preventScroll: true });
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
      }, 300);
    }
  }

  /* the dust, as on the homepage: slow, monochrome, paused when hidden */
  (function dust() {
    var cv = document.getElementById('dust');
    if (!cv || !cv.getContext || reduceMotion) { if (cv) cv.style.display = 'none'; return; }
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var motes = [], w = 0, h = 0, running = true, id = null;
    function size() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(20, (w * h) / 30000)));
      motes = [];
      for (var i = 0; i < n; i++) {
        motes.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.15 + 0.35,
          vy: -(Math.random() * 0.1 + 0.03), vx: (Math.random() - 0.5) * 0.05, a: Math.random() * 0.22 + 0.05 });
      }
    }
    function frame() {
      if (!running) { id = null; return; }
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += m.vy; m.x += m.vx;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        if (m.x < -4) m.x = w + 4; else if (m.x > w + 4) m.x = -4;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + m.a.toFixed(3) + ')'; ctx.fill();
      }
      id = requestAnimationFrame(frame);
    }
    function start() { if (!id && running) id = requestAnimationFrame(frame); }
    size(); start();
    window.addEventListener('resize', size, { passive: true });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) start(); else if (id) { cancelAnimationFrame(id); id = null; }
    });
  })();

  /* on phones the keyboard shrinks the viewport: keep the latest message in view */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      var log = document.getElementById('chat-messages');
      if (log) log.scrollTop = log.scrollHeight;
    });
  }
})();
