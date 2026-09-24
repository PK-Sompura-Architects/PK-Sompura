import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import './ServicesSection.css';

/**
 * What the company actually does, in four steps, each with one of its own
 * photographs.
 *
 * Every image here is work this family did. Nothing is stock, and nothing
 * claims a capability the business has not confirmed -- an earlier version of
 * the site carried invented figures ("40+ machines", "12 active sites") and
 * stock photos labelled with cities where there is no site.
 */
const SERVICES = [
    {
        title: 'Temple Design & Planning',
        body: 'Layout and elevation drawn to Shilpa Shastra proportion, for the whole temple or a single shrine.',
        image: '/media/work-sites/carved-torana.webp',
        alt: 'A finished carved stone torana gateway',
    },
    {
        title: 'Hand Carving',
        body: 'Figures, brackets and torana work cut by carvers who learned the craft in this yard.',
        image: '/media/work-sites/cutting-dressing.webp',
        alt: 'Carvers cutting and dressing stone at the yard',
    },
    {
        title: 'CNC Stone Cutting',
        body: 'Panels, reliefs and repeating ornament cut in-house on our own machines, to the drawing.',
        image: '/media/work-sites/cnc-carved-panel.webp',
        alt: 'A CNC-carved stone panel on the workshop bench',
    },
    {
        title: 'Building & Contracting',
        body: 'Foundation to shikhara, including the artificial mountain temples the family is known for.',
        image: '/media/work-sites/temple-under-build.webp',
        alt: 'A temple part-way through construction',
    },
];

export default function ServicesSection() {
    return (
        <section className="svc-section" aria-labelledby="svc-heading">
            <div className="svc-header">
                <ScrollReveal>
                    <span className="eyebrow">Our work</span>
                </ScrollReveal>
                <ScrollReveal delay={80}>
                    <h2 id="svc-heading">
                        Drawing, carving and building,<br />under one family
                    </h2>
                </ScrollReveal>
                <ScrollReveal delay={160}>
                    <p className="svc-intro">
                        The same hands draw the temple, cut the stone and raise it on
                        site — which is why the carving matches the drawing.
                    </p>
                </ScrollReveal>
            </div>

            <ul className="svc-grid">
                {SERVICES.map((s, i) => (
                    <li key={s.title}>
                        <ScrollReveal delay={i * 90}>
                            <article className="svc-card">
                                <div className="svc-card-media">
                                    <img src={s.image} alt={s.alt} loading="lazy" decoding="async" />
                                </div>
                                <div className="svc-card-body">
                                    <h3>{s.title}</h3>
                                    <p>{s.body}</p>
                                </div>
                            </article>
                        </ScrollReveal>
                    </li>
                ))}
            </ul>

            <ScrollReveal delay={200}>
                <div className="svc-cta">
                    <Link className="svc-cta-link" to="/inquiry">
                        Start a temple project
                        <span className="svc-cta-icon" aria-hidden="true">
                            <ArrowRight size={16} strokeWidth={1.75} />
                        </span>
                    </Link>
                </div>
            </ScrollReveal>
        </section>
    );
}
