import { useState, useEffect } from 'react';
import MagicBento from '../components/MagicBento';
import GalleryModal from '../components/GalleryModal';
import './Projects.css';
import { API_URL } from "../apiBase";


export default function Projects() {
    // One object, so `loading` is derived rather than set from inside the
    // effect -- a null `projects` means the fetch has not landed yet.
    const [result, setResult] = useState({ projects: null, error: false });
    const [selectedProject, setSelectedProject] = useState(null);

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
    const bentoItems = (projects ?? []).map(p => ({
        id: p.id,
        title: p.name,
        description: [p.city, p.state].filter(Boolean).join(' • '),
        label: p.year,
        image: p.cover_image || '/placeholder-gold.jpg',
        rawData: p,
    }));

    return (
        <div className="projects-page">
            <header className="projects-header">
                <span className="eyebrow">Portfolio</span>
                <h1>Sacred Monuments</h1>
                <div className="accent-line" style={{ margin: 'var(--space-sm) auto' }} />
            </header>

            {loading ? (
                <p className="projects-state">Loading archives…</p>
            ) : error ? (
                <p className="projects-state">
                    Could not load the archive. Please try again shortly.
                </p>
            ) : projects.length === 0 ? (
                <p className="projects-state">No projects yet.</p>
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
                subtitle={[selectedProject?.city, selectedProject?.year]
                    .filter(Boolean).join(' • ')}
                images={selectedProject?.images}
            />
        </div>
    );
}
