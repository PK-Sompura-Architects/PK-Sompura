import { useState, useEffect } from 'react';
import MagicBento from '../components/MagicBento';
import GalleryModal from '../components/GalleryModal';
import { useLanguage } from '../context/LanguageContext';
import './Projects.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function Projects() {
    const { language } = useLanguage();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        // The API resolves translations server-side, so switching language
        // refetches rather than shipping all three up front.
        const controller = new AbortController();
        setLoading(true);
        setError(false);

        fetch(`${API_URL}/api/projects/?lang=${language}`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setProjects(data.projects || []);
                setLoading(false);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                setError(true);
                setLoading(false);
            });

        return () => controller.abort();
    }, [language]);

    const bentoItems = projects.map(p => ({
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
                <div className="gold-line" style={{ margin: 'var(--space-sm) auto' }} />
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
                        glowColor="245, 158, 11"
                        enableTilt={true}
                        enableStars={true}
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
