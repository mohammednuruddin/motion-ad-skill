# The pipeline: building and rendering the film

## Layout

Run `scripts/new_film.sh launch` from the project root. It copies `assets/starter/` to `launch/`, copies this skill's scripts into `launch/tools/` and installs `puppeteer-core`. The starter renders a 16 s sample film out of the box, which proves the toolchain before you write any of your own:

```bash
node launch/tools/at.js launch/probe 1.5 3.6 5.5 7.6 9.8 11 14.5
```

Then put the brand's SVG at `launch/brand/logo.svg` (the sample re-renders with it, unchanged), point `film.config.json` at the real product, and replace the sample sections with the storyboard's.

```
launch/
  BRIEF.md  STORYBOARD.md  PLAYBOOK.md (your lessons)  REFERENCES.md
  film.config.json   what is served, the film's page, the product pages that get the clock, the clock's moment, size, fps
  brand/        logo.svg (the brand's own), fonts
  film/
    film.html   layers: #bg (the ground), #world (the product plane, under a camera), #cap (words), #fx (logo, overlays)
    film.css    nothing animates in CSS; film.js sets everything for a given time
    film.js     the film: render(t) for any t, and moments(t) for motion blur
    timeline.js window.TL = { bpm, section start times, end }, read by the film and the score
    logo.js     the brand module: loads brand/logo.svg, splits it into parts, poses them (see logo.md)
  product/      what the film shows live (or a path to the real app, served on the same origin)
  assets/       recorded takes (seq/<name>/fNNNN.jpg, tracks.js), score.wav, voices
  tools/        render.js, at.js, serve.js, frame.js, config.js, record.js, animcheck.js (copied from this skill's scripts/)
  out/          the deliverables, always the newest
```

## The rules of the engine

