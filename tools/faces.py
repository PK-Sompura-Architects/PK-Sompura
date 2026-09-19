"""Find faces in the member photos so each headshot can be framed the same way."""
import sys
from pathlib import Path

import cv2
import numpy as np

MODEL = Path(__file__).parent / "models" / "face_detection_yunet.onnx"


def detect(path, score=0.6, max_side=1600):
    img = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return [], None
    h, w = img.shape[:2]
    # YuNet is happier on a moderate input size; scale back up afterwards.
    scale = min(1.0, max_side / max(h, w))
    small = cv2.resize(img, (round(w * scale), round(h * scale))) if scale < 1 else img
    sh, sw = small.shape[:2]
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (sw, sh), score, 0.3, 5000)
    det.setInputSize((sw, sh))
    _, faces = det.detect(small)
    out = []
    for f in (faces if faces is not None else []):
        x, y, fw, fh = [v / scale for v in f[:4]]
        out.append({"x": x, "y": y, "w": fw, "h": fh, "score": float(f[-1])})
    out.sort(key=lambda d: -d["w"] * d["h"])
    return out, (w, h)


if __name__ == "__main__":
    for p in sorted(Path(sys.argv[1]).glob("*.jpg"), key=lambda q: int(q.stem)):
        faces, size = detect(p)
        print(f"{p.name:8} {size[0]}x{size[1]}  faces={len(faces)}")
        for i, f in enumerate(faces):
            frac = f["h"] / size[1]
            print(f"    #{i} at ({f['x']:.0f},{f['y']:.0f}) {f['w']:.0f}x{f['h']:.0f}"
                  f"  face={frac:.1%} of height  score={f['score']:.2f}")
