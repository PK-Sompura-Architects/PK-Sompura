"""Turn candid member photos into a consistent set of headshots.

    python tools/headshot.py IMAGES_DIR --out headshots/out
    python tools/headshot.py photo.jpg --face 1 --name "Member Name"

Each face is placed at the same size and position as the reference portrait,
on a backdrop matched to it. This is framing, cut-out and grading -- it cannot
add detail the source photo never captured, so a face only 80px tall in the
original will look soft no matter what.
"""
import argparse
import io
import math
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

from faces import detect

# Output sized for a 340px card at 2x. Larger only magnifies the upscaling.
TARGET_W, TARGET_H = 700, 933

# Framing measured from the reference portrait (1086x1448, face 300x404 @352,220).
FACE_H_RATIO = 0.279      # face box height as a share of frame height
FACE_TOP_RATIO = 0.152    # face box top, share of frame height
FACE_CX_RATIO = 0.462     # face box centre x, share of frame width

BACKDROP_CORE = (150, 135, 122)
BACKDROP_EDGE = (74, 63, 57)
CORE_X, CORE_Y = 0.50, 0.22

_session = None


def cutout(img):
    global _session
    from rembg import remove, new_session
    if _session is None:
        _session = new_session("u2net_human_seg")
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    out = remove(buf.getvalue(), session=_session, alpha_matting=True,
                 alpha_matting_foreground_threshold=250,
                 alpha_matting_background_threshold=15,
                 alpha_matting_erode_size=5)
    return Image.open(io.BytesIO(out)).convert("RGBA")


def backdrop(w, h):
    """Warm radial vignette, brightest behind the head, matching the reference."""
    sw, sh = max(2, w // 8), max(2, h // 8)
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    cx, cy = sw * CORE_X, sh * CORE_Y
    far = math.hypot(max(cx, sw - cx), max(cy, sh - cy))
    for y in range(sh):
        for x in range(sw):
            t = min(1.0, (math.hypot(x - cx, y - cy) / far) ** 1.35)
            px[x, y] = tuple(round(BACKDROP_CORE[i] + (BACKDROP_EDGE[i] - BACKDROP_CORE[i]) * t)
                             for i in range(3))
    return small.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))


def isolate(src, face, width_factor=2.9, above=1.5, below=3.2):
    """Crop to just this person before cutting out.

    Segmentation happily keeps whoever is standing alongside, and most of these
    photos are group shots, so the neighbour has to be cropped away first.
    Returns the crop and the face box translated into it.
    """
    cx = face["x"] + face["w"] / 2
    half = face["w"] * width_factor / 2
    box = (max(0, round(cx - half)),
           max(0, round(face["y"] - face["h"] * above)),
           min(src.width, round(cx + half)),
           min(src.height, round(face["y"] + face["h"] * below)))
    moved = {**face, "x": face["x"] - box[0], "y": face["y"] - box[1]}
    return src.crop(box), moved


def white_balance(rgba, face):
    """Pull a colour cast out of the skin, gently.

    Measured on the face box alone: a grey-world average over the whole person
    is dominated by whatever colour their shirt is, which sent a pink shirt
    green. Skin under neutral light sits near R:G:B 100:82:72, so correct
    toward that, and clamp hard -- a wrong guess should be invisible, not a
    second cast.
    """
    SKIN = (1.00, 0.82, 0.72)
    box = (max(0, round(face["x"])), max(0, round(face["y"])),
           min(rgba.width, round(face["x"] + face["w"])),
           min(rgba.height, round(face["y"] + face["h"])))
    if box[2] - box[0] < 4 or box[3] - box[1] < 4:
        return rgba
    patch = rgba.crop(box).convert("RGB")
    means = [sum(c) / len(c) for c in zip(*patch.getdata())]
    if min(means) < 1:
        return rgba
    target = [SKIN[i] / SKIN[0] * means[0] for i in range(3)]
    r, g, b, a = rgba.split()
    fixed = []
    for ch, m, t in zip((r, g, b), means, target):
        k = min(1.12, max(0.89, t / m))          # at most ~12% either way
        fixed.append(ch.point(lambda v, k=k: min(255, round(v * k))))
    return Image.merge("RGBA", (*fixed, a))


def build(path, face, name, out_dir, keep_bg=False):
    src = Image.open(path).convert("RGB")
    src, face = isolate(src, face)
    layer = src.convert("RGBA") if keep_bg else cutout(src)
    layer = white_balance(layer, face)

    # Scale so this person's face matches the reference's face size.
    scale = (TARGET_H * FACE_H_RATIO) / face["h"]
    new = (max(1, round(layer.width * scale)), max(1, round(layer.height * scale)))
    layer = layer.resize(new, Image.LANCZOS)

    # Place the face box where the reference's face box sits.
    fx = (face["x"] + face["w"] / 2) * scale
    fy = face["y"] * scale
    left = round(fx - TARGET_W * FACE_CX_RATIO)
    top = round(fy - TARGET_H * FACE_TOP_RATIO)

    canvas = backdrop(TARGET_W, TARGET_H).convert("RGBA")
    canvas.alpha_composite(layer, dest=(max(0, -left), max(0, -top)),
                           source=(max(0, left), max(0, top)))
    final = canvas.convert("RGB")

    # Upscaled faces go soft; a light unsharp mask restores some definition
    # without inventing detail.
    amount = min(140, round(60 * scale))
    final = final.filter(ImageFilter.UnsharpMask(radius=1.6, percent=amount, threshold=3))
    final = ImageEnhance.Color(final).enhance(0.90)
    final = ImageEnhance.Contrast(final).enhance(1.07)

    out_dir.mkdir(parents=True, exist_ok=True)
    slug = "-".join(filter(None, "".join(
        c.lower() if c.isalnum() else "-" for c in name).split("-")))
    dest = out_dir / f"{slug}.webp"
    final.save(dest, "WEBP", quality=90, method=6)
    return dest, scale


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=Path)
    ap.add_argument("--out", type=Path, default=Path("headshots/out"))
    ap.add_argument("--face", type=int, default=0)
    ap.add_argument("--name")
    ap.add_argument("--keep-bg", action="store_true")
    a = ap.parse_args()

    paths = sorted(a.src.glob("*.jpg"), key=lambda q: int(q.stem)) if a.src.is_dir() else [a.src]
    for p in paths:
        found, _ = detect(p)
        if not found:
            print(f"{p.name}: no face found")
            continue
        idx = a.face if not a.src.is_dir() else 0
        if idx >= len(found):
            print(f"{p.name}: no face #{idx}")
            continue
        name = a.name or f"{p.stem}-face{idx}"
        dest, scale = build(p, found[idx], name, a.out, a.keep_bg)
        flag = "ok" if scale <= 1.8 else ("soft" if scale <= 2.6 else "TOO SMALL")
        print(f"{p.name:8} face#{idx} upscale {scale:.1f}x  {flag:9} -> {dest.name}")
