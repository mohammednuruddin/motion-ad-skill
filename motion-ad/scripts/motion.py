"""How much the picture changes from each frame to the next, to find what the eye would catch and stills hide:
jumps and flashes that are not planned cuts, and stretches where nothing moves.

    python3 motion.py <video.mp4> [cuts]      cuts: comma-separated times of the planned cuts, in seconds

Prints the frames whose change stands far above their neighbours' (with the nearest planned cut; a run of them is
reported once, as a burst of motion), whether each
planned cut happens in one frame or is spread over two (a double exposure, as motion blur across a cut makes), and
every stretch of half a second or more in which almost nothing moves.
"""
import subprocess, sys
import numpy as np

video = sys.argv[1]
cuts = [float(c) for c in sys.argv[2].split(",") if c] if len(sys.argv) > 2 else []
_pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", video], capture_output=True, text=True).stdout.strip().split(",")
_n, _d = _pr[2].split("/")
FPS = round(float(_n) / float(_d))
W = 192; H = max(2, int(round(W * int(_pr[1]) / int(_pr[0]) / 2)) * 2)  # small, same aspect as the video
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", video, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))  # d[i]: change from frame i to i + 1
print(f"{len(f)} frames, median change {np.median(d):.2f}")

print("\nspikes (change > 4x the median of the 30 frames around it, and > 2):")
hits = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    ref = np.median(np.concatenate([d[lo:i], d[i + 1:hi]]))
    if d[i] > 2 and d[i] > 4 * max(ref, 0.25):
        hits.append((i, ref))
# a run of three or more spiking frames is a burst of motion in a still scene (a sort, a whip): planned or not, check it
# moves on a curve and has motion blur; one or two frames on their own are a jump: a cut, or a pop that should not be there
runs = []
for i, ref in hits:
    if runs and i - runs[-1][-1][0] <= 2: runs[-1].append((i, ref))
    else: runs.append([(i, ref)])
for r in runs:
    t0, t1 = (r[0][0] + 1) / FPS, (r[-1][0] + 1) / FPS
    if len(r) >= 3:
        print(f"  {t0:7.3f}s to {t1:.3f}s  burst of motion over {len(r)} frames (peak change {max(d[i] for i, _ in r):.2f}): check its curve and blur at 60 fps")
        continue
    for i, ref in r:
        t = (i + 1) / FPS
        near = min(cuts, key=lambda c: abs(c - t)) if cuts else None
        tag = f"cut {near:.2f}" if near is not None and abs(near - t) < 0.05 else "UNPLANNED"
        print(f"  {t:7.3f}s  change {d[i]:6.2f}  around {ref:5.2f}  {tag}")

print("\ncuts (a clean cut changes everything in one frame; one spread over two frames is a double exposure):")
for c in cuts:
    i = int(round(c * FPS)) - 1  # d[i] is the change into the cut's first frame
    if i < 1 or i + 1 >= len(d):
        continue
    a, b, e = d[i - 1], d[i], d[i + 1]
    tag = "BLENDED" if min(a, e) > 0.35 * b or (a > 0.35 * (a + b)) else "clean"
    print(f"  {c:7.3f}s  before {a:6.2f}  at {b:6.2f}  after {e:6.2f}  {tag}")

print("\nstill stretches (change < 0.05 for 0.5 s or more):")
still = d < 0.05
i = 0
while i < len(still):
    if still[i]:
        j = i
        while j < len(still) and still[j]:
            j += 1
        if (j - i) / FPS >= 0.5:
            print(f"  {i / FPS:7.2f}s to {j / FPS:7.2f}s  ({(j - i) / FPS:.2f} s)")
        i = j
    else:
        i += 1
