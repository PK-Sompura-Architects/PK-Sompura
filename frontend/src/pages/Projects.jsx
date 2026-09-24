import { useState, useEffect, useMemo } from 'react';
import MagicBento from '../components/MagicBento';
import GalleryModal from '../components/GalleryModal';
import { STATUS, CATEGORY, ALL } from '../components/projectVocab';
import './Projects.css';
import { API_URL } from "../apiBase";

// The map lives on /about ("Across India") rather than here, so it has one
// home instead of two copies to keep in step.

export default function Projects() {
    // One object, so `loading` is derived rather than set from inside the
    // effect -- a null `projects` means the fetch has not landed yet.
    const [result, setResult] = useState({ projects: null, error: false });
    const [selectedProject, setSelectedProject] = useState(null);

    // One filter bar drives the map and the grid. Two separate bars on the same
    // page would let them disagree about what the visitor asked for.
    const [filters, setFilters] = useState({ state: ALL, status: ALL, category: ALL });

    const loading = result.projects === null;
    const { projects, error } = result;

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_URL}/api/projects/`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => setResult({ projects: data.projects || [], error: false }))
            .catch(err => {
                if (err.name === 'AbortError') return;
                setResult({ projects: [], error: true });
            });

        return () => controller.abort();
    }, []);

    // `projects` is null until the fetch lands, and this runs on that first
    // render too.
    // `?? []` inline would be a new array each render, recomputing every memo
    // below it.
    const all = useMemo(() => projects ?? [], [projects]);

    const states = useMemo(
        () => [...new Set(all.map(p => p.state).filter(Boolean))].sort(),
        [all]
    );

    const visible = useMemo(() => all.filter(p => (
        (filters.state === ALL || p.state === filters.state) &&
        (filters.status === ALL || (p.status || 'completed') === filters.status) &&
        (filters.category === ALL || p.category === filters.category)
    )), [all, filters]);

    const bentoItems = visible.map(p => ({
        id: p.id,
        title: p.name,
        description: [p.city, p.state].filter(Boolean).join(' • '),
        label: p.year,
        image: p.cover_image || '/placeholder-gold.jpg',
        rawData: p,
    }));

    const set = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));
    const filtered = visible.length !== all.length;

    return (
        <div className="projects-page">
            <header className="projects-header">
                <span className="eyebrow">Portfolio</span>
                <h1>Sacred Monuments</h1>
                <div className="accent-line" style={{ margin: 'var(--space-sm) auto' }} />
            </header>

            {/* Only worth showing once there is something to filter. A bar with
                one option in each select is furniture. */}
            {!loading && !error && all.length > 1 && (
                <div className="projects-filters">
                    {states.length > 1 && (
                        <label>
                            <span>State</span>
                            <select value={filters.state} onChange={set('state')}>
                                <option value={ALL}>All states</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                    )}
                    <label>
                        <span>Type</span>
                        <select value={filters.category} onChange={set('category')}>
                            <option value={ALL}>All types</option>
                            {Object.entries(CATEGORY).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Status</span>
                        <select value={filters.status} onChange={set('status')}>
                            <option value={ALL}>All statuses</option>
                            {Object.entries(STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </label>
                    {filtered && (
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


            {loading ? (
                <p className="projects-state">Loading archives…</p>
            ) : error ? (
                <p className="projects-state">
                    Could not load the archive. Please try again shortly.
                </p>
            ) : all.length === 0 ? (
                <p className="projects-state">No projects yet.</p>
            ) : visible.length === 0 ? (
                <p className="projects-state">No projects match these filters.</p>
            ) : (
                <div className="projects-grid-wrap">
                    <MagicBento
                        items={bentoItems}
                        glowColor="144, 200, 216"
                        enableTilt={true}
                        onCardClick={(item) => setSelectedProject(item.rawData)}
                    />
                </div>
            )}

            <GalleryModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                title={selectedProject?.name}
                subtitle={[selectedProject?.city, selectedProject?.year,
                           selectedProject?.stone_type]
                    .filter(Boolean).join(' • ')}
                images={selectedProject?.images}
            />
        </div>
    );
}
