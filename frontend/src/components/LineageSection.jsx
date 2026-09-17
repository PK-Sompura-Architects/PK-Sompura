import React, { useState, useEffect } from 'react';
import ChromaGrid from './ChromaGrid';
import ScrollReveal from "./ScrollReveal";

// Primary contact numbers associated with the Sompura family
const CONTACT_NUMBERS = [
    "9227866635",
    "9227866634",
    "9427287387",
    "9429638738",
];

export default function LineageSection() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        fetch(`${API_URL}/lineage/`)
            .then(res => res.json())
            .then(data => {
                setMembers(Array.isArray(data) ? data : (data.members || []));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Map each member to a ChromaGrid item, attaching a contact number
    const gridItems = members.map((member, index) => ({
        image: member.image_url || "/placeholder.jpg",
        title: member.name,
        subtitle: member.role,
        phone: CONTACT_NUMBERS[index % CONTACT_NUMBERS.length],
        borderColor: "#B8965A",
        gradient: "linear-gradient(145deg, #0F1C2E, #1E3A5F)",
    }));

    return (
        <section className="py-20" style={{ backgroundColor: '#000000' }}>
            <div className="text-center mb-12">
                <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={3}>
                    <h2 className="text-5xl font-serif" style={{ color: '#B8965A' }}>The Lineage</h2>
                </ScrollReveal>
                <ScrollReveal baseOpacity={0} blurStrength={5}>
                    <p className="text-gray-300 tracking-widest mt-2 uppercase">Generations of Sacred Mastery</p>
                </ScrollReveal>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative mt-10">
                {loading ? (
                    <div className="text-center text-gold">Loading Legacy...</div>
                ) : (
                    <ChromaGrid
                        items={gridItems}
                        radius={300}
                        damping={0.45}
                    />
                )}
            </div>
        </section>
    );
}