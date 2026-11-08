// A local server for the film: it serves the project root so the film and the live product it shows share an origin
// (the film reaches into the product's frames), and starts each product page listed in film.config.json "inject" on
// the film's virtual clock (frame.js), before any of the page's own scripts run. Used by render.js, at.js, animcheck.js.
const http = require('http'), fs = require('fs'), path = require('path'), C = require('./config');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const CLOCK = fs.readFileSync(path.join(__dirname, 'frame.js'));
module.exports = () => new Promise(res => {
  const srv = http.createServer((req, rsp) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/__film/frame.js') { rsp.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); rsp.end(CLOCK); return; }
    let f = path.join(C.root, decodeURIComponent(u.pathname));
    if (f.startsWith(C.root) && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!f.startsWith(C.root) || !fs.existsSync(f)) { rsp.writeHead(404); rsp.end(); return; }
    let body = fs.readFileSync(f);
    if (C.inject.includes(u.pathname)) body = Buffer.concat([Buffer.from('<script>window.__FILM_CLOCK=' + JSON.stringify(C.clock) + '</script><script src="/__film/frame.js"></script>\n'), body]);
    rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    rsp.end(body);
  });
  srv.listen(+process.env.PORT || 0, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + srv.address().port, close: () => srv.close() }));
});
/* run on its own (node tools/serve.js) to preview the film or a logo lab in a browser: it serves until stopped */
if (require.main === module) module.exports().then(s => console.log('serving ' + C.root + ' at ' + s.url + '  (film: ' + s.url + C.film + ')'));
