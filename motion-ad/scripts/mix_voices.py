"""The voiced cut's soundtrack: the score with voice clips placed on the film's timeline, each processed, the music ducked
under speech, and the whole matched to the streaming targets.

    python3 mix_voices.py voices.json            # writes the "out" file named in it
    python3 mix_voices.py --words clip.wav       # where the speech in a clip starts and ends, and its likely word gaps

voices.json:
{
  "score": "assets/score.wav",
  "out": "assets/score_voices.wav",
  "duck_db": 8.5,                       # how far the music steps down while a voice speaks
  "clips": [
    { "file": "voices/note.wav", "speech_at": 36.55, "level_db": -19.5, "treat": "phone",
      "fade": [39.7, 40.35] },          # optional: fade out over this span (leave the way the camera leaves)
    { "file": "voices/question.wav", "speech_at": 47.6, "level_db": -19.5, "treat": "close", "tempo": 1.25 }
  ]
}
speech_at is where the first word should start on the timeline; the clip's own leading silence is measured and allowed
for. treat: "phone" (a voice note: band-limited, pressed), "close" (a person near a mic: dry), "room" (a little space),
or "none". tempo speeds a slow take up a little (keep it at 1.3 or under). Paths are relative to the JSON file.
"""
import json, os, subprocess, sys, tempfile
import numpy as np

SR = 48000
TREAT = {
    "phone": "highpass=f=190,lowpass=f=6200,equalizer=f=2600:t=q:w=1.2:g=3,acompressor=threshold=-22dB:ratio=3:attack=4:release=90:makeup=2",
    "close": "highpass=f=85,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=120:makeup=1.5",
    "room": "highpass=f=90,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=120:makeup=1.5,aecho=0.8:0.5:28|41:0.18|0.12",
    "none": "anull",
}


def load(path, chain, ch=1):
    with tempfile.NamedTemporaryFile(suffix=".f32") as f:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", chain + ",aresample=48000:resampler=soxr", "-ac", str(ch), "-f", "f32le", f.name], check=True)
        x = np.fromfile(f.name, np.float32)
    return x.reshape(-1, ch).copy() if ch > 1 else x


def speech_span(x, sr=SR, floor_db=35):
    win = int(sr * 0.02); e = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, max(1, len(x) - win), win)])
    db = 20 * np.log10(e + 1e-9); on = np.where(db > db.max() - floor_db)[0]
    return (on[0] * 0.02, (on[-1] + 1) * 0.02, db) if len(on) else (0.0, len(x) / sr, db)


def soft(x):
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


if sys.argv[1:2] == ["--words"]:
    x = load(sys.argv[2], "anull")
    a, b, db = speech_span(x)
    hop = 0.005; win = int(SR * 0.02); hp_ = int(SR * hop)
    e = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, len(x) - win, hp_)]); d = np.convolve(20 * np.log10(e + 1e-6), np.ones(5) / 5, "same")
    dips = [round(i * hop, 3) for i in range(10, len(d) - 10) if a < i * hop < b and d[i] == d[i - 10:i + 11].min() and d[i] < d[i - 10:i + 11].max() - 6]
    print(f"speech {a:.2f}-{b:.2f} s of {len(x) / SR:.2f} s; dips (likely word boundaries): {dips}")
    sys.exit()

cfg_path = sys.argv[1]; base = os.path.dirname(os.path.abspath(cfg_path)); cfg = json.load(open(cfg_path))
P = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
score = load(P(cfg["score"]), "anull", ch=2); n = len(score); t = np.arange(n) / SR
voice = np.zeros(n, np.float32); on = np.zeros(n, np.float32)
for c in cfg["clips"]:
    chain = (f"atempo={c['tempo']}," if c.get("tempo") else "") + TREAT[c.get("treat", "close")]
    x = load(P(c["file"]), chain)
    a, b, _ = speech_span(x)
    v = x[np.abs(x) > 1e-4]; x = x * 10 ** ((c.get("level_db", -19.5) - 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)) / 20)
    at = c["speech_at"] - a; i = int(round(at * SR)); j = min(n, i + len(x))
    seg = np.zeros(n, np.float32); seg[max(0, i):j] = x[max(0, -i):j - i]
    end = at + b
    if c.get("fade"):
        f0, f1 = c["fade"]; seg *= 1 - soft((t - f0) / (f1 - f0)); end = min(end, f1)
    voice += seg
    on = np.maximum(on, soft((t - (c["speech_at"] - 0.15)) / 0.25) * (1 - soft((t - end) / 0.5)))
    print(f"{c['file']}: speech {a:.2f}-{b:.2f} s in the clip, placed {c['speech_at']:.2f}-{at + b:.2f} s")
duck = 10 ** (-cfg.get("duck_db", 8.5) * on / 20)
mix = score * duck[:, None] + voice[:, None] * np.array([0.98, 1.0], np.float32)
peak = np.abs(mix).max(); ceiling = 10 ** (-1.6 / 20)
if peak > ceiling: mix *= ceiling / peak
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", P(cfg["out"])], input=pcm, check=True)
print("wrote", P(cfg["out"]), "- now: python3 loudness.py", cfg["out"], "--check")
