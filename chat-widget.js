/* ============================================================
   H@rts · chat-widget.js
   Opens and closes the AI assistant bubble. The conversation
   itself is app.js, untouched: this file only owns the panel.

   Behaviour:
     · the FAB toggles the panel, Escape closes it
     · ?chat=<package|open> deep links open it with the input prefilled
     · once per browser session it opens by itself, but only after
       the visitor has come through the descent, never over the hero
     · anything with .js-open-chat opens it (the pricing band uses this)
   ============================================================ */
(function () {
  'use strict';

  var widget = document.getElementById('harts-chat-widget');
  var openBtn = document.getElementById('fab-chat');
  var closeBtn = document.getElementById('chat-widget-close');
  var stack = document.querySelector('.fab-stack');
  if (!widget || !openBtn) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('.hero');

  function open() {
    widget.classList.add('open');
    if (stack) stack.classList.add('chat-open');
    widget.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    var input = document.getElementById('chat-input');
    if (input) setTimeout(function () { input.focus({ preventScroll: true }); }, reduceMotion ? 0 : 260);
  }
  function close() {
    widget.classList.remove('open');
    if (stack) stack.classList.remove('chat-open');
    widget.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    if (widget.contains(document.activeElement)) openBtn.focus({ preventScroll: true });
  }
  function toggle() { widget.classList.contains('open') ? close() : open(); }

  openBtn.addEventListener('click', toggle);
  if (closeBtn) closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && widget.classList.contains('open')) close();
  });
  document.querySelectorAll('.js-open-chat').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  /* Deep link: /?chat=<package|open>. Buying intent from a social link or an
     old services URL lands straight in the assistant with the line prefilled. */
  var chatParam = null;
  try { chatParam = new URLSearchParams(window.location.search).get('chat'); } catch (e) { chatParam = null; }
  if (chatParam) {
    var PKG_LABELS = { starter: 'Starter', essential: 'Essential', growth: 'Growth', pro: 'Pro', build: 'One-Time Build' };
    open();
    var label = PKG_LABELS[chatParam.toLowerCase()];
    if (label) {
      var input = document.getElementById('chat-input');
      if (input) {
        input.value = "I'm interested in the " + label + " package.";
        setTimeout(function () {
          input.focus({ preventScroll: true });
          try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
        }, 320);
      }
    }
    return;
  }

  /* Once per session the assistant says hello, as a small nudge beside its
     button rather than a full panel over the page. It waits until the hero
     descent has settled (or, on the static hero, until the visitor has
     scrolled into the page). Clicking it opens the conversation. */
  var greeted = false;
  try { greeted = Boolean(sessionStorage.getItem('harts_chat_greeted')); } catch (e) { greeted = true; }
  if (greeted) return;

  function pastHero() {
    if (!hero) return window.scrollY > window.innerHeight * 0.6;
    var range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return window.scrollY > window.innerHeight * 0.6;
    var p = -hero.getBoundingClientRect().top / range;
    return p >= 0.97;
  }

  var nudge = null;
  function showNudge() {
    if (nudge || widget.classList.contains('open')) return;
    nudge = document.createElement('div');
    nudge.className = 'chat-nudge';
    nudge.setAttribute('role', 'status');
    nudge.innerHTML =
      '<button class="chat-nudge-body" type="button">' +
        '<span class="chat-nudge-who mono">H@rts assistant</span>' +
        '<span class="chat-nudge-text">What are you trying to fix? Ask us anything, in English or French.</span>' +
      '</button>' +
      '<button class="chat-nudge-close" type="button" aria-label="Dismiss">×</button>';
    if (stack) stack.insertBefore(nudge, stack.firstChild); else document.body.appendChild(nudge);
    requestAnimationFrame(function () { nudge.classList.add('in'); });
    nudge.querySelector('.chat-nudge-body').addEventListener('click', function () { hideNudge(); open(); });
    nudge.querySelector('.chat-nudge-close').addEventListener('click', hideNudge);
    /* it leaves on its own, so it never becomes furniture */
    setTimeout(hideNudge, 14000);
  }
  function hideNudge() {
    if (!nudge) return;
    var n = nudge; nudge = null;
    n.classList.remove('in');
    setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, reduceMotion ? 0 : 400);
  }
  openBtn.addEventListener('click', hideNudge);

  var armed = true;
  function check() {
    if (!armed || !pastHero()) return;
    armed = false;
    window.removeEventListener('scroll', check);
    try { sessionStorage.setItem('harts_chat_greeted', '1'); } catch (e) {}
    setTimeout(showNudge, reduceMotion ? 300 : 1200);
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();
