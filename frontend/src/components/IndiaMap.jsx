import { useEffect, useMemo, useRef, useState } from 'react';
import { VIEWBOX, OUTLINE, project } from './indiaOutline';
import { STATUS, CATEGORY, ALL } from './projectVocab';
import './IndiaMap.css';
import { API_URL } from '../apiBase';

/**
 * Static SVG map of India with a marker per temple.
 *
 * Deliberately not Leaflet or Mapbox. Every Awwwards-winning map experience we
 * fingerprinted is hand-drawn SVG rather than a tile map, and drawing our own
 * boundary is the only way to guarantee the Survey of India depiction — with
 * Jammu & Kashmir and Ladakh — instead of re-auditing a tile provider on every
 * deploy. It is also lighter, works offline, themes with our own tokens, and
 * gives keyboard access for free because each marker is a real DOM node.
 */

// How far apart two markers must be on screen before they stay separate: the
// 30px marker plus the 8px minimum gap WCAG asks for between adjacent targets.
//
// The threshold has to be in PIXELS and converted using the map's rendered
// scale, not fixed in SVG units. A fixed SVG threshold means the same
// geographic distance is comfortable on a wide screen and overlapping on a
// narrow one -- at 300px wide, India spans 3000km in 300px, so two temples
// 140km apart are 14px apart and their targets collide.
//
// This replaces an earlier attempt that fanned overlapping markers apart.
// That could not work: separating two targets far enough on a narrow map
// meant moving a marker more than 100km from where the temple actually is.
// Clustering is the honest answer -- at this scale three temples around
// Palitana really are in one place, and the cluster panel lists them.
const MARKER_PX = 30;
const MIN_GAP_PX = 8;

function cluster(markers, unitsPerPx) {
    const radius = (MARKER_PX + MIN_GAP_PX) * unitsPerPx;
    const clusters = [];
    for (const m of markers) {
        const near = clusters.find(
            (c) => Math.hypot(c.x - m.x, c.y - m.y) < radius
        );
        if (near) {
            near.items.push(m);
            // Sit the marker at the centroid of what it represents.
            near.x = near.items.reduce((sum, i) => sum + i.x, 0) / near.items.length;
            near.y = near.items.reduce((sum, i) => sum + i.y, 0) / near.items.length;
        } else {
            clusters.push({ x: m.x, y: m.y, items: [m] });
        }
    }
    return clusters;
}

function Marker({ group, selectedId, onSelect }) {
    const many = group.items.length > 1;
    const lead = group.items[0];
    const status = STATUS[lead.status] || STATUS.completed;
    const holdsSelection = group.items.some((i) => i.id === selectedId);

    // A cluster can span a couple of hundred kilometres at this map scale, so
    // naming it after the first project's city would be wrong. Only use a city
    // when every project in the group shares it.
    const cities = new Set(group.items.map((i) => i.city).filter(Boolean));
    const states = new Set(group.items.map((i) => i.state).filter(Boolean));
    const where = cities.size === 1 ? [...cities][0]
        : states.size === 1 ? [...states][0]
        : 'this area';

    const label = many
        ? `${group.items.length} projects in ${where}: ` +
          group.items.map((i) => i.name).join(', ')
        : `${[lead.name, lead.city].filter(Boolean).join(', ')}. ${status.label}. ` +
          `${CATEGORY[lead.category]?.label || 'Temple'}.`;

    return (
        <button
            type="button"
            className={
                `imap-marker ${many ? 'is-cluster' : status.className}` +
                `${!many && lead.category === 'mountain' ? ' is-mountain' : ''}` +
                `${holdsSelection ? ' is-selected' : ''}`
            }
            style={{ left: `${group.xPct}%`, top: `${group.yPct}%` }}
            title={many ? `${group.items.length} projects — ${group.items.map((i) => i.name).join(', ')}` : label}
            aria-label={label}
            onClick={() => onSelect(group)}
        >
            {many
                ? <span className="imap-marker-count">{group.items.length}</span>
                : <span className="imap-marker-dot" aria-hidden="true" />}
        </button>
    );
}

