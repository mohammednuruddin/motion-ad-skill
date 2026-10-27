---
name: motion-ad
description: Make Apple-quality motion-graphics ads, product launch films, promo and teaser videos, app trailers and animated logo reveals, rendered frame by frame from code (HTML/SVG and the live product in a browser, Puppeteer and ffmpeg). Covers the whole job. Interview the user about what this video needs, and ask for access to text-to-speech, image, video or music generation, API keys and brand assets when the video calls for them. Study the reference videos and links the user shares, and find more. Work out how the brand's logo is built and design logo animations that suit the film. Storyboard, build, score, render with motion blur, and review frame by frame against a measurable motion rulebook. Use this skill whenever someone asks for a launch video, product video, motion graphics, promo, ad, sizzle, demo film, explainer replacement, logo animation, or end card, or shares X/Twitter, Dribbble, Behance or YouTube links to launch videos and says "make something like this", even if they never say "motion graphics".
---

# Motion-graphics ads and launch films

This skill makes short films that sell a product by showing it: 30–90 s, music-led, built from the product itself and the brand's own shapes, and judged frame by frame. It was distilled from a real 76-second launch film made over many rounds with a demanding client. Every rule here is either measured or came from something that client rejected.

The bar: **every word, image, interaction, transition and stretch of white space earns its place.** If something is there only to fill time or to decorate, it comes out. A film that passes every check can still feel like an explainer video. When the user asks "are you proud of it?", answer honestly and specifically, and keep going until the answer is yes.

## The workflow

Work through these stages in order. Each one has a guide in `references/`; read it when you reach that stage, not all at once.

1. **Intake.** Find out what the film is for and what it needs before building anything (`references/intake.md`). This covers:
   - who it's for and where it will be seen;
   - its length and aspect ratio;
   - what product there is to show;
   - brand assets;
   - sound (music only? voices?);
   - which outside services this particular film needs, such as text-to-speech, image or video generation, music, or stock.

   First read what you can without asking: the project, the brand folder, and the user's links (their text and media sizes with `scripts/fetch_ref.py`, no download). Then ask in one batch, with your recommendation for each question, including permission to download each reference (file, source, size). Ask for keys and access only for what this film will use.

   Settle the film's folder now (default `launch/` in the project) and write `BRIEF.md` there (`assets/templates/BRIEF.md`). `new_film.sh` fills the folder later and leaves the brief alone.
2. **Research before you build** (`references/research.md`). Study every reference the user shares: with permission, download it and make contact sheets, and write down the devices it uses. Without permission, work from the text and mark those notes unseen. Then find more references yourself, plus the principles the best films follow. The client asked why this hadn't been done first. It should have been.
3. **Study the logo** (`references/logo.md`):
   - Get the vector. With an SVG, its own elements are the parts. Trace a PNG with `scripts/trace_logo.py`, which also finds symmetry and repeats.
   - Work out how it is built: its repeated unit, symmetry, strokes, colours and what it depicts.
   - Start the film folder (`scripts/new_film.sh launch`) and put the SVG at `launch/brand/logo.svg`. The starter's `logo.js` can already move its parts.
   - Make a lab page of candidate motions, previewed locally (`node launch/tools/serve.js`), and let the user pick.

   Logo motions are brand decisions. Record the picks.
4. **Story and storyboard:**
   - Open on the problem, on screen within 5 seconds, not on the logo. The mark can arrive after it, grown out of the problem line's own element.
   - Then the product as the answer, and proof chapters, each with its own device. How many depends on length: see the table in `references/intake.md`. A 30 s film has room for two or three short proofs, not three chapters.
   - End with a finale only this product could have, then the end card (4–6 s).

   Pick each beat's device from `references/devices.md`. Time the words with the rulebook's reading time and headline roles (`references/rulebook.md`). Write `STORYBOARD.md` from `assets/templates/STORYBOARD.md`: times, words, the device and the transition into the next beat. Show it to the user before the big build, as a short table in chat plus the file: a story correction costs a paragraph now and a rebuild later.
5. **Build** (`references/pipeline.md`; start with `scripts/new_film.sh <dest>`, which copies the working starter film):
   - Make one timeline file for both picture and sound.
   - Make `render(t)` a pure function of time.
   - Show the real product live in iframes on a pinned virtual clock, or play recorded takes of it.
   - Use a camera over one plane, and words as separate spans.

   Devices that worked, and what doesn't work, are in `references/devices.md`.
6. **Sound** (`references/sound.md`). Write a score synced to the timeline, at −14 LUFS and no higher than −1 dBTP. Voices go in only where the film needs one, usually the product listening (a voice note, a spoken question) rather than a narrator. Voiced versions are separate files.
7. **Render and review** (`references/review.md`, against `references/rulebook.md`):
   - Probe single frames after every change.
   - Make 10 fps strips, run the motion meter, and check animations against styles.
   - Use fresh-eyed auditors for big passes: subagents that get only the rulebook, the storyboard and the review sheets.
   - Look at the whole film again after any change, not only the part you changed.
8. **Deliver.** Put the newest render where the user is watching (`out/`), say in a line what changed, and keep alternates (a voiced cut, a finale clip) as separate files. A user who watches the old file thinks nothing changed.

## What the client taught (keep these in front of you)

These came from real rejections. The reasons matter more than the rules, so apply the reasons.

