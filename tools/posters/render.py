"""Render the stand-in posters (tools/posters/poster.html) to public/posters as AVIF + WebP.

Run from the project root:  python tools/posters/render.py
Needs Google Chrome and Pillow with AVIF support.
"""
import os
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
    "hero": ("mode=hero", 2400, 1350, [2400, 1600, 960]),
    "hero-m": ("mode=hero", 960, 1200, [960, 480]),
    "toolpath": ("mode=toolpath", 2400, 1200, [2400, 1600, 960]),
    "toolpath-m": ("mode=toolpath", 960, 1120, [960, 480]),
    "mountain-k3": ("mode=mountain&stage=3", 2400, 1350, [2400, 1600, 960]),
    "mountain-k3-m": ("mode=mountain&stage=3", 960, 1494, [960, 480]),
}


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


OUT.mkdir(parents=True, exist_ok=True)
for name, (query, w, h, widths) in POSTERS.items():
    img = shoot(query, w, h)
    assert img.size == (w, h), f"{name}: got {img.size}"
    for tw in widths:
        im = img if tw == w else img.resize((tw, round(h * tw / w)), Image.LANCZOS)
        for ext, kw in (("avif", {"quality": 55, "speed": 4}), ("webp", {"quality": 80, "method": 6})):
            path = OUT / f"{name}-{tw}.{ext}"
            im.save(path, **kw)
            print(f"{path.name:28s} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")
