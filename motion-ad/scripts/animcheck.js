// Lists elements in the film's live product frames whose inline style the film set but a CSS animation overrides:
//   node animcheck.js t1 t2 ...
// A finished entrance animation (fill-mode both) keeps holding what it animated, so the film's inline transform and
// opacity silently do nothing. Every element listed needs style.animation = "none" before the film moves it.
const puppeteer = require('puppeteer-core'), serve = require('./serve'), C = require('./config');
const times = process.argv.slice(2).map(Number);
(async () => {
  const srv = await serve();
  const br = await puppeteer.launch({ executablePath: C.chrome(), headless: 'new', args: C.launchArgs, defaultViewport: { width: C.width, height: C.height } });
  const p = await br.newPage();
  await p.goto(srv.url + C.film); await p.evaluate(() => window.FILM.ready);
  for (const t of times.sort((x, y) => x - y)) {
    await p.evaluate(t => window.FILM.render(t), t);
    const r = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('iframe').forEach(f => {
        const d = f.contentDocument; if (!d) return;
        d.querySelectorAll('[style]').forEach(e => {
          const cs = f.contentWindow.getComputedStyle(e);
          if (cs.animationName === 'none') return;
          const bad = [];
          if (e.style.opacity && Math.abs(parseFloat(e.style.opacity) - parseFloat(cs.opacity)) > 0.01) bad.push('opacity ' + e.style.opacity + ' vs ' + cs.opacity);
          if (e.style.transform && e.style.transform !== 'none' && (cs.transform === 'none' || (/translate|scale/.test(e.style.transform) && cs.transform === 'matrix(1, 0, 0, 1, 0, 0)'))) bad.push('transform ' + e.style.transform + ' vs ' + cs.transform);
          if (bad.length) out.push((f.getAttribute('src') || '').split('/').pop() + ' ' + e.tagName + '.' + String(e.className || '').slice(0, 30) + ' anim=' + cs.animationName + ' :: ' + bad.join('; '));
        });
      });
      return out;
    });
    console.log('t=' + t, r.length ? '\n  ' + r.slice(0, 20).join('\n  ') : 'none');
  }
  await br.close(); srv.close(); process.exit(0);
})();
