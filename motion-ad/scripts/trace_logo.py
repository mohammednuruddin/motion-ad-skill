"""Study how a logo is built: its colours, its separate parts and their holes, its rotational symmetry and mirror pairs,
and its canonical repeated unit, traced into a 120-unit box centred on the mark (the box logo motions are built in).

    python3 trace_logo.py logo.png [--out logo-study/] [--colours 4]
    python3 trace_logo.py logo.svg ...        (rasterised first with rsvg-convert, ImageMagick or macOS Quick Look)

Writes:
  study.json   colours; parts (colour, centroid angle and radius from the mark's centre, area, holes); symmetry (best
               rotational order and its match, best mirror axis and its match); which parts are rotations or mirror
               images of the unit; the unit's outline and holes; the hollow centre, if any. All in units of a 120-unit
               box centred on the mark (so the mark spans about -50..50).
  study.png    the logo with each part numbered, the centre, and the mirror axis drawn: check it by eye.
  mark.svg     every part as a path (fill-rule evenodd), in viewBox -60 -60 120 120: when the brand has only a PNG,
               check it against the original and use it as brand/logo.svg (logo.js reads whatever SVG is there).

Parts are the pieces you can see: connected areas of one colour. A shape cut through by another colour counts as two
pieces, and overlapping shapes of one colour merge. With an SVG, the file's own elements are the parts the film moves
(logo.js reads them); use this for the symmetry, the repeats, the colours and the hollow centre, and check study.png.
Reading the numbers: an IoU above about 0.9 is a real symmetry or copy; 0.8 to 0.9 is close (check by eye); below
about 0.6 is none. A copy can be rotated about the centre, mirrored, or moved along (bars side by side).
  unit.svg     the canonical unit alone, centroid on the +x axis.

Read study.json, then write the study in words (logo.md, section 2): what it depicts, its unit and how copies are
placed, its strokes and holes, its construction, its colour logic.
"""
import argparse, json, math, os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

try:
    from skimage import measure
    def contours_of(mask):
        return [c[:, ::-1] for c in measure.find_contours(np.pad(mask.astype(float), 2), 0.5)]  # (x, y), padded by 2
except ImportError:  # contourpy ships with matplotlib
    from contourpy import contour_generator
    def contours_of(mask):
        g = contour_generator(z=np.pad(mask.astype(float), 2))
        return [np.asarray(l) for l in g.lines(0.5)]

ap = argparse.ArgumentParser(); ap.add_argument("logo"); ap.add_argument("--out", default="logo-study"); ap.add_argument("--colours", type=int, default=4)
ap.add_argument("--min-area", type=float, default=0.004, help="smallest part, as a share of the mark's area")
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)


def rasterise(path):
    if not path.lower().endswith(".svg"): return path
    tmp = tempfile.mkdtemp(); out = os.path.join(tmp, "logo.png")
    if shutil.which("rsvg-convert"): subprocess.run(["rsvg-convert", "-w", "1600", "-o", out, path], check=True); return out
    for exe in ("magick", "convert"):
        if shutil.which(exe): subprocess.run([exe, "-background", "none", "-density", "600", path, "-resize", "1600x", out], check=True); return out
    if shutil.which("qlmanage"):
        subprocess.run(["qlmanage", "-t", "-s", "1600", "-o", tmp, path], capture_output=True)
        q = os.path.join(tmp, os.path.basename(path) + ".png")
        if os.path.exists(q): return q
    sys.exit("can't rasterise the SVG here: export a large PNG (1500 px or more, transparent background) and pass that")


im = np.asarray(Image.open(rasterise(a.logo)).convert("RGBA")).astype(float)
H, W = im.shape[:2]
alpha = im[..., 3] / 255.0
if alpha.min() > 0.99:  # no transparency: take the background from the corners
    bgc = np.median(np.concatenate([im[:8, :8, :3].reshape(-1, 3), im[-8:, -8:, :3].reshape(-1, 3), im[:8, -8:, :3].reshape(-1, 3), im[-8:, :8, :3].reshape(-1, 3)]), axis=0)
    alpha = np.clip(np.linalg.norm(im[..., :3] - bgc, axis=2) / 60, 0, 1)
