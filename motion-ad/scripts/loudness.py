"""Loudness of a soundtrack or a film: integrated loudness (LUFS), true peak, and short-term loudness over time.

    python3 loudness.py <file.wav|mp4> [--check] [--every 2] [--from 0] [--to end]

--check exits non-zero if the integrated loudness is outside -14 +/- 1 LUFS or the true peak is above -1 dBTP (the
streaming targets). The short-term table, with a bar a dB, shows where sections run hot or quiet; read it against the
film's event times when balancing the score.
"""
import argparse, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("file"); ap.add_argument("--check", action="store_true")
ap.add_argument("--every", type=float, default=2.0); ap.add_argument("--from", dest="t0", type=float, default=0.0)
ap.add_argument("--to", dest="t1", type=float, default=None)
a = ap.parse_args()

r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.file, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); P = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
print(f"integrated {I:.1f} LUFS   true peak {P:.1f} dBTP")

chain = "ebur128=metadata=1,ametadata=print:key=lavfi.r128.S:file=-"
if a.t0 or a.t1: chain = f"atrim={a.t0}:{a.t1 if a.t1 else 1e9}," + chain
out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.file, "-af", chain, "-f", "null", "-"], capture_output=True, text=True).stdout
t = None; st = {}
for line in out.splitlines():
    if line.startswith("frame:"): t = float(line.split("pts_time:")[1]) + a.t0
    elif "lavfi.r128.S" in line and t is not None: st[t] = float(line.split("=")[1])
if st:
    print("\nshort-term loudness (3 s window):")
    nxt = a.t0
    for k in sorted(st):
        if k + 1e-9 >= nxt:
            v = st[k]; print(f"  {k:6.1f}s  {v:6.1f}  " + "#" * max(0, int(v + 40))); nxt += a.every
if a.check:
    ok = abs(I + 14) <= 1 and P <= -1
    print("\nPASS" if ok else "\nFAIL: target -14 +/- 1 LUFS, true peak <= -1 dBTP")
    sys.exit(0 if ok else 1)
