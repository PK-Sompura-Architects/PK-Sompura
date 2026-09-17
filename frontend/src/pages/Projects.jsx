import React, { useState, useEffect } from 'react';
import MagicBento from '../components/MagicBento';
import GalleryModal from '../components/GalleryModal';
import './Projects.css'; // Keep your page header styles

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        fetch(`${API_URL}/projects/`)
            .then(res => res.json())
            .then(data => {
                setProjects(data.projects || []);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching projects:", err));
    }, []);

    // Transform backend data to fit MagicBento's expected prop structure
    const bentoItems = projects.map(p => ({
        id: p.id,
        title: p.name,
        description: [p.city, p.trust_name].filter(Boolean).join(" • "),
        label: p.status, // "Completed" or "Ongoing" will render in the top right
        image: p.main_image || '/placeholder-gold.jpg',
        rawData: p // Pass the raw data so we can give the modal the other_images array
    }));

    return (
        <div className="projects-page">
            <header className="projects-header text-center py-12">
                <span className="text-gold tracking-widest uppercase text-sm">Portfolio</span>
                <h1 className="text-5xl font-serif mt-2" style={{ color: '#B8965A' }}>Sacred Monuments</h1>
                <div className="h-px w-24 bg-gold mx-auto mt-6" />
            </header>

            {loading ? (
                <div className="text-center text-gold py-20">Loading Archives...</div>
            ) : projects.length === 0 ? (
                <div className="text-center text-gray-500 py-20">No Projects Yet</div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 pb-20">
                    <MagicBento 
                        items={bentoItems}
                        glowColor="184, 150, 90" // Sompura Gold
                        enableTilt={true}
                        enableStars={true}
                        onCardClick={(item) => setSelectedProject(item.rawData)}
                    />
                </div>
            )}

            {/* The Universal Modal handles the "other_images" */}
            <GalleryModal 
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                title={selectedProject?.name}
                subtitle={[selectedProject?.city, selectedProject?.trust_name].filter(Boolean).join(" • ")}
                images={selectedProject?.other_images}
            />
        </div>
    );
}