ink = alpha > 0.5
if ink.sum() < 100: sys.exit("no logo found in the image")

# colours: k-means on the ink's pixels, merged when close
px = im[..., :3][ink]; rng = np.random.default_rng(0)
sample = px[rng.choice(len(px), min(len(px), 20000), replace=False)]
k = min(a.colours, 8); cen = sample[rng.choice(len(sample), k, replace=False)]
for _ in range(25):
    lab = np.argmin(((sample[:, None] - cen[None]) ** 2).sum(-1), 1)
    cen = np.array([sample[lab == j].mean(0) if (lab == j).any() else cen[j] for j in range(k)])
keep = []
for c in cen:
    if all(np.linalg.norm(c - q) > 40 for q in keep): keep.append(c)
cen = np.array(keep)
labels = np.full((H, W), -1); labels[ink] = np.argmin(((px[:, None] - cen[None]) ** 2).sum(-1), 1)
share = [(labels == j).sum() / ink.sum() for j in range(len(cen))]
order = np.argsort(share)[::-1]
colours = [{"hex": "#%02X%02X%02X" % tuple(int(round(v)) for v in cen[j]), "share": round(float(share[j]), 3)} for j in order if share[j] > 0.01]
remap = {int(j): i for i, j in enumerate([j for j in order if share[j] > 0.01])}

# parts: connected pieces of each colour (holes filled to find each piece, then counted)
ys, xs = np.nonzero(ink); cx0, cy0 = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
parts = []
for j, ci in remap.items():
    m = labels == j
    lab, n = ndimage.label(ndimage.binary_fill_holes(m))
    for i in range(1, n + 1):
        pm = lab == i
        if pm.sum() < a.min_area * ink.sum(): continue
        cy, cx = ndimage.center_of_mass(pm)
        holes_lab, nh = ndimage.label(pm & ~m)
        nh = sum(1 for h in range(1, nh + 1) if (holes_lab == h).sum() > 20)
        parts.append({"colour": ci, "mask": pm, "solid": pm & m, "cx": cx, "cy": cy, "area": int(pm.sum()), "holes": nh})
if not parts: sys.exit("no parts found")
CX = float(np.mean([p["cx"] for p in parts])) if len(parts) > 1 else cx0
CY = float(np.mean([p["cy"] for p in parts])) if len(parts) > 1 else cy0
R = max(np.hypot(xs - CX, ys - CY).max(), 1.0); S = 50.0 / R  # the mark's farthest ink at 50 units, as in a -60..60 box
for p in parts:
    p["angle"] = math.degrees(math.atan2(p["cy"] - CY, p["cx"] - CX)); p["radius"] = math.hypot(p["cx"] - CX, p["cy"] - CY) * S

# symmetry: rotate / mirror the ink about the centre, and measure how well it lands on itself (IoU)
def iou(m1, m2): return float((m1 & m2).sum() / max(1, (m1 | m2).sum()))
def _rot(m, deg):
    t = math.radians(deg); c, s = math.cos(t), math.sin(t)
    yy, xx = np.mgrid[0:H, 0:W]; x = xx - CX; y = yy - CY
    sx = c * x + s * y + CX; sy = -s * x + c * y + CY
    return ndimage.map_coordinates(m.astype(float), [sy, sx], order=1, mode="constant") > 0.5
def mirror(m, deg):
    t = math.radians(2 * deg); c, s = math.cos(t), math.sin(t)
    yy, xx = np.mgrid[0:H, 0:W]; x = xx - CX; y = yy - CY
    sx = c * x + s * y + CX; sy = s * x - c * y + CY
    return ndimage.map_coordinates(m.astype(float), [sy, sx], order=1, mode="constant") > 0.5
