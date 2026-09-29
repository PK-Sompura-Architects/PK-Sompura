"""Trace brand/LOGO_2.png into an outline-only SVG of stroke paths (centrelines of the navy linework, plus the
saffron Om). Output: src/assets/logo-outline.svg.  Run from the project root:  python tools/logo/trace.py
Needs Pillow, numpy, scipy and scikit-image.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import find_contours
from skimage.morphology import remove_small_objects, skeletonize

ROOT = Path(__file__).resolve().parents[2]
im = np.asarray(Image.open(ROOT / "brand/LOGO_2.png").convert("RGBA")).astype(int)
H, W = im.shape[:2]
r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
opaque = a > 128
navy = opaque & (r < 95) & (g < 95) & (b < 150) & (b > r)   # the dark linework
saffron = opaque & (r > 150) & (r - b > 70)                   # the Om


def clean(mask, close=0, min_px=12):
    m = ndi.binary_closing(mask, iterations=close) if close else mask
    return remove_small_objects(m, max_size=min_px)


def rdp(pts, eps):
    """Ramer–Douglas–Peucker simplification."""
    if len(pts) < 3:
        return pts
    s, e = pts[0], pts[-1]
    d = e - s
    v = pts - s
    n = np.hypot(*d)
    dist = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / n if n else np.hypot(*v.T)
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return np.vstack([rdp(pts[: i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.array([s, e])


def paths_from(mask, simplify):
    """Skeletonize, walk the pixel graph into polylines. Returns (points, stroke width measured underneath)."""
    sk = skeletonize(mask)
    edt = ndi.distance_transform_edt(mask)
    pts = set(zip(*np.nonzero(sk)))

    def nb(p):
        return [(p[0] + dy, p[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                if (dy or dx) and (p[0] + dy, p[1] + dx) in pts]

    deg = {p: len(nb(p)) for p in pts}
    seen, lines = set(), []

    def walk(start, nxt):
        line, prev, cur = [start, nxt], start, nxt
        seen.add(frozenset((start, nxt)))
        while deg[cur] == 2:
            cands = [q for q in nb(cur) if q != prev and frozenset((cur, q)) not in seen]
            if not cands:
                break
            prev, cur = cur, cands[0]
            seen.add(frozenset((prev, cur)))
            line.append(cur)
            if cur == start:
                break
        return line

    for p in [p for p in pts if deg[p] != 2] + list(pts):   # junction/end runs first, then pure loops (beads)
        for q in nb(p):
            if frozenset((p, q)) not in seen:
                lines.append(walk(p, q))
    return [(rdp(np.array(l, float)[:, ::-1], simplify), 2 * float(np.median([edt[p] for p in l])))
            for l in lines if len(l) >= 4]


def to_d(p):
    """Catmull-Rom through the simplified points, written as cubic Béziers."""
    closed = len(p) > 3 and np.hypot(*(p[0] - p[-1])) < 1.5

    def f(v):
        return f"{v[0]:.0f},{v[1]:.0f}"

    d = [f"M{f(p[0])}"]
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i > 0 else (p[-2] if closed else p[i])
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else (p[1] if closed else p2)
        c1, c2 = p1 + (p2 - p0) / 6, p2 - (p3 - p1) / 6
        d.append(f"C{f(c1)} {f(c2)} {f(p2)}")
    return "".join(d) + ("Z" if closed else "")


def width_class(w):
    # Thin details (flags, eye, lips) stay thin; the main outline stays bold.
    return 2.4 if w < 3.6 else 3.8 if w < 5.0 else 5.6


def group(stroke, width, ds):
    body = "\n".join(f'<path pathLength="1" d="{d}"/>' for d in ds)
    return f'<g stroke="{stroke}" stroke-width="{width}">\n{body}\n</g>\n'


def split_blobs(mask, max_side=40, min_fill=0.3):
    """Small solid shapes (the star, the Om's dot) collapse to a cross or vanish as centrelines, so they are traced
    by their outline instead. Returns (mask without them, outline paths)."""
    lab, _ = ndi.label(mask)
    rest, outlines = mask.copy(), []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        comp = lab[sl] == i
        h, w = comp.shape
        if max(h, w) <= max_side and comp.mean() >= min_fill and comp.sum() >= 4:
            rest[sl][comp] = False
            for c in find_contours(np.pad(comp, 1).astype(float), 0.5):
                outlines.append(rdp(c[:, ::-1] + [sl[1].start - 1, sl[0].start - 1], 0.5))
    return rest, outlines


groups = {}
navy_lines, navy_blobs = split_blobs(clean(navy))
for pts, w in paths_from(navy_lines, 1.2):
    groups.setdefault(width_class(w), []).append(to_d(pts))
groups.setdefault(2.4, []).extend(to_d(p) for p in navy_blobs)
om_lines, om_blobs = split_blobs(clean(saffron, 1, 3), max_side=24)
om = [to_d(p) for p, _ in paths_from(om_lines, 0.6)] + [to_d(p) for p in om_blobs]

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-linecap="round" stroke-linejoin="round">\n'
    '<!-- P.K. Sompura symbol, outline only: centrelines traced from brand/LOGO_2.png by tools/logo/trace.py -->\n'
    + "".join(group("#262654", w, ds) for w, ds in sorted(groups.items()))
    + group("#CD8841", 3, om)
    + "</svg>\n"
)
out = ROOT / "src/assets/logo-outline.svg"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(svg, encoding="utf-8")
counts = ", ".join(f"{len(ds)} at {w}px" for w, ds in sorted(groups.items()))
print(f"navy paths: {counts}; Om paths: {len(om)}; {len(svg.encode()) // 1024} KB")
