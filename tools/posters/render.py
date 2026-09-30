"""Encode the posters to public/posters as AVIF + WebP.

  python tools/posters/render.py          stand-ins drawn by tools/posters/poster.html (phase 2)
  python tools/posters/render.py --real   frames rendered from the three.js scenes by render-3d.mjs (phase 5 on)

Run from the project root. Needs Google Chrome and Pillow with AVIF support.
"""
import os
import sys
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "tools/posters/poster.html").as_uri()
OUT = ROOT / "public/posters"

# name: (query, render width, render height, export widths)
POSTERS = {
    "toolpath": ("mode=toolpath", 2400, 1200, [2400, 1600, 960]),
    "toolpath-m": ("mode=toolpath", 960, 1120, [960, 480]),
}
# The Fero fly-through shots (Posters P3) exist only as renders of the real scene (--real). Named fw-s1…s5 (2400×1350)
# and fw-sN-m (1080×1920), AVIF, plus half-size AVIFs and a 1200 WebP fallback.
FERO = {f"fw-s{n}{m}": (None, *((2400, 1350, [2400, 1200]) if not m else (1080, 1920, [1080, 540])))
        for n in range(1, 6) for m in ("", "-m")}


def shoot(query: str, w: int, h: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "p.png")
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
             "--force-device-scale-factor=1", f"--window-size={w},{h}", "--virtual-time-budget=3000",
             f"--screenshot={png}", f"{PAGE}?{query}"],
            check=True, capture_output=True,
        )
        return Image.open(png).convert("RGB").copy()


REAL = "--real" in sys.argv
OUT.mkdir(parents=True, exist_ok=True)
for name, (query, w, h, widths) in (POSTERS | FERO if REAL else POSTERS).items():
    img = Image.open(ROOT / f"tools/posters/out/{name}.png").convert("RGB") if REAL else shoot(query, w, h)
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
