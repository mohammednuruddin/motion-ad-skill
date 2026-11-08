# The logo: how it's built, and how it should move

A logo animation is a brand decision, not a flourish. The best ones come from how the mark is built and what it means: a mark drawn from one continuous line can be written, a mark made of repeated units can assemble, a mark that depicts something (a leaf, a spark, a comma, a letter) can do what that thing does. Study first, prototype several, let the user choose, then fit the choice to the film.

This works for any logo. The brand's own file is the input; nothing about a particular mark is built in.

## 1. Get the real mark

- Look in the project first (`assets/`, `public/`, the app's logo component, mobile asset folders, the design system), then ask the user for the SVG and the brand kit.
- An SVG with clean paths is best: its own elements are the parts the film moves. If there's only a PNG, trace it (below), compare the trace's `mark.svg` with the original at 400% zoom, confirm it with the user, and use it as the SVG.
- Take the exact colours from the asset (from an SVG, read them from the file), not from memory or from a trace. Note the wordmark's typeface, and any rules about clear space, minimum size and colours on dark.

## 2. Study how it's built

Run the tracer on the mark. It takes a PNG (1500 px or more), or an SVG, which it rasterises first with `rsvg-convert`, ImageMagick, or macOS Quick Look. To make the PNG yourself: `qlmanage -t -s 1600 -o <dir> logo.svg` on a Mac (the mark comes out on white, which the tracer handles), or `rsvg-convert -w 1600 logo.svg -o logo.png` (`brew install librsvg`).

```bash
python3 <skill>/scripts/trace_logo.py brand/logo.svg --out logo-study/     # run from the film's folder
```

It writes `study.json` and `study.png`:
- the colours;
- each separate part, with its centroid, angle and radius from the mark's centre, its area and its holes;
- the rotational symmetry it finds;
- which parts are copies of one unit: rotated about the centre, mirrored, or moved along (bars side by side);
- that unit's outline and holes in a 120-unit box centred on the mark;
- any empty space at the centre.

It also writes `mark.svg`, every part as a clean path in `viewBox="-60 -60 120 120"`. Check `study.png` by eye: the numbers only mean something if the parts it found are the parts a person sees.

Reading it:
- **Parts are the visible pieces**: connected areas of one colour. A shape cut through by another colour counts as two pieces, and touching shapes of one colour merge. With an SVG, count the file's elements instead; the tracer is for the symmetry, the repeats and the hollow centre.
- **IoU** says how well the ink lands on itself: above about 0.9 is a real symmetry or copy, 0.8–0.9 is close (check by eye), below about 0.6 is none. The tracer prints which.

Then write the study down in a few lines:

1. **What it depicts or stands for.** Ask the user if it isn't obvious. Meaning decides motion.
2. **Its parts.** One shape or several? A repeated unit, and how its copies are placed (rotated, mirrored, offset)? A wordmark with a symbol?
3. **Strokes and fills.** Is it drawn (lines of even weight that could be traced with a pen), filled (solid shapes), or both? Are there holes or counters? Are there edges that run continuously through several parts?
4. **Construction geometry**: circles, grids, angles, a hollow centre, the baseline the wordmark shares.
5. **Colour logic**: which parts carry which colour, and whether colour breaks a symmetry the shape has.

## 3. Build a logo module that can move its parts

Don't animate a flat image with transforms alone. Rebuild the mark as data the film can re-pose. The starter's `film/logo.js` does this for any SVG file. It loads `brand/logo.svg` and splits it into parts: each leaf shape (path, circle, rect, polygon, line, text), with groups flattened and each `<use>` turned into a copy of its own. It measures each part's length, centroid and angle from the mark's centre, so the generic motions below work on any mark without changes:

- `LOGO.ready` resolves once the file is loaded and measured. Build stages after it (the starter's `FILM.ready` waits for it).

- `LOGO.make(stage)` puts a copy of the mark in a stage element and returns its parts, each with a pen (its outline, for drawing).
- `LOGO.drawn(S, p)`, `LOGO.assembled(S, p)` and `LOGO.grown(S, p, r0)` pose it for p from 0 to 1, where 1 is exactly the finished logo. `grown` starts from a circle of radius `r0` (% of the stage), so it can take over from a dot of the same size.
- `LOGO.box()` is the mark's own width and height in the 120-unit box, for placing type under it whatever its shape.
- `LOGO.colour()` is the brand's main colour, read from the file (the fill of its largest part). The starter colours the opening pill and dot with it, so the dot can become the mark.

The sample film uses all three, so swapping in a new `brand/logo.svg` shows straight away how each reads with this mark. These are a start, not the film's logo motion. For a richer study, extend the module:

- **The unit and its placements.** For marks made of repeats, store one unit's outline and holes, plus each copy's rotation, mirror and colour. Draw each as an SVG path with `fill-rule: evenodd`, so holes stay holes.
- **Coordinates that mean something.** Give the unit's points parameters the motions can move along: how far along the unit, which side, the distance from the centre. Then one function can pose the mark anywhere between states, for example from an unrolled line to its finished shape.
- **Derived geometry for drawing.** The continuous strokes or edges that run through the mark, so pens can draw it the way it's constructed. Each part's angular sector: a part that sits within its sector can be revealed exactly by a wedge from the centre.
- **Framing.** Keep a function that centres a pose on its own box, or on the finished mark's box, so a forming mark stays in the middle of the frame and its last frame lands exactly on the logo.
- **One namespace.** Keep everything inside `window.LOGO`. The film is one scope, and a stray global can overwrite one of the film's own.

## 4. The motions a logo can make

Choose by meaning first, construction second.

| Family | What happens | Fits when |
|---|---|---|
| **Draw** | Pens trace the mark's strokes, several at once, so it reads early; the fills arrive behind the pens in their own colours | Drawn marks; a finale where a story's path draws the mark |
| **Assemble** | The parts arrive from their own directions (out from the centre, or along their own axes) and lock into place | Marks made of parts or repeats; "everything comes together" |
| **Grow from a seed** | A dot becomes a line, the line becomes the mark | Marks with an origin: a line, a sprout, a stroke |
| **Open and close** | The mark unfolds into another form (a line, a row, a ribbon) and folds back | Loops, loaders, transitions between scenes, "it becomes a line, then the logo again" |
| **Morph from something on screen** | A pill, a button, a cursor dot or a UI shape becomes the mark | Openings and landings: the product turns into the brand |
| **The shape as a transition** | The mark wipes the frame, or is a window onto the next scene | Bold, simple shapes |
| **Construction** | Guide lines and circles appear, the shapes snap to them, then fill | Geometric marks; design-led audiences |

Lessons from real feedback:
- **Keep it solid.** A mark that breaks into a particle cloud before forming reads as cheap.
- **Gimmick reveals get rejected.** A camera flying through a hole in the mark into the product was called "very weird".
- **Identity is colour, weight and holes, not the contour.** A drawing that only reads as the logo when it's nearly finished misses the point. A thin single-colour outline of a filled mark didn't read as the logo until almost the end.
- **Centre it.** A forming mark that sags off-centre is noticed. Frame each frame on the shape's own box, aimed at the finished logo's box.

## 5. Make a lab, and let the user choose

Build one HTML page with every candidate looping side by side (6–9 of them), each labelled with what it says about the brand. Make it in the film's folder (for example `lab/index.html`, loading `../film/logo.js`), so it uses the same module the film will. Preview it locally: `node tools/serve.js` prints a local address, and the page is at `<address>/lab/`. It needs that server, because `logo.js` fetches the SVG. Publish it only if the user asks, and then privately. The user keeps a few and drops the rest; record the picks and the reasons in the film's notes. Build each candidate as `make(stage) → pose(p)` with p from 0 to 1, so the film can play any of them at any speed and point, and the lab and the film share one implementation.

## 6. Fit the chosen motions to the film

- **Opening.** Grow the mark out of the opening line's own element: for example, a pill in the headline closes into a dot, and the dot becomes the mark's first stroke, with no unrelated shape in between. Grow it on a soft curve (on a fast-start curve it leaps), and lift it into the lockup with the wordmark as it closes, not after it settles.
- **Landing.** Match-cut into the product: the camera pulls back and the drawn mark shrinks exactly onto the product's own logo (in a header or sidebar). Place it from the live camera every frame, and hand over inside the hold before the next move, so two logos never show at once.
- **Finale.** Let the story make the mark: a path through the product's screens that draws it, the product's parts gathering into it. Paint, don't outline. Keep the silhouette clear: labels outside the mark (pushed off by half their size plus a margin), no leftover lead-in line, empty spaces empty. Give the finished mark its own hold with a caption.
- **Transition into the end card.** Play the mark's own loop from its first frame, which is exactly the finished mark, so the handover is invisible. Resize its stage rather than scaling it with CSS, so the vector stays sharp. If a motion module eases its own progress, don't feed it eased time on top: you get a dead stretch, then a leap. Invert its inner ease so one ease runs across the move.
- **End card.** The formed mark holds about 0.9 s, then the wordmark, the line and the address arrive, on a steady drift.

## 7. Smoothness at film scale

- A logo drawn at several times its usual size shows every polygon corner. Smooth traced points (Catmull-Rom with about 8 points between samples, or the Fourier low-pass in `trace_logo.py`) before drawing lines.
- Colour pens by the part they're drawing. A pen's head is a dot with a light ring, a little larger than the stroke.
- Measure motion blur from the pens' real speed. Hand a moving line to the pens at matching speed, so the split happens while the line is still moving.
