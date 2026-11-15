/* ============================================================
   H@rts · The Story
   Plain vanilla JS. No framework, no build step.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var storyCanvas = document.getElementById('story');
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

  /* Bands 1 to 3 sit right while the story plays out on the left.
     Bands 4 and 5 step left, and the story crosses to the right with them
     (see lane() in the story below). */
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
     2. HERO PROGRESS AND LERP
     ========================================================== */

  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroOnScreen = true;
  var loadK = 0, loadStart = 0, loadRamping = false;

  function heroProgress() {
    if (!hero) return 0;
    var range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
  }

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

    story.setProgress(shown);
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
      story.setOnScreen(heroOnScreen);
    }, { rootMargin: '10px' }).observe(hero);
  }

  /* ==========================================================
     3. THE STORY · drawn live, driven by the scroll
     Beat 1 (0 to .19)    loose records drift, scattered
     Beat 2 (.21 to .40)  they glide into a web app: window, header, rows
     Beat 3 (.42 to .61)  03:14, a message arrives; the app scans its rows
     Beat 4 (.63 to .79)  the lane crosses right; a pulse carries the answer
                          to the chat and the reply goes out, in the accent
     Beat 5 (.82 to 1)    it all settles, calm, behind the closing line
     The big moves sit in the gaps between captions (.20 .41 .62 .80), so a
     caption never shares the screen with a transition. Nothing is loaded:
     it is drawn from a seeded layout, the same on every visit.
     ========================================================== */

  var heroInit = false;
  function initHeroOnce() {
    if (heroInit) return;
    heroInit = true;
    loadStart = performance.now();
    loadRamping = true;
  }

  var story = createStory(storyCanvas);

  function createStory(cv) {
    var noop = { setProgress: function () {}, setOnScreen: function () {}, setStatic: function () {} };
    if (!cv || !cv.getContext) return noop;
    var ctx = cv.getContext('2d');
    var rm = matchMedia('(prefers-reduced-motion: reduce)');
    var SIG = '79,140,255';                 /* --signal, the one accent */
    var MONO = '500 11px "JetBrains Mono", Consolas, monospace';
    var COLS = 9, ROWS = 6, HIT_R = 3, HIT_C = 6;

    var dpr = 1, W = 0, H = 0;
    var p = 0, staticMode = false, onScreen = true, running = false, id = null;
    var born = performance.now();

    var rand = rng(20261115);
    var nodes = [], motes = [], i;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        nodes.push({
          c: c, r: r,
          sx: rand(), sy: rand(),                 /* scattered home, 0..1 of the lane */
          ph: rand() * 6.2832, sp: 0.35 + rand() * 0.55,
          st: rand(),                             /* gather stagger */
          sz: 0.6 + rand() * 0.8,
          bar: rand() < 0.34                      /* some start as spreadsheet rows */
        });
      }
    }
    for (i = 0; i < 46; i++) {
      motes.push({ x: rand(), y: rand(), r: rand() * 1.1 + 0.3, a: rand() * 0.18 + 0.05, ph: rand() * 6.2832, sp: 0.15 + rand() * 0.35 });
    }

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return false;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function rrect(x, y, w, h, rad) {
      rad = Math.min(rad, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }

    /* The action lane mirrors the caption bands in cinematic.css: the bands
       start at 46% (38% under 1100px), so the lane is the other 46% (38%). */
    function layout() {
      var narrowStatic = staticMode && W < 721;
      var lw, lx;
      if (staticMode) {
        lw = narrowStatic ? W * 0.9 : W * 0.46;
        lx = narrowStatic ? W * 0.05 : W - lw;
      } else {
        lw = W * (W <= 1100 ? 0.38 : 0.46);
        lx = smoothstep(p, 0.60, 0.665) * (W - lw);
      }
      var bw = Math.min(lw * (narrowStatic ? 0.72 : 0.68), 480);
      var bh = bw * 0.6;
      var bub = bh * 0.24;
      var gap = bh * 0.1;
      var stack = bh + gap * 2 + bub * 2;
      /* the stack stays clear of the nav at the top and of the WhatsApp and
         assistant buttons that live bottom right */
      /* on phones it lives in the 210px floor the static hero leaves free */
      var room = narrowStatic ? Math.min(H * 0.3, 180) : H * 0.66;
      if (stack > room) { var s = room / stack; bw *= s; bh *= s; bub *= s; gap *= s; stack = room; }
      var bx = lx + (lw - bw) / 2;
      var by;
      if (narrowStatic) by = H - stack - 28;
      else {
        /* the window sits centred on its own, and rises to make room
           only when the chat arrives (in the handover at .41) */
        var alone = (H - bh) / 2 - H * 0.02;
        var withChat = (H - stack) / 2 - H * 0.04;
        by = staticMode ? withChat : alone + (withChat - alone) * smoothstep(p, 0.39, 0.45);
      }
      return { lx: lx, lw: lw, bx: bx, by: by, bw: bw, bh: bh, bub: bub, gap: gap };
    }

    function nodeAt(n, L, t) {
      var head = L.bh * 0.17, padX = L.bw * 0.09, padY = L.bh * 0.12;
      var gx = L.bx + padX + n.c * (L.bw - 2 * padX) / (COLS - 1);
      var gy = L.by + head + padY + n.r * (L.bh - head - 2 * padY) / (ROWS - 1);
      var sx = L.lx + (n.sx * 1.1 - 0.05) * L.lw + Math.sin(t * n.sp + n.ph) * 16;
      var sy = H * (0.12 + n.sy * 0.76) + Math.cos(t * n.sp * 0.8 + n.ph * 1.3) * 12;
      var a = 0.15 + n.st * 0.08;               /* every record is home by .33 */
      var k = smoothstep(p, a, a + 0.1);
      return { x: sx + (gx - sx) * k, y: sy + (gy - sy) * k + Math.sin(t * 1.1 + n.ph) * 0.8 * k, k: k };
    }

    function bars(x, y, w, h, color, widths) {
      ctx.fillStyle = color;
      var lh = Math.max(2, h * 0.13), step = h / (widths.length + 1);
      for (var b = 0; b < widths.length; b++) {
        rrect(x + w * 0.1, y + step * (b + 1) - lh / 2, w * widths[b], lh, lh / 2);
        ctx.fill();
      }
    }

    function bubble(x, y, w, h, mine, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      rrect(x, y, w, h, Math.min(14, h * 0.4));
      if (mine) {
        ctx.fillStyle = 'rgba(' + SIG + ',.92)';
        ctx.shadowColor = 'rgba(' + SIG + ',.55)'; ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;
        bars(x, y, w, h, 'rgba(6,10,20,.62)', [0.62, 0.42]);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 1; ctx.stroke();
        bars(x, y, w, h, 'rgba(255,255,255,.55)', [0.7, 0.48]);
      }
      ctx.restore();
    }

    function draw() {
      if ((!W || !H) && !size()) return;
      var t = rm.matches ? 0 : (performance.now() - born) / 1000;
      ctx.clearRect(0, 0, W, H);
      var L = layout();
      var calm = staticMode ? 0.6 : 1 - smoothstep(p, 0.80, 0.9) * 0.45;

      /* ambient motes across the whole stage */
      for (i = 0; i < motes.length; i++) {
        var m = motes[i];
        var my = ((m.y - t * 0.006 * m.sp) % 1 + 1) % 1;
        ctx.fillStyle = 'rgba(255,255,255,' + m.a.toFixed(3) + ')';
        ctx.fillRect(m.x * W + Math.sin(t * m.sp + m.ph) * 18, my * H, m.r, m.r);
      }

      /* the web app: a window, a header with three dots, faint row rules */
      var formed = smoothstep(p, 0.22, 0.32);
      if (formed > 0) {
        ctx.save();
        ctx.globalAlpha = formed * calm;
        rrect(L.bx, L.by, L.bw, L.bh, 12);
        ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; ctx.stroke();
        var hy = L.by + L.bh * 0.17;
        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.beginPath(); ctx.moveTo(L.bx, hy); ctx.lineTo(L.bx + L.bw, hy); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(L.bx + 16 + i * 11, L.by + L.bh * 0.085, 2.6, 0, 6.2832); ctx.fill(); }
        ctx.restore();
      }

      /* the records */
      var scan = smoothstep(p, 0.5, 0.575) * (HIT_C + 1.4);
      var hitOn = smoothstep(p, 0.565, 0.6);
      var cell = Math.max(3, Math.min(L.bw, L.bh) * 0.045);
      var hit = null;
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i], q = nodeAt(n, L, t);
        var s0 = 3.2 + n.sz * 2.6;
        var w = (n.bar ? s0 * 3.6 : s0) * (1 - q.k) + cell * q.k;
        var h = (n.bar ? s0 * 0.75 : s0) * (1 - q.k) + cell * q.k;
        var al = (0.46 + 0.3 * n.sz / 1.4 + 0.1 * q.k) * calm;
        var col = '255,255,255';
        if (n.r === HIT_R && n.c <= HIT_C) {
          var lit = scan - n.c;
          if (lit > 0 && lit < 1.4) { col = SIG; al = Math.max(al, (1 - Math.abs(lit - 0.5) / 0.9) * calm); }
        }
        if (n.r === HIT_R && n.c === HIT_C) {
          hit = q;
          if (hitOn > 0) { col = SIG; al = Math.max(al, hitOn * calm); }
        }
        ctx.fillStyle = 'rgba(' + col + ',' + Math.min(1, al).toFixed(3) + ')';
        rrect(q.x - w / 2, q.y - h / 2, w, h, Math.min(w, h) * 0.3);
        ctx.fill();
      }
      if (hit && hitOn > 0) {
        var g = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, cell * 5);
        g.addColorStop(0, 'rgba(' + SIG + ',' + (0.45 * hitOn * calm).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + SIG + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(hit.x, hit.y, cell * 5, 0, 6.2832); ctx.fill();
      }

      /* 03:14: the message arrives under the app */
      var bubW = L.bw * 0.56;
      var inc = smoothstep(p, 0.43, 0.5);
      var iy = L.by + L.bh + L.gap;
      var ry = iy + L.bub + L.gap;
      var rx = L.bx + L.bw - bubW;
      if (inc > 0) {
        bubble(L.bx, iy + (1 - inc) * 22, bubW, L.bub, false, inc * calm);
        ctx.save();
        ctx.globalAlpha = inc * calm * 0.9;
        ctx.font = MONO; ctx.fillStyle = 'rgb(140,148,161)'; ctx.textBaseline = 'bottom';
        ctx.fillText('03:14', L.bx + bubW + 10, iy + (1 - inc) * 22 + L.bub);
        ctx.restore();
      }

      /* the answer travels from the record to the reply */
      var go = smoothstep(p, 0.665, 0.735);
      if (hit && go > 0 && go < 1) {
        var ex = rx + bubW * 0.82, ey = ry + L.bub * 0.5;
        var cx = L.bx + L.bw + L.bw * 0.14, cy = (hit.y + ey) / 2;
        var pt = function (u) {
          var v = 1 - u;
          return [v * v * hit.x + 2 * v * u * cx + u * u * ex, v * v * hit.y + 2 * v * u * cy + u * u * ey];
        };
        ctx.save();
        ctx.lineCap = 'round';
        var from = Math.max(0, go - 0.35), steps = 18;
        for (var sI = 1; sI <= steps; sI++) {
          var u0 = from + (go - from) * (sI - 1) / steps, u1 = from + (go - from) * sI / steps;
          var a0 = pt(u0), a1 = pt(u1);
          ctx.strokeStyle = 'rgba(' + SIG + ',' + (0.85 * sI / steps * calm).toFixed(3) + ')';
          ctx.lineWidth = 1 + 1.6 * sI / steps;
          ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
        }
        var head = pt(go);
        var hg = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 14);
        hg.addColorStop(0, 'rgba(' + SIG + ',' + (0.95 * calm).toFixed(3) + ')');
        hg.addColorStop(1, 'rgba(' + SIG + ',0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(head[0], head[1], 14, 0, 6.2832); ctx.fill();
        ctx.restore();
      }

      /* the reply goes out, in the accent */
      var rep = smoothstep(p, 0.725, 0.775);
      if (rep > 0) {
        var sc = 0.9 + 0.1 * rep;
        ctx.save();
        ctx.translate(rx + bubW, ry + L.bub / 2); ctx.scale(sc, sc); ctx.translate(-(rx + bubW), -(ry + L.bub / 2));
        bubble(rx, ry, bubW, L.bub, true, rep * calm);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = rep * calm * 0.9;
        ctx.font = MONO; ctx.fillStyle = 'rgb(140,148,161)'; ctx.textBaseline = 'bottom'; ctx.textAlign = 'right';
        ctx.fillText('03:14', rx - 10, ry + L.bub);
        ctx.restore();
      }
    }

    /* run only while the hero is on screen and the tab is visible; under
       reduced motion it is drawn once, still, and redrawn only on change */
    function frame() { id = null; draw(); if (running) id = requestAnimationFrame(frame); }
    function decide() {
      var want = onScreen && !document.hidden && !rm.matches;
      if (want && !running) { running = true; if (!id) id = requestAnimationFrame(frame); }
      else if (!want && running) { running = false; if (id) { cancelAnimationFrame(id); id = null; } draw(); }
    }
    document.addEventListener('visibilitychange', decide);
    if (rm.addEventListener) rm.addEventListener('change', function () { decide(); draw(); });
    window.addEventListener('resize', function () { size(); draw(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });

    size();
    draw();
    decide();

    return {
      setProgress: function (v) { p = v; if (!running) draw(); },
      setOnScreen: function (v) { onScreen = v; decide(); },
      setStatic: function (v) { if (v === staticMode) return; staticMode = v; if (v) p = 0.9; size(); draw(); }
    };
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
    var gated = MQLS.some(function (m) { return m.matches; });
    story.setStatic(gated);
    if (gated) disableScrub();
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
      /* once the reply has "sent", letting go must not drain the finished state */
      if (rig.classList.contains('done')) return;
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
   Pointer parallax on the hero captions, and a tilt on the raised
   cards further down. Decoration only: fine pointers, off under
   reduced motion, and the page reads identically without it.
   ============================================================ */
(function threeD() {
  'use strict';

  var rm = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(pointer: fine)');
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

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

