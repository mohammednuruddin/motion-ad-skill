# The rulebook: what every frame is checked against

These are numbers to measure, not taste to argue about. They come from Willenskomer's UX in Motion, Material and Carbon motion guidance, subtitle and broadcast reading norms, broadcast safe areas, display typography practice and streaming loudness targets, and every one was tested on a real film. Auditors check strips against this list (see `review.md`).

## Timing and easing

1. **Everything eases.** Entrances decelerate, exits accelerate, and moves on screen ease in and out. Use linear only for constant drift, loops, and the speed through a hidden cut. *Why: real things accelerate and settle, and a linear move reads as mechanical.*
2. **Duration grows with distance and size.** A small element takes 0.25–0.4 s, something screen-sized 0.5–0.9 s, a camera move 0.8–1.6 s. Nothing the viewer must follow moves in under 0.2 s. *Why: a big jump done fast is a pop, and a small one done slow drags.*
3. **Stagger related items 40–100 ms apart**, main element first. A whole stagger finishes inside 0.5 s.
4. **A state that matters holds at least 0.4 s** once settled before the next move. No hold goes past 1.5 s without some motion, except the end card, which drifts.
5. **One focal motion at a time.** Anything else moving is quieter, slower, or supports it. A camera that follows its subject is supporting motion; a camera that moves against it competes.

## Reading

6. **A line stays readable for at least 0.4 s plus 0.3 s a word**: 1.3 s for three words, 1.9 s for five. Time runs from the first word landing, and the whole line still holds at least 0.5 s once complete.
7. **Words never sit over busy UI without a wash behind them.** Small text that isn't meant to be read is never the focal point.

## Composition

8. **Text sits inside the 5% action-safe margin** (96 px across, 54 px down at 1080p), and comfortably away from it.
9. **One idea a shot, with room round it.** The frame is balanced, and the eye knows where to look within half a second of a new shot.
10. **On a hold, crops don't slice through a line of text or a control at the frame edge.** A haze or a wash quiets what's cut (`spot`, see `devices.md`).
11. **Headlines that play the same role share position, size and weight.** For example: top 72 px, bottom 72 px, side 100–104 px, full screen 124 px. Pick the set at the start and keep it.

## Continuity

12. **Nothing pops.** Everything arrives from somewhere and leaves to somewhere, and when one thing becomes another, it morphs: shape, colour, size and icon change together on the same element.
13. **Cuts are hidden by matching content or by motion**, and direction stays consistent within a sequence.

## Sound

14. **Integrated loudness is −14 LUFS ±1, with a true peak no higher than −1 dBTP.**
15. **Hits land on the frame, and whooshes peak at the fastest frame.** Leave a breath of near-silence before big reveals.

## Rendering

16. **Use motion blur on fast moves** (a 180° shutter), never across a cut, with no strobing copies, shimmer or half-drawn frames.

## Motion rules (how the numbers are met)

- **Nothing just switches.** Every change of screen is a move, and where possible something on screen causes it: a row pressed, a tile in the rail, a button. Where nothing does, the camera carries it with a glide, a whip, or a zoom through a shape the two shots share.
- **Match the speed across a hidden cut.** In a whip or a zoom, the curve before the cut must end as fast as the one after it starts, or the cut shows as a hitch. Pick curves whose end and start slopes are equal and finite: a cubic-bezier whose last control point has x = 1 ends at infinite speed. Pairs that work: `WHIPIN = (0.55, 0, 0.85, 0.5)` with `WHIPOUT = (0.15, 0.5, 0.45, 1)` (both defined in the starter's `film.js`).
- **Push into a point along a straight line.** A linear pan with a zoom that grows as a power swings the target off screen and back. Interpolate the target's position on screen instead, so it travels straight to the centre as the camera closes in (`pv: "in"`/`"out"` in `camAt`).
- **Clear every word before the next screen arrives**, not just before the cut. Start a headline's exit at least 0.5 s before the move; staggered words take about 0.45 s to leave.
- **Don't settle, then move again straight away.** Land directly in the composition the next moment needs. Where a move must follow a landing, overlap them: start the next push gently before the landing ends. A push that starts on a fast-start curve the moment something lands reads as a lurch.
- **Cut on motion**, ideally in a related direction.
- **Dark to light takes at least 0.6 s, with the light leading,** so no screen edge shows against the dark.
- **Hand over from a drawn vector to screenshot pixels with a few frames of crossfade**, or better, on a frame where the two are identical.
- **When zooming towards a point that must stay put**, place the camera from where that point should be on screen, using the live camera, not a constant.
- **Reorder a list in carries**, the way a list reorders when you drag it. Lift the rows that rise and carry them over the rest. Each row they pass steps down when the carried rows' top crosses its middle, driven by where they are, not by a timer.
- **Move on arcs.** Something that travels far goes along one axis first and then the other (x and y on different curves), as a hand would, so it never crosses other words.
- **A close-up that cuts through its neighbours gets a spotlight:** a pale haze over everything in the window but the subject, sized to the subject.
- **Frame the whole window when the layout won't centre.** And keep the camera inside the panel it shows: work out the zoom at which both edges fit (`x0 + 960/z ≤ x ≤ x1 − 960/z`).
- **A wash leads its words** by at least 0.2 s, in and out.
- **Two labels in one place hand over in turn:** the old one is gone by a third of the change, then the new one comes in, while the shape morphs. Crossfading them together overprints them.
- **Track anything you highlight or click in recorded footage on every frame**: feeds scroll.
- **In a whip or a zoom, let the smear go long** (a 96 px cap instead of 24): nothing needs reading there.
- **At the instant of a cut, the cut wins.** Looking keys up with `t <= key.t` returns the previous shot on the cut's frame, and blur then double-exposes it. Use a strict `<`.

## Truth

- No invented numbers, features or data. Use the product's own sample data and real behaviour, with buttons pressed for real.
- Follow the product's semantics: its threshold bands and colours, and red only where it uses red.
- When the product shows a bug on camera, fix it in the film and tell the user, so the product gets fixed too.
- Pin one moment in time (a date and time on the virtual clock) for every shot, so live and recorded shots agree.

## Don'ts that read as "explainer video"

- Moving a camera over screenshots with a highlight box: a slideshow.
- A screen that just switches to the next.
- The same device every beat.
- UI too small to read. Frame tight when the screen is the point (1.4× or more on a 1440-wide UI), or lift the part that matters out of the screen.
- A score nobody has listened to.
- A long blank ending, or long holds with nothing moving. Give a held end card a slow, steady drift.
- Letters that fly and tilt along a path.
- Taking a hint literally. Treat it as a direction.
