/* The brand module: the brand's own logo, loaded from an SVG file, split into its parts, and posed by motions that work
   on any mark. Replace ../brand/logo.svg with the brand's logo (from the skill's references/logo.md: get the real vector,
   study how it is built). These generic motions are a start; once the mark is studied, add motions that come from its
   construction and meaning (draw along its own strokes, open its repeated unit, and so on), each as pose(S, p in 0..1),
   where p = 1 is the finished logo, exactly.

   LOGO.ready            resolves once the file is loaded and measured. Its parts are the file's own leaf shapes (path,
                         circle, rect, ... and text); groups are flattened, and each <use> becomes a copy of its own
   LOGO.make(parent)     the mark in a stage: { svg, parts: [{ el, pen, cx, cy, ang, len }] }. Size the stage element
                         (width/height), never scale it with CSS, so the vector stays sharp.
   LOGO.drawn(S, p)      each part's outline drawn by its own pen, all together, its fill arriving behind the pen
   LOGO.assembled(S, p)  the parts arrive from their own directions out from the centre and lock into place
   LOGO.grown(S, p, r0)  the mark revealed from its centre outwards (from a circle of radius r0, % of the stage), settling in scale
   LOGO.box()            the mark's own width and height in the 120-unit box (its longer side is 100): place type by it
   LOGO.colour()         the brand's main colour, read from the file (the fill of its largest part)
   Every name stays inside window.LOGO: the film is one scope, and a stray global could overwrite one of the film's. */