- **Nothing just switches.** A cut between two screens of a product reads as an edit, and a move from one to the other reads as the product. ("It just switches. It could have been a movement transition.") Before every cut, ask what on screen could carry the eye across: a row opening into its page, a glide across one screen, a whip, a zoom through a shape the two shots share.
- **Morph, don't swap.** When one thing becomes another, shape, colour, size and icon change together on the same element. Don't fade one out and then show the next.
- **The product is the hero, live and sharp.** A camera panning over screenshots with a highlight box is a slideshow. Drive the real UI, or play back recorded takes of it, and frame it tight enough to read.
- **One device per beat.** The same "travel, zoom, highlight, headline at top" eight times is predictable by the third. Move the headline between top, bottom, side and full screen too.
- **Treat a suggestion as a direction.** When the client said "maybe with the logo, or around it", building exactly that gave the most common ending in software films. Asked to think outside the box, the better answer came from the story already in the product's data: one record's path through every screen. Look for what only this product and this film can say.
- **A line that claims "every" must touch everything on screen.**
- **When the line is drawn, it should be the logo.** If the finale draws the brand mark, the drawing itself must read as the mark early, in its own colours and weight, not as an outline that turns into the logo at the end.
- **Words over busy motion stay level and still**, and arrive and leave as words. Letters that fly and tilt along a path can't be read ("it was just off").
- **Music first; voices only where they mean something.** A synthetic narrator cheapens a film that asks for trust. The client approved a music-only film, then a separate cut with two in-product voices in the right accent.
- **Generate one take** of anything from a paid or rate-limited service (speech, images, video), and let the user judge it. Eleven voice takes used up a free tier's day, and the first take of each was the one chosen.
- **Review the whole film after any change.** A variable added for the finale overwrote one the opening used, and a stray logo sat in the corner of the frame at 12 s. Only the finale had been checked, and the client found it. Check the whole film.

## The rulebook, in one breath

`references/rulebook.md` has the full rulebook with its reasons.

- **Timing:**
  - Everything eases.
  - Duration grows with distance: a small element takes 0.25–0.4 s, a screen-sized one 0.5–0.9 s, a camera move 0.8–1.6 s.
  - Stagger related items 40–100 ms apart.
  - A state that matters holds at least 0.4 s, and no hold goes past 1.5 s without some motion.
  - One focal motion at a time.
- **Reading time** is 0.4 s plus 0.3 s a word, counted from the first word landing.
- **Composition:**
  - Keep text inside action-safe (96/54 px at 1080p).
  - Headline roles keep fixed sizes: top 72, bottom 72, side 100–104, full screen 124.
  - Never slice text at the frame edge on a hold.
  - Never put words over busy UI without a wash.
- **Continuity:** nothing pops, cuts are hidden by matching content or by motion, and the speed matches across a hidden cut.
- **Sound:** −14 LUFS ±1, true peak no higher than −1 dBTP. Hits land on the frame, and whooshes peak at the fastest frame.
- **Rendering:** motion blur on fast moves (a 180° shutter), never across a cut, with no strobing copies.

## Tools in this skill

| Script | What it does |
|---|---|
| `scripts/new_film.sh` | Starts a film folder from `assets/starter/` (a 16 s sample film: a line, a logo grown from a dot, a landing on the live product, a real click, an end card), copies in the tools and installs Puppeteer. |
| `scripts/fetch_ref.py` | Reads a reference post (X via the fxtwitter API, or a direct video URL): text, author, media. With `--download` (ask first), saves the video and makes a contact sheet. |
| `scripts/trace_logo.py` | Traces a logo from a PNG or SVG render: colours, parts, holes, rotational symmetry and mirror pairs, the canonical repeated unit, plus a preview. The first step of a logo study. |
| `scripts/serve.js`, `scripts/frame.js` | A same-origin server that injects a pinned virtual clock into the product pages the film shows live. |
| `scripts/render.js`, `scripts/at.js` | Render the whole film or part of it (with motion blur) to H.264, or single frames for probing. |
| `scripts/record.js` | Records the product's own interactions frame by frame at 3×, with tracked rects, for playback. |
| `scripts/animcheck.js` | Lists elements whose CSS animation overrides what the film set. |
| `scripts/motion.py` | The motion meter: unplanned jumps, double-exposed cuts, dead stretches. |
| `scripts/strips.py` | Contact sheets of a stretch of video at any fps, with timestamps, for review. |
| `scripts/loudness.py` | Integrated loudness, true peak and short-term loudness over time; checks the targets. |
| `scripts/synth.py` | A small synthesiser (pads, plucks, bells, bass, drums, risers, whooshes, ticks, reverb) for writing a score in code against the timeline. |
| `scripts/tts_gemini.py` | Gemini TTS: designs a voice from a description (any accent), then speaks one line with a style direction. One take by default. |
| `scripts/mix_voices.py` | Places voice clips on the timeline, processes them (phone or close), ducks the score under them and writes the voiced soundtrack. |

The scripts need Node with `puppeteer-core` and Chrome, ffmpeg, and Python 3 with numpy, scipy and Pillow (`trace_logo.py` also needs scikit-image). Run everything from the film's folder. The Node tools are copied into it (`node tools/at.js …`). Run the Python tools from the skill (`python3 <skill>/scripts/strips.py …`); their outputs land relative to where you run them. `assets/templates/` holds BRIEF, STORYBOARD and PLAYBOOK outlines.

`assets/starter/brand/logo.svg` is a placeholder: the first thing a new film needs is the brand's own SVG there. The starter's `film/logo.js` loads any SVG and gives it generic motions (drawn, assembled, grown), so the sample runs with any logo before you design the film's own.
