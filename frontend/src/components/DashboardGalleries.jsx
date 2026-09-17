import React, { useState, useEffect } from 'react';
import MagicBento from './MagicBento';
import GalleryModal from './GalleryModal';

export default function DashboardGalleries() {
    const [galleries, setGalleries] = useState([]);
    const [selectedGallery, setSelectedGallery] = useState(null);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        fetch(`${API_URL}/galleries/`)
            .then(res => res.json())
            .then(data => setGalleries(data.galleries || []))
            .catch(err => console.error("Error fetching galleries:", err));
    }, []);

    if (galleries.length === 0) return null;

    const bentoItems = galleries.map(g => ({
        id: g.id,
        title: g.title,
        description: "Explore Gallery",
        label: "Internal", 
        image: g.main_image || '/placeholder-gold.jpg',
        rawData: g
    }));

    return (
        <section className="py-20 bg-black">
            <h2 className="text-4xl text-gold font-serif text-center mb-12">Our Operations</h2>
            
            <div className="max-w-7xl mx-auto px-4">
                <MagicBento 
                    items={bentoItems}
                    glowColor="184, 150, 90" 
                    enableTilt={true}
                    onCardClick={(item) => setSelectedGallery(item.rawData)}
                />
            </div>

            <GalleryModal 
                isOpen={!!selectedGallery}
                onClose={() => setSelectedGallery(null)}
                title={selectedGallery?.title}
                images={selectedGallery?.images}
            />
        </section>
    );
}