(function () {
  var NS = "http://www.w3.org/2000/svg", SRC = "../brand/logo.svg", SHAPES = "path,circle,ellipse,rect,polygon,polyline,line,text";
  var L = { parts: [], tpl: null };
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function ease(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
  function soft(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  /* load the file, put it in a 120-unit box centred on 0,0 (the mark's longer side 100 units), and measure each part */
  var ready = fetch(SRC).then(function (r) { if (!r.ok) throw new Error("no logo at " + SRC); return r.text(); }).then(function (txt) {
    var doc = new DOMParser().parseFromString(txt, "image/svg+xml"), root = doc.documentElement;
    var probe = el("svg", { width: "1000", height: "1000", style: "position:absolute;left:-9999px;top:0" }, document.body);
    [].forEach.call(root.querySelectorAll("defs, style"), function (d) { probe.appendChild(document.importNode(d, true)); });
    var g = el("g", {}, probe); [].forEach.call(root.childNodes, function (n) { if (n.nodeType === 1 && !/^(defs|style|title|desc|metadata)$/i.test(n.nodeName)) g.appendChild(document.importNode(n, true)); });
    /* a <use> (a shape reused, rotated or moved) becomes a real copy, so every copy is a part the motions can move */
    [].slice.call(g.querySelectorAll("use")).forEach(function (u) {
      var id = (u.getAttribute("href") || u.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "").replace(/^#/, ""), src = id && root.querySelector("[id='" + id + "']");
      if (!src) return;
      var w = el("g", { transform: (u.getAttribute("transform") || "") + " translate(" + (+u.getAttribute("x") || 0) + " " + (+u.getAttribute("y") || 0) + ")" });
      [].forEach.call(u.attributes, function (at) { if (!/^(href|xlink:href|x|y|width|height|transform|id)$/.test(at.name)) w.setAttribute(at.name, at.value); });
      var c = document.importNode(src, true); c.removeAttribute("id"); w.appendChild(c); u.parentNode.replaceChild(w, u);
    });
    var bb = g.getBBox(), s = 100 / Math.max(bb.width, bb.height), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    g.setAttribute("transform", "scale(" + s + ") translate(" + (-cx) + " " + (-cy) + ")");
    L.tpl = g; L.s = s; L.box = { w: bb.width * s, h: bb.height * s }; /* the mark's own size in the box's units (longer side 100) */ L.defs = [].map.call(probe.querySelectorAll("defs, style"), function (d) { return d; });
    [].forEach.call(g.querySelectorAll(SHAPES), function (e, i) {
      var b = e.getBBox(), m = e.getCTM(), gm = g.getCTM(), inv = gm.inverse().multiply(m);
      var px = (b.x + b.width / 2) * inv.a + (b.y + b.height / 2) * inv.c + inv.e, py = (b.x + b.width / 2) * inv.b + (b.y + b.height / 2) * inv.d + inv.f;
      var X = (px - cx) * s, Y = (py - cy) * s, len = e.getTotalLength ? e.getTotalLength() : 0;
      e.setAttribute("data-part", i);
      /* the brand's main colour: the fill (or stroke) of the part covering the most area */
      var cs = getComputedStyle(e), c = cs.fill !== "none" && !/^url/.test(cs.fill) ? cs.fill : cs.stroke, area = b.width * b.height;
      if (c && c !== "none" && !/^url/.test(c) && area > (L.mainArea || 0)) { L.mainArea = area; L.main = c; }
      L.parts.push({ i: i, cx: X, cy: Y, ox: px, oy: py, ang: Math.atan2(Y, X), r: Math.hypot(X, Y), len: len });
    });
    probe.remove();
  });

  function make(parent) {
    var svg = el("svg", { viewBox: "-60 -60 120 120" }, parent);
    L.defs.forEach(function (d) { svg.appendChild(d.cloneNode(true)); });
    /* outer: the motions' own transforms; g: the file, centred and scaled (its transform attribute must stay) */
    var outer = el("g", {}, svg), g = L.tpl.cloneNode(true); outer.appendChild(g);
    var parts = [].map.call(g.querySelectorAll("[data-part]"), function (e) {
      var info = L.parts[+e.getAttribute("data-part")], cs = getComputedStyle(e), fill = e.getAttribute("fill") || cs.fill;
      var stroked = (e.getAttribute("stroke") && e.getAttribute("stroke") !== "none") || (cs.stroke && cs.stroke !== "none");
      /* a pen: the part's outline, in the part's colour, drawn with a dash; filled parts get a thin pen of their fill colour */
      var pen = e.cloneNode(e.nodeName.toLowerCase() === "text"); pen.removeAttribute("data-part"); /* a text part's pen keeps its letters */
      pen.setAttribute("fill", "none"); pen.setAttribute("pathLength", "1");
      if (!stroked) { pen.setAttribute("stroke", fill && fill !== "none" ? fill : "#000"); pen.setAttribute("stroke-width", "3"); pen.setAttribute("vector-effect", "non-scaling-stroke"); }
      pen.setAttribute("stroke-linecap", "round"); pen.setAttribute("stroke-linejoin", "round");
      /* each part and its pen in a wrapper the motions move, so a part's own transform in the file is left alone */
      var w = document.createElementNS(NS, "g"); e.parentNode.insertBefore(w, e); w.appendChild(e); w.appendChild(pen);
      if (stroked) e.setAttribute("pathLength", "1");
      return { el: e, pen: pen, wrap: w, stroked: stroked, cx: info.cx, cy: info.cy, ox: info.ox, oy: info.oy, ang: info.ang, r: info.r, len: info.len };
    });
    return { svg: svg, outer: outer, g: g, parts: parts, s: L.s };
  }
  function reset(S) { S.parts.forEach(function (P) { P.wrap.removeAttribute("transform"); P.el.style.opacity = ""; P.el.style.strokeDasharray = ""; P.pen.style.display = "none"; }); S.svg.style.clipPath = ""; S.outer.removeAttribute("transform"); }

  function drawn(S, p) {
    reset(S);
    var n = S.parts.length;
    S.parts.forEach(function (P, k) {
      var d = ease(seg(p, 0.04 * k / Math.max(1, n - 1), 0.72)), f = soft(seg(p, 0.45 + 0.04 * k / Math.max(1, n - 1), 1));
      if (P.stroked) { P.el.style.strokeDasharray = d.toFixed(4) + " 1"; P.el.style.opacity = d > 0.002 ? "1" : "0"; return; }
      P.pen.style.display = d > 0.002 && f < 0.999 ? "" : "none"; P.pen.style.strokeDasharray = d.toFixed(4) + " 1"; P.pen.style.opacity = (1 - f).toFixed(3);
      P.el.style.opacity = f.toFixed(3);
    });
  }
  function assembled(S, p) {
    reset(S);
    var n = S.parts.length;
    S.parts.forEach(function (P, k) {
      var e = ease(seg(p, 0.12 * k / Math.max(1, n - 1), 0.88 + 0.12 * k / Math.max(1, n - 1))), away = (1 - e);
      /* out along its own direction from the centre, turned and smaller; in the file's own units (the wrapper sits inside the scaled group) */
      var k2 = 34 / S.s, dx = Math.cos(P.ang) * k2 * away, dy = Math.sin(P.ang) * k2 * away, rot = -24 * away, sc = 1 - 0.35 * away;
      P.wrap.setAttribute("transform", "translate(" + dx.toFixed(3) + " " + dy.toFixed(3) + ") rotate(" + rot.toFixed(2) + " " + P.ox.toFixed(2) + " " + P.oy.toFixed(2) + ")"
        + " translate(" + P.ox.toFixed(2) + " " + P.oy.toFixed(2) + ") scale(" + sc.toFixed(4) + ") translate(" + (-P.ox).toFixed(2) + " " + (-P.oy).toFixed(2) + ")");
      P.el.style.opacity = soft(seg(p, 0.12 * k / Math.max(1, n - 1), 0.3 + 0.12 * k / Math.max(1, n - 1))).toFixed(3);
    });
  }
  /* revealed from the centre outwards, starting at the size of a dot (r0, in % of the box) so it can take over from one */
  function grown(S, p, r0) {
    reset(S);
    r0 = r0 == null ? 4 : r0;
    var r = r0 + (72 - r0) * ease(p);
    S.svg.style.clipPath = p < 1 ? "circle(" + r.toFixed(2) + "% at 50% 50%)" : "";
    S.outer.setAttribute("transform", "scale(" + (0.92 + 0.08 * ease(p)).toFixed(4) + ")");
  }
  window.LOGO = { ready: ready, make: make, drawn: drawn, assembled: assembled, grown: grown, parts: L.parts, box: function () { return L.box; }, colour: function () { return L.main; } };
})();
