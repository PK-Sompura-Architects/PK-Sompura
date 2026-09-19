import { useState } from "react";
import ScrollReveal from "../components/ScrollReveal";
import "./Inquiry.css";
import { API_URL } from "../apiBase";
import { INQUIRY_NUMBERS } from "../siteContact";


function Inquiry() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        templeType: "",
        message: "",
    });
    const [status, setStatus] = useState("idle"); // idle | success
    const [errors, setErrors] = useState({});
    const [whatsappLinks, setWhatsappLinks] = useState([]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Full name is required.";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
        // Basic phone check — exactly 10 digits
        if (formData.phone.trim() && !/^\d{10}$/.test(formData.phone.replace(/[\s\-+]/g, ""))) {
            newErrors.phone = "Enter a valid phone number.";
        }
        return newErrors;
    };

    // The visitor sends this from their own WhatsApp, so it lands in a real
    // thread the family can reply to -- no Meta Cloud API, no message
    // template, no dedicated sender number.
    const buildWhatsAppUrl = (waNumber) => {
        const lines = [
            "Hello P.K. Sompura, I would like to enquire about a project.",
            "",
            `Name: ${formData.name.trim()}`,
            `Phone: +91 ${formData.phone.replace(/[\s\-+]/g, "")}`,
        ];
        if (formData.email.trim()) lines.push(`Email: ${formData.email.trim()}`);
        if (formData.templeType) lines.push(`Type: ${formData.templeType}`);
        if (formData.message.trim()) {
            lines.push("", "Details:");
            // A wa.me link is a URL, and long ones get truncated by the OS
            // before WhatsApp ever sees them. The full text still reaches the
            // admin panel through the save below.
            lines.push(formData.message.trim().slice(0, 700));
        }
        return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});

        // One link per recipient, built while the form values are still here.
        const links = INQUIRY_NUMBERS.map((n) => ({ ...n, url: buildWhatsAppUrl(n.wa) }));
        setWhatsappLinks(links);
        const waUrl = links[0].url;

        const cleanPhone = formData.phone.replace(/[\s\-+]/g, "");
        // keepalive, because the navigation below would otherwise cancel this
        // in flight. The record is what makes an abandoned inquiry -- one
        // where WhatsApp never opened, or the visitor never pressed send --
        // still reach the family through the admin panel.
        fetch(`${API_URL}/api/contact/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
                name: formData.name,
                phone: cleanPhone ? `+91 ${cleanPhone}` : "",
                email: formData.email.trim(),
                temple_type: formData.templeType,
                message: formData.message,
            }),
        }).catch(() => {
            // Already handed to WhatsApp; a failed record must not look like a
            // failed inquiry to the person who wrote it.
        });

        setStatus("success");
        // Assigned in the same tick as the click, so this counts as a
        // navigation rather than a pop-up and no blocker intercepts it.
        window.location.href = waUrl;
    };

    return (
        <div className="inquiry-wrapper">
            <div className="inquiry-container">
                <div className="inquiry-header">
                    <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={2}>
                        <h1 className="sompura-title" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
                            Begin a Project
                        </h1>
                    </ScrollReveal>
                    <p style={{ color: "var(--color-text-muted)", marginTop: "10px" }}>
                        Connect with our architects to discuss your sacred vision.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="inquiry-success">
                        <div className="success-icon">🏛️</div>
                        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px", color: "var(--color-primary)" }}>
                            One last step
                        </h2>
                        <p style={{ color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            WhatsApp should have opened with your inquiry already written out.
                            Press send there and it reaches us straight away.
                        </p>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                            If it did not open, use a link below. We have your details either way.
                        </p>
                        {whatsappLinks.map((link, i) => (
                            <a
                                key={link.wa}
                                className="submit-btn"
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    marginTop: i === 0 ? "30px" : "12px",
                                    display: "inline-block",
                                    textDecoration: "none",
                                    // Only the first was opened for them; the rest are a
                                    // second door, not a second instruction.
                                    ...(i > 0
                                        ? { background: "transparent", color: "var(--color-accent)" }
                                        : {}),
                                }}
                            >
                                {i === 0 ? "Open WhatsApp" : `Or message ${link.display}`}
                            </a>
                        ))}
                        <button
                            className="submit-btn"
                            onClick={() => setStatus("idle")}
                            style={{ marginTop: "12px", background: "transparent", color: "var(--color-accent)" }}
                        >
                            Send Another Inquiry
                        </button>
                    </div>
                ) : (
                    <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
                        {/* Name — MANDATORY */}
                        <div className="form-group">
                            <label htmlFor="name">
                                Full Name <span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Ramesh Patel"
                                className={errors.name ? "input-error" : ""}
                            />
                            {errors.name && <span className="field-error">{errors.name}</span>}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            {/* Email — OPTIONAL */}
                            <div className="form-group">
                                <label htmlFor="email">
                                    Email Address <span className="optional-label">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {/* Phone — MANDATORY */}
                            <div className="form-group">
                                <label htmlFor="phone">
                                    Phone Number <span className="required-star">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    className={errors.phone ? "input-error" : ""}
                                />
                                {errors.phone && <span className="field-error">{errors.phone}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="templeType">Type of Construction</label>
                            <select
                                id="templeType"
                                name="templeType"
                                value={formData.templeType}
                                onChange={handleChange}
                            >
                                <option value="" disabled>Select a category...</option>
                                <option value="New Temple">New Temple Construction</option>
                                <option value="Renovation">Renovation</option>
                                <option value="Consultation">Architectural Consultation</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Project Details</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Please describe your vision, location, and timeline..."
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">
                            Send on WhatsApp
                        </button>

                        <p className="inquiry-disclaimer">
                            <span className="required-star">*</span> Required fields. Your information is kept private and used only to respond to your inquiry.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Inquiry;