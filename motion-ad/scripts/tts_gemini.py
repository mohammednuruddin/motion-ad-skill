"""Gemini text-to-speech for a film's voices: design a voice from a description (any accent), then speak one line.

    python3 tts_gemini.py design --name lead --gender female --lang en-GB --desc "A woman in her forties from Edinburgh, ..."
    python3 tts_gemini.py speak --voice voice_xxxx --text "Which orders are late today?" --style "asked out loud to a laptop" --out voices/question.wav
    python3 tts_gemini.py list [--lang en-GB] [--accent "Cape Town English"]       # the voice library, to check for a ready-made accent

- The key is read from $GEMINI_API_KEY, or from an `export GEMINI_API_KEY=...` line in ~/.zshrc or ~/.bashrc. It is
  sent only in the x-goog-api-key header and never printed.
- Accent and timbre belong in the voice (design it); delivery belongs in --style, per line.
- One take per call. Free tiers can be 3 requests a minute and 10 a day: make one take a line and let the user listen
  before making more. A 429 is reported with the wait the API asks for.
- Designed voices are stored in the user's project for a year (renewed by use): reuse the id for every line by that speaker.
"""
import argparse, base64, json, os, re, sys, urllib.request, urllib.error, wave
from pathlib import Path

API = "https://generativelanguage.googleapis.com/v1beta/"
MODEL = "gemini-3.8-flash-tts"


def key():
    k = os.environ.get("GEMINI_API_KEY")
    if k: return k
    for rc in ("~/.zshrc", "~/.bashrc", "~/.bash_profile", "~/.zprofile", "~/.profile"):
        p = Path(rc).expanduser()
        if p.exists():
            m = re.search(r'^\s*export\s+GEMINI_API_KEY=["\']?([^"\'\s]+)', p.read_text(), re.M)
            if m: return m.group(1)
    sys.exit("No GEMINI_API_KEY: ask the user to add `export GEMINI_API_KEY=...` to their shell profile.")


def call(method, path, body=None, params=None, timeout=180):
    url = API + path + ("?" + urllib.parse.urlencode(params, doseq=True) if params else "")
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"x-goog-api-key": key(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        try: msg = json.loads(msg)["error"]["message"]
        except Exception: pass
        sys.exit(f"HTTP {e.code}: {msg[:400]}")


def find_audio(o):
    if isinstance(o, dict):
        if isinstance(o.get("data"), str) and len(o["data"]) > 1000: return o["data"]
        for v in o.values():
            r = find_audio(v)
            if r: return r
    if isinstance(o, list):
        for v in o:
            r = find_audio(v)
            if r: return r
    return None


ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
d = sub.add_parser("design"); d.add_argument("--name", required=True); d.add_argument("--gender", default="neutral"); d.add_argument("--lang", default="en-US"); d.add_argument("--desc", required=True); d.add_argument("--model", default=MODEL); d.add_argument("--sample", default=None)
s = sub.add_parser("speak"); s.add_argument("--voice", required=True); s.add_argument("--text", required=True); s.add_argument("--style", default=""); s.add_argument("--out", required=True); s.add_argument("--model", default=MODEL)
l = sub.add_parser("list"); l.add_argument("--lang", action="append"); l.add_argument("--accent", action="append"); l.add_argument("--gender", action="append"); l.add_argument("--search")
a = ap.parse_args()
import urllib.parse  # noqa: E402

if a.cmd == "design":
    r = call("POST", "voices", {"store": True, "voice": {"model": a.model, "type": "prompted", "display_name": a.name, "gender": a.gender, "language_code": a.lang, "prompted": {"input": a.desc}}})
    v = r.get("voice", r)
    print("voice id:", v.get("id"), "| language", v.get("language_code"), "| expires", v.get("expire_time"))
    sa = v.get("sample_audio") or {}
    if sa.get("data"):
        out = a.sample or f"{a.name}-sample.wav"
        Path(out).write_bytes(base64.b64decode(sa["data"])); print("sample:", out)
elif a.cmd == "speak":
    content = {"type": "text", "text": a.text}
    if a.style: content["annotations"] = [{"type": "speech_metadata", "style": a.style}]
    r = call("POST", "interactions", {"model": a.model, "input": [{"type": "user_input", "content": [content]}], "response_format": {"type": "audio"}, "generation_config": {"speech_config": [{"voice": a.voice}]}})
    b = find_audio(r)
    if not b: sys.exit("no audio in the response: " + json.dumps(r)[:300])
    Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_bytes(base64.b64decode(b))
    try:
        w = wave.open(a.out); print(a.out, w.getframerate(), "Hz", round(w.getnframes() / w.getframerate(), 2), "s")
    except Exception:
        print(a.out, "(raw PCM 24 kHz mono 16-bit; wrap it in a WAV header before use)")
else:
    params = {"page_size": 1000}
    if a.lang: params["language_code"] = a.lang
    if a.accent: params["accent"] = a.accent
    if a.gender: params["gender"] = a.gender
    if a.search: params["search"] = a.search
    vs = call("GET", "voices", params=params).get("voices", [])
    for v in vs: print(v.get("id"), "|", v.get("language_code"), "|", v.get("accent"), "|", v.get("gender"), "|", (v.get("description") or "")[:100])
    print(len(vs), "voices")
