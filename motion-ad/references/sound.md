# Sound: the score, effects and voices

You can't hear audio. Check sound by its numbers and by event timing, and tell the user plainly that they must listen before it's final. A synthesised score can be approved, but only by the user's ears.

## The score

Three routes. Recommend one in the intake.

1. **A licensed track** the user supplies. Cut the film's sections to its bars: read its tempo and downbeats, and set the `timeline.js` times on its grid.
2. **A music-generation service** the user has. Generate one take to a brief of tempo, key, mood and structure with timestamps, and let the user judge it.
3. **A score composed in code** (`scripts/synth.py`): no licence, and every hit placed on a film event. It's a placeholder until someone listens, but it can be good.

Writing a score with `synth.py` (the docstring at the top of `synth.py` shows the shape of an arrangement):
- Read `timeline.js` and import the film's event times (the same constants the film uses), so hits land on the frame.
- **Harmony:** pick a key and a four-chord loop (for example D major, Bm G D A, 120 BPM, a bar every 2 s), with a pad, a bass and an arpeggio.
- **Structure follows the story:**
  - The intro is sparse, with a monitor-like tick for tension.
  - The groove enters as the product does.
  - The drums sit out in quiet beats (a key screen opening, a spoken question) and come back on a downbeat.
  - A chapter change lifts the arpeggio an octave.
  - The finale gets a riser, a breath, a hit, and a held chord into the end card.
- **Effects on events:**
  - a `tick()` on every click frame and a `key()` per typed letter;
  - `whoosh()`/`sweep_noise()` peaking at the fastest frame of a move;
  - a `riser()` into reveals and `impact()` hits;
  - `blip()`/`bell()` when something lights up.
  - Diegetic touches sell it: a pulse oximeter's beep that falls in pitch with the saturation; a J-cut, where the room is heard before it's seen.
- **Mastering:** a gentle high-pass, a tanh soft clip, and a ceiling of −1.6 dBFS. Then measure integrated loudness and adjust the drive or gain to hit −14 LUFS ±1. Changing the arrangement changes the loudness, so re-measure every time.

```bash
python3 <skill>/scripts/loudness.py assets/score.wav              # integrated LUFS, true peak, short-term over time
python3 <skill>/scripts/loudness.py out/film.mp4 --check          # fails if outside -14 ±1 LUFS or above -1 dBTP
```

## Voices

**Narration: usually no.** On-screen words read to music are the film's voice, and a synthetic narrator cheapens a film that asks for trust. If the user wants a narrator, a real voice actor is better than text-to-speech, and the words on screen must change so the two don't fight.

**In-product voices: often yes, as a separate cut.** Where the product itself listens or plays audio, a voice makes it real: a voice note playing, a question spoken to an assistant, a call answered. Keep the music-only film as the main one, and deliver the voiced cut as a second file.

### Making voices with Gemini TTS

`scripts/tts_gemini.py` uses `gemini-3.8-flash-tts` through the Interactions API. The key is read from `GEMINI_API_KEY` (from the environment, or the shell profile) and sent only in a header.

- **Accent goes in the voice, not the style.** The model's prebuilt library covers some accents (check it with `tts_gemini.py list`; regional accents are patchy). For anything else, design a voice from a one- or two-sentence description: who the speaker is, their age, where they're from, the accent, the timbre. Design it once and reuse its ID: designed voices are stored for a year.
- **Delivery goes in the style**, per line ("a quick voice note to the team, said into a phone between meetings: relaxed, practical, natural").
- **Generate one take a line.** Free tiers can be 3 requests a minute and 10 a day. Say so before starting, space requests out, and let the user listen and pick before making more.

```bash
python3 <skill>/scripts/tts_gemini.py design --name lead --gender female --lang en-GB \
  --desc "A woman in her forties from Edinburgh, an operations lead, speaking English with a light Scottish accent; calm, assured, warm, slightly low voice."
python3 <skill>/scripts/tts_gemini.py speak --voice voice_xxx --out voices/question.wav \
  --text "Which orders are late today?" --style "asked out loud to an assistant on a laptop: natural, matter-of-fact"
```

### Mixing voices in

`scripts/mix_voices.py` reads a small JSON config: each clip, where its speech should start on the timeline, its processing, its level, and any fade. It ducks the score under speech and writes the voiced soundtrack.
- **Find the speech's own start and word boundaries** from its envelope (the script prints them), then place the clip so the first word lands where the picture needs it.
- **Treatment:** a phone voice note is band-limited (about 190 Hz to 6.2 kHz) with a little presence and compression; a person speaking to a device is close and dry.
- **Levels:** the voice sits about 7 dB over the ducked music (duck about 8.5 dB), and the whole cut still measures −14 LUFS.
- **Time the picture to the voice where the product shows the words.** If the product transcribes speech live, remap the recorded take so each word appears about 0.12 s after it's said (`piece` in the film). A slight speed-up (up to 1.25×) is fine to fit a slow take; beyond that it sounds wrong.
- **Leave a voice the way the camera leaves the scene:** the voice note carries on into its next sentence and fades as the camera dives away.
