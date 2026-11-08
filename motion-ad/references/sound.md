# Sound: voices

A film is picture and words, with a voice only where the product itself is heard. You can't hear audio. Check a voice by its numbers and its timing, and tell the user plainly that they must listen before it's final.

## Voices

**Narration: usually no.** The on-screen words are the film's voice, and a synthetic narrator cheapens a film that asks for trust. If the user wants a narrator, a real voice actor is better than text-to-speech, and the words on screen must change so the two don't fight.

**In-product voices: often yes, as a separate cut.** Where the product itself listens or plays audio, a voice makes it real: a voice note playing, a question spoken to an assistant, a call answered. Keep the film without voices as the main one, and deliver the voiced cut as a second file.

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

`scripts/mix_voices.py` reads a small JSON config: the film's length, each clip, where its speech should start on the timeline, its processing, its level, and any fade. It writes the voice track.
- **Find the speech's own start and word boundaries** from its envelope (the script prints them), then place the clip so the first word lands where the picture needs it.
- **Treatment:** a phone voice note is band-limited (about 190 Hz to 6.2 kHz) with a little presence and compression; a person speaking to a device is close and dry.
- **Levels:** the voiced cut measures −14 LUFS ±1 with a true peak no higher than −1 dBTP (`python3 <skill>/scripts/loudness.py out/film_voiced.mp4 --check`).
- **Time the picture to the voice where the product shows the words.** If the product transcribes speech live, remap the recorded take so each word appears about 0.12 s after it's said (`piece` in the film). A slight speed-up (up to 1.25×) is fine to fit a slow take; beyond that it sounds wrong.
- **Leave a voice the way the camera leaves the scene:** the voice note carries on into its next sentence and fades as the camera dives away.
