import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "var(--space-lg) 24px",
                gap: "12px",
            }}
        >
            <p className="eyebrow">Page not found</p>
            <h1 className="sompura-title" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
                This page does not exist
            </h1>
            <p style={{ color: "var(--color-text-muted)", maxWidth: "46ch" }}>
                The link may be out of date. Everything on the site is reachable from
                the pages below.
            </p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
                <Link to="/">Home</Link>
                <Link to="/projects">Projects</Link>
                <Link to="/about">Across India</Link>
                <Link to="/inquiry">Inquiry</Link>
            </div>
        </div>
    );
}
