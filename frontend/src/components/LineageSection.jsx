import React, { useState, useEffect } from 'react';
import ChromaGrid from './ChromaGrid';
import ScrollReveal from "./ScrollReveal";
import { CONTACT_NUMBERS } from "../siteContact";

export default function LineageSection() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        fetch(`${API_URL}/api/lineage/`)
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
        borderColor: "var(--c-marigold-500)",
        gradient: "linear-gradient(145deg, #0F766E, #134E4A)",
    }));

    return (
        <section style={{ padding: 'var(--section-padding) 0', background: 'transparent' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={3}>
                    <h2>The Lineage</h2>
                </ScrollReveal>
                <ScrollReveal baseOpacity={0} blurStrength={5}>
                    <p className="eyebrow" style={{ marginTop: 'var(--space-2xs)' }}>
                        Generations of Sacred Mastery
                    </p>
                </ScrollReveal>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative mt-10">
                {loading ? (
                    <div className="eyebrow" style={{ textAlign: "center" }}>Loading Legacy...</div>
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