- **One timeline.** Section start times live in `timeline.js` as `window.TL`. The score reads the same file (Python parses the JSON after the `=`). Move a section once, and picture and sound move together. Keep a beat grid (120 BPM is a 0.5 s beat, a 2 s bar) and put events on it.
- **`render(t)` is a pure function of time.** Every element's position, opacity, blur and content is set from `t` alone, so any frame renders on its own, in any order (except irreversible clicks in a live product; see below). Re-apply every pose on every frame. Start each section with "if t is outside my range, hide everything I own".
- **Helpers** (in the starter's `film.js`):
  - time: `seg(t, a, b)`, `lerp`, `clamp01`, cubic-bezier easing (`bez(x1,y1,x2,y2)`), `piece` (a polyline for remapping time);
  - words: `line()` and `wordsAt()`;
  - the product: `win(x, y, src)` (a live page on the plane), `clockTo`, `drive` (its CSS animations on film time), `rectIn` (an element's rect in the window), `spot` (a spotlight);
  - the camera: `K()`, `camAt()`, `camApply()`, `onScreen()` (a window point's place on screen now);
  - the pointer: `cursor`/`cursorAt`; the logo: `stage`/`stageAt`.
  Measure what the film aims at (the product's logo, a button) once, when `FILM.ready` resolves, not with hard-coded pixels.
- **Curves.** The product's own curve is the default (`EASE`). Use `SOFT (0.4,0,0.2,1)` to start a move from rest, `INOUT (0.65,0,0.35,1)` for symmetric moves, `IN (0.55,0,0.9,0.4)` for exits, and `SWELL (0.42,0,0.58,1)` for brightness changes. Pair whip and zoom curves so their speeds match at a hidden cut.
- **The camera** looks at a plane where every product window lives (laid out in a grid, so a wall of every screen comes free at the end). Keys are `{t, x, y, z, ease, cut, pv}`; z is interpolated in log space; `pv: "in"` pushes into a point along a straight line on screen. Draw only the window the camera is on (and the one a move is bringing in), so neighbours never peek in at the edges.
- **Never hide and show a live frame within one render.** A frame that stops being drawn loses its CSS animations, and they restart from nothing when it's drawn again. Decide each window's visibility once per frame.
- **Words** are spans, one per word. `wordsAt(line, t, in, out)` brings them in out of a blur, rising, staggered, and takes them out the reverse way. A pill (`**...**` in the text) is its own element and can morph.
- **Logo and overlays** are SVG in `#fx`, sized by setting the stage's width and height (not a CSS scale) so they stay sharp.

## Showing the product live

- **Same origin, pinned clock.** `serve.js` serves `root` and injects `frame.js` at the top of each product page listed in `film.config.json` `inject`. The product then runs on a virtual clock (timers, `requestAnimationFrame`, `Date`, `performance.now`) pinned to the moment in `clock.start` and moved only by the film; `clock.localStorage` seeds settings such as a theme. The film and the product must share `root`, or the film can't reach into the product's frames.
- **Boot.** Load each product view in an iframe (`win(x, y, src)`), advance its clock about 3 s, then run any setup clicks with small clock advances.
- **Every frame:**
  - Advance the window's clock with film time (`clockTo`), make any click that's due, then `drive()`: it pauses every CSS animation and transition the page has and sets each one's time from the frame it first appeared, so the product's own motion runs on film time, on its own curve. Make the click before `drive()`, so a transition it starts is timed from that frame.
  - Where the film itself moves a product element, turn that element's transitions off, or the two fight.
  - Find elements again by stable text or IDs, because lists re-render after you measure them.
  - Set `animation: none` on everything the film moves: a finished entrance animation keeps overriding inline `transform` and `opacity`, and the film's pose silently never happens. `animcheck.js` lists any element where this is going on.
- **Irreversible clicks** (send, approve, play) happen once, at their time. Renders go in rising time, and a segment render starts early enough for the live screens to catch up. Where the product then plays something, advance that frame's clock with film time, and stop it when its beat ends, or it fires later events (a demo call popped into the final wall).
- **A copy of a product element goes beside it, in the same parent, not in `body`.** In `body` it picks up the wrong type. Switch off its entrance animation (and its children's), and show it with `display: ""`, not `block`, or its flex layout breaks.
- **Chrome rasterises an iframe at its displayed zoom**, so live UI stays sharp at 4× and beyond. Blur at screen size, not on a hugely scaled layer.

## Recorded takes (when the product moves itself)

`record.js` films a product interaction frame by frame:
- at 60 fps and 3× pixel density, on the same clock;
- every CSS animation paused and stepped by hand;
- 45 unsaved lead frames first;
- clicks at given frames;
- every rect the film will follow tracked on every frame (`tracks.js`).

Play a take back with `seqTo(window, frame)`. Show **one recorded frame per film frame** (round the take's time to the frame) so motion blur never averages two recorded frames into two copies. Remap time with `piece([[t, frame], …])` to slow a take, hold it, or time it to a voice. Diff the first frame of a live-to-take handover to prove they match. A track's first frame can be stale, so check the picture.

## Motion blur

`FILM.moments(t)` returns the instants to average for frame t. How many depends on how fast the fastest point on screen moves:
- the camera's frame corners;
- the corners of a card that's growing (measure them from the same lerp the move draws with, `rectV`, rather than guessing a peak speed);
- listed element moves.

The smear is half the frame's movement (a 180° shutter), capped at 24 px (96 px in a whip or zoom where nothing is read), with samples no more than 1 px apart (at 2 px, the thin strokes of moving text show as stacked copies), and never straddling a cut (`CUTS_AT`). `render.js` sends each frame as `FILM.maxMoments` (24) pictures, repeating instants to fill them, and ffmpeg's `tmix` averages each group back into one frame.

Measure each listed move's speed from its own curve: distance on screen × the curve's slope at that instant ÷ duration ÷ 60. Never guess a peak: a fast-start curve like `(0.32, 0.72, 0, 1)` peaks at about 4× its average speed, and a guess of half that left stripes on a product's sorting rows.

## Rendering

```bash
node tools/at.js probe/ 7.2 7.3 12.4          # single frames, no blur, rising order: after every change
node tools/render.js video out/film.mp4         # the whole film, 60 fps, with motion blur
node tools/render.js video seg.mp4 47.0 50.0    # one stretch, to splice into the last full render
```

Splice a re-rendered stretch into the last full render by frame numbers, then re-encode:

```bash
ffmpeg -i full.mp4 -i seg.mp4 -filter_complex "[0:v]trim=start_frame=0:end_frame=2820,setpts=PTS-STARTPTS[a];[1:v]trim=start_frame=0:end_frame=180,setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=3000,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart new.mp4
ffmpeg -i new.mp4 -i assets/score.wav -c:v copy -c:a aac -b:a 256k -shortest out/film.mp4
```

- Render on one page. On a laptop Chrome draws on the CPU, and three pages at once ran three times slower each.
- Run long renders in the background and wait for them to finish; don't poll.
- Frame times come from whole frame numbers, so a stretch lands exactly on the frames a full render would.
- Expect about 3–4 frames a second for a film full of live UI: a 76 s film is about 20 minutes.

## Pitfalls that cost a render

- **Two declarations of one name in the film's scope.** `film.js` is one big closure, and a second `var X` silently overwrites the first. Scan for duplicate top-level names before every render, and keep sections' state in objects.
- **A NaN in a transform.** The browser drops the whole transform, and the element sits at its origin (the frame's top-left corner). Check suspicious elements' `style.transform` in a probe.
- **Double easing.** An animation module that eases its own progress, fed eased time on top: invert one of them.
- **A spotlight or haze set only inside a time window.** Call it every frame, with zero alpha outside the window, or it stays in its last state.
- **A copy, patch or overlay that fades with its layer** when it should stay opaque, letting what it covers show through.
- **Cuts listed in the camera but not in `CUTS_AT`**: their blur double-exposes both shots.
