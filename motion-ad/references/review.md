# The review loop

Checks passing is not the bar: a first draft can pass every check and still feel like an explainer. Review frame by frame, and as motion, against the rulebook. Then ask honestly whether you're proud of it, and fix the biggest thing first.

## After every change

1. **Probe single frames** around what changed, in rising time: `node tools/at.js probe/ t1 t2 …`. Look at them. Crop and zoom where detail matters (text overlaps, edges, junctions).
2. **Check the effect actually happens**, not just that its code exists. For anything the film sets on a live product element, run `node tools/animcheck.js t…` to catch CSS animations overriding the film's styles. Then look for the effect in a rendered frame.
3. **Scan for duplicate top-level names** in `film.js` (a second `var` silently overwrites the first) and for NaN transforms.

## After every render

1. **Look at the whole film, every chapter, not only the part you changed.** A finale change once broke the opening's landing, and the client found it. Make a 2 fps sheet of the whole film and 10 fps sheets of every chapter:
   ```bash
   python3 <skill>/scripts/strips.py out/video.mp4 0 76 --fps 2 --cols 12 --out review/all.jpg
   python3 <skill>/scripts/strips.py out/video.mp4 56 60 --fps 10 --out review/56.jpg
   ```
2. **Run the motion meter.** It lists unplanned jumps (a pop, a swap, a stale splice), planned cuts spread over two frames (a double exposure), and dead stretches with nothing moving:
   ```bash
   python3 <skill>/scripts/motion.py out/video.mp4 57.0,40.5      # the planned cuts
   ```
   Check every spike at 60 fps (`strips.py --fps 60` over a third of a second) and decide whether it's planned (a knock to black, a pass through a dot) or a bug.
3. **Measure the sound:** `python3 <skill>/scripts/loudness.py out/film.mp4 --check`.
4. **Look at every hand-off at 60 fps:** words, take swaps, cuts, logo handovers, list carries.

## Fresh eyes for the big passes

After a major build, hand the film to independent auditors: subagents that never saw the build, given only what's listed below. A shot-by-shot review stops seeing what's always been there, and fresh auditors found effects that had never worked: an overlay hidden by a CSS animation, a sort that emptied the top of a list, a warning too small to read, a question that vanished on send. Split the film into four stretches plus one whole-film critic:
- Give each auditor the rulebook, the storyboard, the motion report and the 10 fps sheets, with the full-resolution frames beside them.
- Tell them what has already been fixed, so they don't report it again.
- Ask for findings with times, pixels, the rule broken, and a concrete fix that fits how the film is built, ranked high, medium or low.
- Then run one sceptic a stretch to re-check each finding on frames it renders itself, defaulting to "not real". In one real pass 49 of 57 findings survived, and the sceptics corrected several of the proposed fixes.
- Fix the confirmed findings, highest first. Check each claim on your own frames before acting on it: one claimed blink didn't reproduce, and one missing mark came from a stale splice.

## Deliver

- Copy the newest render to the place the user watches (`out/<name>.mp4`) immediately, and say what changed. A user who watches the old file thinks nothing changed.
- Keep alternates as their own files (a voiced cut, a finale-only clip for quick review), and never overwrite the main cut with an alternate.
- Record what you learned (what worked, what the user rejected and why, the logo motions picked) in the film's `PLAYBOOK.md` (`assets/templates/PLAYBOOK.md`), so the next round, and the next film, starts ahead.
