// Renders the film frame by frame.
//   node render.js video <out.mp4> [from] [to] [fps]   every frame piped into ffmpeg (H.264, 4:2:0, bt709, crf 14)
//   node render.js frames <dir> [from] [to] [step]     stills as JPEG, for review sheets
// Motion blur: the film says which moments each frame averages (FILM.moments, a 180-degree shutter, more of them the
// faster things move). Every frame goes to ffmpeg as FILM.maxMoments pictures, each moment repeated to fill them, and
// ffmpeg averages each group back into one frame. Frame times come from whole frame numbers, so a stretch rendered on
// its own lands on exactly the frames a full render would, and can be spliced in.
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path'), { spawn } = require('child_process'), serve = require('./serve'), C = require('./config');
const [mode, out, a, b, c] = process.argv.slice(2);
if (!mode || !out) { console.log('usage: node render.js video <out.mp4> [from] [to] [fps] | frames <dir> [from] [to] [step]'); process.exit(1); }
(async () => {
  const srv = await serve();
  const br = await puppeteer.launch({ executablePath: C.chrome(), headless: 'new', protocolTimeout: 600000, args: C.launchArgs, defaultViewport: { width: C.width, height: C.height, deviceScaleFactor: 1 } });
  const p = await br.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { const at = (m.location() || {}).url || ''; if (m.type() === 'error' && !/favicon/.test(m.text() + at)) errs.push(m.text() + (at ? ' ' + at : '')); });
  await p.goto(srv.url + C.film, { waitUntil: 'load' });
  await p.evaluate(() => window.FILM.ready);
  const dur = await p.evaluate(() => window.FILM.duration);
  const cdp = await p.target().createCDPSession();
  const shot = async t => { await p.evaluate(t => window.FILM.render(t), t); return Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64'); };
  if (mode === 'frames') {
    fs.mkdirSync(out, { recursive: true });
    const from = +a || 0, to = b == null ? dur : +b, step = +c || 0.25;
    for (let t = from; t <= to + 1e-6; t += step) {
      await p.evaluate(t => window.FILM.render(t), t);
      const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
      fs.writeFileSync(path.join(out, 'f_' + t.toFixed(3) + '.jpg'), Buffer.from(r.data, 'base64'));
    }
  } else {
    const fps = +c || C.fps, F0 = Math.round((+a || 0) * fps), F1 = Math.round((b == null ? dur : +b) * fps), n = F1 - F0, M = await p.evaluate(() => window.FILM.maxMoments || 1);
    const avg = `tmix=frames=${M},select='eq(mod(n\\,${M})\\,${M - 1})',setpts=N/(${fps}*TB)`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * M), '-i', '-', '-vf', avg, '-r', String(fps), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now(); let blurred = 0;
    const put = async buf => { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); };
    for (let i = 0; i < n; i++) {
      const ts = await p.evaluate(t => window.FILM.moments ? window.FILM.moments(t) : [t], (F0 + i) / fps);
      if (ts.length > 1) blurred++;
      for (const t of ts) { const buf = await shot(t); for (let r = 0; r < M / ts.length; r++) await put(buf); }
      if (i % 300 === 0) process.stdout.write(`${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    }
    console.log('motion blur on', blurred, 'frames');
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('wrote', out, n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  }
  if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 8));
  await br.close(); srv.close();
  process.exit(0); /* idle connections can otherwise hold the process open after the video is written */
})();
