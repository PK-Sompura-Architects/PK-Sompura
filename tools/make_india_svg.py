"""Turn an India boundary GeoJSON into the SVG path data the map component uses.

Source: datameet/maps `Country/india-composite.geojson`. "Composite" is the
Survey of India depiction, which is the whole reason for using it — it includes
Jammu & Kashmir and Ladakh in full. Its northern extent reaches 37.1 N; a
boundary that stops near 34 N is a different depiction and must not be
substituted here.

The raw file is 10 MB and 252k points, so it is simplified with
Ramer-Douglas-Peucker and projected to SVG user units once, at build time. The
result is committed as a small JS module: the browser never sees the GeoJSON,
and there is no projection maths or map library at runtime.

Run:
    backend/venv/Scripts/python.exe tools/make_india_svg.py <path-to-geojson>
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "src" / "components" / "indiaOutline.js"

# SVG user-unit width. Height follows from the aspect ratio below, so the
# component's viewBox and the marker projection agree by construction.
WIDTH = 1000

# Douglas-Peucker tolerance in degrees. 0.02 deg is roughly 2 km, which is
# invisible at this size and cuts the point count by ~99%.
TOLERANCE = 0.02

# Drop islands and slivers below this area in square degrees. Keeps the
# mainland plus the substantial island groups, discards single-pixel specks
# that cost bytes and render as dirt.
MIN_RING_AREA = 0.05


def rdp(points, epsilon):
    """Ramer-Douglas-Peucker, iterative so a 100k-point ring cannot blow the
    recursion limit."""
    if len(points) < 3:
        return points

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]

    while stack:
        start, end = stack.pop()
        ax, ay = points[start]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)

        worst, worst_i = -1.0, None
        for i in range(start + 1, end):
            px, py = points[i]
            if norm == 0:
                dist = math.hypot(px - ax, py - ay)
            else:
                # Perpendicular distance from the point to the segment.
                dist = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if dist > worst:
                worst, worst_i = dist, i

        if worst_i is not None and worst > epsilon:
            keep[worst_i] = True
            stack.append((start, worst_i))
            stack.append((worst_i, end))

    return [p for p, k in zip(points, keep) if k]


def ring_area(points):
    """Absolute shoelace area, used only to decide what is too small to keep."""
    total = 0.0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2


def iter_rings(geometry):
    """Yield each outer ring. Holes are ignored: at this scale they would be
    sub-pixel, and the fill is a flat colour, so nothing is lost visually."""
    kind = geometry["type"]
    if kind == "Polygon":
        yield geometry["coordinates"][0]
    elif kind == "MultiPolygon":
        for polygon in geometry["coordinates"]:
            yield polygon[0]
    else:
        raise ValueError(f"unexpected geometry type {kind!r}")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    if not source.exists():
        sys.exit(f"Not found: {source}")

    data = json.loads(source.read_text(encoding="utf-8"))

    rings, raw_points = [], 0
    for feature in data["features"]:
        for ring in iter_rings(feature["geometry"]):
            raw_points += len(ring)
            simplified = rdp([(x, y) for x, y, *_ in ring], TOLERANCE)
            if len(simplified) >= 4 and ring_area(simplified) >= MIN_RING_AREA:
                rings.append(simplified)

    if not rings:
        sys.exit("No rings survived simplification -- check TOLERANCE and MIN_RING_AREA.")

    lons = [x for ring in rings for x, _ in ring]
    lats = [y for ring in rings for _, y in ring]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)

    if max_lat < 36:
        sys.exit(
            f"Northern extent is only {max_lat:.2f} N. The Survey of India depiction "
            "reaches about 37.1 N -- this looks like a boundary with Jammu & Kashmir "
            "or Ladakh removed. Refusing to generate it."
        )

    # Equirectangular, with longitude degrees narrowed by cos(mid-latitude) so
    # the country is not stretched sideways. Good enough for a static national
    # map; it is not a projection for measuring distance.
    mid_lat = (min_lat + max_lat) / 2
    lon_scale = math.cos(math.radians(mid_lat))
    span_x = (max_lon - min_lon) * lon_scale
    span_y = max_lat - min_lat
    height = round(WIDTH * span_y / span_x, 2)

    def project(lon, lat):
        x = (lon - min_lon) * lon_scale / span_x * WIDTH
        # SVG y grows downward; latitude grows upward.
        y = (max_lat - lat) / span_y * height
        return round(x, 1), round(y, 1)

    paths = []
    for ring in rings:
        pts = [project(lon, lat) for lon, lat in ring]
        head = f"M{pts[0][0]} {pts[0][1]}"
        tail = "".join(f"L{x} {y}" for x, y in pts[1:])
        paths.append(head + tail + "Z")

    kept = sum(len(r) for r in rings)
    body = f'''// GENERATED by tools/make_india_svg.py -- do not edit by hand.
//
// Source: datameet/maps Country/india-composite.geojson, the Survey of India
// composite depiction, which includes Jammu & Kashmir and Ladakh in full. The
// generator refuses to run on a boundary whose northern extent falls short of
// 36 N, so this cannot silently be regenerated from a different depiction.
//
// {raw_points} source points simplified to {kept} at a {TOLERANCE} degree tolerance.

export const VIEWBOX = {{ width: {WIDTH}, height: {height} }};

// The geographic window the path was projected into. project() below must use
// exactly these numbers or the markers will not sit on the coastline.
export const BOUNDS = {{
    minLon: {min_lon:.4f},
    maxLon: {max_lon:.4f},
    minLat: {min_lat:.4f},
    maxLat: {max_lat:.4f},
    lonScale: {lon_scale:.6f},
}};

export const OUTLINE = [
{chr(10).join(f'    "{p}",' for p in paths)}
];

/**
 * Longitude/latitude to SVG user units, matching the projection baked into
 * OUTLINE above. Equirectangular with longitude narrowed by cos(mid-latitude).
 */
export function project(lon, lat) {{
    const spanX = (BOUNDS.maxLon - BOUNDS.minLon) * BOUNDS.lonScale;
    const spanY = BOUNDS.maxLat - BOUNDS.minLat;
    return {{
        x: ((lon - BOUNDS.minLon) * BOUNDS.lonScale / spanX) * VIEWBOX.width,
        y: ((BOUNDS.maxLat - lat) / spanY) * VIEWBOX.height,
    }};
}}
'''
    OUT.write_text(body, encoding="utf-8")
    size = OUT.stat().st_size
    print(f"{OUT.relative_to(ROOT)}")
    print(f"  rings kept      {len(rings)}")
    print(f"  points          {raw_points} -> {kept}")
    print(f"  lon/lat window  {min_lon:.2f}..{max_lon:.2f} / {min_lat:.2f}..{max_lat:.2f}")
    print(f"  viewBox         {WIDTH} x {height}")
    print(f"  file size       {size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
