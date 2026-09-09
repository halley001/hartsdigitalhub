/* ============================================================
   H@rts · The Descent
   Plain vanilla JS. No framework, no build step.
   ============================================================ */
(function () {
  'use strict';

  var VIDEO_URL = 'assets/hero-scrub.mp4';
  var POSTER_URL = 'assets/hero-poster.jpg';
  var VIDEO_BYTES = 2745649;   /* the real byte size, used when Content-Length is missing */

  var video = document.getElementById('hero-video');
  var stage = document.getElementById('stage');
  var poster = document.getElementById('poster');
  var loader = document.getElementById('loader');
  var hero = document.querySelector('.hero');
  var cue = document.getElementById('cue');
  var nav = document.querySelector('.nav');

  var bands = [].slice.call(document.querySelectorAll('.band'));

  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) {
    var t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* seeded generator, so the "random" scatter is identical on every load */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { return (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  }

  /* ==========================================================
     1. BAND SETUP · split the text, assign entrances and sides
     ========================================================== */

  /* Bands 1 to 3 sit right, where the footage stays dark and calm.
     Bands 4 and 5 step left, because the right side brightens as the
     mist arrives. The layout follows the delivered footage. */
  var SIDES = ['right', 'right', 'right', 'left', 'left'];
  var SCRIMS = [0.66, 0.62, 0.66, 0.76, 0.72];

  bands.forEach(function (b, i) {
    b.a = parseFloat(b.dataset.a);
    b.bEnd = parseFloat(b.dataset.b);
    b.ramp = b.dataset.ramp ? parseFloat(b.dataset.ramp) : 0;
    b.spread = b.dataset.spread ? parseFloat(b.dataset.spread) : 0.5;
    b.entrance = b.dataset.entrance;
    b.op = -1;
    b.k = -1;
    b.setAttribute('data-side', SIDES[i] || 'right');
    b.style.setProperty('--scrim', SCRIMS[i] || 0.66);
    b.classList.add('e-' + b.entrance);
    splitTitle(b, i);
  });

  function splitTitle(band, index) {
    var title = band.querySelector('.band-title');
    if (!title) return;
    var text = title.textContent.trim();
    var mode = title.dataset.split || 'word';
    var rand = rng(9301 + index * 7919);

    title.textContent = '';

    var sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = text;
    title.appendChild(sr);

    if (band.entrance === 'blur') {
      /* two stacked copies crossfaded by opacity only; the blur stays static */
      var wrap = document.createElement('span');
      wrap.className = 'vis';
      wrap.setAttribute('aria-hidden', 'true');
      var soft = document.createElement('span');
      soft.className = 'soft';
      soft.textContent = text;
      var sharp = document.createElement('span');
      sharp.className = 'sharp';
      sharp.textContent = text;
      wrap.appendChild(soft);
      wrap.appendChild(sharp);
      title.appendChild(wrap);
      return;
    }

    var vis = document.createElement('span');
    vis.className = 'vis';
    vis.setAttribute('aria-hidden', 'true');

    var words = text.split(' ');
    var totalChars = text.replace(/\s/g, '').length;
    var charIndex = 0;

    words.forEach(function (word, wi) {
      var w = document.createElement('span');
      w.className = 'w';

      if (mode === 'word') {
        w.textContent = word;
        /* (e) rise: ordered threshold, reading order */
        w.style.setProperty('--th', (wi / Math.max(1, words.length) * 0.5).toFixed(3));
      } else {
        for (var ci = 0; ci < word.length; ci++) {
          var c = document.createElement('span');
          c.className = 'c';
          c.textContent = word[ci];

          if (band.entrance === 'grid') {
            /* (b) ordered stagger, horizontal only */
            c.style.setProperty('--th', (charIndex / totalChars * band.spread + rand() * 0.06).toFixed(3));
            c.style.setProperty('--jx', ((rand() * 40 + 18) * -1).toFixed(1) + 'px');
          } else if (band.entrance === 'weave') {
            /* (i) alternating from above and below */
            c.style.setProperty('--th', (charIndex / totalChars * band.spread + rand() * 0.05).toFixed(3));
            c.style.setProperty('--jy', ((charIndex % 2 ? 1 : -1) * (rand() * 26 + 16)).toFixed(1) + 'px');
            c.style.setProperty('--jx', '0px');
          } else {
            /* (a) scatter: seeded random offsets in every direction */
            c.style.setProperty('--th', (rand() * band.spread).toFixed(3));
            c.style.setProperty('--jx', ((rand() - 0.5) * 90).toFixed(1) + 'px');
            c.style.setProperty('--jy', ((rand() - 0.5) * 74).toFixed(1) + 'px');
            c.style.setProperty('--jr', ((rand() - 0.5) * 24).toFixed(1) + 'deg');
          }
          w.appendChild(c);
          charIndex++;
        }
      }
      vis.appendChild(w);
      if (wi < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });

    title.appendChild(vis);
  }

  /* ==========================================================
     2. HERO PROGRESS, LERP AND SEEK GATING
     ========================================================== */

  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroOnScreen = true;
  var seekBusy = false, pendingTime = null;
  var loadK = 0, loadStart = 0, loadRamping = false;

  function heroProgress() {
    if (!hero) return 0;
    var range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
  }

  function requestSeek(t) {
    if (!video.duration || isNaN(t)) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    try { video.currentTime = t; } catch (e) { seekBusy = false; }
  }

  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (pendingTime !== null) {
      var t = pendingTime;
      pendingTime = null;
      requestSeek(t);
    }
  });

  video.addEventListener('error', function () {   /* the deadlock escape */
    seekBusy = false;
    pendingTime = null;
    failVideo();
  });

  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    var k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

    if (loadRamping) {
      loadK = clamp((now - loadStart) / 900, 0, 1);
      if (loadK >= 1) loadRamping = false;
    }

    var settled = Math.abs(target - shown) < 0.0005;
    if (settled && !loadRamping) {
      shown = target;
      rafId = null;
      lastTick = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }

    if (video.duration) requestSeek(shown * video.duration);
    updateCaptions(shown);
  }

  function onScroll() {
    target = heroProgress();
    if (rafId === null && heroOnScreen) {
      lastTick = 0;
      rafId = requestAnimationFrame(tick);
    }
    if (cue) {
      var gone = target > 0.03;
      if (gone !== cue._gone) { cue._gone = gone; cue.classList.toggle('gone', gone); }
    }
  }

  function updateCaptions(p) {
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var a = b.a, e = b.bEnd;
      var f = Math.min(0.02, (e - a) / 3);
      var inRamp = (i === 0) ? 0 : f;                 /* band one opens settled */
      var outRamp = (i === bands.length - 1) ? 0 : f; /* the settle never fades out */
      var op = smoothstep(p, a - (inRamp ? 0 : 0.0001), a + inRamp) * (1 - smoothstep(p, e - outRamp, e));
      if (inRamp === 0) op = (p >= a ? 1 : 0) * (1 - smoothstep(p, e - outRamp, e));

      var ramp = b.ramp || Math.min(0.025, (e - a) * 0.35);
      var kv = clamp((p - a) / ramp, 0, 1);
      if (i === 0) kv = Math.max(kv, loadK);

      /* delta-gated: touch the DOM only when the value actually moved */
      if (Math.abs(op - b.op) > 0.004) {
        b.op = op;
        b.style.opacity = op.toFixed(3);
        var on = op > 0.02 ? '1' : '0';
        if (on !== b._on) { b._on = on; b.setAttribute('data-on', on); }
      }
      if (Math.abs(kv - b.k) > 0.008) { b.k = kv; b.style.setProperty('--k', kv.toFixed(3)); }
    }
    /* which band the copy is on, so the mark can keep to the opposite lane */
    var lead = -1, leadOp = 0.02;
    for (var j = 0; j < bands.length; j++) { if (bands[j].op > leadOp) { leadOp = bands[j].op; lead = j; } }
    if (lead !== -1 && stage && stage._band !== lead) {
      stage._band = lead;
      stage.setAttribute('data-band', String(lead + 1));
    }
  }

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroOnScreen = entries[0].isIntersecting;
      if (!heroOnScreen && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      else if (heroOnScreen && scrubOn) onScroll();
    }, { rootMargin: '10px' }).observe(hero);
  }

  /* ==========================================================
     3. THE STREAMED BLOB LOADER
     ========================================================== */

  var heroInit = false;

  function initHeroOnce() {
    if (heroInit) return;
    heroInit = true;

    /* the poster wins the bandwidth race by design */
    poster.style.backgroundImage = "url('" + POSTER_URL + "')";

    var started = false;
    function startBlobFetch() {
      if (started) return;
      started = true;
      loadHeroBlob().catch(failVideo);
    }
    var img = new Image();
    img.onload = startBlobFetch;
    img.onerror = startBlobFetch;
    img.src = POSTER_URL;
    setTimeout(startBlobFetch, 4000);

    loadStart = performance.now();
    loadRamping = true;
  }

  function loadHeroBlob() {
    var ring = loader ? loader.querySelector('.ring-fill') : null;
    var ctrl = new AbortController();
    var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);

    return fetch(VIDEO_URL, { signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('video unavailable');
      var total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
      var reader = res.body.getReader();
      var chunks = [];
      var got = 0, lastRing = 0;

      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(watchdog);
          watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value);
          got += r.value.length;
          var frac = Math.min(1, got / total);
          var now = performance.now();
          if (ring && (now - lastRing > 100 || frac === 1)) {
            lastRing = now;
            ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
          }
          return pump();
        });
      }

      return pump().then(function () {
        clearTimeout(watchdog);
        if (ring) ring.style.setProperty('--ld', 0);
        video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.load();
        video.addEventListener('canplay', function () {
          requestSeek(heroProgress() * video.duration);
          stage.classList.add('video-ready');
        }, { once: true });
      });
    });
  }

  function failVideo() {
    if (loader && !loader._failed) {
      loader._failed = true;
      loader.innerHTML =
        '<svg class="scroll-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
        '<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    stage.classList.add('video-failed');
  }

  /* ==========================================================
     4. THE FIVE STATIC-HERO GATES · live, in both directions
     ========================================================== */

  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var MQLS = GATES.map(function (q) { return matchMedia(q); });
  var scrubOn = false;

  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    initHeroOnce();
    window.addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(function (b) { b.op = -1; b.k = -1; });
    unpinFinalStates();
    updateCaptions(heroProgress());
    onScroll();
  }

  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function applyHeroMode() {
    if (MQLS.some(function (m) { return m.matches; })) disableScrub();
    else enableScrub();
  }
  MQLS.forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', applyHeroMode);
    else m.addListener(applyHeroMode);
  });

  /* ==========================================================
     5. THE REPLY LINE, REVEALS AND THE NAV
     ========================================================== */

  var rl = document.getElementById('reply-line');
  var rlDraw = document.getElementById('rl-draw');
  var lastRl = -1;

  function updatePage() {
    if (rl && rlDraw) {
      var r = rl.getBoundingClientRect();
      var span = r.height - window.innerHeight * 0.4;
      var v = span > 0 ? clamp((window.innerHeight * 0.72 - r.top) / span, 0, 1) : 1;
      if (Math.abs(v - lastRl) > 0.006) { lastRl = v; rlDraw.style.setProperty('--rl', v.toFixed(3)); }
    }
    if (nav) {
      var solid = window.scrollY > window.innerHeight * 0.6;
      if (solid !== nav._solid) { nav._solid = solid; nav.classList.toggle('solid', solid); }
    }
  }
  window.addEventListener('scroll', updatePage, { passive: true });
  window.addEventListener('resize', updatePage);

  var revealables = [].slice.call(document.querySelectorAll('.reveal, .divider'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        /* retire the stagger delays once the entrance has played */
        setTimeout(function () { el.classList.add('done'); }, 1800);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in', 'done'); });
  }

  /* ==========================================================
     6. THE DUST LAYER · one fixed environment behind everything
     ========================================================== */

  (function dustLayer() {
    var cv = document.getElementById('dust');
    if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) { if (cv) cv.style.display = 'none'; return; }
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var motes = [];
    var w = 0, h = 0, running = true, id = null;

    function size() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp((w * h) / 26000, 26, 90));
      motes = [];
      var rand = rng(4242);
      for (var i = 0; i < n; i++) {
        motes.push({
          x: rand() * w, y: rand() * h,
          r: rand() * 1.15 + 0.35,
          vy: -(rand() * 0.1 + 0.03),
          vx: (rand() - 0.5) * 0.05,
          a: rand() * 0.24 + 0.05
        });
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
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + m.a.toFixed(3) + ')';
        ctx.fill();
      }
      id = requestAnimationFrame(frame);
    }

    function start() { if (!id && running) id = requestAnimationFrame(frame); }
    size(); start();
    window.addEventListener('resize', function () { size(); }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) start(); else if (id) { cancelAnimationFrame(id); id = null; }
    });
  })();

  /* ==========================================================
     7. HOLD TO REPLY · the one designed interactive moment
     ========================================================== */

  (function holdToReply() {
    var rig = document.getElementById('hold-rig');
    var btn = document.getElementById('hold-btn');
    var timerEl = document.getElementById('hold-timer');
    var finalEl = document.getElementById('hold-final');
    if (!rig || !btn) return;

    var HOLD_MS = 6400;
    var progress = 0, holding = false, id = null, last = 0, elapsed = 0;
    var lastTimerText = '', lastTimerAt = 0;

    function showTimer(now) {
      var text = (elapsed / 1000).toFixed(1) + 's';
      if (now - lastTimerAt < 100) return;
      if (text === lastTimerText) return;
      lastTimerText = text; lastTimerAt = now;
      timerEl.textContent = text;
    }

    function step(now) {
      var dt = Math.min(64, now - (last || now));
      last = now;
      if (holding) {
        progress = clamp(progress + dt / HOLD_MS, 0, 1);
        elapsed += dt;
        showTimer(now);
        if (progress >= 1) return finish();
      } else {
        progress = clamp(progress - dt / (HOLD_MS * 0.55), 0, 1);
      }
      btn.style.setProperty('--h', progress.toFixed(3));
      rig.classList.toggle('q2', progress > 0.34);
      rig.classList.toggle('q3', progress > 0.68);
      if (holding || progress > 0) id = requestAnimationFrame(step);
      else { id = null; last = 0; }
    }

    function finish() {
      holding = false;
      progress = 1;
      btn.style.setProperty('--h', '1');
      if (id) { cancelAnimationFrame(id); id = null; }
      if (finalEl) finalEl.textContent = (elapsed / 1000).toFixed(1);
      rig.classList.add('q2', 'q3', 'done');
    }

    function down(e) {
      if (rig.classList.contains('done')) return;
      e.preventDefault();
      holding = true;
      if (!id) { last = 0; id = requestAnimationFrame(step); }
    }
    function up() {
      holding = false;
      if (!id && progress > 0) { last = 0; id = requestAnimationFrame(step); }
    }

    btn.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    btn.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') down(e);
    });
    btn.addEventListener('keyup', up);
    btn.addEventListener('blur', up);

    rig._complete = function () {
      elapsed = 6400;
      if (finalEl) finalEl.textContent = '6.4';
      finish();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) rig._complete();
  })();

  /* ==========================================================
     8. THE FORM
     ========================================================== */

  /* The site runs on Vercel, so the form posts to the same /api/lead the
     assistant uses: stored in Supabase and a person is notified. If the server
     cannot be reached the lead is held in localStorage and retried on the next
     visit, and the visitor is handed a WhatsApp link that carries the whole
     form, so nothing typed is ever lost. Mirrors the queue in hub.js. */
  (function quoteForm() {
    var form = document.getElementById('qform');
    var ok = document.getElementById('qsuccess');
    var fail = document.getElementById('qfail');
    var failWa = document.getElementById('qfail-wa');
    var note = document.getElementById('qnote');
    if (!form || !ok) return;

    var WA = '237622341343';
    var PENDING_KEY = 'harts_pending_leads';
    var PENDING_MAX = 20;

    function readPending() {
      try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch (e) { return []; }
    }
    function writePending(list) {
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-PENDING_MAX))); } catch (e) {}
    }
    function queueLead(payload) {
      try {
        var list = readPending();
        list.push({ payload: payload, queued_at: new Date().toISOString() });
        writePending(list);
        return readPending().length > 0;
      } catch (e) { return false; }
    }
    function postLead(payload) {
      return fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) { return res.ok; });
    }
    /* retry anything an earlier visit could not send; best effort, in order */
    function flushPending() {
      if (!('fetch' in window)) return;
      var list = readPending();
      if (!list.length) return;
      var remaining = [], i = 0;
      (function next() {
        if (i >= list.length) { writePending(remaining); return; }
        var item = list[i++];
        postLead(item.payload)
          .then(function (sent) { if (!sent) remaining.push(item); })
          .catch(function () { remaining.push(item); })
          .then(next);
      })();
    }

    function read() {
      var d = new FormData(form);
      var g = function (k) { return String(d.get(k) || '').trim(); };
      return { name: g('name'), email: g('email'), phone: g('phone'), need: g('need'), budget: g('budget'), message: g('message') };
    }
    function payloadFor(v) {
      /* email and budget fold into summary (no columns on `leads`); email is
         passed separately so the notifier can use it as a reply-to */
      return {
        name: v.name,
        phone: v.phone,
        email: v.email,
        package: v.need,
        summary: 'Need: ' + v.need + ' | Budget: ' + v.budget + ' | Email: ' + v.email + ' | ' + v.message,
        lang: document.documentElement.lang || 'en',
        source: 'website-lead'
      };
    }
    function waLink(v) {
      var text =
        'Hello H@rts, I would like a build quote.\n\n' +
        'Name: ' + (v.name || '-') + '\n' +
        'Email: ' + (v.email || '-') + '\n' +
        'WhatsApp: ' + (v.phone || '-') + '\n' +
        'Need: ' + (v.need || '-') + '\n' +
        'Budget: ' + (v.budget || '-') + '\n\n' +
        (v.message || '');
      return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    }

    function showSuccess() {
      form.hidden = true;
      ok.hidden = false;
      ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    function showFailure(v) {
      if (failWa) failWa.href = waLink(v);
      form.hidden = true;
      if (fail) { fail.hidden = false; fail.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = false;
      ['name', 'email'].forEach(function (n) {
        var f = form.elements[n];
        if (!f.value.trim()) { invalid = true; f.style.borderColor = '#fff'; if (!invalid) f.focus(); }
      });
      if (invalid) {
        if (note) note.textContent = 'A name and an email are enough. We reply to the email.';
        return;
      }

      var v = read();
      var payload = payloadFor(v);
      form.classList.add('is-sending');
      if (note) note.textContent = 'Sending…';

      var finish = function (sent) {
        form.classList.remove('is-sending');
        if (sent) { showSuccess(); return; }
        queueLead(payload);
        showFailure(v);
      };

      if (!('fetch' in window)) { finish(false); return; }
      postLead(payload).then(finish).catch(function () { finish(false); });
    });

    flushPending();
  })();

  /* ==========================================================
     9. REDUCED MOTION, LIVE, IN BOTH DIRECTIONS
     ========================================================== */

  function pinToFinalStates() {
    document.querySelectorAll('.reveal, .divider').forEach(function (el) {
      el.classList.add('in', 'done', 'pinned');
    });
    if (rlDraw) rlDraw.style.setProperty('--rl', '1');
    var rig = document.getElementById('hold-rig');
    if (rig && rig._complete && !rig.classList.contains('done')) rig._complete();
    var cv = document.getElementById('dust');
    if (cv) cv.style.display = 'none';
  }

  function unpinFinalStates() {
    document.querySelectorAll('.pinned').forEach(function (el) { el.classList.remove('pinned'); });
    lastRl = -1;
    updatePage();
    var cv = document.getElementById('dust');
    if (cv) cv.style.display = '';
  }

  var rmq = matchMedia('(prefers-reduced-motion: reduce)');
  var onRM = function (e) {
    if (e.matches) pinToFinalStates();
    else applyHeroMode();
  };
  if (rmq.addEventListener) rmq.addEventListener('change', onRM); else rmq.addListener(onRM);

  /* pause every animation on a hidden tab */
  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('paused', document.hidden);
  });

  /* ==========================================================
     10. BOOT
     ========================================================== */

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  applyHeroMode();
  updatePage();
  if (rmq.matches) pinToFinalStates();
  requestAnimationFrame(function () { document.body.classList.add('ready'); });

})();