export default function IndiaMap({ onOpenGallery, filters, matchingTotal }) {
    const [state, setState] = useState({ rows: null, error: false });
    const [selected, setSelected] = useState(null);
    const panelRef = useRef(null);
    const plotRef = useRef(null);
    // The rendered width drives the cluster threshold, so it has to be
    // measured rather than assumed, and re-measured when the map resizes.
    const [plotWidth, setPlotWidth] = useState(0);

    useEffect(() => {
        const el = plotRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setPlotWidth(entry.contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
        // `state.rows`, not the derived `rows`: this effect is declared above
        // that binding, and naming it here is a temporal-dead-zone crash.
        // The plot only exists once rows have loaded, which is what we need.
    }, [state.rows]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/api/projects/map`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setState({ rows: data.projects || [], error: false }))
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setState({ rows: [], error: true });
            });
        return () => controller.abort();
    }, []);

    // `?? []` would build a new array every render, so every useMemo below it
    // would recompute on every render and defeat the point of memoising.
    const rows = useMemo(() => state.rows ?? [], [state.rows]);

    const visible = useMemo(() => rows.filter((r) => (
        (filters.state === ALL || r.state === filters.state) &&
        (filters.status === ALL || (r.status || 'completed') === filters.status) &&
        (filters.category === ALL || r.category === filters.category)
    )), [rows, filters]);

    const groups = useMemo(() => cluster(
        visible
            .filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number')
            .map((r) => ({ ...r, ...project(r.lng, r.lat) })),
        // Before the first measurement, assume a narrow map and cluster more
        // rather than less: a merged marker is usable, an overlapping one is not.
        plotWidth > 0 ? VIEWBOX.width / plotWidth : VIEWBOX.width / 320
    ).map((g) => ({
        // Percentages rather than SVG units, because the markers are HTML
        // layered over the SVG. Sizing a marker in SVG units made it shrink
        // with the map: a 28-unit hit area rendered as 13px, under the 24px
        // target-size minimum.
        ...g,
        xPct: (g.x / VIEWBOX.width) * 100,
        yPct: (g.y / VIEWBOX.height) * 100,
    })), [visible, plotWidth]);

    const placedCount = groups.reduce((n, g) => n + g.items.length, 0);

    // A filter change can remove whatever is open. Derive the live selection
    // instead of clearing it from an effect: setting state synchronously in an
    // effect cascades an extra render, and this needs no state at all.
    const visibleIds = useMemo(() => new Set(visible.map((r) => r.id)), [visible]);
    const active = !selected ? null
        : active.items
            ? (active.items.some((i) => visibleIds.has(i.id)) ? selected : null)
            : (visibleIds.has(selected.id) ? selected : null);

    // Derived, never hardcoded.
    const stateCount = useMemo(
        () => new Set(visible.map((r) => r.state).filter(Boolean)).size,
        [visible]
    );

    // Grouped by state for the fallback list. This is real content, not a
    // progressive enhancement: it is what a screen reader, a crawler and a
    // visitor without JavaScript get, so it is never hidden behind animation.
    // Escape closes the panel. Registered only while something is open, so it
    // never competes with the gallery modal's own handler.
    useEffect(() => {
        if (!active) return;
        const onKeyDown = (e) => { if (e.key === 'Escape') setSelected(null); };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [active]);

    // Below 860px the panel is a bottom sheet over the page, so the page
    // behind it must not scroll. Two things are needed and neither is
    // sufficient alone: the lock goes on <html> (never <body>, whose
    // `overflow-x: clip` computes to `hidden` once the other axis is set, which
    // once made the whole site unscrollable), and `data-lenis-prevent` on the
    // sheet, because Lenis scrolls programmatically and `overflow: hidden`
    // does not stop it.
    useEffect(() => {
        if (!active) return;
        if (!window.matchMedia('(max-width: 860px)').matches) return;
        const root = document.documentElement;
        const previous = root.style.overflow;
        root.style.overflow = 'hidden';
        return () => { root.style.overflow = previous; };
    }, [active]);

    const byState = useMemo(() => {
        const groups = new Map();
        for (const r of visible) {
            const key = r.state || 'State not recorded';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(r);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [visible]);

    if (state.rows === null) {
        return <p className="imap-state">Loading the map…</p>;
    }
    if (state.error) {
        return <p className="imap-state">Could not load the project map. Please try again shortly.</p>;
    }
    if (rows.length === 0) {
        return null; // Nothing placed yet; an empty map of India says nothing.
    }

    return (
        <section className="imap" aria-labelledby="imap-heading">
            <header className="imap-header">
                <span className="eyebrow">Across India</span>
                <h2 id="imap-heading">
                    {visible.length} {visible.length === 1 ? 'temple' : 'temples'}
                    {stateCount > 0 && <> across {stateCount} {stateCount === 1 ? 'state' : 'states'}</>}
                </h2>
                {/* Counted against the page's full filtered list, not this
                    endpoint's rows: the map endpoint only returns projects that
                    already have coordinates, so comparing within it can never
                    find a missing one. */}
                {typeof matchingTotal === 'number' && matchingTotal > placedCount && (
                    <p className="imap-note">
                        {matchingTotal - placedCount} more {matchingTotal - placedCount === 1 ? 'project has' : 'projects have'} no
                        coordinates recorded yet, so {matchingTotal - placedCount === 1 ? 'it is' : 'they are'} counted
                        but not placed. The full list is on the projects page.
                    </p>
                )}
            </header>

            <div className={`imap-body${active ? ' has-panel' : ''}`}>
                <div className="imap-canvas">
                    <div className="imap-plot" ref={plotRef}>
                        <svg
                            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
                            role="img"
                            aria-label={`Map of India showing ${placedCount} temple locations. The same locations are listed in text below the map.`}
                        >
                            {OUTLINE.map((d, i) => (
                                <path key={i} className="imap-land" d={d} />
                            ))}
                        </svg>
                        {groups.map((g) => (
                            <Marker
                                key={g.items.map((i) => i.id).join('-')}
                                group={g}
                                selectedId={active?.id}
                                onSelect={(picked) => setSelected(
                                    picked.items.length === 1 ? picked.items[0] : picked
                                )}
                            />
                        ))}
                    </div>

                    <ul className="imap-legend">
                        {Object.entries(STATUS).map(([k, v]) => (
                            <li key={k}>
                                <span className={`imap-swatch ${v.className}`} aria-hidden="true" />
                                {v.label}
                            </li>
                        ))}
                        <li><span className="imap-swatch is-shape-circle" aria-hidden="true" />Stone temple</li>
                        <li><span className="imap-swatch is-shape-triangle" aria-hidden="true" />Artificial mountain</li>
                    </ul>
                </div>

                {/* Below 860px the panel is a bottom sheet, and the page behind
                    it must not scroll. `html { overflow: hidden }` alone does
                    not achieve that: Lenis intercepts the wheel and scrolls
                    programmatically, which overflow does not stop. Measured --
                    with the lock on and no backdrop, a real wheel event still
                    moved the page 521px to 1990px.

                    This backdrop carries `data-lenis-prevent`, so a wheel over
                    the background is ignored by Lenis and then blocked by the
                    overflow lock. It is the same arrangement GalleryModal uses,
                    and it doubles as tap-outside-to-close. */}
                {active && (
                    <div
                        className="imap-backdrop"
                        onClick={() => setSelected(null)}
                        data-lenis-prevent
                        aria-hidden="true"
                    />
                )}

                {active && (active.items ? (
                    /* A cluster: list what is here and let the visitor pick
                       one, rather than guessing which of them they meant. */
                    <aside
                        className="imap-panel"
                        role="dialog"
                        aria-modal="false"
                        aria-label={`${active.items.length} projects at this location`}
                        data-lenis-prevent
                    >
                        <button
                            className="imap-panel-close"
                            onClick={() => setSelected(null)}
                            aria-label="Close project list"
                        >
                            ×
                        </button>
                        <h3>{active.items.length} projects here</h3>
                        <p className="imap-panel-where">
                            {(() => {
                                const cities = new Set(active.items.map((i) => i.city).filter(Boolean));
                                const states = new Set(active.items.map((i) => i.state).filter(Boolean));
                                if (cities.size === 1) {
                                    return [...cities][0] + (states.size === 1 ? `, ${[...states][0]}` : '');
                                }
                                return states.size === 1 ? [...states][0] : 'Several locations';
                            })()}
                        </p>
                        <ul className="imap-panel-list">
                            {active.items.map((item) => (
                                <li key={item.id}>
                                    <button onClick={() => setSelected(item)}>
                                        <strong>{item.name}</strong>
                                        <span>
                                            {(STATUS[item.status] || STATUS.completed).label}
                                            {CATEGORY[item.category] && ` · ${CATEGORY[item.category].label}`}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>
                ) : (
                    <aside
                        className="imap-panel"
                        ref={panelRef}
                        role="dialog"
                        aria-modal="false"
                        aria-label={active.name}
                        data-lenis-prevent
                    >
                        <button
                            className="imap-panel-close"
                            onClick={() => setSelected(null)}
                            aria-label="Close project details"
                        >
                            ×
                        </button>
                        <h3>{active.name}</h3>
                        <p className="imap-panel-where">
                            {[active.city, active.state].filter(Boolean).join(', ') || 'Location not recorded'}
                        </p>
                        <dl className="imap-panel-meta">
                            <dt>Type</dt>
                            <dd>{CATEGORY[active.category]?.label || 'Not recorded'}</dd>
                            <dt>Status</dt>
                            <dd>{(STATUS[active.status] || STATUS.completed).label}</dd>
                            {active.stone_type && <><dt>Stone</dt><dd>{active.stone_type}</dd></>}
                        </dl>
                        {active.cover_image && (
                            <img
                                className="imap-panel-image"
                                src={active.cover_image}
                                alt={`${active.name} temple`}
                                loading="lazy"
                                decoding="async"
                            />
                        )}
                        {/* Several projects have no usable photographs and exist
                            to be counted. Offering a gallery that opens empty is
                            worse than not offering one. */}
                        {active.cover_image ? (
                            <button
                                className="imap-panel-cta"
                                onClick={() => onOpenGallery?.(active.id)}
                            >
                                View gallery
                            </button>
                        ) : (
                            <p className="imap-panel-note">No photographs on record for this project yet.</p>
                        )}
                    </aside>
                ))}
            </div>

            <div className="imap-fallback">
                <h3>All locations</h3>
                {byState.length === 0 ? (
                    <p className="imap-state">No projects match these filters.</p>
                ) : byState.map(([stateName, items]) => (
                    <div key={stateName}>
                        <h4>{stateName}</h4>
                        <ul>
                            {items.map((r) => (
                                <li key={r.id}>
                                    {r.name}
                                    {r.city && <>, {r.city}</>}
                                    {' — '}
                                    {(STATUS[r.status] || STATUS.completed).label}
                                    {CATEGORY[r.category] && <>, {CATEGORY[r.category].label.toLowerCase()}</>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
