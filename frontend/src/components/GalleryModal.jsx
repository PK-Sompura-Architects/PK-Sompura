import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './GalleryModal.css';

export default function GalleryModal({ isOpen, onClose, title, subtitle, images }) {
    // Escape to close, and freeze the page behind: without this the gallery
    // could only be dismissed by clicking the backdrop, and scrolling while
    // it was open moved the page underneath it.
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);

        // The lock goes on <html>, not <body>. Lenis scrolls the document
        // element, so hiding body's overflow does not stop it -- and it would
        // force body's `overflow-x: clip` to compute as `hidden`, which is
        // what made the whole page unscrollable once before. html carries
        // `scrollbar-gutter: stable`, so nothing shifts when the bar goes.
        const root = document.documentElement;
        const previous = root.style.overflow;
        root.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            root.style.overflow = previous;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        // data-lenis-prevent: Lenis handles the wheel itself and scrolls the
        // page programmatically, which `overflow: hidden` does not stop. This
        // is the library's own opt-out, and it leaves the grid below scrolling
        // natively inside the box.
        <div className="modal-backdrop" onClick={onClose} data-lenis-prevent>
            <div
                className="modal-container"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <button className="close-btn" onClick={onClose} aria-label="Close gallery">
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <h2>{title}</h2>
                    {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                </div>

                <div className="modal-image-grid">
                    {images && images.length > 0 ? (
                        images.map((url, idx) => (
                            <img key={idx} src={url} alt={`${title} gallery ${idx + 1}`} loading="lazy" />
                        ))
                    ) : (
                        <p className="empty-state">No gallery images available yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
