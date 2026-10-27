// Shared settings for the film tools, read from film.config.json in the film's folder (the folder above tools/),
// or from the path in $FILM_CONFIG. Every field has a default, so a missing file still works for the starter.
//
// {
//   "root": "..",                         folder served, relative to the config file: the film and the product must share it
//   "film": "/launch/film/film.html",     URL path of the film page under root
//   "inject": ["/prototype/home.html"],   product pages that get the virtual clock (frame.js) before their own scripts
//   "clock": { "start": "2026-10-25T14:37:00", "localStorage": { "theme": "light" } },
//   "width": 1920, "height": 1080, "fps": 60,
//   "chrome": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
// }
const fs = require('fs'), path = require('path');
const file = process.env.FILM_CONFIG || path.resolve(__dirname, '..', 'film.config.json');
const raw = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const base = fs.existsSync(file) ? path.dirname(file) : path.resolve(__dirname, '..');
function chrome() {
  const tries = [raw.chrome, process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const hit = tries.find(p => fs.existsSync(p));
  if (!hit) throw new Error('Chrome not found: set "chrome" in film.config.json or CHROME_PATH');
  return hit;
}
module.exports = {
  root: path.resolve(base, raw.root || '..'),
  film: raw.film || '/' + path.relative(path.resolve(base, raw.root || '..'), path.join(base, 'film', 'film.html')).split(path.sep).join('/'),
  inject: raw.inject || [],
  clock: Object.assign({ start: '2026-01-01T12:00:00', localStorage: {} }, raw.clock || {}),
  width: raw.width || 1920, height: raw.height || 1080, fps: raw.fps || 60,
  chrome, file,
  launchArgs: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'],
};
