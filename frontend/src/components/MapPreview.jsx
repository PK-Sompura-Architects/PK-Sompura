import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VIEWBOX, OUTLINE, project } from './indiaOutline';
import './MapPreview.css';
import { API_URL } from '../apiBase';

/**
 * Compact, non-interactive version of the India map for the dashboard.
 *
 * Deliberately not the real map: no filters, no panel, no clustering, no
 * per-marker interaction. It is a credibility glance that links through to
 * /projects, and a second copy of the interactive behaviour here would be two
 * implementations of the same thing to keep in step.
 *
 * It shares `indiaOutline` with IndiaMap, so the boundary data is bundled once
 * and served from a chunk both routes reuse.
 */
export default function MapPreview() {
    const [rows, setRows] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/api/projects/map`, { signal: controller.signal })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
            .then((data) => setRows(data.projects || []))
            .catch((err) => {
                if (err.name !== 'AbortError') setRows([]);
            });
        return () => controller.abort();
    }, []);

    const dots = useMemo(() => (rows ?? [])
        .filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number')
        .map((r) => ({ id: r.id, ...project(r.lng, r.lat) })), [rows]);

    const stateCount = useMemo(
        () => new Set((rows ?? []).map((r) => r.state).filter(Boolean)).size,
        [rows]
    );

    // Nothing placed yet, or the request failed. Either way an empty outline of
    // India on the dashboard would say less than leaving the section out.
    if (!rows || dots.length === 0) return null;

    return (
        <section className="mprev" aria-labelledby="mprev-heading">
            <div className="mprev-copy">
                <span className="eyebrow">Across India</span>
                <h2 id="mprev-heading">
                    {dots.length} {dots.length === 1 ? 'temple' : 'temples'}
                    {stateCount > 0 && <> in {stateCount} {stateCount === 1 ? 'state' : 'states'}</>}
                </h2>
                <p>
                    Three generations of work, from Palitana across the country.
                </p>
                <Link className="mprev-link" to="/projects">
                    Explore the map
                    <span className="mprev-link-icon" aria-hidden="true">→</span>
                </Link>
            </div>

            <div className="mprev-map">
                <svg
                    viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
                    role="img"
                    aria-label={`Outline map of India with ${dots.length} temple locations marked. The full, interactive map is on the projects page.`}
                >
                    {OUTLINE.map((d, i) => (
                        <path key={i} className="mprev-land" d={d} />
                    ))}
                    {dots.map((dot) => (
                        <circle key={dot.id} className="mprev-dot" cx={dot.x} cy={dot.y} r="9" />
                    ))}
                </svg>
            </div>
        </section>
    );
}