/* ============================================================
   11. THE 3D LAYER
   The extruded mark turning in the hero, pointer parallax on the
   stage, and a tilt on the raised cards further down. Everything
   here is decoration: gated to fine pointers, off under reduced
   motion, and the page reads identically without it.
   ============================================================ */
(function threeD() {
  'use strict';

  var rm = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(pointer: fine)');
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

  /* ---- the mark: N stacked copies of the wordmark along Z ---- */
  var obj = document.getElementById('mark3d-obj');
  if (obj) {
    /* fewer, thicker slices on phones: same depth, a third of the compositing */
    var small = matchMedia('(max-width: 720px)').matches;
    var LAYERS = small ? 12 : 22, STEP = small ? 1.5 : 0.85;
    var frag = document.createDocumentFragment();
    for (var i = LAYERS - 1; i >= 0; i--) {
      var l = document.createElement('div');
      l.className = 'mark3d-layer' + (i === 0 ? ' is-front' : i === LAYERS - 1 ? ' is-back' : '');
      /* the body of the extrusion darkens toward the middle and lifts again at
         the back face, so the block reads as a solid with two lit faces */
      var t = i / (LAYERS - 1);
      var b = i === 0 ? 1 : i === LAYERS - 1 ? 0.62 : 0.30 + 0.22 * Math.abs(t - 0.5) * 2;
      l.style.setProperty('--z', (-i * STEP).toFixed(2) + 'px');
      l.style.setProperty('--b', b.toFixed(3));
      frag.appendChild(l);
    }
    obj.appendChild(frag);
  }

  /* ---- pointer parallax across the whole stage ---- */
  var stage = document.getElementById('stage');
  if (!stage) return;

  var mx = 0, my = 0, tx = 0, ty = 0, raf = null, on = false;

  function frame() {
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    stage.style.setProperty('--mx', mx.toFixed(4));
    stage.style.setProperty('--my', my.toFixed(4));
    if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) raf = requestAnimationFrame(frame);
    else raf = null;
  }
  function move(e) {
    var r = stage.getBoundingClientRect();
    tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
    ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function leave() { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(frame); }

  function arm() {
    if (on || rm.matches || !fine.matches) return;
    on = true;
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerleave', leave);
    document.documentElement.classList.add('has-3d');
  }
  function disarm() {
    if (!on) return;
    on = false;
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerleave', leave);
    document.documentElement.classList.remove('has-3d');
    tx = 0; ty = 0; mx = 0; my = 0;
    stage.style.setProperty('--mx', '0'); stage.style.setProperty('--my', '0');
  }
  function apply() { if (rm.matches || !fine.matches) disarm(); else arm(); }
  [rm, fine].forEach(function (q) { if (q.addEventListener) q.addEventListener('change', apply); else q.addListener(apply); });
  apply();

  /* ---- tilt on the raised cards ---- */
  var cards = [].slice.call(document.querySelectorAll('.transcript, .case, .care-card, .quote-side'));
  cards.forEach(function (c) {
    c.classList.add('tilt');
    var id = null, rx = 0, ry = 0, gx = 50, gy = 50, trx = 0, try_ = 0, tgx = 50, tgy = 50;
    function step() {
      rx += (trx - rx) * 0.14; ry += (try_ - ry) * 0.14; gx += (tgx - gx) * 0.14; gy += (tgy - gy) * 0.14;
      c.style.setProperty('--rx', rx.toFixed(3) + 'deg');
      c.style.setProperty('--ry', ry.toFixed(3) + 'deg');
      c.style.setProperty('--gx', gx.toFixed(2) + '%');
      c.style.setProperty('--gy', gy.toFixed(2) + '%');
      if (Math.abs(trx - rx) > 0.01 || Math.abs(try_ - ry) > 0.01 || Math.abs(tgx - gx) > 0.1) id = requestAnimationFrame(step);
      else id = null;
    }
    c.addEventListener('pointermove', function (e) {
      if (rm.matches || !fine.matches) return;
      var r = c.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      try_ = (px - 0.5) * 9; trx = (0.5 - py) * 7; tgx = px * 100; tgy = py * 100;
      c.classList.add('is-tilting');
      if (!id) id = requestAnimationFrame(step);
    }, { passive: true });
    c.addEventListener('pointerleave', function () {
      trx = 0; try_ = 0; tgx = 50; tgy = 50;
      c.classList.remove('is-tilting');
      if (!id) id = requestAnimationFrame(step);
    });
  });
})();

