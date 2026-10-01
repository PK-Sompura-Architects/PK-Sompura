"""CNC chapter: a line trace of one of the firm's CNC-cut sandstone panels, drawn stage by stage on the page.

  python tools/cnc/trace.py

Reads the archive photo (read-only), flattens it to a rectangle, traces the carving's edges, and writes
  src/data/cnc-paths.json   viewBox + paths in machine order, each tagged with its stage 1-4
The line drawing is the finished state; no photo is shown. Cleanup: fragments under MIN_LEN are dropped, the rest
simplified (Douglas-Peucker) and drawn as smooth curves (Catmull-Rom through the kept points, as cubic Beziers).
Stages: 1 outer border, 2 frame and moulding, 3 main motifs (the longer strokes and the three sunflowers),
4 fine detail. The panel is carved mirror-symmetric; its right half traces cleanest, so the trace is that half mirrored.
The three sunflowers are redrawn as clean petal outlines on the photo's flowers (their petals trace patchily).
Needs opencv-python, scikit-image, scipy. Run from the project root.
"""
import json
import math
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d
from skimage.morphology import skeletonize

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(r"D:\projects\ALBUM-IMAGES\OUR WORK PHOTO\cnc work\IMG_20220626_211446.jpg")

# 1. Flatten: the inner moulding frame's corners in the photo -> a 2000 x 1370 rectangle with a 140 px margin.
CORNERS = [(240, 97), (2267, 130), (2320, 1495), (224, 1548)]
M, W, H = 140, 2000, 1370
FW, FH = W + 2 * M, H + 2 * M                       # flattened size, 2280 x 1650
CROP = 100                                           # final frame: 100 px in, which also drops the phone marks
AXIS = 1001                                          # mirror axis, in trace (norm) coordinates: found by correlation
S = 0.5                                              # output scale: viewBox 0 0 1040 725
MIN_LEN = 40                                         # shortest traced stroke kept, in viewBox units

photo = cv2.imdecode(np.fromfile(str(SRC), np.uint8), cv2.IMREAD_COLOR)
P = cv2.getPerspectiveTransform(np.float32(CORNERS), np.float32([(M, M), (M + W, M), (M + W, M + H), (M, M + H)]))
flat = cv2.warpPerspective(photo, P, (FW, FH), flags=cv2.INTER_LANCZOS4)

# 2. Trace the panel's field (8 px inside the frame): even out the lighting, smooth, edges, one-pixel strokes.
OFF = M + 8
g = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY)[OFF:M + H - 8, OFF:M + W - 8]
g = cv2.createCLAHE(2.0, (8, 8)).apply(cv2.divide(g, cv2.GaussianBlur(g, (0, 0), 60), scale=128))
g = cv2.GaussianBlur(cv2.bilateralFilter(g, 9, 40, 9), (0, 0), 3.0)
e = (cv2.Canny(g, 18, 50, L2gradient=True) > 0).astype(np.uint8)
e[:30], e[-30:], e[:, :30], e[:, -30:] = 0, 0, 0, 0   # the frame is drawn as clean rectangles instead
band = e[930:1020]                                   # the slab joint: a long thin horizontal crack
e[930:1020] = band & (1 - cv2.morphologyEx(band, cv2.MORPH_OPEN, np.ones((1, 41), np.uint8)))
half = np.zeros_like(e)                              # right half, mirrored onto the left
xs = np.arange(AXIS, e.shape[1]); mx = 2 * AXIS - xs; ok = mx >= 0
half[:, mx[ok]] = e[:, xs[ok]]
sk = skeletonize(cv2.dilate(half, np.ones((3, 3), np.uint8)) > 0); sk[:, AXIS:] = False

# 3. Follow the skeleton into chains (junction to junction), join chains that continue each other, smooth.
pts = set(zip(*[a.tolist() for a in np.nonzero(sk)]))
NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
nb = lambda p: [(p[0] + dy, p[1] + dx) for dy, dx in NB if (p[0] + dy, p[1] + dx) in pts]
deg = {p: len(nb(p)) for p in pts}
seen, chains = set(), []

def walk(a, b):
    ch = [a, b]; seen.add(frozenset((a, b)))
    while deg[ch[-1]] == 2:
        nx = [q for q in nb(ch[-1]) if q != ch[-2] and frozenset((ch[-1], q)) not in seen]
        if not nx: break
        seen.add(frozenset((ch[-1], nx[0]))); ch.append(nx[0])
    return ch

