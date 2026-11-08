// Records the product's own interactions frame by frame (60 fps, 3x pixel density) for the film to play back.
//   node record.js <takes.js> [name ...]       (default: every take in the file)
// The page runs on the film's virtual clock (served with frame.js injected; list the page in film.config.json "inject"),
// which the recorder moves one frame at a time. Every CSS transition and animation is paused and set to the frame's time
// by hand, so each saved frame is exactly what the product shows at that moment. 45 unsaved lead frames go first, so
// whatever the page sets going as it settles has finished.
//
// takes.js exports:
//   module.exports = {
//     page: '/app/index.html',                  // a page under the served root, listed in "inject"
//     viewport: { width: 1440, height: 900, dpr: 3 },
//     out: '../assets/seq',                     // relative to the takes file; one folder of fNNNN.jpg per take, plus tracks.js and rects.json
//     hide: '#toast, #dev-banner',              // optional: selectors hidden while filming
//     takes: {
//       send: {
//         route: 'messages',                     // the page's hash route (or '' for none)
//         frames: 240,
//         prep: async (ev, adv) => { await ev(() => document.querySelector('[data-open=chat]').click()); await adv(1200); },
//         at: { 30: ev => ev(() => document.querySelector('#send').click()) },          // clicks on given frames
//         track: () => ({ msg: R('.message:last-child'), send: R('#send') }),          // rects the film follows, every frame
//         measure: { 0: () => ({ form: R('form') }) }                                   // rects at given frames
//       }
//     }
//   };
// R(selectorOrElement) returns [left, top, width, height] in the page's CSS pixels, or null.
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), serve = require('./serve'), C = require('./config');
const wait = ms => new Promise(r => setTimeout(r, ms)), F = 1000 / 60, LEAD = 45;
const [takesFile, ...only] = process.argv.slice(2);
if (!takesFile) { console.log('usage: node record.js <takes.js> [name ...]'); process.exit(1); }
const CFG = require(path.resolve(takesFile)), OUT = path.resolve(path.dirname(path.resolve(takesFile)), CFG.out || 'seq');
const VP = Object.assign({ width: 1440, height: 900, dpr: 3 }, CFG.viewport || {});
(async () => {
  const srv = await serve(), T = {};
  const names = only.length ? only : Object.keys(CFG.takes);
  const b = await puppeteer.launch({ executablePath: C.chrome(), headless: 'new', protocolTimeout: 120000, args: C.launchArgs, defaultViewport: { width: VP.width, height: VP.height, deviceScaleFactor: VP.dpr } });
  for (const name of names) {
    const S = CFG.takes[name], p = await b.newPage(), ev = (f, ...a) => p.evaluate(f, ...a), errs = [];
    p.on('pageerror', e => errs.push(String(e.message)));
    await p.goto(srv.url + CFG.page + '?take=' + Date.now() + (S.route ? '#' + S.route : '')); await wait(1500);
    const adv = async ms => { for (let t = 0; t < ms; t += 50) await ev(d => window.__vclock.advance(d), Math.min(50, ms - t)); };
    await adv(1600);
    await ev(h => { const st = document.createElement('style'); st.textContent = (h ? h + ' { display: none !important; } ' : '') + '* { caret-color: transparent !important; }'; document.head.appendChild(st); }, CFG.hide || '');
    await ev(() => { window.R = s => { const e = typeof s === 'string' ? document.querySelector(s) : s; if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }; });
    if (S.prep) await S.prep(ev, adv);
    /* what is already moving when recording starts finishes first; endless loops carry on from where they are */
    await wait(600);
    await ev(() => { window.__A = new Map(); document.getAnimations().forEach(a => { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else __A.set(a, -Math.round((a.currentTime || 0) / (1000 / 60))); } catch (e) {} }); });
    await ev(() => { window.__step = i => { document.getAnimations().forEach(a => { if (!__A.has(a)) __A.set(a, i); a.pause(); a.currentTime = Math.max(0, (i - __A.get(a)) * 1000 / 60); }); }; __step(0); });
    const dir = path.join(OUT, name), M = {};
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (let k = -LEAD; k < S.frames; k++) {
      const i = k + LEAD;
      if (k >= 0 && S.at && S.at[k]) { await S.at[k](ev); await ev(() => void document.body.offsetWidth); }
      await ev(d => window.__vclock.advance(d), F);
      await ev(i => __step(i), i);
      if (k < 0) continue;
      if (S.track) (T[name] = T[name] || []).push(await ev('(' + S.track.toString() + ')()'));
      if (S.measure && S.measure[k]) M[k] = await ev('(' + S.measure[k].toString() + ')()');
      await p.screenshot({ path: path.join(dir, 'f' + String(k).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: VP.width, height: VP.height } });
    }
    console.log(name, S.frames, 'frames', errs.length ? errs : '');
    if (Object.keys(M).length) { const f = path.join(OUT, 'rects.json'); const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : {}; all[name] = M; fs.writeFileSync(f, JSON.stringify(all, null, 1)); }
    await p.close();
  }
  if (Object.keys(T).length) {
    const f = path.join(OUT, 'tracks.js'); let all = {};
    if (fs.existsSync(f)) all = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^window.TRACKS = /, '').replace(/;\s*$/, ''));
    Object.assign(all, T); fs.writeFileSync(f, 'window.TRACKS = ' + JSON.stringify(all) + ';\n');
  }
  await b.close(); srv.close(); process.exit(0);
})();