/* ============================================================
   12. THE MIND
   A field of points behind the wordmark, drawn from the same
   world as the footage. They drift, gather into the @ mark, hold,
   and let go again. The pointer scatters them. Every few seconds
   a message arrives from the edge, the mark answers with a pulse,
   and a reply goes back out. Nothing is loaded for this: the
   points are sampled from the site icon already on the page.
   ============================================================ */
(function mind() {
  'use strict';

  var cv = document.getElementById('mind');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var rm = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(pointer: fine)');
  var small = matchMedia('(max-width: 720px)').matches;
  var N = small ? 520 : 2300;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  var W = 0, H = 0, parts = [], ready = false;
  var running = false, id = null, lastNow = 0, born = performance.now();
  var pointer = { x: -9, y: -9 };
  var msg = null, reply = null, ripple = null, nextMsgAt = 0;

  /* the loop: gather, hold, let go, drift; the first gather starts at once */
  var T_GATHER = 2.6, T_HOLD = 9.5, T_RELEASE = 2.0, T_DRIFT = 2.6;
  var PERIOD = T_GATHER + T_HOLD + T_RELEASE + T_DRIFT;

  function cohesion(t) {
    var u = t % PERIOD;
    if (u < T_GATHER) return smooth(u / T_GATHER);
    if (u < T_GATHER + T_HOLD) return 1;
    if (u < T_GATHER + T_HOLD + T_RELEASE) return 1 - smooth((u - T_GATHER - T_HOLD) / T_RELEASE);
    return 0;
  }

  function size() {
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* sample the icon: every light pixel is a candidate home for a point */
  function sample(img) {
    var S = 176;
    var oc = document.createElement('canvas'); oc.width = S; oc.height = S;
    var o = oc.getContext('2d');
    o.drawImage(img, 0, 0, S, S);
    var d;
    try { d = o.getImageData(0, 0, S, S).data; } catch (e) { return null; }
    var pts = [], minX = S, minY = S, maxX = 0, maxY = 0;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var i = (y * S + x) * 4;
      if (d[i] > 165 && d[i + 3] > 128) {
        pts.push([x, y]);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (!pts.length) return null;
    for (var k = pts.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1)); var t = pts[k]; pts[k] = pts[j]; pts[j] = t;
    }
    /* recentre and fit the shape into the middle 84% of the field */
    var bw = maxX - minX + 1, bh = maxY - minY + 1, sc = 0.84 / Math.max(bw, bh);
    var ox = 0.5 - (bw * sc) / 2, oy = 0.5 - (bh * sc) / 2;
    return pts.slice(0, N).map(function (p) {
      return [ox + (p[0] - minX + 0.5) * sc, oy + (p[1] - minY + 0.5) * sc];
    });
  }

  function seed(homes) {
    parts = homes.map(function (h) {
      var a = Math.random() * 6.2832, r = 0.22 + Math.random() * 0.4;
      return {
        hx: h[0], hy: h[1],
        x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r,
        vx: 0, vy: 0,
        a: a, r: r, w: (Math.random() - 0.5) * 0.22, ph: Math.random() * 6.2832,
        s: Math.random(), b: 0,
        stay: Math.random() < 0.36
      };
    });
    ready = true;
  }

  /* The shape drawn by hand, in the icon's own 512 grid: the square @ and the
     cursor. Used when the icon cannot be read back (file://, a blocked
     request), so the mark always forms. */
  function drawMark(o, S) {
    var u = S / 512;
    o.save(); o.scale(u, u);
    o.fillStyle = '#fff'; o.strokeStyle = '#fff'; o.lineJoin = 'round'; o.lineCap = 'butt';
    o.lineWidth = 44;
    o.beginPath(); o.moveTo(305, 262); o.lineTo(305, 110); o.quadraticCurveTo(305, 78, 273, 78);
    o.lineTo(137, 78); o.quadraticCurveTo(105, 78, 105, 110); o.lineTo(105, 275);
    o.quadraticCurveTo(105, 307, 137, 307); o.lineTo(240, 307); o.stroke();
    o.lineWidth = 38;
    o.strokeRect(176, 148, 90, 92);
    o.beginPath(); o.moveTo(322, 332); o.lineTo(462, 392); o.lineTo(402, 412); o.lineTo(432, 468);
    o.lineTo(394, 478); o.lineTo(370, 422); o.lineTo(322, 442); o.closePath(); o.fill();
    o.restore();
  }
  function sampleDrawn() {
    var S = 176;
    var oc = document.createElement('canvas'); oc.width = S; oc.height = S;
    var o = oc.getContext('2d');
    drawMark(o, S);
    return sample(oc);
  }
  function boot(homes) {
    if (!homes) homes = sampleDrawn();
    if (!homes) return;
    size();
    seed(homes);
    if (rm.matches) { drawStill(); return; }
    start();
  }
  var img = new Image();
  img.onload = function () { boot(sample(img)); };
  img.onerror = function () { boot(null); };
  img.src = 'android-chrome-512x512.png';

  /* ---- the message and the reply ---- */
  function spawnMessage(now) {
    var a = Math.random() * 6.2832;
    msg = { sx: 0.5 + Math.cos(a) * 0.72, sy: 0.5 + Math.sin(a) * 0.72, t0: now, dur: 1150, trail: [] };
  }
  function spawnReply(now, fromAngle) {
    var a = fromAngle + 2.2 + Math.random() * 1.9;   /* out a different way than it came */
    reply = { ex: 0.5 + Math.cos(a) * 0.78, ey: 0.5 + Math.sin(a) * 0.78, t0: now, dur: 900, trail: [] };
  }

  /* ---- the frame ---- */
  function step(now) {
    if (!running) { id = null; return; }
    var dt = Math.min(48, now - (lastNow || now)); lastNow = now;
    var f = dt / 16.667;
    var t = (now - born) / 1000;
    var k = cohesion(t);

    /* a message only arrives while the mark is holding together */
    if (k > 0.95 && !msg && !reply && now > nextMsgAt) spawnMessage(now);

    var mx = -1, my = -1, ripX = 0.5, ripY = 0.5, rip = null;
    if (msg) {
      var u = clamp((now - msg.t0) / msg.dur, 0, 1), e = u * u;
      mx = msg.sx + (0.5 - msg.sx) * e; my = msg.sy + (0.5 - msg.sy) * e;
      msg.trail.push([mx, my]); if (msg.trail.length > 9) msg.trail.shift();
      if (u >= 1) {
        ripple = { t0: now };
        spawnReply(now, Math.atan2(msg.sy - 0.5, msg.sx - 0.5));
        msg = null;
      }
    }
    if (ripple) {
      var age = (now - ripple.t0) / 1000;
      if (age > 1.5) ripple = null; else rip = { r: age * 0.5, g: 1 - age / 1.5 };
    }
    var rx = -1, ry = -1;
    if (reply) {
      var v = clamp((now - reply.t0) / reply.dur, 0, 1), eo = 1 - Math.pow(1 - v, 3);
      rx = 0.5 + (reply.ex - 0.5) * eo; ry = 0.5 + (reply.ey - 0.5) * eo;
      reply.trail.push([rx, ry]); if (reply.trail.length > 12) reply.trail.shift();
      if (v >= 1) { reply = null; nextMsgAt = now + 3800 + Math.random() * 2800; }
    }

    /* ---- the points ---- */
    var spring = 0.05 * f, damp = Math.pow(0.80, f);
    var px = pointer.x, py = pointer.y, R = 0.15;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      /* drift: a slow orbit of its own, breathing */
      var ang = p.a + t * p.w, rr = p.r + Math.sin(t * 0.7 + p.ph) * 0.04;
      var dx = 0.5 + Math.cos(ang) * rr, dy = 0.5 + Math.sin(ang) * rr;
      /* the points that stay hold almost exactly: even 8% of a wide orbit is
         30px of blur at this size, enough to dissolve the outline */
      var kk = p.stay ? Math.max(k, 0.985) : k;
      p.k = kk;
      var tx = dx + (p.hx - dx) * kk, ty = dy + (p.hy - dy) * kk;
      /* a little life even when held */
      tx += Math.sin(t * 1.3 + p.ph) * 0.0025 * (0.4 + k);
      ty += Math.cos(t * 1.1 + p.ph * 1.7) * 0.0025 * (0.4 + k);

      p.vx += (tx - p.x) * spring; p.vy += (ty - p.y) * spring;

      if (px >= 0) {
        var ddx = p.x - px, ddy = p.y - py, d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < R && d > 0.0001) { var push = (R - d) / R * 0.0045 * f; p.vx += ddx / d * push; p.vy += ddy / d * push; }
      }

      var bright = 0;
      if (rip) {
        var cx = p.x - ripX, cy = p.y - ripY, dc = Math.sqrt(cx * cx + cy * cy);
        var g = Math.exp(-Math.pow((dc - rip.r) / 0.05, 2)) * rip.g;
        if (g > 0.01) { bright = g; if (dc > 0.0001) { p.vx += cx / dc * g * 0.0035 * f; p.vy += cy / dc * g * 0.0035 * f; } }
      }
      p.b += (bright - p.b) * 0.3;

      p.vx *= damp; p.vy *= damp;
      p.x += p.vx; p.y += p.vy;
    }

    draw(k, mx, my, rx, ry);
    id = requestAnimationFrame(step);
  }

  function draw(k, mx, my, rx, ry) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var a = clamp(0.34 + 0.36 * (p.k || k) + p.s * 0.25 + p.b * 0.7, 0, 1);
      var s = 1.1 + p.s * 1.0 + p.b * 1.6;
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      ctx.fillRect(p.x * W - s / 2, p.y * H - s / 2, s, s);
    }
    if (mx >= 0 && msg) drawSpark(msg.trail, mx, my, 1);
    if (rx >= 0 && reply) drawSpark(reply.trail, rx, ry, 1.35);
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSpark(trail, x, y, scale) {
    if (trail.length > 1) {
      ctx.lineWidth = 1.2;
      for (var i = 1; i < trail.length; i++) {
        var q = i / trail.length;
        ctx.strokeStyle = 'rgba(255,255,255,' + (q * 0.55).toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(trail[i - 1][0] * W, trail[i - 1][1] * H);
        ctx.lineTo(trail[i][0] * W, trail[i][1] * H);
        ctx.stroke();
      }
    }
    var gr = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, 14 * scale);
    gr.addColorStop(0, 'rgba(255,255,255,.95)');
    gr.addColorStop(0.25, 'rgba(255,255,255,.45)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x * W, y * H, 14 * scale, 0, 6.2832); ctx.fill();
  }

  /* reduced motion: the mark, gathered, drawn once */
  function drawStill() {
    size();
    for (var i = 0; i < parts.length; i++) { parts[i].x = parts[i].hx; parts[i].y = parts[i].hy; parts[i].b = 0; }
    draw(1, -1, -1, -1, -1);
  }

  /* ---- run control: only while visible, never on a hidden tab ---- */
  var onScreen = true;
  function start() {
    if (running || !ready || rm.matches) return;
    running = true; lastNow = 0;
    if (!id) id = requestAnimationFrame(step);
  }
  function stop() { running = false; if (id) { cancelAnimationFrame(id); id = null; } }
  function decide() { if (onScreen && !document.hidden && !rm.matches) start(); else stop(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; decide(); }, { rootMargin: '40px' }).observe(cv);
  }
  document.addEventListener('visibilitychange', decide);
  var onRM = function () { if (rm.matches) { stop(); if (ready) drawStill(); } else decide(); };
  if (rm.addEventListener) rm.addEventListener('change', onRM); else rm.addListener(onRM);

  window.addEventListener('resize', function () {
    size();
    if (ready && rm.matches) drawStill();
  }, { passive: true });

  /* the pointer scatters what it touches */
  var stage = document.getElementById('stage') || cv;
  stage.addEventListener('pointermove', function (e) {
    if (!fine.matches) return;
    var r = cv.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width;
    pointer.y = (e.clientY - r.top) / r.height;
    if (pointer.x < -0.2 || pointer.x > 1.2 || pointer.y < -0.2 || pointer.y > 1.2) { pointer.x = -9; pointer.y = -9; }
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { pointer.x = -9; pointer.y = -9; });
})();
