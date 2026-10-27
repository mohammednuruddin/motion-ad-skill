/* The film. Every frame is a pure function of time: FILM.render(t) places everything for second t, so the film renders
   frame-exact at any rate and in any order (except that clicks in the live product happen once, forwards: render in
   rising time). Section times live in timeline.js, which the score reads too. Motion runs on the product's own curve.

   The engine (time, words, the camera over the product plane, the pointer, the spotlight, motion blur) is reusable; the
   sections below are a sample to replace: a problem line whose pill closes into a dot, the logo growing out of the dot,
   the logo landing on the product's own logo as the light comes up, a real click in the live product with a spotlight and
   a headline, and an end card. Read the skill's references (rulebook, devices, pipeline) before writing your own. */
(function () {
  "use strict";
  var TL = window.TL, DUR = TL.end, ACCENT = "#5b5bd6"; /* replaced at load by the logo's own main colour */

  /* ---------- time ---------- */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bez(x1, y1, x2, y2) {
    function cx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function cy(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 40; i++) { t = (lo + hi) / 2; if (cx(t) < x) lo = t; else hi = t; }
      return cy(t);
    };
  }
  /* the product's curve first (EASE); SOFT starts from rest; INOUT is symmetric; IN is for exits; SWELL for light */
  var EASE = bez(0.32, 0.72, 0, 1), SOFT = bez(0.4, 0, 0.2, 1), INOUT = bez(0.65, 0, 0.35, 1), IN = bez(0.55, 0, 0.9, 0.4),
      SWELL = bez(0.42, 0, 0.58, 1), LANDC = bez(0.45, 0, 0.2, 1);
  /* a whip or zoom with a cut hidden in its fastest frame: WHIPIN ends exactly as fast as WHIPOUT starts, so the cut is unseen */
  var WHIPIN = bez(0.55, 0, 0.85, 0.5), WHIPOUT = bez(0.15, 0.5, 0.45, 1);
  /* a polyline of [x, y] points: remap time (slow a take, hold it, time it to a voice) */
  function piece(P, x) { for (var i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], seg(x, P[i - 1][0], P[i][0])); return P[P.length - 1][1]; }

  /* ---------- building ---------- */
  function el(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function px(n) { return n.toFixed(2) + "px"; }
  var bg = document.getElementById("bg"), world = document.getElementById("world"), cap = document.getElementById("cap"), fx = document.getElementById("fx");
  var BOOTS = [];

  /* a line of words, each its own span; "**...**" marks a pill */
  function line(parent, text, o) {
    o = o || {};
    var L = el("div", "line " + (o.cls || ""), parent);
    L.style.fontSize = (o.size || 88) + "px"; L.style.top = (o.y || 500) + "px";
    if (o.weight) L.style.fontWeight = o.weight;
    var ws = [];
    text.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (/^\*\*/.test(part)) {
        var p = el("span", "w pill", L); p.style.background = o.pill || ACCENT; p.style.color = o.pillInk || "#fff";
        ws.push({ e: p, pill: true, inner: el("span", "", p, part.slice(2, -2)) });
      } else part.trim().split(/\s+/).forEach(function (w) { ws.push({ e: el("span", "w", L, w) }); });
    });
    L.style.display = "none";
    return { el: L, ws: ws };
  }
  /* words in out of a blur, rising a little, one after another; out the same way, drifting up */
  function wordsAt(Ln, t, tin, tout, o) {
    o = o || {};
    var st = o.stagger == null ? 0.085 : o.stagger, d = o.dur || 0.62, od = o.outDur || 0.42, rise = o.rise == null ? 0.24 : o.rise, ost = o.outStagger == null ? 0.04 : o.outStagger;
    var any = false;
    Ln.ws.forEach(function (w, i) {
      if (w.pill && o.pillManual) return;
      var a = EASE(seg(t, tin + i * st, tin + i * st + d));
      var b = tout == null ? 0 : (o.outEase || IN)(seg(t, tout + i * ost, tout + i * ost + od));
      var v = a * (1 - b);
      if (v > 0.001) any = true;
      w.e.style.opacity = v.toFixed(3);
      w.e.style.transform = "translateY(" + ((1 - a) * rise - b * rise * 0.7).toFixed(3) + "em)";
      var blur = (1 - a) * 16 + b * 12;
      w.e.style.filter = blur > 0.05 ? "blur(" + blur.toFixed(2) + "px)" : "none";
    });
    Ln.el.style.display = any || (o.pillManual && t >= tin && t < (o.until || 1e9)) ? "flex" : "none";
    return any;
  }

  /* ---------- the product plane: every screen on one surface under a camera ---------- */
  var plane = el("div", "", world); plane.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0";
  /* a product window at (x, y) on the plane, showing a live page on the film's clock */
  function win(x, y, src) {
    var w = el("div", "win", plane); w.style.left = x + "px"; w.style.top = y + "px";
    var W = { el: w, x: x, y: y, clock: 0 };
    var f = el("iframe", "", w); f.src = src; W.frame = f;
    W.hole = el("div", "hole", w);
    BOOTS.push(new Promise(function (res) {
      f.addEventListener("load", function () {
        W.doc = f.contentDocument; W.fw = f.contentWindow;
        if (!W.fw.__vclock) console.error("no virtual clock in " + src + ": list it in film.config.json \"inject\"");
        clockTo(W, 3000); /* let it settle */
        res();
      });
    }));
    return W;
  }
  function clockTo(W, ms) { if (W.fw && W.fw.__vclock && ms > W.clock + 0.5) { W.fw.__vclock.advance(ms - W.clock); W.clock = ms; } }
  /* the page's own CSS animations and transitions, run on film time: each is paused and set from the frame it was first
     seen (getAnimations() flushes style, so one started this frame is caught now). Render in rising time: a probe that
     skips ahead shows a transition the page started in between from its beginning */
  function drive(W, t) {
    if (!W.doc) return;
    W.doc.getAnimations().forEach(function (a) {
      if (a.__t0 == null) a.__t0 = t;
      a.pause();
      try { a.currentTime = Math.max(0, (t - a.__t0) * 1000); } catch (e) {}
    });
  }
  function rectIn(W, e) { var b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }
  /* a pale haze over everything in a window but one rect (window pixels), its corners rad; call it every frame */
  function spot(W, r, a, pad, rad) {
    pad = pad == null ? 12 : pad;
    var h = W.hole;
    if (a < 0.002 || !r) { h.style.boxShadow = "none"; return; }
    h.style.borderRadius = px(rad == null ? 14 : rad);
    h.style.left = px(r[0] - pad); h.style.top = px(r[1] - pad); h.style.width = px(r[2] + 2 * pad); h.style.height = px(r[3] + 2 * pad);
    h.style.boxShadow = "0 0 0 4000px rgba(246,246,248," + (0.66 * a).toFixed(3) + "), 0 22px 60px -12px rgba(16,18,40," + (0.28 * a).toFixed(3) + ")";
  }

  var CAM = { x: 720, y: 450, z: 1 };
  /* camera keys: { t, x, y, z, ease, cut, pv }: x, y the plane point at the frame's centre, z the zoom. z moves in log space;
     pv "in" pushes into the key's point along a straight line on screen ("out" pulls out of the previous one). A key marked
     cut is jumped to at its time, and at the very instant of a cut the cut wins (strict <) */
  function K(t, W, x, y, z, ease, cut, pv) { return { t: t, x: W.x + x, y: W.y + y, z: z, ease: ease, cut: cut, pv: pv }; }
  function camAt(keys, t) {
    var a = keys[0];
    if (t <= a.t) return a;
    for (var i = 1; i < keys.length; i++) {
      var b = keys[i];
      if (b.cut) { if (t < b.t) return a; a = b; continue; }
      if (t < b.t) {
        var e = (b.ease || INOUT)(seg(t, a.t, b.t)), z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), e));
        if (b.pv === "in") return { x: b.x - (b.x - a.x) * a.z * (1 - e) / z, y: b.y - (b.y - a.y) * a.z * (1 - e) / z, z: z };
        if (b.pv === "out") return { x: a.x - (a.x - b.x) * b.z * e / z, y: a.y - (a.y - b.y) * b.z * e / z, z: z };
        return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: z };
      }
      a = b;
    }
    return a;
  }
  function camApply(c) { plane.style.transform = "translate(960px,540px) scale(" + c.z.toFixed(5) + ") translate(" + (-c.x).toFixed(2) + "px," + (-c.y).toFixed(2) + "px)"; CAM = c; }
  /* where a point of a window is on screen, with the camera as it is now */
  function onScreen(W, x, y) { return [960 + (W.x + x - CAM.x) * CAM.z, 540 + (W.y + y - CAM.y) * CAM.z]; }

  /* the pointer, in a window's own pixels, twice life size on screen whatever the zoom (a real-size one disappears) */
  var CURSOR_SVG = '<svg viewBox="0 0 26 26"><path d="M5 2.5v18.2l4.6-4.3 2.9 6.6 3.1-1.4-2.9-6.5 6.3-.3z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  function cursor(W) { return { el: el("div", "cursor", W.el, CURSOR_SVG), rip: el("div", "ripple", W.el) }; }
  /* keys [[t, x, y], ...] (it enters from outside the frame, one decelerating glide to each target); clicks: times, each
     on the frame its control changes, the ring staying where the click was */
  function cursorAt(C, t, keys, clicks, tin, tout) {
    var a = seg(t, tin, tin + 0.2) * (1 - seg(t, tout, tout + 0.25)), s = 2.0 / CAM.z;
    C.el.style.display = C.rip.style.display = "none";
    if (a <= 0.001) return;
    function posAt(tt) {
      var q = { x: keys[0][1], y: keys[0][2] };
      for (var i = 1; i < keys.length; i++) if (tt <= keys[i][0]) { var k0 = keys[i - 1], k1 = keys[i], e = SOFT(seg(tt, k0[0], k1[0])); q = { x: lerp(k0[1], k1[1], e), y: lerp(k0[2], k1[2], e) }; break; } else q = { x: keys[i][1], y: keys[i][2] };
      return q;
    }
    var pos = posAt(t), press = 0, rip = -1, rp = null;
    clicks.forEach(function (ct) { press = Math.max(press, 1 - Math.abs(t - ct) / 0.09); if (t >= ct && t < ct + 0.42) { rip = (t - ct) / 0.42; rp = posAt(ct); } });
    C.el.style.display = "block"; C.el.style.opacity = a.toFixed(3);
    C.el.style.transform = "translate(" + px(pos.x - 5 * s) + "," + px(pos.y - 2.5 * s) + ") scale(" + (s * (1 - 0.14 * clamp01(press))).toFixed(4) + ")";
    if (rip >= 0) {
      var rr = (6 + 28 * EASE(rip)) * s;
      C.rip.style.display = "block"; C.rip.style.left = px(rp.x - rr); C.rip.style.top = px(rp.y - rr); C.rip.style.width = C.rip.style.height = px(2 * rr);
      C.rip.style.opacity = ((1 - rip) * (1 - rip) * 0.85).toFixed(3); C.rip.style.borderWidth = px(2.2 * s);
    }
  }
  /* the logo in a stage of its own; sized by width/height each frame (never a CSS scale), so the vector stays sharp */
  function stage(parent) { var s = el("div", "stage", parent); s.style.display = "none"; return s; }
  function stageAt(s, cx, cy, size, op) { s.style.display = op > 0.003 ? "block" : "none"; s.style.width = s.style.height = px(size); s.style.left = px(cx - size / 2); s.style.top = px(cy - size / 2); s.style.opacity = op.toFixed(3); }

  /* ================= the sample film ================= */
  var APP = win(0, 0, "../product/index.html");
  var C_APP = cursor(APP);

  /* 1. the problem, on black: the pill closes into a dot, and the dot is where the mark grows from */
  var A1 = line(cap, "Every team says it's **urgent.**", { cls: "dark", y: 470, size: 112 });
  var MARK0 = TL.mark, LAND = TL.land, LAND_D = 1.0;
  var PILL = { w: 300, h: 132, cx: 960, cy: 530 }, dot = el("div", "", fx); dot.style.cssText = "position:absolute;left:0;top:0;border-radius:50%;background:" + ACCENT + ";display:none";

  /* 2. the mark, grown from the dot, the wordmark under it; then it lands on the product's own logo */
  var MS = 360, MY = 480, mark = stage(fx), S1 = null, S2 = null;
  var word = el("div", "mark dark", fx, "Acme"); word.style.cssText += ";position:absolute;left:0;right:0;text-align:center;font-size:72px;display:none";
  /* where the product shows its logo, in its own pixels (measured at boot), and the framing the landing ends on */
  var APP_LOGO = [49, 38, 34], LAND_CAM = { x: APP.x + 720, y: APP.y + 450, z: 0.9 };
  function landCam(t) {
    var e = LANDC(seg(t, LAND, LAND + LAND_D)), zMark = MS / APP_LOGO[2], z = Math.exp(lerp(Math.log(zMark), Math.log(LAND_CAM.z), e));
    var end = [960 + (APP.x + APP_LOGO[0] - LAND_CAM.x) * LAND_CAM.z, 540 + (APP.y + APP_LOGO[1] - LAND_CAM.y) * LAND_CAM.z];
    var sx = lerp(960, end[0], e), sy = lerp(MY - 40, end[1], e);
    /* placed so the product's logo sits exactly where the drawn mark is on screen: the mark glides, the screen gathers round it */
    return { x: APP.x + APP_LOGO[0] - (sx - 960) / z, y: APP.y + APP_LOGO[1] - (sy - 540) / z, z: z };
  }

  /* 3. the product: a real click sorts the queue; the camera has landed before it; a spotlight, a headline */
  var CLICK = TL.sort + 0.75, SORT_BTN = [1310, 196];
  var KEYS = [
    { t: LAND + LAND_D, x: LAND_CAM.x, y: LAND_CAM.y, z: LAND_CAM.z },
    { t: TL.sort - 0.2, x: LAND_CAM.x, y: LAND_CAM.y, z: LAND_CAM.z },
    K(TL.sort + 0.6, APP, 800, 420, 1.22, SOFT),
    K(TL.card - 0.3, APP, 790, 425, 1.25, SOFT)
  ];
  /* the wash first: a later sibling would sit over the headline */
  var wash = el("div", "", cap); wash.style.cssText = "position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(to top, rgba(246,246,248,0.97) 35%, rgba(246,246,248,0));display:none";
  var H1 = line(cap, "The urgent, first.", { cls: "lite", y: 930, size: 72 });

  /* 4. the end card: a lockup (mark, name, line, address) centred as one group, placed at load from the mark's own height */
  var CS = 300, CY = 400;
  var CARD = TL.card, card = stage(fx);
  var E0 = el("div", "mark lite", fx, "Acme"); E0.style.cssText += ";position:absolute;left:0;right:0;text-align:center;font-size:84px;top:640px;display:none";
  var E1 = line(cap, "Every queue, in order.", { cls: "lite", y: 758, size: 42, weight: 500 });
  var E2 = line(cap, "acme.example", { cls: "soft", y: 880, size: 30, weight: 500 });

  function render(t) {
    /* the ground: dark until the mark lands; the light comes up ahead of the product */
    var lt = SWELL(seg(t, LAND - 0.1, LAND + 0.7));
    bg.style.background = "rgb(" + [5, 5, 6].map(function (d, i) { return Math.round(lerp(d, [246, 246, 248][i], lt)); }).join(",") + ")";

    /* 1. the line, and its pill closing into a dot that travels to where the mark will grow */
    wordsAt(A1, t, 0.35, MARK0 - 1.0, { pillManual: true, until: MARK0 - 0.55 });
    var pill = A1.ws[A1.ws.length - 1], pin = EASE(seg(t, 0.6, 1.2)), close = INOUT(seg(t, MARK0 - 1.0, MARK0 - 0.55));
    pill.e.style.opacity = (pin * (close < 1 ? 1 : 0)).toFixed(3);
    pill.e.style.filter = pin < 1 ? "blur(" + ((1 - pin) * 14).toFixed(2) + "px)" : "none";
    pill.inner.style.opacity = (1 - SOFT(seg(t, MARK0 - 1.1, MARK0 - 0.85))).toFixed(3);
    /* the pill closes into a dot: its padding goes to zero too (or it stays a capsule), and its margin keeps the line's
       layout as it was, so it closes towards its own middle; it was measured once, at load, so this is the same in any order */
    var D0 = PILL.h * 0.3;
    if (close > 0) {
      var pw = lerp(PILL.w, D0, close), ph = lerp(PILL.h, D0, close);
      pill.e.style.width = px(pw); pill.e.style.height = px(ph); pill.e.style.padding = "0";
      pill.e.style.margin = "0 " + px((PILL.w - pw) / 2); pill.e.style.borderRadius = px(ph / 2);
    } else { pill.e.style.width = pill.e.style.height = pill.e.style.padding = pill.e.style.margin = ""; }
    var dOn = t >= MARK0 - 0.55 && t < MARK0 + 0.25, dt = INOUT(seg(t, MARK0 - 0.55, MARK0 - 0.05));
    dot.style.display = dOn ? "block" : "none";
    if (dOn) {
      var sx = lerp(PILL.cx, 960, dt), sy = lerp(PILL.cy, MY, dt);
      dot.style.width = dot.style.height = px(D0); dot.style.transform = "translate(" + px(sx - D0 / 2) + "," + px(sy - D0 / 2) + ")";
      dot.style.opacity = (1 - seg(t, MARK0 + 0.1, MARK0 + 0.25)).toFixed(3); /* gone once the mark has grown past it */
    }

    /* 2. the mark grows out of the dot; rises into the lockup with the wordmark as it settles; then lands */
    var landing = t >= LAND && t < LAND + LAND_D, mOn = t >= MARK0 && t < LAND + LAND_D + 0.3;
    var lift = -40 * SOFT(seg(t, MARK0 + 1.4, MARK0 + 2.3));
    if (mOn && S1) {
      LOGO.grown(S1, SOFT(seg(t, MARK0 - 0.05, MARK0 + 1.6)), 50 * D0 / MS); /* from the dot's own radius */
      if (!landing && t < LAND) stageAt(mark, 960, MY + lift, MS, 1);
    } else stageAt(mark, 960, MY, MS, 0);
    var wa = EASE(seg(t, MARK0 + 1.9, MARK0 + 2.5)) * (1 - IN(seg(t, LAND - 0.45, LAND - 0.1)));
    word.style.display = wa > 0.003 ? "block" : "none"; word.style.opacity = wa.toFixed(3);
    word.style.filter = wa < 1 ? "blur(" + ((1 - wa) * 10).toFixed(2) + "px)" : "none"; word.style.transform = "translateY(" + px(lift + (1 - wa) * 14) + ")";

    /* 3. the product: from the landing on */
    var prod = t >= LAND && t < CARD + 0.6;
    world.style.display = prod ? "block" : "none";
    if (prod) {
      var lc = landing ? landCam(t) : null;
      camApply(lc || camAt(KEYS, t));
      world.style.opacity = landing ? SOFT(seg(t, LAND + 0.15, LAND + 0.6)).toFixed(3) : (1 - SOFT(seg(t, CARD - 0.3, CARD + 0.2))).toFixed(3);
      /* the drawn mark rides the landing onto the product's logo, placed from the live camera, and hands over inside the hold */
      if (S1 && (landing || t < LAND + LAND_D + 0.3)) {
        var pL = onScreen(APP, APP_LOGO[0], APP_LOGO[1]), ho = seg(t, LAND + LAND_D - 0.15, LAND + LAND_D + 0.15);
        stageAt(mark, pL[0], pL[1], APP_LOGO[2] * CAM.z, 1 - SOFT(ho));
      }
      /* the product's clock and its own animations run on film time; the click happens once, at its time, before drive()
         so the transitions it starts are first seen, and timed, from this frame */
      clockTo(APP, 3000 + (t - LAND) * 1000);
      if (t >= CLICK && !APP.clicked && APP.doc) { APP.doc.getElementById("sort").click(); APP.clicked = true; }
      drive(APP, t);
      cursorAt(C_APP, t, [[TL.sort + 0.1, 1560, 640], [CLICK - 0.08, SORT_BTN[0], SORT_BTN[1]], [CLICK + 0.25, SORT_BTN[0], SORT_BTN[1]], [CLICK + 0.75, 1560, 520]], [CLICK], TL.sort + 0.1, CLICK + 0.6);
      /* the two urgent rows, once sorted, lit; the rest goes pale */
      var urgent = APP.doc ? [].filter.call(APP.doc.querySelectorAll("#q li"), function (l) { return l.dataset.u === "3"; }) : [];
      var ur = urgent.length ? urgent.map(function (l) { return rectIn(APP, l); }).reduce(function (a, b) { var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]); return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y]; }) : null;
      spot(APP, ur, EASE(seg(t, CLICK + 0.55, CLICK + 0.95)) * (1 - SOFT(seg(t, CARD - 0.6, CARD - 0.2))), 10, 16);
    }
    var wv = clamp01(seg(t, CLICK + 0.7, CLICK + 1.1) * (1 - seg(t, CARD - 0.45, CARD - 0.15)));
    wash.style.display = wv > 0.003 ? "block" : "none"; wash.style.opacity = wv.toFixed(3);
    wordsAt(H1, t, CLICK + 0.9, CARD - 0.9, { stagger: 0.07 });

    /* 4. the end card: the logo assembles, the name, the line, the address; a steady drift; out, the type first */
    var cOn = t >= CARD - 0.1;
    if (S2 && cOn) { LOGO.assembled(S2, seg(t, CARD, CARD + 1.2)); stageAt(card, 960, CY, CS, 1 - SOFT(seg(t, DUR - 0.6, DUR - 0.12))); }
    else stageAt(card, 960, CY, CS, 0);
    var ew = EASE(seg(t, CARD + 1.1, CARD + 1.7)) * (1 - SOFT(seg(t, DUR - 0.75, DUR - 0.3)));
    E0.style.display = ew > 0.003 ? "block" : "none"; E0.style.opacity = ew.toFixed(3); E0.style.filter = "blur(" + ((1 - ew) * 10).toFixed(2) + "px)";
    wordsAt(E1, t, CARD + 1.6, DUR - 0.85, { stagger: 0.06, outStagger: 0.05, outEase: SOFT });
    wordsAt(E2, t, CARD + 2.1, DUR - 0.9, { stagger: 0.06, outEase: SOFT });
    var drift = t >= CARD + 1.0 ? "scale(" + (1 + 0.04 * seg(t, CARD + 1.0, DUR)).toFixed(5) + ")" : "";
    fx.style.transform = cap.style.transform = drift;
  }

  /* ---------- motion blur: the instants each frame averages, across up to a 180-degree shutter, never across a cut ---------- */
  var CUTS_AT = [];
  var SAMPLES = [1, 2, 3, 4, 6, 8, 12, 24]; /* each divides maxMoments, so every frame's pictures share out evenly */
  function side(t) { var lo = -Infinity, hi = Infinity; CUTS_AT.forEach(function (c) { if (t >= c) lo = Math.max(lo, c); else hi = Math.min(hi, c - 1e-4); }); return [lo, hi]; }
  function camOf(t) { return t >= LAND && t < LAND + LAND_D ? landCam(t) : camAt(KEYS, t); }
  function slope(curve, x) { var a = Math.max(0, x - 0.002), b = Math.min(1, x + 0.002); return (curve(b) - curve(a)) / (b - a); }
  function CUBIC(x) { return 1 - Math.pow(1 - clamp01(x), 3); }
  /* how far, in screen pixels, the fastest point on screen moves in one frame */
  function speed(t) {
    var sd = side(t), a = Math.max(sd[0], t - 1 / 120), b = Math.min(sd[1], t + 1 / 120), v = 0;
    if (b - a < 1e-3) return 0;
    if (t >= LAND && t < CARD) {
      var p = camOf(a), q = camOf(b);
      [[0, 0], [1920, 0], [0, 1080], [1920, 1080]].forEach(function (c) {
        var wx = p.x + (c[0] - 960) / p.z, wy = p.y + (c[1] - 540) / p.z;
        v = Math.max(v, Math.hypot(960 + (wx - q.x) * q.z - c[0], 540 + (wy - q.y) * q.z - c[1]));
      });
    }
    v *= (1 / 60) / (b - a);
    /* things that move on their own, as [from, to, distance on screen in px, curve]: the speed is measured from the curve
       itself, never guessed (a fast-start curve like the product's peaks at about 4x its average speed) */
    [[MARK0 - 0.55, MARK0 - 0.05, Math.hypot(PILL.cx - 960, PILL.cy - MY), INOUT],
     [CLICK, CLICK + 0.45, 4 * 86 * KEYS[2].z, EASE],               /* the sort: a row moves up to 4 rows, on the product's curve */
     [CARD, CARD + 1.06, 34 / 120 * CS, CUBIC]                      /* the end card's parts arriving (logo.js: 34 units out) */
    ].forEach(function (r) {
      if (t > r[0] && t < r[1]) v = Math.max(v, r[2] * slope(r[3], seg(t, r[0], r[1])) / (r[1] - r[0]) / 60);
    });
    return v;
  }
  /* the smear is half the frame's movement, at most 24 px, from enough instants that they sit 1 px apart or less: at 2 px
     apart the thin strokes of moving text show as stacked copies (stripes) */
  function moments(t) {
    var v = speed(t), smear = Math.min(0.5 * v, 24), out = [];
    if (smear < 1.2) return [t];
    var k = SAMPLES.filter(function (n) { return n >= smear; })[0] || 24, open = (smear / v) / 60, sd = side(t);
    for (var j = 0; j < k; j++) out.push(Math.min(sd[1], Math.max(sd[0], t + ((j + 0.5) / k - 0.5) * open)));
    return out;
  }

  var ready = Promise.all([document.fonts.ready, LOGO.ready].concat(BOOTS)).then(function () {
    S1 = LOGO.make(mark); S2 = LOGO.make(card);
    /* the pill and the dot it closes into are the brand's colour, so the dot can become the mark */
    ACCENT = LOGO.colour() || ACCENT; A1.ws[A1.ws.length - 1].e.style.background = ACCENT; dot.style.background = ACCENT;
    A1.el.style.display = "flex"; var pr = A1.ws[A1.ws.length - 1].e.getBoundingClientRect(); A1.el.style.display = "none";
    PILL = { w: pr.width, h: pr.height, cx: pr.left + pr.width / 2, cy: pr.top + pr.height / 2 };
    var lg = APP.doc && APP.doc.getElementById("logo"), sb = APP.doc && APP.doc.getElementById("sort");
    if (lg) { var r = rectIn(APP, lg); APP_LOGO = [r[0] + r[2] / 2, r[1] + r[3] / 2, r[2]]; }
    if (sb) { var q = rectIn(APP, sb); SORT_BTN = [q[0] + q[2] / 2, q[1] + q[3] / 2]; }
    /* the wordmark sits under the mark's own lower edge, whatever its shape */
    word.style.top = px(MY + (LOGO.box().h / 120) * MS / 2 + 44);
    var hh = (LOGO.box().h / 120) * CS / 2, gh = 2 * hh + 56 + 276;
    CY = 540 - gh / 2 + hh; E0.style.top = px(CY + hh + 56); E1.el.style.top = px(CY + hh + 56 + 118); E2.el.style.top = px(CY + hh + 56 + 240);
  });
  window.FILM = { duration: DUR, render: render, moments: moments, maxMoments: 24, ready: ready };
})();