small = max(1, int(max(H, W) / 400))
inks = ink[::small, ::small]; H0, W0, CX0, CY0 = H, W, CX, CY
H, W, CX, CY = inks.shape[0], inks.shape[1], CX0 / small, CY0 / small
rot = {n: iou(inks, _rot(inks, 360 / n)) for n in range(2, 13)}
best_n = max(rot, key=lambda n: (round(rot[n], 2), n))
mir = [(d, iou(inks, mirror(inks, d))) for d in np.arange(0, 180, 1.0)]
best_m = max(mir, key=lambda q: q[1])
H, W, CX, CY = H0, W0, CX0, CY0

# the unit: the part with the most copies in the mark (rotated about the centre, mirrored, or moved along: three bars
# side by side are copies too), then the largest, then the one nearest 0 degrees. Matched on a small grid, for speed.
def _small(m): return m[::small, ::small]
def _turn0(m, deg, flip=False):
    t = math.radians(deg); c, s_ = math.cos(t), math.sin(t)
    yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]]; x = xx - CX / small; y = yy - CY / small
    if flip: y = -y
    return ndimage.map_coordinates(m.astype(float), [-s_ * x + c * y + CY / small, c * x + s_ * y + CX / small], order=1, mode="constant") > 0.5
def _moved(m, dy, dx): return ndimage.shift(m.astype(float), (dy, dx), order=1, mode="constant") > 0.5
def likeness(pa, pb):
    """how well part b is a copy of part a: rotated about the centre, mirrored, or moved along (IoU of each)"""
    ma, mb = _small(pa["solid"]), _small(pb["solid"])
    rot_ = iou(_turn0(ma, -pa["angle"]), _turn0(mb, -pb["angle"]))
    mir_ = iou(_turn0(ma, -pa["angle"]), _turn0(mb, -pb["angle"], flip=True))
    mov_ = iou(_moved(ma, (pb["cy"] - pa["cy"]) / small, (pb["cx"] - pa["cx"]) / small), mb)
    return rot_, mir_, mov_
COPY = 0.8
alike = [[max(likeness(pa, pb)) if pa is not pb and 0.6 < pa["area"] / max(1, pb["area"]) < 1.67 else 0.0 for pb in parts] for pa in parts]
unit_i = max(range(len(parts)), key=lambda i: (sum(v > COPY for v in alike[i]), parts[i]["area"], -abs(parts[i]["angle"])))
unit = parts[unit_i]
relations = []
for i, p in enumerate(parts):
    r_same, r_flip, r_move = likeness(unit, p) if p is not unit else (1.0, 1.0, 1.0)
    best = max(r_same, r_flip, r_move)
    kind = "unit" if p is unit else "different" if best <= COPY else "rotated copy" if best == r_same else "mirror copy" if best == r_flip else "moved copy"
    relations.append({"part": i, "rotation_of_unit": round(r_same, 3), "mirror_of_unit": round(r_flip, 3), "moved_copy_of_unit": round(r_move, 3), "kind": kind})

def to_units(c, rot_deg=0.0):
    t = math.radians(rot_deg); cs, sn = math.cos(t), math.sin(t)
    out = []
    for x, y in c:
        X, Y = (x - 2 - CX) * S, (y - 2 - CY) * S
        out.append([round(X * cs - Y * sn, 3), round(X * sn + Y * cs, 3)])
    return out
def rings(mask, rot_deg=0.0, tol=1.0):
    cs = [c for c in contours_of(mask) if len(c) > 12]
    cs.sort(key=lambda c: -abs(0.5 * np.sum(c[:, 0] * np.roll(c[:, 1], 1) - np.roll(c[:, 0], 1) * c[:, 1])))
    out = []
    for c in cs:
        keep = [c[0]]
        for q in c[1:]:
            if np.hypot(*(q - keep[-1])) >= tol: keep.append(q)
        out.append(to_units(keep, rot_deg))
    return out
