"""Read a reference post: its text, author and media. Optionally download its video and make a contact sheet.

    python3 fetch_ref.py <url> [<url> ...]                       # read only: text, author, each video's URL, length, size
    python3 fetch_ref.py <url> --download --out refs/ [--every 0.5]
                                                                 # also save refs/<author>-<id>.mp4 and refs/<author>-<id>.jpg

Ask the user before --download, naming the file, its source and its size, which this prints first.

- X / Twitter (x.com, twitter.com): read through the public fxtwitter API (api.fxtwitter.com), no sign-in needed.
- A direct video URL (.mp4, .mov, .webm) or a local file: used as is.
- YouTube, Vimeo, Instagram, TikTok: needs yt-dlp (`yt-dlp -f mp4 -o refs/%(id)s.mp4 <url>`), with the user's go-ahead;
  this script then makes the sheet from the saved file (pass its path).
"""
import argparse, json, os, re, subprocess, sys, urllib.request

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (reference reader)"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.loads(r.read())


def read_x(url):
    m = re.search(r"(?:x|twitter)\.com/([^/]+)/status/(\d+)", url)
    if not m: return None
    user, sid = m.groups()
    t = get_json(f"https://api.fxtwitter.com/{user}/status/{sid}").get("tweet", {})
    vids = [{"url": v.get("url"), "duration": v.get("duration"), "width": v.get("width"), "height": v.get("height"), "thumb": v.get("thumbnail_url")}
            for v in (t.get("media") or {}).get("videos", [])]
    photos = [p.get("url") for p in (t.get("media") or {}).get("photos", [])]
    a = t.get("author") or {}
    return {"id": sid, "author": a.get("screen_name") or user, "name": a.get("name"), "text": t.get("text"), "date": t.get("created_at"),
            "likes": t.get("likes"), "views": t.get("views"), "videos": vids, "photos": photos, "url": url}


def size_of(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r: return int(r.headers.get("Content-Length") or 0)
    except Exception: return 0


def sheet(video, out_jpg, every):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], capture_output=True, text=True).stdout or 0)
    subprocess.run([sys.executable, os.path.join(SCRIPTS, "strips.py"), video, "0", str(dur), "--fps", str(1 / every), "--cols", "8", "--width", "240", "--out", out_jpg], check=True)


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); ap.add_argument("urls", nargs="+"); ap.add_argument("--download", action="store_true")
ap.add_argument("--out", default="refs"); ap.add_argument("--every", type=float, default=0.5)
a = ap.parse_args()
for url in a.urls:
    if os.path.exists(url):
        os.makedirs(a.out, exist_ok=True); base = os.path.splitext(os.path.basename(url))[0]
        sheet(url, os.path.join(a.out, base + ".jpg"), a.every); continue
    info = read_x(url) if re.search(r"(x|twitter)\.com/", url) else None
    if info is None and re.search(r"\.(mp4|mov|webm)(\?|$)", url):
        info = {"id": re.sub(r"\W+", "_", url.split("/")[-1].split("?")[0])[:40], "author": "video", "text": "", "videos": [{"url": url}], "photos": []}
    if info is None:
        print(f"{url}: not an X post or a direct video; for YouTube and the like use yt-dlp (with the user's go-ahead), then pass the file"); continue
    print(f"\n{url}\n  @{info['author']} ({info.get('name')}), {info.get('date')}\n  text: {info.get('text')}")
    for k, v in enumerate(info["videos"]):
        sz = size_of(v["url"]) if v.get("url") else 0
        print(f"  video {k + 1}: {v.get('duration')} s, {v.get('width')}x{v.get('height')}, {sz / 1e6:.1f} MB\n    {v.get('url')}")
    for p in info["photos"]: print(f"  photo: {p}")
    if a.download:
        os.makedirs(a.out, exist_ok=True)
        for k, v in enumerate(info["videos"]):
            name = f"{info['author']}-{info['id']}" + (f"-{k + 1}" if len(info["videos"]) > 1 else "")
            path = os.path.join(a.out, name + ".mp4")
            with urllib.request.urlopen(urllib.request.Request(v["url"], headers=UA), timeout=120) as r, open(path, "wb") as f: f.write(r.read())
            print("  saved", path); sheet(path, os.path.join(a.out, name + ".jpg"), a.every)
        json.dump(info, open(os.path.join(a.out, f"{info['author']}-{info['id']}.json"), "w"), indent=1)