for p in pts:
    if deg[p] != 2:
        for q in nb(p):
            if frozenset((p, q)) not in seen: chains.append(walk(p, q))
for p in pts:                                        # closed loops
    if deg[p] == 2 and not any(frozenset((p, q)) in seen for q in nb(p)): chains.append(walk(p, nb(p)[0]))
chains = [np.array([(x, y) for y, x in c], np.float32) for c in chains if len(c) >= 3]
ends = lambda c: [(c[0], c[0] - c[min(6, len(c) - 1)]), (c[-1], c[-1] - c[-min(7, len(c))])]
for _ in range(6):                                   # join ends within 5 px that point at each other
    idx = defaultdict(list)
    for i, c in enumerate(chains):
        for k, (p, _) in enumerate(ends(c)): idx[(int(p[0] // 5), int(p[1] // 5))].append((i, k))
    used, merged, n0 = set(), [], len(chains)
    for i, c in enumerate(chains):
        if i in used: continue
        for k, (pa, da) in enumerate(ends(c)):
            hit = None
            for gx in (-1, 0, 1):
                for gy in (-1, 0, 1):
                    for j, kb in idx.get((int(pa[0] // 5) + gx, int(pa[1] // 5) + gy), []):
                        if j == i or j in used: continue
                        pb, db = ends(chains[j])[kb]
                        if np.linalg.norm(pa - pb) < 5 and np.dot(da, db) / (np.linalg.norm(da) * np.linalg.norm(db) + 1e-6) < -0.5:
                            hit = (j, kb)
            if hit:
                j, kb = hit
                merged.append(np.vstack([c if k == 1 else c[::-1], chains[j] if kb == 0 else chains[j][::-1]]))
                used.update((i, j)); break
        if i not in used: merged.append(c); used.add(i)
    chains = merged
    if len(chains) == n0: break

to_vb = lambda x, y: [(x + OFF - CROP) * S, (y + OFF - CROP) * S]
strokes = []
for a in chains:
    length = float(np.sum(np.linalg.norm(np.diff(a, axis=0), axis=1)))
    if length * S < MIN_LEN: continue
    if len(a) > 7:
        s = np.stack([gaussian_filter1d(a[:, 0], 3.5, mode='nearest'), gaussian_filter1d(a[:, 1], 3.5, mode='nearest')], 1)
        s[0], s[-1] = a[0], a[-1]
    else: s = a
    s = cv2.approxPolyDP(s.reshape(-1, 1, 2).astype(np.float32), 1.6, False).reshape(-1, 2)
    v = [to_vb(x, y) for x, y in s]
    strokes.append({'pts': v, 'len': length})
    if max(abs(x - AXIS) for x, _ in s) > 3:          # the mirror image, for the other half
        strokes.append({'pts': [[2 * ((AXIS + OFF - CROP) * S) - x, y] for x, y in v], 'len': length})

# 4. Stages. Frame lines are rectangles; strokes above the 62nd length percentile are main motifs.
VW, VH = (FW - 2 * CROP) * S, (FH - 2 * CROP) * S
rect = lambda m: [[m, m], [VW - m, m], [VW - m, VH - m], [m, VH - m], [m, m]]
paths = [{'stage': 1, 'pts': rect(3)}, {'stage': 2, 'pts': rect(12)}, {'stage': 2, 'pts': rect(20)}]
cut = np.percentile([s['len'] for s in strokes], 62)
for s in strokes:
    s2 = cv2.approxPolyDP(np.array(s['pts'], np.float32).reshape(-1, 1, 2), 1.0, False).reshape(-1, 2).tolist()
    paths.append({'stage': 3 if s['len'] >= cut else 4, 'pts': s2})

# 5. The three sunflowers, redrawn on the photo's flowers: petal outlines + domed centre (stage 3), petal midribs and
#    the dome's inner ring (stage 4). Traced strokes inside a flower are cut away, as stems pass behind it.
AXV = (AXIS + OFF - CROP) * S
FLOWERS = [(AXV, 159, 24, 100, 14, 'point'), (AXV + 403, 312.5, 25, 76, 12, 'round'), (AXV - 403, 312.5, 25, 76, 12, 'round')]

def outside(pts, cx, cy, r):
    segs, cur = [], []
    for x, y in pts:
        if math.hypot(x - cx, y - cy) < r:
            if len(cur) > 1: segs.append(cur)
            cur = []
        else: cur.append([x, y])
    if len(cur) > 1: segs.append(cur)
    return segs

kept = []
for p in paths:
    if p['stage'] < 3: kept.append(p); continue
    segs = [p['pts']]
    for cx, cy, _, R, _, _ in FLOWERS: segs = [q for sg in segs for q in outside(sg, cx, cy, R * 0.98)]
    kept += [{'stage': p['stage'], 'pts': q} for q in segs if sum(math.dist(q[i], q[i + 1]) for i in range(len(q) - 1)) >= MIN_LEN]
paths = kept
f2 = lambda p: f"{p[0]:.1f} {p[1]:.1f}"
for cx, cy, rd, R, n, shape in FLOWERS:
    pol = lambda r, t: (cx + r * math.sin(t), cy - r * math.cos(t))
    step = 2 * math.pi / n; w = step * (0.42 if shape == 'point' else 0.47)
    for k in range(n):
        t = k * step
        bl, br, tip = pol(rd + 1, t - w), pol(rd + 1, t + w), pol(R, t)
        if shape == 'point': c = [pol(R * 0.55, t - w * 1.15), pol(R * 0.86, t - w * 0.45), pol(R * 0.86, t + w * 0.45), pol(R * 0.55, t + w * 1.15)]
        else: c = [pol(R * 0.62, t - w * 1.25), pol(R * 1.02, t - w * 0.75), pol(R * 1.02, t + w * 0.75), pol(R * 0.62, t + w * 1.25)]
        paths.append({'stage': 3, 'd': f"M{f2(bl)} C{f2(c[0])} {f2(c[1])} {f2(tip)} C{f2(c[2])} {f2(c[3])} {f2(br)}", 'pts': [bl, br]})
        a, b = pol(rd + 5, t), pol(R * (0.78 if shape == 'point' else 0.7), t)
        paths.append({'stage': 4, 'd': f"M{f2(a)} L{f2(b)}", 'pts': [a, b]})
    for r, st in ((rd, 3), (rd * 0.6, 4)):
        a, b = pol(r, 0), pol(r, math.pi)
        paths.append({'stage': st, 'd': f"M{f2(a)} A{r:.1f} {r:.1f} 0 1 1 {f2(b)} A{r:.1f} {r:.1f} 0 1 1 {f2(a)}", 'pts': [a, a]})

# 6. Machine order within each stage: the nearest next start, reversing a traced stroke when its far end is nearer.
ordered, cur = [], np.array([0.0, 0.0])
for st in (1, 2, 3, 4):
    todo = [p for p in paths if p['stage'] == st]
    while todo:
        dist = lambda p: min(np.linalg.norm(np.array(p['pts'][0]) - cur), np.linalg.norm(np.array(p['pts'][-1]) - cur))
        p = todo.pop(min(range(len(todo)), key=lambda i: dist(todo[i])))
        if 'd' not in p and np.linalg.norm(np.array(p['pts'][-1]) - cur) < np.linalg.norm(np.array(p['pts'][0]) - cur): p['pts'] = p['pts'][::-1]
        ordered.append(p); cur = np.array(p['pts'][-1], float)
num = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
xy = lambda p: f"{num(p[0])} {num(p[1])}"

def curve(pts):
    # Catmull-Rom through the points, as cubic Beziers; straight runs (2 points, the frame rectangles' sides) stay lines.
    P = [np.array(q, float) for q in pts]
    if len(P) < 3 or (len(P) == 5 and np.allclose(P[0], P[-1])): return 'M' + ' L'.join(xy(q) for q in P)
    d = 'M' + xy(P[0])
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        d += f" C{xy(p1 + (p2 - p0) / 6)} {xy(p2 - (p3 - p1) / 6)} {xy(p2)}"
    return d

for p in ordered:
    if 'd' not in p: p['d'] = curve(p['pts'])
out = {'viewBox': f"0 0 {num(VW)} {num(VH)}", 'paths': [{'stage': p['stage'], 'd': p['d']} for p in ordered]}
(ROOT / 'src/data/cnc-paths.json').write_text(json.dumps(out, separators=(',', ':')), encoding='utf-8')
print('paths by stage', {s: sum(p['stage'] == s for p in ordered) for s in (1, 2, 3, 4)}, '| viewBox', out['viewBox'])

