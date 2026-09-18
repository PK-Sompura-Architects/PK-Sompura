import React, { useState, useEffect } from 'react';
import MagicBento from './MagicBento';
import GalleryModal from './GalleryModal';
import { API_URL } from "../apiBase";

export default function DashboardGalleries() {
    const [galleries, setGalleries] = useState([]);
    const [selectedGallery, setSelectedGallery] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/galleries/`)
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
                    glowColor="245, 158, 11" 
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