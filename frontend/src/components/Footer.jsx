import { Link } from "react-router-dom";
import { Instagram, Phone, Mail, MapPin } from "lucide-react";
import "./Footer.css";

// Edit these four lines to change what the footer shows everywhere.
const CONTACT = {
    instagram: "https://instagram.com/pksompura",
    phone: "+91 98240 00000",
    email: "info@pksompura.com",
    place: "Palitana, Gujarat, India",
};

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <div className="site-footer__brand">
                    <img src="/logo-mark.webp" alt="" width="64" height="52" loading="lazy" />
                    <div>
                        <p className="site-footer__name">P.K. Sompura</p>
                        <p className="site-footer__tag">Temple Architect &amp; Contractor</p>
                    </div>
                </div>

                <nav className="site-footer__links" aria-label="Footer">
                    <Link to="/">Home</Link>
                    <Link to="/projects">Projects</Link>
                    <Link to="/about">The Lineage</Link>
                    <Link to="/inquiry">Inquiry</Link>
                </nav>

                <ul className="site-footer__contact">
                    <li>
                        <a href={CONTACT.instagram} target="_blank" rel="noreferrer noopener">
                            <Instagram size={16} strokeWidth={1.6} aria-hidden="true" />
                            Instagram
                        </a>
                    </li>
                    <li>
                        <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
                            <Phone size={16} strokeWidth={1.6} aria-hidden="true" />
                            {CONTACT.phone}
                        </a>
                    </li>
                    <li>
                        <a href={`mailto:${CONTACT.email}`}>
                            <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
                            {CONTACT.email}
                        </a>
                    </li>
                    <li>
                        <MapPin size={16} strokeWidth={1.6} aria-hidden="true" />
                        {CONTACT.place}
                    </li>
                </ul>
            </div>

            <p className="site-footer__legal">
                © {new Date().getFullYear()} P.K. Sompura · Three generations of temple architecture
            </p>
        </footer>
    );
}
