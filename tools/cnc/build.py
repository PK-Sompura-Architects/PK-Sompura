"""CNC chapter: contour paths and cut order for the panel, "drawn, not revealed".
Samples the panel's height field (the same h() as src/scripts/three/relief.ts, [A2] stand-in panel, 70.4 x 88 units),
extracts contour paths at its height steps, groups them into the machine's stages and orders them:
  1 outer border -> 2 inner frame and moulding lines -> 3 main motif outlines -> 4 fine interior detail
(stage 5, the relief depth cutting in behind the lines in the same order, is the shader reading the cut-order map).
Writes src/data/cnc-paths.json (SVG paths in panel units, with start/end progress) and public/tex/cut-order.webp
(each pixel = when the tool reaches it, 0..1 over the depth stage). Run from the project root: python tools/cnc/build.py
If h() in relief.ts changes, change it here too.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from skimage.measure import find_contours

ROOT = Path(__file__).resolve().parents[2]
PX = 10                                     # samples per panel unit
W, H = 70.4, 88.0
# Progress windows (of the pinned section's scroll): stages 1-4 draw lines, stage 5 cuts the depth in.
STAGES = {1: (0.0, 0.1), 2: (0.1, 0.3), 3: (0.3, 0.5), 4: (0.5, 0.64)}
DEPTH = (0.64, 1.0)


def rdp(pts, eps):
    """Ramer-Douglas-Peucker simplification (keeps the SVG light: rectangles collapse to their corners)."""
    if len(pts) < 3:
        return pts
    s, e = pts[0], pts[-1]
    d = e - s
    n = np.hypot(*d)
    v = pts - s
    dist = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / n if n else np.hypot(*v.T)
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return np.vstack([rdp(pts[: i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.array([s, e])


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def box(qx, qy, a, b, bev):
    d = np.minimum(np.minimum(qx - a[0], b[0] - qx), np.minimum(qy - a[1], b[1] - qy))
    return smoothstep(0.0, bev, d)


def h(qx, qy):
    """Port of relief.ts h(q)."""
    Hh = 1.0 * box(qx, qy, (3.3, 3.3), (67.1, 84.7), 0.5)
    Hh -= 0.7 * box(qx, qy, (5.6, 5.6), (64.8, 82.4), 0.6)
    pitch = (70.4 - 18.0 - 2.6) / 10.0
    i = np.clip(np.floor((qx - 9.0) / pitch + 0.5), 0, 10)
    x0 = 9.0 + i * pitch
    Hh += 0.8 * box(qx, qy, (x0, 8.0), (x0 + 2.6, 10.6), 0.35)
    Hh += 0.8 * box(qx, qy, (x0, 77.4), (x0 + 2.6, 80.0), 0.35)
    Hh -= 0.6 * box(qx, qy, (9.0, 14.0), (12.4, 74.0), 0.6)
    Hh -= 0.6 * box(qx, qy, (58.0, 14.0), (61.4, 74.0), 0.6)
    dx, dy = qx - 35.2, qy - 44.0
    r = np.hypot(dx, dy)
    a = np.arctan2(dx, -dy)
    Hh += 1.1 * smoothstep(21.1, 20.3, r)
    Hh -= 0.7 * smoothstep(16.5, 15.8, r)
    s12 = np.floor(a / 0.5236 + 0.5) * 0.5236
    Hh += 0.6 * smoothstep(0.9, 0.2, np.hypot(qx - (35.2 + 14.2 * np.sin(s12)), qy - (44.0 - 14.2 * np.cos(s12))))
    Hh += 1.2 * smoothstep(11.75, 11.1, r)
    Hh -= 0.7 * smoothstep(7.0, 6.4, r)
    Hh += 1.1 * np.sqrt(np.maximum(0.0, 1.0 - r * r / 10.9))
    s8 = np.floor(a / 0.7854 + 0.5) * 0.7854
    lx, ly = qx - (35.2 + 27.7 * np.sin(s8)), qy - (44.0 - 27.7 * np.cos(s8))
    Hh += 0.9 * smoothstep(0.0, 0.6, 3.32 - (np.abs(lx) + np.abs(ly)))
    return Hh


ys, xs = np.mgrid[0:int(H * PX) + 1, 0:int(W * PX) + 1] / PX
field = h(xs, ys)

# Contours at the height steps between the plateaus (slab/field edges, grooves, rosette rings, inner recess).
paths = []
for level in (0.0, 0.65, 1.05, 1.55):
    for c in find_contours(field, level):
        p = c[:, ::-1] / PX                  # (x, y) panel units
        if len(p) < 12:
            continue
        cx, cy = p.mean(0)
        size = np.ptp(p, 0)
        if any(np.hypot(cx - q["c"][0], cy - q["c"][1]) < 0.6 and abs(size - q["size"]).max() < 1.2 for q in paths):
            continue                         # the same edge seen at two levels
        paths.append({"p": p, "c": (cx, cy), "size": size, "len": float(np.hypot(*np.diff(p, axis=0).T).sum())})


def classify(q):
    cx, cy = q["c"]
    w, hh = q["size"]
    r = np.hypot(cx - 35.2, cy - 44.0)
    if w > 62:
        return 1 if w > 63.3 else 2        # outer slab edge / recessed field edge
    if hh > 40 or (w < 4 and hh < 4 and (cy < 12 or cy > 76)):
        return 2                             # side grooves, dentils (the moulding)
    if r < 1 and w > 18 or 3 < w < 8 and abs(r - 27.7) < 1.5:
        return 3                             # rosette rings and the 8 diamonds
    return 4                                 # 12 bosses, inner recess, centre boss


def order_key(q):
    cx, cy = q["c"]
    ang = np.arctan2(cx - 35.2, -(cy - 44.0)) % (2 * np.pi)   # clockwise from the top, like the tool
    return (-max(q["size"]), ang) if np.hypot(cx - 35.2, cy - 44.0) < 1 else (0, ang)


for q in paths:
    q["stage"] = classify(q)
out, samples = [], []
for s, (t0, t1) in STAGES.items():
    group = sorted([q for q in paths if q["stage"] == s], key=order_key)
    total = sum(q["len"] for q in group)
    t = t0
    for q in group:
        dt = (t1 - t0) * q["len"] / total
        p = rdp(q["p"], 0.05)
        d = "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in p) + ("Z" if np.hypot(*(p[0] - p[-1])) < 0.2 else "")
        out.append({"stage": s, "t0": round(t, 4), "t1": round(t + dt, 4), "d": d})
        # Time along this path, for the cut-order map.
        seg = np.r_[0, np.cumsum(np.hypot(*np.diff(q["p"], axis=0).T))]
        for (x, y), f in zip(q["p"], seg / max(seg[-1], 1e-6)):
            samples.append((x, y, t + dt * f))
        t += dt

(ROOT / "src/data/cnc-paths.json").write_text(json.dumps({"viewBox": f"0 0 {W} {H}", "depth": DEPTH, "paths": out}, indent=0), encoding="utf-8")

# Cut order: every pixel takes the time of the nearest tool line, rescaled to 0..1 over the depth stage, so the relief
# cuts in behind the lines in the order they were drawn.
S = np.array(samples)
tree = cKDTree(S[:, :2])
gy, gx = np.mgrid[0:int(H * 4), 0:int(W * 4)]
_, i = tree.query(np.c_[(gx.ravel() + 0.5) / 4, (gy.ravel() + 0.5) / 4])
order = (S[i, 2] / STAGES[4][1]).reshape(gy.shape)
Image.fromarray(np.round(np.clip(order, 0, 1) * 255).astype(np.uint8)).save(ROOT / "public/tex/cut-order.webp", lossless=True)
counts = {s: sum(1 for o in out if o["stage"] == s) for s in STAGES}
print(f"{len(out)} paths by stage {counts}; cut-order {gx.shape[1]}x{gx.shape[0]} "
      f"({(ROOT / 'public/tex/cut-order.webp').stat().st_size // 1024} KB)")
