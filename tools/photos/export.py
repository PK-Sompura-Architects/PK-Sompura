"""Exports the approved photos (tools/photos/picks.json) from the private archive into public/media/ as AVIF + WebP at
480 / 720 / 960 / 1600 / 2400 px wide (never wider than the source), and writes src/data/media.json (id -> size, widths, alt)
for the <picture> markup. The archive (D:\\projects\\ALBUM-IMAGES) is only read; the originals are never copied.
Run from the project root:  python tools/photos/export.py [id ...]   (ids: re-export only those; the rest of
media.json is kept, and entries no longer in picks.json are dropped)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = Path(r"D:\projects\ALBUM-IMAGES")
OUT = ROOT / "public/media"
WIDTHS = [480, 720, 960, 1600, 2400]

picks = {k: v for k, v in json.loads((ROOT / "tools/photos/picks.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}
OUT.mkdir(parents=True, exist_ok=True)
only = sys.argv[1:]
manifest, total = {}, 0
if only:
    old = json.loads((ROOT / "src/data/media.json").read_text(encoding="utf-8"))
    manifest = {k: v for k, v in old.items() if k in picks and k not in only}
for key, p in picks.items():
    if only and key not in only:
        continue
    im = ImageOps.exif_transpose(Image.open(ARCHIVE / p["src"])).convert("RGB")
    l, t, r, b = p.get("crop", [0, 0, 1, 1])
    im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
    if p.get("rotate"):
        im = im.rotate(p["rotate"], expand=True)
    widths = [w for w in WIDTHS if w <= im.width] or [im.width]
    for w in widths:
        s = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        for ext, kw in (("avif", {"quality": 55, "speed": 4}), ("webp", {"quality": 78, "method": 6})):
            path = OUT / f"{key}-{w}.{ext}"
            s.save(path, **kw)
            total += path.stat().st_size
    manifest[key] = {"w": im.width, "h": im.height, "widths": widths, "alt": p["alt"]}
    print(f"{key:24s} {im.width}x{im.height} -> {widths}")
(ROOT / "src/data/media.json").write_text(json.dumps(dict(sorted(manifest.items(), key=lambda kv: list(picks).index(kv[0]))), indent=1), encoding="utf-8")
print(f"{len(manifest)} photos, {total / 1024 / 1024:.1f} MB in public/media (all widths, both formats)")
