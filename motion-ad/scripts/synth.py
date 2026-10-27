"""A small synthesiser for scoring a film in code: no samples, nothing licensed. Every sound is a numpy array at 48 kHz,
placed on a Bus at a time from the film's timeline, so hits land on the frame.

    import sys; sys.path.insert(0, "<skill>/scripts"); from synth import *
    TL = load_timeline("film/timeline.js")
    music, drums, fx, verb = Bus(TL["end"]), Bus(TL["end"]), Bus(TL["end"]), Bus(TL["end"])
    music.add(0.0, pad([62, 66, 69], 4.0), 0.3)          # a D major pad for 4 s
    fx.add(TL["land"] - 0.05, whoosh(0.9), 0.25)         # a whoosh peaking at the move's fastest frame
    fx.add(TL["click"], tick(), 0.2)                     # a click on the frame the control changes
    mix = mixdown(music, drums, fx, verb)               # reverb send, a gentle high-pass, soft limit to -1.6 dBFS
    write_wav("assets/score.wav", mix)                   # then: python3 loudness.py assets/score.wav --check

Instruments: pad (detuned saw/sine chord), pluck, bell, bass, kick, clap, hat, shaker, fm (the FM voice under them),
blip, tick (a UI click), key (a key press), sweep_noise (filtered noise that glides), riser, whoosh, impact,
reverse_swell, reverb_ir. MIDI note numbers throughout (60 = middle C); hz(m) converts.
A typical arrangement: 120 BPM, a four-chord loop (Bm G D A), a pad, a bass and an arpeggio, drums that sit out in quiet beats, and an effect on every film event.
"""
import json, wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sawtooth

SR = 48000
RNG = np.random.default_rng(7)


def load_timeline(path):
    """window.TL = {...} from the film's timeline.js, as a dict"""
    return json.loads(Path(path).read_text().split("=", 1)[1].strip().rstrip(";"))

def S(t):
    return int(round(t * SR))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


class Bus:
    """a stereo track as long as the film; add() places a sound at a time"""
    def __init__(self, dur):
        self.n = int(SR * dur)
        self.x = np.zeros((2, self.n))

    def add(self, t, sig, gain=1.0, pan=0.0):
        """sig: mono or (2, n); pan -1..1 (equal power)"""
        N = self.n
        i = S(t)
        if i >= N:
            return
        if sig.ndim == 1:
            a = np.pi / 4 * (pan + 1)
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        n = min(sig.shape[1], N - i)
        if i < 0:
            sig = sig[:, -i:]
            n = min(sig.shape[1], N)
            i = 0
        self.x[:, i:i + n] += sig[:, :n] * gain


def env_adsr(n, a, d, s, r, sus_len):
    e = np.zeros(n)
    ia, idd, isl, ir = int(a * SR), int(d * SR), int(sus_len * SR), int(r * SR)
    k = 0
    for seg_len, f in ((ia, lambda u: u), (idd, lambda u: 1 - (1 - s) * u), (isl, lambda u: s + 0 * u), (ir, lambda u: s * (1 - u))):
        m = min(seg_len, n - k)
        if m <= 0:
            break
        e[k:k + m] = f(np.linspace(0, 1, seg_len, endpoint=False)[:m])
        k += m
    return e


# ---------------- instruments ----------------
def pad(midis, dur, bright=1500.0, attack=0.8, release=1.6):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in midis:
        f = hz(m)
        for det, side in ((-7, 0), (6, 1), (-2, 0), (3, 1)):
            ph = RNG.uniform(0, 2 * np.pi)
            w = sawtooth(2 * np.pi * f * 2 ** (det / 1200) * t + ph) * 0.5 + 0.5 * np.sin(2 * np.pi * f * 2 ** (det / 1200) * t + ph)
            (L if side == 0 else R)[:] += w
    e = env_adsr(n, attack, 0.6, 0.85, release, max(0.0, dur - attack - 0.6))
    L = hp(lp(L * e, bright, 2), 150, 2)
    R = hp(lp(R * e, bright, 2), 150, 2)
    return np.vstack([L, R]) / (len(midis) * 2)


def fm(f, dur, ratio=2.0, index=2.0, idecay=6.0, adecay=3.0, attack=0.004):
    t = tt(dur)
    I = index * np.exp(-idecay * t)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t))
    e = np.minimum(1, t / attack) * np.exp(-adecay * t)
    return y * e


def pluck(m, dur=0.9):
    return fm(hz(m), dur, ratio=2.0, index=1.6, idecay=9, adecay=5.5) * 0.9 + fm(hz(m) * 2, dur, ratio=1, index=0.4, idecay=12, adecay=9) * 0.12


def bell(m, dur=3.0):
    return fm(hz(m), dur, ratio=3.5, index=2.2, idecay=3.0, adecay=1.6) * 0.7 + 0.3 * fm(hz(m) * 2, dur, ratio=1.0, index=0.3, idecay=4, adecay=2.4)


def bass(m, dur):
    t = tt(dur + 0.15)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    e = np.minimum(1, t / 0.008) * np.where(t < dur, 1.0, np.exp(-(t - dur) * 30)) * (0.75 + 0.25 * np.exp(-t * 3))
    return np.tanh(1.6 * y * e) / np.tanh(1.6)


def kick(power=1.0):
    t = tt(0.55)
    f = 46 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 6.5) * power
    click = hp(RNG.standard_normal(len(t)) * np.exp(-t * 400), 2000) * 0.15
    return np.tanh(1.4 * (y + click))


