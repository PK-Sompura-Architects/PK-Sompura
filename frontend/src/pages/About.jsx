import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import ScrollReveal from "../components/ScrollReveal";
import GalleryModal from "../components/GalleryModal";
import { STATUS, CATEGORY, ALL } from "../components/projectVocab";
import "./About.css";
import { API_URL } from "../apiBase";

// Shares the boundary data with the dashboard preview, so it is fetched once.
const IndiaMap = lazy(() => import("../components/IndiaMap"));

/**
 * Across India — the project map's own page.
 *
 * This route used to be "The Lineage": a grid of family photographs. The
 * family asked for their photographs off the site, so the page is the map
 * instead. The lineage table, its API and its admin screen are all still
 * there and untouched -- nothing renders them, which is the point, and the
 * decision stays reversible.
 */
export default function About() {
    const [result, setResult] = useState({ projects: null, error: false });
    const [selectedProject, setSelectedProject] = useState(null);
    const [filters, setFilters] = useState({ state: ALL, status: ALL, category: ALL });

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/api/projects/`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setResult({ projects: data.projects || [], error: false }))
            .catch((err) => {
                if (err.name === "AbortError") return;
                setResult({ projects: [], error: true });
            });
        return () => controller.abort();
    }, []);

    const all = useMemo(() => result.projects ?? [], [result.projects]);

    const states = useMemo(
        () => [...new Set(all.map((p) => p.state).filter(Boolean))].sort(),
        [all]
    );

    const visible = useMemo(() => all.filter((p) => (
        (filters.state === ALL || p.state === filters.state) &&
        (filters.status === ALL || (p.status || "completed") === filters.status) &&
        (filters.category === ALL || p.category === filters.category)
    )), [all, filters]);

    // Grouped from the page's own list, which is every project. The map only
    // ever receives the ones that already have coordinates, so this list is the
    // only place an unplaced project is visible at all.
    const byState = useMemo(() => {
        const groups = new Map();
        for (const p of visible) {
            const key = p.state || p.city || 'Location not recorded';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(p);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [visible]);

    const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
    const isFiltered = visible.length !== all.length;

    return (
        <div className="about-page">
            <header className="about-header">
                <ScrollReveal>
                    <span className="eyebrow">Across India</span>
                </ScrollReveal>
                <ScrollReveal delay={80}>
                    <h1>Where the work stands</h1>
                </ScrollReveal>
                <ScrollReveal delay={160}>
                    <p className="about-intro">
                        Three generations of temple building, from the workshops of
                        Palitana to sites across the country.
                    </p>
                </ScrollReveal>
            </header>

            {all.length > 1 && (
                <div className="projects-filters">
                    {states.length > 1 && (
                        <label>
                            <span>State</span>
                            <select value={filters.state} onChange={set("state")}>
                                <option value={ALL}>All states</option>
                                {states.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                    )}
                    <label>
                        <span>Type</span>
                        <select value={filters.category} onChange={set("category")}>
                            <option value={ALL}>All types</option>
                            {Object.entries(CATEGORY).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Status</span>
                        <select value={filters.status} onChange={set("status")}>
                            <option value={ALL}>All statuses</option>
                            {Object.entries(STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </label>
                    {isFiltered && (
                        <button
                            type="button"
                            className="projects-filters-clear"
                            onClick={() => setFilters({ state: ALL, status: ALL, category: ALL })}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {result.error ? (
                <p className="about-state">
                    Could not load the project map. Please try again shortly.
                </p>
            ) : (
                <Suspense fallback={null}>
                    <IndiaMap
                        filters={filters}
                        matchingTotal={visible.length}
                        onOpenGallery={(id) => {
                            const match = all.find((p) => p.id === id);
                            if (match) setSelectedProject(match);
                        }}
                    />
                </Suspense>
            )}

            <section className="about-list" aria-labelledby="about-list-heading">
                <h2 id="about-list-heading">All projects</h2>
                {result.projects === null ? (
                    <p className="about-state">Loading the projects…</p>
                ) : byState.length === 0 ? (
                    <p className="about-state">No projects match these filters.</p>
                ) : byState.map(([groupName, items]) => (
                    <div key={groupName}>
                        <h3>{groupName}</h3>
                        <ul>
                            {items.map((p) => (
                                <li key={p.id}>
                                    {p.images?.length ? (
                                        <button type="button" onClick={() => setSelectedProject(p)}>
                                            {p.name}
                                        </button>
                                    ) : <span className="about-list-name">{p.name}</span>}
                                    {p.city && p.city !== groupName && <>, {p.city}</>}
                                    {' — '}
                                    {(STATUS[p.status] || STATUS.completed).label}
                                    {CATEGORY[p.category] && <>, {CATEGORY[p.category].label.toLowerCase()}</>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <GalleryModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                title={selectedProject?.name}
                subtitle={[selectedProject?.city, selectedProject?.year,
                           selectedProject?.stone_type]
                    .filter(Boolean).join(" • ")}
                images={selectedProject?.images}
            />
        </div>
    );
}
