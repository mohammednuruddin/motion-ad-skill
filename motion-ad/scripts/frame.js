/* The virtual clock. Loaded before a product page's own scripts whenever the film shows it live or record.js films it.
   The page runs on a clock that moves only when told to, pinned to one moment (window.__FILM_CLOCK.start, set by
   serve.js from film.config.json), so every screen in the film shows the same moment, and timers, animation frames,
   Date and performance.now are all frame-exact. The film advances it with window.__vclock.advance(ms). */
(function () {
  var cfg = window.__FILM_CLOCK || {};
  var RealDate = Date, rPerf = performance.now.bind(performance);
  var base = cfg.start ? new RealDate(cfg.start).getTime() : new RealDate(2026, 0, 1, 12, 0, 0).getTime();
  var pbase = rPerf(), vnow = 0, nextId = 1, timers = new Map(), rafs = new Map();
  function VDate() {
    if (!(this instanceof VDate)) return new RealDate(base + vnow).toString();
    return Reflect.construct(RealDate, arguments.length ? [].slice.call(arguments) : [base + vnow]);
  }
  VDate.prototype = RealDate.prototype;
  VDate.now = function () { return base + vnow; };
  VDate.parse = RealDate.parse; VDate.UTC = RealDate.UTC;
  window.Date = VDate;
  performance.now = function () { return pbase + vnow; };
  function add(fn, ms, args, every) {
    var id = nextId++;
    timers.set(id, { id: id, at: vnow + Math.max(0, +ms || 0), fn: typeof fn === "function" ? fn : function () { (0, eval)(fn); }, args: args, every: every ? Math.max(1, +ms || 0) : 0 });
    return id;
  }
  window.setTimeout = function (fn, ms) { return add(fn, ms, [].slice.call(arguments, 2), false); };
  window.setInterval = function (fn, ms) { return add(fn, ms, [].slice.call(arguments, 2), true); };
  window.clearTimeout = window.clearInterval = function (id) { timers.delete(id); };
  window.requestAnimationFrame = function (cb) { var id = nextId++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = function (id) { rafs.delete(id); };
  try { Object.keys(cfg.localStorage || {}).forEach(function (k) { localStorage.setItem(k, cfg.localStorage[k]); }); } catch (e) {}
  window.__vclock = {
    now: function () { return vnow; },
    advance: function (ms) {
      var target = vnow + ms, guard = 0;
      for (;;) {
        var next = null;
        timers.forEach(function (t) { if (t.at <= target && (!next || t.at < next.at || (t.at === next.at && t.id < next.id))) next = t; });
        if (!next || ++guard > 20000) break;
        vnow = Math.max(vnow, next.at);
        if (next.every) next.at += next.every; else timers.delete(next.id);
        try { next.fn.apply(window, next.args); } catch (e) { console.error(e); }
      }
      vnow = target;
      var cbs = []; rafs.forEach(function (cb) { cbs.push(cb); }); rafs.clear();
      cbs.forEach(function (cb) { try { cb(pbase + vnow); } catch (e) { console.error(e); } });
    }
  };
})();
