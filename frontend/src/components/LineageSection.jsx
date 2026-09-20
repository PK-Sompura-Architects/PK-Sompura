import React, { useState, useEffect } from 'react';
import ChromaGrid from './ChromaGrid';
import ScrollReveal from "./ScrollReveal";
import { API_URL } from "../apiBase";

export default function LineageSection() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    // Map each member to a ChromaGrid item
    const gridItems = members.map((member) => ({
        image: member.image_url || "/placeholder.jpg",
        title: member.name,
        subtitle: member.role,
        // Blank until someone sets it in the admin panel. The card hides the
        // button rather than showing a number that is not this person's.
        phone: member.phone || null,
        borderColor: "var(--c-sky-300)",
        gradient: "linear-gradient(145deg, #4A637A, #1E2D40)",
    }));

    // Nothing to show yet: render nothing at all rather than a heading floating
    // over an empty grid. The section reappears as soon as members are added.
    if (!loading && members.length === 0) return null;

    return (
        <section style={{ padding: 'var(--section-padding) 0', background: 'transparent' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <ScrollReveal>
                    <h2>The Lineage</h2>
                </ScrollReveal>
                <ScrollReveal>
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