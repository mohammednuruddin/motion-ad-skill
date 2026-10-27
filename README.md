# motion-ad

A [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) for making motion-graphics ads and product launch films: short, music-led films that sell a product by showing it, rendered frame by frame from code (HTML/SVG and the live product in a browser, Puppeteer and ffmpeg).

![The starter film, rendered with two unrelated logos and no code changes](media/preview.gif)

*The starter film every project begins from, rendered with two unrelated logos and no code changes ([mp4](media/starter-two-logos.mp4)).*

## What it does

Ask Claude for a launch video, a promo, a logo animation or an end card, or share a few launch films you like and say "make something like this". The skill walks the whole job:

1. **Intake.** It reads your links and project first. Then it asks one batch of questions, with a recommendation for each. It asks for access only to the services this film needs (text-to-speech, image, video or music generation) and gets your permission before downloading anything.
2. **Research.** It studies your references frame by frame, finds more on its own, and writes down the devices worth borrowing.
3. **Logo study.** It works out how your logo is built (its parts, repeats, symmetry and colours) and builds a lab page of candidate logo animations for you to pick from. Then it fits your picks to the film's opening, landing, finale and end card. It works with any SVG logo.
4. **Storyboard.** A structure sized to the length (15, 30, 60 or 90 s), one device per beat. You see it before anything is built.
5. **Build.** One timeline drives both picture and sound. The real product runs live in the film on a pinned clock, under a camera.
6. **Sound.** A score written in code against the timeline, at streaming loudness (−14 LUFS). Voices go in only where the film needs them, and as a separate cut.
7. **Render and review.** It renders at 60 fps with real motion blur (never across a cut), then checks the result frame by frame. The check uses a motion meter and a measurable rulebook:
   - nothing just switches;
   - morph, don't swap;
   - words stay level over motion;
   - reading time is 0.4 s plus 0.3 s a word.

## What's inside

```
motion-ad/
  SKILL.md              the workflow and the rules, with the reasons behind them
  references/           intake, research, logo, devices, pipeline, sound, review, rulebook
  scripts/              render, probe, motion meter, contact sheets, loudness, logo tracer,
                        reference reader, synthesiser, Gemini TTS, voice mixer, new_film.sh
  assets/starter/       a working 16 s sample film (the one above) to build from
  assets/templates/     BRIEF, STORYBOARD and PLAYBOOK outlines
```

## Install

**Claude Code:**

```bash
git clone https://github.com/nurumino/motion-ad-skill.git
cp -R motion-ad-skill/motion-ad ~/.claude/skills/
```

**Claude apps (web or desktop):** download `motion-ad.skill` from [Releases](https://github.com/nurumino/motion-ad-skill/releases). Then upload it in the Skills section of Settings → Capabilities.

## Requirements

Rendering runs on your machine, so the agent needs:

- Node 18+ and Google Chrome (`puppeteer-core` drives it; `new_film.sh` installs it);
- ffmpeg;
- Python 3 with numpy, scipy and Pillow (scikit-image too, for the logo tracer).

Optional: a `GEMINI_API_KEY` for designed voices with Gemini text-to-speech. The skill asks before using any paid or rate-limited service, and makes one take at a time.

## Try it

```text
Make a 30-second launch film for <product> for X and LinkedIn.
Our logo is at brand/logo.svg. We like this one: <link>
```

Or start a film folder by hand and render the sample:

```bash
bash ~/.claude/skills/motion-ad/scripts/new_film.sh launch
node launch/tools/render.js video launch/out/sample.mp4
```

The sample takes about 2–3 minutes to render on a laptop.

## License

MIT