unit_rings = rings(unit["solid"], -unit["angle"])
hollow = None
lab_bg, _ = ndimage.label(~ink)
cl = lab_bg[int(CY), int(CX)]
if cl and cl != lab_bg[0, 0]: hollow = rings(lab_bg == cl)[0] if rings(lab_bg == cl) else None

def path_d(rs): return "".join("M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in r) + "Z" for r in rs)
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">']
for p in parts: svg.append(f'<path fill="{colours[p["colour"]]["hex"]}" fill-rule="evenodd" d="{path_d(rings(p["solid"]))}"/>')
svg.append("</svg>"); open(os.path.join(a.out, "mark.svg"), "w").write("\n".join(svg))
open(os.path.join(a.out, "unit.svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120"><path fill="{colours[unit["colour"]]["hex"]}" fill-rule="evenodd" d="{path_d(unit_rings)}"/></svg>')

# the picture to check by eye
pic = Image.open(rasterise(a.logo)).convert("RGBA"); bgp = Image.new("RGBA", pic.size, (255, 255, 255, 255)); bgp.alpha_composite(pic); pic = bgp.convert("RGB")
d = ImageDraw.Draw(pic); r0 = max(4, int(max(H, W) / 150))
d.ellipse([CX - r0, CY - r0, CX + r0, CY + r0], outline=(0, 0, 0), width=2)
L = max(H, W); t = math.radians(best_m[0])
d.line([CX - L * math.cos(t), CY - L * math.sin(t), CX + L * math.cos(t), CY + L * math.sin(t)], fill=(0, 160, 0), width=2)
for i, p in enumerate(parts):
    d.text((p["cx"] - 6, p["cy"] - 8), str(i), fill=(0, 0, 0)); d.line([CX, CY, p["cx"], p["cy"]], fill=(150, 150, 150), width=1)
pic.save(os.path.join(a.out, "study.png"))

study = {
    "source": os.path.abspath(a.logo), "pixels": [W, H], "centre_px": [round(CX, 1), round(CY, 1)], "units_per_px": round(S, 5),
    "colours": colours,
    "parts": [{"part": i, "colour": colours[p["colour"]]["hex"], "angle_deg": round(p["angle"], 2), "radius": round(p["radius"], 2),
               "area_share": round(p["area"] / ink.sum(), 3), "holes": p["holes"]} for i, p in enumerate(parts)],
    "symmetry": {"rotation_iou": {str(n): round(v, 3) for n, v in rot.items()}, "best_rotation_order": best_n, "best_rotation_iou": round(rot[best_n], 3),
                 "mirror_axis_deg": float(best_m[0]), "mirror_iou": round(best_m[1], 3)},
    "unit": {"part": unit_i, "colour": colours[unit["colour"]]["hex"], "angle_deg": round(unit["angle"], 2), "outline_and_holes": unit_rings},
    "relations": relations, "hollow_centre": hollow,
    "notes": "Units: a 120-unit box centred on the mark, its farthest ink at 50. Symmetry IoU near 1 means the ink lands on itself; "
             "colour can break a symmetry the shape has (compare parts' colours with their relations).",
}
json.dump(study, open(os.path.join(a.out, "study.json"), "w"), indent=1)
print(f"{len(parts)} parts in {len(colours)} colours: " + ", ".join(c['hex'] + f" {c['share']:.0%}" for c in colours))
def _reads(v): return "real" if v > 0.9 else "close, check by eye" if v > 0.8 else "weak" if v > 0.6 else "none"
print(f"rotational symmetry: best order {best_n} (IoU {rot[best_n]:.2f}, {_reads(rot[best_n])}); mirror axis {best_m[0]:.0f} deg (IoU {best_m[1]:.2f}, {_reads(best_m[1])})")
kinds = {}
for r in relations: kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
print("parts relative to the unit (part %d, at %.1f deg): %s" % (unit_i, unit["angle"], kinds))
print("holes per part:", [p["holes"] for p in parts], "| hollow centre:", "yes" if hollow else "no")
print("wrote", os.path.join(a.out, "study.json"), "study.png mark.svg unit.svg")