def clap():
    t = tt(0.35)
    n = RNG.standard_normal(len(t))
    e = np.zeros(len(t))
    for k, off in enumerate((0.0, 0.011, 0.022)):
        e += (t >= off) * np.exp(-(t - off).clip(0) * 180) * (0.7 if k < 2 else 1.0)
    e += (t >= 0.022) * np.exp(-(t - 0.022).clip(0) * 14) * 0.35
    return bp(n * e, 900, 4200) * 1.4


def hat(decay=60.0):
    t = tt(0.25)
    return hp(RNG.standard_normal(len(t)) * np.exp(-t * decay), 7000, 3) * 0.6


def shaker():
    t = tt(0.12)
    e = np.minimum(1, t / 0.012) * np.exp(-t * 45)
    return bp(RNG.standard_normal(len(t)) * e, 4500, 11000) * 0.5


def sweep_noise(dur, f0, f1, q=0.5, shape="up"):
    """noise through a band-pass whose centre glides f0 -> f1 (state-variable filter)"""
    n = int(dur * SR)
    x = RNG.standard_normal(n)
    u = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** u
    g = np.tan(np.pi * np.minimum(fc, SR * 0.45) / SR)
    k = 1 / q
    y = np.zeros(n)
    ic1 = ic2 = 0.0
    for i in range(n):
        gi = g[i]
        a1 = 1 / (1 + gi * (gi + k))
        v3 = x[i] - ic2
        v1 = a1 * ic1 + gi * a1 * v3
        v2 = ic2 + gi * v1
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        y[i] = v1
    if shape == "up":
        e = u ** 2.2
    elif shape == "hump":
        e = np.sin(np.pi * u) ** 1.6
    else:
        e = (1 - u) ** 2
    return y * e


def riser(dur, m0=50, m1=86):
    t = tt(dur)
    u = t / dur
    f = hz(m0) * (hz(m1) / hz(m0)) ** (u ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * u ** 2.4 * 0.35
    return tone + sweep_noise(dur, 300, 9000, q=0.7, shape="up") * 0.9


def whoosh(dur=0.8):
    return sweep_noise(dur, 250, 3200, q=0.6, shape="hump")


def impact():
    t = tt(2.6)
    boom = np.sin(2 * np.pi * (38 + 30 * np.exp(-t * 9)) * t) * np.exp(-t * 2.2)
    crash = lp(RNG.standard_normal(len(t)) * np.exp(-t * 1.6), 6000) * 0.25
    k = kick(1.2)
    return np.tanh(1.2 * (boom * 0.9 + crash)) + np.pad(k, (0, len(t) - len(k)))


def tick():
    t = tt(0.06)
    return (np.sin(2 * np.pi * 2300 * t) * 0.6 + np.sin(2 * np.pi * 1150 * t) * 0.4) * np.exp(-t * 140)


def key():
    """a key pressed: a short knock of filtered noise with a click on top"""
    t = tt(0.05)
    return bp(RNG.standard_normal(len(t)) * np.exp(-t * 260), 1400, 6500) * 0.55 + np.sin(2 * np.pi * 2900 * t) * np.exp(-t * 420) * 0.25


def blip(m):
    """a bright, very short tone: something small arriving"""
    return fm(hz(m), 0.3, ratio=1.0, index=1.4, idecay=28, adecay=12)


def reverse_swell(m, dur=1.2):
    b = bell(m, dur)
    return b[::-1] * np.linspace(0, 1, len(b)) ** 1.5


def reverb_ir(dur=2.4, damp=5000):
    t = tt(dur)
    e = np.exp(-t * 3.0)
    L = lp(RNG.standard_normal(len(t)) * e, damp)
    R = lp(RNG.standard_normal(len(t)) * e, damp)
    L[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    R[: int(0.017 * SR)] *= np.linspace(0, 1, int(0.017 * SR))
    return np.vstack([L, R]) / np.sqrt(np.sum(L ** 2))


def mixdown(music, drums, fx, verb, wet=0.55, send=None, drive=1.45, ceiling_db=-1.6, fade_out=1.35):
    """music + drums + fx, with verb's bus (and an optional extra send) through a reverb; a gentle high-pass, a fade at
    the end, then a tanh soft limit to the ceiling. Raise drive for louder, lower it for quieter: measure with
    loudness.py and aim for -14 LUFS."""
    ir = reverb_ir()
    src = verb.x + (send if send is not None else 0)
    w = np.vstack([fftconvolve(src[c], ir[c])[: music.n] for c in range(2)])
    mix = music.x + drums.x + fx.x + w * wet
    t = np.arange(music.n) / SR
    dur = music.n / SR
    mix *= (1 - np.clip((t - (dur - fade_out - 0.05)) / fade_out, 0, 1) ** 1.4) * np.clip(t / 0.05, 0, 1)
    mix = np.vstack([hp(mix[c], 28, 2) for c in range(2)])
    peak = np.max(np.abs(mix)) or 1.0
    return np.tanh(mix / peak * drive) / np.tanh(drive) * 10 ** (ceiling_db / 20)


def write_wav(path, mix):
    pcm = (np.clip(mix, -1, 1).T * 32767).astype("<i2")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(path, f"{mix.shape[1] / SR:.1f}s", f"peak {20 * np.log10(np.max(np.abs(mix)) + 1e-9):.1f} dBFS")
