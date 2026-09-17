import { useState } from "react";
import ScrollReveal from "../components/ScrollReveal";
import "./Inquiry.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "";

function Inquiry() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        templeType: "",
        message: "",
    });
    const [status, setStatus] = useState("idle"); // idle | submitting | success | error
    const [errors, setErrors] = useState({});


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
        // Basic phone check — at least 7 digits
        if (formData.phone.trim() && !/^\d{7,15}$/.test(formData.phone.replace(/[\s\-\+]/g, ""))) {
            newErrors.phone = "Enter a valid phone number.";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setStatus("submitting");
        setErrors({});

        const cleanPhone = formData.phone.replace(/[\s\-+]/g, "");

        try {
            // Posts to our own API, which relays to Telegram server-side. The
            // bot token must never reach the browser.
            const response = await fetch(`${API_URL}/api/contact/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    phone: cleanPhone ? `+91 ${cleanPhone}` : "",
                    email: formData.email.trim(),
                    temple_type: formData.templeType,
                    message: formData.message,
                }),
            });

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", phone: "", templeType: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
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
                        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px", color: "var(--color-gold)" }}>
                            Inquiry Received!
                        </h2>
                        <p style={{ color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            We have received your inquiry and will contact you shortly.
                        </p>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                            You may also reach us directly via WhatsApp for a faster response.
                        </p>
                        <button
                            className="submit-btn"
                            onClick={() => setStatus("idle")}
                            style={{ marginTop: "30px" }}
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
                                <option value="Restoration">Heritage Restoration</option>
                                <option value="Monument">Monument / Memorial</option>
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

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={status === "submitting"}
                        >
                            {status === "submitting" ? "Sending..." : "Submit Inquiry"}
                        </button>

                        {status === "error" && (
                            <p style={{ color: "#e53e3e", textAlign: "center", fontSize: "14px", marginTop: "10px" }}>
                                Something went wrong. Please check your connection and try again.
                            </p>
                        )}

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