"""Encode the frames rendered by render-3d.mjs (tools/posters/out) to public/posters as AVIF + WebP.

  python tools/posters/render.py

Run from the project root. Needs Pillow with AVIF support.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/posters"

# name: (render width, render height, export widths). The Fero fly-through shots (Posters P3): fw-s1…s5 (2400×1350)
# and fw-sN-m (1080×1920), AVIF, plus half-size AVIFs and a 1200 WebP fallback.
POSTERS = {f"fw-s{n}{m}": ((2400, 1350, [2400, 1200]) if not m else (1080, 1920, [1080, 540]))
           for n in range(1, 6) for m in ("", "-m")}

OUT.mkdir(parents=True, exist_ok=True)
for name, (w, h, widths) in POSTERS.items():
    img = Image.open(ROOT / f"tools/posters/out/{name}.png").convert("RGB")
    assert img.size == (w, h), f"{name}: got {img.size}"
    for tw in widths:
        im = img if tw == w else img.resize((tw, round(h * tw / w)), Image.LANCZOS)
        fw = name.startswith("fw-")
        for ext, kw in (("avif", {"quality": 55, "speed": 4}), ("webp", {"quality": 80, "method": 6})):
            if fw and ext == "webp" and tw != 1200:
                continue
            path = OUT / (f"{name}.{ext}" if fw and tw == w else f"{name}-{tw}.{ext}")
            im.save(path, **kw)
            print(f"{path.name:28s} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")
