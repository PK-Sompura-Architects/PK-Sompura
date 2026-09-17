import React from 'react';
import { X } from 'lucide-react';
import './GalleryModal.css'; // We'll define this below

export default function GalleryModal({ isOpen, onClose, title, subtitle, images }) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
                
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