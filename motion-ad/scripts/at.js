// Renders single frames at given times, without motion blur, for probing after every change:
//   node at.js <dir> t1 t2 ...      (render in rising time: the film's live product clicks happen once, forwards)
// Writes <dir>/tNN.NN.jpg and prints any page errors (favicon misses filtered out). Between probes the film is walked
// forward in 0.1 s steps without screenshots, so a click in the live product, and the transitions it starts, happen as
// they would in a render (a probe at 11 s after one at 3 s still shows the list sorted at 9.2 s).
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), serve = require('./serve'), C = require('./config');
const [dir, ...ts] = process.argv.slice(2);
if (!dir || !ts.length) { console.log('usage: node at.js <dir> t1 t2 ...'); process.exit(1); }
(async () => {
  const srv = await serve();
  const br = await puppeteer.launch({ executablePath: C.chrome(), headless: 'new', protocolTimeout: 600000, args: C.launchArgs, defaultViewport: { width: C.width, height: C.height } });
  const p = await br.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message)));
  p.on('console', m => { const at = (m.location() || {}).url || ''; if (m.type() === 'error' && !/favicon/.test(m.text() + at)) errs.push(m.text() + (at ? ' ' + at : '')); });
  await p.goto(srv.url + C.film); await p.evaluate(() => window.FILM.ready);
  fs.mkdirSync(dir, { recursive: true });
  let now = 0;
  for (const t of ts.map(Number).sort((x, y) => x - y)) {
    await p.evaluate((a, b) => { for (let s = a + 0.1; s < b - 1e-6; s += 0.1) window.FILM.render(s); window.FILM.render(b); }, now, t); now = t;
    await p.screenshot({ path: path.join(dir, 't' + t.toFixed(2) + '.jpg'), type: 'jpeg', quality: 88 });
  }
  if (errs.length) console.log(errs);
  await br.close(); srv.close(); process.exit(0);
})();
