"""Contact sheets of a stretch of video, each cell labelled with its time, for frame-by-frame review.

    python3 strips.py <video> <from> <to> [--fps 10] [--cols 8] [--width 320] [--crop x,y,w,h] [--out sheet.jpg] [--keep dir]

--fps 60 shows every frame (use it over a third of a second at any spike the motion meter flags); --fps 2 over the whole
film gives an overview; --fps 10 over 4 s is the review strip. --keep saves the full-resolution frames as f_<time>.jpg,
so you can open any cell at full size. --crop looks closer at one region (in the video's pixels).
"""
import argparse, glob, os, subprocess, tempfile
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("t0", type=float); ap.add_argument("t1", type=float)
ap.add_argument("--fps", type=float, default=10); ap.add_argument("--cols", type=int, default=8)
ap.add_argument("--width", type=int, default=320); ap.add_argument("--crop", default=None)
ap.add_argument("--out", default=None); ap.add_argument("--keep", default=None)
a = ap.parse_args()
out = a.out or os.path.splitext(a.video)[0] + f"_{a.t0:g}-{a.t1:g}.jpg"
with tempfile.TemporaryDirectory() as tmp:
    d = a.keep or tmp
    os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, "raw_*.jpg")): os.remove(f)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(a.t0), "-to", str(a.t1), "-i", a.video, "-vf", f"fps={a.fps}", "-q:v", "3", os.path.join(d, "raw_%05d.jpg")], check=True)
    fs = sorted(glob.glob(os.path.join(d, "raw_*.jpg")))
    named = []
    for i, f in enumerate(fs):
        t = a.t0 + i / a.fps
        g = os.path.join(d, f"f_{t:.3f}.jpg"); os.replace(f, g); named.append((t, g))
    if not named: raise SystemExit("no frames in that stretch")
    im0 = Image.open(named[0][1]); W, H = im0.size
    cx, cy, cw, ch = [int(v) for v in a.crop.split(",")] if a.crop else (0, 0, W, H)
    w = a.width; h = int(w * ch / cw)
    rows = (len(named) + a.cols - 1) // a.cols
    s = Image.new("RGB", (a.cols * w, rows * (h + 18)), (40, 40, 44)); dr = ImageDraw.Draw(s)
    for i, (t, g) in enumerate(named):
        x, y = (i % a.cols) * w, (i // a.cols) * (h + 18)
        s.paste(Image.open(g).crop((cx, cy, cx + cw, cy + ch)).resize((w, h), Image.LANCZOS), (x, y + 18))
        dr.text((x + 4, y + 3), f"{t:.3f}s" if a.fps > 10 else f"{t:.2f}s", fill=(240, 240, 240))
    s.save(out, quality=90)
    print(out, len(named), "frames", s.size)
